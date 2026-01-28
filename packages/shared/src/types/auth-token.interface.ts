import { User } from './user.interface';

export interface AuthToken {
  token: string;
  user: User;
  expiresAt: string;
}