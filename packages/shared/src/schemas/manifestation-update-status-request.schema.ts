import { z } from 'zod';

/**
 * Schema de validação para atualização de status de manifestação
 */
export const ManifestationUpdateStatusRequestSchema = z.object({
  status: z
    .enum(['AGENDADO', 'PROCESSANDO', 'CONCLUIDO', 'ERRO', 'CANCELADO'])
    .refine((val) => ['AGENDADO', 'PROCESSANDO', 'CONCLUIDO', 'ERRO', 'CANCELADO'].includes(val), {
      message: 'Status deve ser um dos valores válidos: AGENDADO, PROCESSANDO, CONCLUIDO, ERRO, CANCELADO'
    }),
  
  notes: z
    .string()
    .max(1000, 'Observações devem ter no máximo 1000 caracteres')
    .optional()
});

export type ManifestationUpdateStatusRequestDTO = z.infer<typeof ManifestationUpdateStatusRequestSchema>;