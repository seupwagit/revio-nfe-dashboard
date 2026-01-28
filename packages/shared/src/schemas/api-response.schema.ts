import { z } from 'zod';

export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.object({
    code: z.string(),
    message: z.string(),
    timestamp: z.string()
  }).optional()
});