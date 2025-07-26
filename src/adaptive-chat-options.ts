// Adaptive chat model options/types

import { z } from 'zod/v4';

const adaptiveSemanticCacheOptions = z.object({
  enabled: z.boolean().optional(),
  semantic_threshold: z.number().optional(),
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
  semantic_cache: adaptiveSemanticCacheOptions.optional(),
});

/**
 * Type for validated Adaptive provider options.
 */
export type AdaptiveProviderOptions = z.infer<typeof adaptiveProviderOptions>;
