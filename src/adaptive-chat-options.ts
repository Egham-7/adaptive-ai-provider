// Adaptive chat model options/types

import { z } from 'zod/v4';

const adaptiveSemanticCacheOptions = z.object({
  enabled: z.boolean().optional(),
  semantic_threshold: z.number().optional(),
});

const modelCapabilitySchema = z.object({
  description: z.string().optional(),
  provider: z.string(),
  model_name: z.string(),
  cost_per_1m_input_tokens: z.number(),
  cost_per_1m_output_tokens: z.number(),
  max_context_tokens: z.number(),
  max_output_tokens: z.number().optional(),
  supports_function_calling: z.boolean(),
  languages_supported: z.array(z.string()).optional(),
  model_size_params: z.string().optional(),
  latency_tier: z.string().optional(),
  task_type: z.string().optional(),
  complexity: z.string().optional(),
});

const protocolManagerConfigSchema = z.object({
  models: z.array(modelCapabilitySchema).optional(),
  cost_bias: z.number().optional(),
  complexity_threshold: z.number().optional(),
  token_threshold: z.number().optional(),
});

const promptCacheConfigSchema = z.object({
  enabled: z.boolean(),
  ttl: z.number(), // TTL in seconds
});

const fallbackConfigSchema = z.object({
  enabled: z.boolean().optional(), // Whether fallback is enabled (default: true)
  mode: z.enum(['sequential', 'parallel']).optional(), // Fallback mode (sequential/parallel)
});

/**
 * Provider options for Adaptive chat models.
 */
export const adaptiveProviderOptions = z.object({
  /**
   * Modify the likelihood of specified tokens appearing in the completion.
   * Accepts a JSON object that maps tokens (specified by their token ID) to a bias value from -100 to 100.
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
   * Cost bias for optimization.
   */
  cost_bias: z.number().optional(),
  /**
   * Semantic cache configuration.
   */
  semantic_cache: adaptiveSemanticCacheOptions.optional(),
  /**
   * Protocol manager configuration for model selection and optimization.
   */
  protocol_manager: protocolManagerConfigSchema.optional(),
  /**
   * Prompt cache configuration.
   */
  prompt_cache: promptCacheConfigSchema.optional(),
  /**
   * Fallback configuration with enabled toggle.
   */
  fallback: fallbackConfigSchema.optional(),
});

/**
 * Type for validated Adaptive provider options.
 */
export type AdaptiveProviderOptions = z.infer<typeof adaptiveProviderOptions>;
