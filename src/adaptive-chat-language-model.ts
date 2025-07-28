import type {
  LanguageModelV2,
  LanguageModelV2CallWarning,
  LanguageModelV2Content,
  LanguageModelV2FinishReason,
  LanguageModelV2Usage,
} from '@ai-sdk/provider';
import type { FetchFunction } from '@ai-sdk/provider-utils';
import {
  combineHeaders,
  createEventSourceResponseHandler,
  createJsonResponseHandler,
  postJsonToApi,
} from '@ai-sdk/provider-utils';
import { z } from 'zod';
import { adaptiveProviderOptions } from './adaptive-chat-options';
import { adaptiveFailedResponseHandler } from './adaptive-error';
import { prepareTools } from './adaptive-prepare-tools';
import type {
  AdaptiveChatCompletionMessage,
  AdaptiveChatCompletionRequest,
} from './adaptive-types';
import { convertToAdaptiveChatMessages } from './convert-to-adaptive-chat-messages';
import { getResponseMetadata } from './get-response-metadata';
import { mapAdaptiveFinishReason } from './map-adaptive-finish-reason';

interface AdaptiveChatConfig {
  provider: string;
  baseURL: string;
  headers: () => Record<string, string | undefined>;
  fetch?: FetchFunction;
  defaultProvider?: string;
}

const adaptiveChatResponseSchema = z.object({
  id: z.string().nullish(),
  created: z.number().nullish(),
  model: z.string().nullish(),
  choices: z.array(
    z.object({
      message: z.object({
        role: z.enum(['assistant', '']).nullish(),
        content: z.string().nullish(),
        tool_calls: z
          .array(
            z.object({
              id: z.string().nullish(),
              type: z.literal('function'),
              function: z.object({
                name: z.string(),
                arguments: z.string(),
              }),
            })
          )
          .nullish(),
        reasoning_content: z.string().optional(),
        generated_files: z
          .array(
            z.object({
              media_type: z.string(),
              data: z.string(),
            })
          )
          .optional(),
      }),
      index: z.number(),
      logprobs: z
        .object({
          content: z
            .array(
              z.object({
                token: z.string(),
                logprob: z.number(),
                top_logprobs: z.array(
                  z.object({
                    token: z.string(),
                    logprob: z.number(),
                  })
                ),
              })
            )
            .nullish(),
        })
        .nullish(),
      finish_reason: z.string().nullish(),
    })
  ),
  usage: z
    .object({
      completion_tokens: z.number(),
      prompt_tokens: z.number(),
      total_tokens: z.number(),
      reasoning_tokens: z.number().optional(),
      cached_input_tokens: z.number().optional(),
    })
    .optional(),
  system_fingerprint: z.string().optional(),
  provider: z.string(),
});

const adaptiveChatChunkSchema = z.union([
  z.object({
    id: z.string().nullish(),
    created: z.number().nullish(),
    model: z.string().nullish(),
    choices: z.array(
      z.object({
        delta: z
          .object({
            role: z.enum(['assistant']).nullish(),
            content: z.string().nullish(),
            tool_calls: z
              .array(
                z.object({
                  index: z.number(),
                  id: z.string().nullish(),
                  type: z.literal('function').nullish(),
                  function: z.object({
                    name: z.string().nullish(),
                    arguments: z.string().nullish(),
                  }),
                })
              )
              .nullish(),
            reasoning_content: z.string().optional(),
            generated_files: z
              .array(
                z.object({
                  media_type: z.string(),
                  data: z.string(),
                })
              )
              .optional(),
          })
          .nullish(),
        logprobs: z
          .object({
            content: z
              .array(
                z.object({
                  token: z.string(),
                  logprob: z.number(),
                  top_logprobs: z.array(
                    z.object({
                      token: z.string(),
                      logprob: z.number(),
                    })
                  ),
                })
              )
              .nullish(),
          })
          .nullish(),
        finish_reason: z.string().nullish(),
        index: z.number(),
      })
    ),
    usage: z
      .object({
        completion_tokens: z.number(),
        prompt_tokens: z.number(),
        total_tokens: z.number(),
        reasoning_tokens: z.number().optional(),
        cached_input_tokens: z.number().optional(),
      })
      .optional(),
    provider: z.string(),
  }),
  z.object({
    error: z.object({
      message: z.string(),
      type: z.string(),
    }),
    provider: z.string(),
  }),
]);

export class AdaptiveChatLanguageModel implements LanguageModelV2 {
  readonly specificationVersion = 'v2';
  readonly modelId: string;
  private readonly config: AdaptiveChatConfig;

  constructor(modelId: string, config: AdaptiveChatConfig) {
    this.modelId = modelId;
    this.config = config;
  }

