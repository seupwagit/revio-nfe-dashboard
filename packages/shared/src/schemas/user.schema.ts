import { z } from 'zod';

export const UserSchema = z.object({
  usrCodigo: z.string().min(1),
  usrNome: z.string().min(1),
  usrEmail: z.string().email(),
  usrAtivo: z.boolean()
});