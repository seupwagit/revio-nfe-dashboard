import { z } from 'zod';

/**
 * Schema de validação para requisição de agendamento de manifestação
 */
export const ManifestationScheduleRequestSchema = z.object({
  manifestationType: z
    .string()
    .min(1, 'Tipo de manifestação é obrigatório')
    .max(10, 'Tipo de manifestação deve ter no máximo 10 caracteres'),
  
  chaves: z
    .array(
      z.string()
        .min(44, 'Chave de acesso deve ter pelo menos 44 caracteres')
        .max(47, 'Chave de acesso deve ter no máximo 47 caracteres')
        .regex(/^(NFe)?[0-9]{44}$/, 'Chave de acesso deve ter 44 dígitos (opcionalmente prefixados com NFe)')
    )
    .min(1, 'Pelo menos uma chave de acesso deve ser fornecida')
    .max(1000, 'Máximo de 1000 documentos por operação')
});