  get provider(): string {
    return this.config.provider;
  }

  readonly supportedUrls: Record<string, RegExp[]> = {
    'application/pdf': [/^https:\/\/.*$/],
  };

  private async getArgs({
    prompt,
    maxOutputTokens,
    temperature,
    topP,
    topK,
    frequencyPenalty,
    presencePenalty,
    stopSequences,
    responseFormat,
    seed,
    providerOptions,
    tools,
    toolChoice,
  }: Parameters<LanguageModelV2['doGenerate']>[0]) {
    const warnings: LanguageModelV2CallWarning[] = [];

    // Warn for unsupported settings
    if (topK != null) {
      warnings.push({ type: 'unsupported-setting', setting: 'topK' });
    }
    if (responseFormat != null) {
      warnings.push({ type: 'unsupported-setting', setting: 'responseFormat' });
    }

    if (seed != null) {
      warnings.push({ type: 'unsupported-setting', setting: 'seed' });
    }
    // Parse provider options with zod schema (flat, not nested)
    const result = adaptiveProviderOptions.safeParse(providerOptions ?? {});
    const adaptiveOptions = result.success ? result.data : {};

    const {
      tools: adaptiveTools,
      toolChoice: adaptiveToolChoice,
      toolWarnings,
    } = prepareTools({
      tools,
      toolChoice,
    });
    warnings.push(...toolWarnings);

    // Convert messages
    const { messages, warnings: messageWarnings } =
      convertToAdaptiveChatMessages({ prompt });
    warnings.push(...messageWarnings);

    // Standardized settings for intelligent model selection
    const standardizedArgs = {
      messages: messages as AdaptiveChatCompletionMessage[],
      max_tokens:
        typeof maxOutputTokens === 'number' ? maxOutputTokens : undefined,
      temperature,
      top_p: topP,
      stop: stopSequences,
      presence_penalty: presencePenalty,
      frequency_penalty: frequencyPenalty,
      user: adaptiveOptions.user,
      tools: adaptiveTools,
      tool_choice: adaptiveToolChoice,
    };

    // logit_bias
    const logitBias = adaptiveOptions.logit_bias;

    const args: AdaptiveChatCompletionRequest = {
      ...standardizedArgs,
      ...(logitBias ? { logit_bias: logitBias } : {}),
      ...(adaptiveOptions.semantic_cache
        ? { semantic_cache: adaptiveOptions.semantic_cache }
        : {}),
    };

    return {
      args,
      warnings,
    };
  }

