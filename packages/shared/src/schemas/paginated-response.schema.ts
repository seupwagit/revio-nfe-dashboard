import { z } from 'zod';
import { APIResponseSchema } from './api-response.schema';

export const PaginatedResponseSchema = APIResponseSchema.extend({
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number()
  }).optional()
});