import { z } from 'zod';

/**
 * Schema de validação para consulta de status de manifestações
 */
export const ManifestationStatusQuerySchema = z.object({
  manifestationType: z
    .string()
    .max(10, 'Tipo de manifestação deve ter no máximo 10 caracteres')
    .optional(),
  
  status: z
    .enum(['AGENDADO', 'PROCESSANDO', 'CONCLUIDO', 'ERRO', 'CANCELADO'])
    .optional(),
  
  dateFrom: z
    .string()
    .datetime('Data inicial deve estar no formato ISO')
    .optional(),
  
  dateTo: z
    .string()
    .datetime('Data final deve estar no formato ISO')
    .optional(),
  
  page: z
    .number()
    .int('Página deve ser um número inteiro')
    .min(1, 'Página deve ser maior que 0')
    .default(1),
  
  pageSize: z
    .number()
    .int('Tamanho da página deve ser um número inteiro')
    .min(1, 'Tamanho da página deve ser maior que 0')
    .max(1000, 'Tamanho da página deve ser no máximo 1000')
    .default(50)
});

export type ManifestationStatusQueryDTO = z.infer<typeof ManifestationStatusQuerySchema>;