  async doGenerate(
    options: Parameters<LanguageModelV2['doGenerate']>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV2['doGenerate']>>> {
    const { args: body, warnings } = await this.getArgs(options);

    const { responseHeaders, value, rawValue } = await postJsonToApi({
      url: `${this.config.baseURL}/chat/completions`,
      headers: combineHeaders(this.config.headers(), options.headers),
      body,
      failedResponseHandler: adaptiveFailedResponseHandler,
      successfulResponseHandler: createJsonResponseHandler(
        adaptiveChatResponseSchema
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    if (!value) {
      throw new Error('Failed to parse Adaptive API response');
    }

    const choice = value?.choices[0];
    const content: Array<LanguageModelV2Content> = [];

    if (choice.message?.content) {
      content.push({ type: 'text', text: choice.message.content });
    }

    if (choice.message?.reasoning_content) {
      content.push({
        type: 'reasoning',
        text: choice.message.reasoning_content,
      });
    }

    if (
      choice.message?.generated_files &&
      choice.message.generated_files.length > 0
    ) {
      for (const file of choice.message.generated_files) {
        content.push({
          type: 'file',
          mediaType: file.media_type,
          data: file.data,
        });
      }
    }

    if (choice.message?.tool_calls && choice.message.tool_calls.length > 0) {
      for (const toolCall of choice.message.tool_calls) {
        content.push({
          type: 'tool-call',
          toolCallId: toolCall.id || '',
          toolName: toolCall.function?.name || '',
          input: toolCall.function?.arguments || '{}',
        });
      }
    }

    // Extract usage information
    const {
      prompt_tokens,
      completion_tokens,
      total_tokens,
      reasoning_tokens,
      cached_input_tokens,
    } = value.usage ?? {};

    return {
      content,
      finishReason: choice.finish_reason
        ? mapAdaptiveFinishReason(choice.finish_reason)
        : 'stop',
      usage: value.usage
        ? {
            inputTokens: prompt_tokens,
            outputTokens: completion_tokens,
            totalTokens: total_tokens,
            reasoningTokens: reasoning_tokens,
            cachedInputTokens: cached_input_tokens,
          }
        : { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      providerMetadata: value.provider
        ? {
            adaptive: {
              provider: value.provider,
            },
          }
        : undefined,
      request: { body },
      response: {
        id: value.id ?? '',
        modelId: value.model ?? '',
        timestamp: new Date((value.created ?? 0) * 1000),
        headers: responseHeaders,
        body: rawValue,
      },
      warnings,
    };
  }

  async doStream(
    options: Parameters<LanguageModelV2['doStream']>[0]
  ): Promise<Awaited<ReturnType<LanguageModelV2['doStream']>>> {
    const { args, warnings } = await this.getArgs(options);
    const body = {
      ...args,
      stream: true,
      stream_options: { include_usage: true },
    };

    const { responseHeaders, value: response } = await postJsonToApi({
      url: `${this.config.baseURL}/chat/completions`,
      headers: combineHeaders(this.config.headers(), options.headers),
      body,
      failedResponseHandler: adaptiveFailedResponseHandler,
      successfulResponseHandler: createEventSourceResponseHandler(
        adaptiveChatChunkSchema
      ),
      abortSignal: options.abortSignal,
      fetch: this.config.fetch,
    });

    const state = {
      finishReason: 'unknown' as LanguageModelV2FinishReason,
      usage: {
        inputTokens: undefined as number | undefined,
        outputTokens: undefined as number | undefined,
        totalTokens: undefined as number | undefined,
      } as LanguageModelV2Usage,
      isFirstChunk: true,
      isActiveText: false,
      provider: undefined as string | undefined,
    };

    return {
      stream: response.pipeThrough(
        new TransformStream({
          start(controller) {
            controller.enqueue({ type: 'stream-start', warnings });
          },
          async transform(chunk, controller) {
            // handle failed chunk parsing / validation:
            if (!chunk.success) {
              state.finishReason = 'error';
              controller.enqueue({ type: 'error', error: chunk.error });
              return;
            }

            const value = chunk.value;

            // Handle error responses
            if ('error' in value) {
              state.finishReason = 'error';
              controller.enqueue({
                type: 'error',
                error: new Error(value.error.message),
              });
              return;
            }

            if (state.isFirstChunk) {
              state.isFirstChunk = false;
              controller.enqueue({
                type: 'response-metadata',
                ...getResponseMetadata({
                  id: value.id ?? '',
                  model: value.model ?? '',
                  created: value.created ?? 0,
                }),
              });
            }

            if (value.usage != null) {
              state.usage.inputTokens = value.usage.prompt_tokens ?? undefined;
              state.usage.outputTokens =
                value.usage.completion_tokens ?? undefined;
              state.usage.totalTokens = value.usage.total_tokens ?? undefined;
              state.usage.reasoningTokens =
                value.usage.reasoning_tokens ?? undefined;
              state.usage.cachedInputTokens =
                value.usage.cached_input_tokens ?? undefined;
            }

            if (value.provider) {
              state.provider = value.provider;
            }

            const choice = value.choices[0];
            if (choice?.finish_reason != null) {
              state.finishReason = mapAdaptiveFinishReason(
                choice.finish_reason
              );
            }

            if (!choice?.delta) {
              return;
            }

            const delta = choice.delta;

            if (delta.content != null) {
              if (!state.isActiveText) {
                controller.enqueue({ type: 'text-start', id: 'text-1' });
                state.isActiveText = true;
              }
              controller.enqueue({
                type: 'text-delta',
                id: 'text-1',
                delta: delta.content,
              });
            }

            if (delta.reasoning_content != null) {
              controller.enqueue({
                type: 'reasoning-delta',
                id: 'reasoning-1',
                delta: delta.reasoning_content,
              });
            }

            if (
              delta.generated_files != null &&
              Array.isArray(delta.generated_files)
            ) {
              for (const file of delta.generated_files) {
                controller.enqueue({
                  type: 'file',
                  mediaType: file.media_type,
                  data: file.data,
                });
              }
            }

            if (delta.tool_calls != null && Array.isArray(delta.tool_calls)) {
              for (const toolCall of delta.tool_calls) {
                if (toolCall.type !== 'function') continue;
                controller.enqueue({
                  type: 'tool-call',
                  toolCallId: toolCall.id || '',
                  toolName: toolCall.function?.name || '',
                  input: toolCall.function?.arguments || '{}',
                });
              }
            }
          },
          flush(controller) {
            controller.enqueue({
              type: 'finish',
              finishReason: state.finishReason ?? 'stop',
              usage: state.usage ?? {
                inputTokens: 0,
                outputTokens: 0,
                totalTokens: 0,
              },
              providerMetadata: state.provider
                ? {
                    adaptive: {
                      provider: state.provider,
                    },
                  }
                : undefined,
            });
          },
        })
      ),
      request: { body },
      response: {
        headers: responseHeaders,
      },
    };
  }
}
