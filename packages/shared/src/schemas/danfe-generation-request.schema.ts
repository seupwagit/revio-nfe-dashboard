import { z } from 'zod';

export const DANFEGenerationRequestSchema = z.object({
  documentId: z.string().min(1),
  userId: z.string().min(1)
});