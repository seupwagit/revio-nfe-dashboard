import { z } from 'zod';
import { UserSchema } from './user.schema';

export const AuthTokenSchema = z.object({
  token: z.string(),
  user: UserSchema,
  expiresAt: z.string()
});