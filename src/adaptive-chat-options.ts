// Adaptive chat model options/types

import { z } from 'zod/v4';

const adaptiveSemanticCacheOptions = z.object({
  enabled: z.boolean().optional(),
  semantic_threshold: z.number().optional(),
});

const modelSchema = z.object({
  provider: z.string(),
  model_name: z.string().optional(),
  cost_per_1m_input_tokens: z.number().optional(),
  cost_per_1m_output_tokens: z.number().optional(),
  max_context_tokens: z.number().optional(),
  max_output_tokens: z.number().optional(),
  supports_function_calling: z.boolean().optional(),
  task_type: z.string().optional(),
  complexity: z.string().optional(),
});

const modelRouterConfigSchema = z.object({
  models: z.array(modelSchema).optional(),
  cost_bias: z.number().optional(),
  complexity_threshold: z.number().optional(),
  token_threshold: z.number().optional(),
});

const providerConfigSchema = z.object({
  base_url: z.string().optional(),
  api_key: z.string().optional(),
  auth_type: z.string().optional(),
  headers: z.record(z.string(), z.string()).optional(),
  timeout_ms: z.number().optional(),
});

const promptCacheConfigSchema = z.object({
  enabled: z.boolean(),
  ttl: z.number(), // TTL in seconds
});

const fallbackConfigSchema = z.object({
  enabled: z.boolean().optional(),
  mode: z.enum(['sequential', 'parallel']).optional(),
});

const promptResponseCacheConfigSchema = z.object({
  enabled: z.boolean().optional(),
  ttl: z.number().optional(),
});

/**
 * Provider options for Adaptive chat models.
 */
export const adaptiveProviderOptions = z.object({
  /**
   * Modify the likelihood of specified tokens appearing in the completion.
   */
  logit_bias: z.record(z.string(), z.number()).optional(),
  /**
   * Number of completions to generate for each prompt.
   */
  n: z.number().optional(),
  /**
   * Whether to stream responses.
   */
  stream: z.boolean().optional(),
  /**
   * Unique identifier representing your end-user.
   */
  user: z.string().optional(),
  /**
   * Intelligent routing configuration.
   */
  model_router: modelRouterConfigSchema.optional(),
  /**
   * Provider fallback behavior.
   */
  fallback: fallbackConfigSchema.optional(),
  /**
   * Semantic caching configuration.
   */
  prompt_response_cache: promptResponseCacheConfigSchema.optional(),
  /**
   * Ultra-fast caching configuration.
   */
  prompt_cache: promptCacheConfigSchema.optional(),
  /**
   * Custom provider configurations.
   */
  provider_configs: z.record(z.string(), providerConfigSchema).optional(),
  /**
   * Semantic cache configuration (legacy).
   */
  semantic_cache: adaptiveSemanticCacheOptions.optional(),
});

/**
 * Type for validated Adaptive provider options.
 */
export type AdaptiveProviderOptions = z.infer<typeof adaptiveProviderOptions>;
