import { z } from 'zod';

export const DANFEStatusSchema = z.object({
  documentId: z.string(),
  status: z.enum(['xml_not_found', 'xml_downloaded', 'pdf_cached', 'pdf_ready']),
  xmlExists: z.boolean(),
  pdfExists: z.boolean(),
  pdfCached: z.boolean(),
  fileSize: z.number().optional(),
  error: z.string().optional()
});