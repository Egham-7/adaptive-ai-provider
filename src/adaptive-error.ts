import { createJsonErrorResponseHandler } from '@ai-sdk/provider-utils';
import { z } from 'zod';

export const adaptiveErrorDataSchema = z.object({
  error: z.object({
    message: z.string(),
    type: z.string().nullish(),
    param: z.any().nullish(),
    code: z.union([z.string(), z.number()]).nullish(),
  }),
});

export type AdaptiveErrorData = z.infer<typeof adaptiveErrorDataSchema>;

export const adaptiveFailedResponseHandler = createJsonErrorResponseHandler({
  errorSchema: adaptiveErrorDataSchema,
  errorToMessage: (data: AdaptiveErrorData) => data.error.message,
});
