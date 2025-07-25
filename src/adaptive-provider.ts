import type {
  EmbeddingModelV2,
  LanguageModelV2,
  ProviderV2,
} from '@ai-sdk/provider';
import { NoSuchModelError } from '@ai-sdk/provider';
import type { FetchFunction } from '@ai-sdk/provider-utils';
import { loadApiKey, withoutTrailingSlash } from '@ai-sdk/provider-utils';
import { AdaptiveChatLanguageModel } from './adaptive-chat-language-model';

export type AdaptiveChatModelId = string;

export interface AdaptiveProvider extends ProviderV2 {
  (): LanguageModelV2;

  /**
   * Creates a model for text generation with adaptive provider selection.
   */
  languageModel: () => LanguageModelV2;

  /**
   * Creates a chat model with adaptive provider selection.
   */
  chat: () => LanguageModelV2;

  /**
   * Text embedding is not currently supported by the adaptive provider.
   */
  textEmbeddingModel: (modelId: string) => EmbeddingModelV2<string>;
}

export interface AdaptiveProviderSettings {
  /**
   * Use a different URL prefix for API calls, e.g. to use proxy servers.
   * The default prefix is your adaptive API endpoint.
   */
  baseURL?: string;

  /**
   * API key for the adaptive service.
   * It defaults to the `ADAPTIVE_API_KEY` environment variable.
   */
  apiKey?: string;

  /**
   * Custom headers to include in the requests.
   */
  headers?: Record<string, string>;

  /**
   * Custom fetch implementation. You can use it as a middleware to intercept requests,
   * or to provide a custom fetch implementation for e.g. testing.
   */
  fetch?: FetchFunction;

  /**
   * Default provider to use for comparisons and fallbacks.
   */
  defaultProvider?: string;
}

/**
 * Create an Adaptive AI provider instance.
 */
export function createAdaptive(
  options: AdaptiveProviderSettings = {}
): AdaptiveProvider {
  const baseURL =
    withoutTrailingSlash(options.baseURL) ??
    'https://backend.mangoplant-a7a21605.swedencentral.azurecontainerapps.io/v1';

  const getHeaders = () => ({
    Authorization: `Bearer ${loadApiKey({
      apiKey: options.apiKey,
      environmentVariableName: 'ADAPTIVE_API_KEY',
      description: 'Adaptive',
    })}`,
    'Content-Type': 'application/json',
    ...options.headers,
  });

  const createChatModel = () =>
    new AdaptiveChatLanguageModel('', {
      provider: 'adaptive.chat',
      baseURL,
      headers: getHeaders,
      fetch: options.fetch,
      defaultProvider: options.defaultProvider,
    });

  const provider = function () {
    if (new.target) {
      throw new Error(
        'The Adaptive model function cannot be called with the new keyword.'
      );
    }

    return createChatModel();
  };

  provider.languageModel = createChatModel;
  provider.chat = createChatModel;

  provider.textEmbeddingModel = (modelId: string) => {
    throw new NoSuchModelError({ modelId, modelType: 'textEmbeddingModel' });
  };

  provider.imageModel = (modelId: string) => {
    throw new NoSuchModelError({ modelId, modelType: 'imageModel' });
  };

  return Object.freeze(provider);
}

/**
 * Default Adaptive provider instance.
 */
export const adaptive = createAdaptive();
