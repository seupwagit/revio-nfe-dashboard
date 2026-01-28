/**
 * Usuários de teste para E2E
 * Baseado em .kiro/steering/testing-environment-rules.md
 */

export const TEST_USERS = {
  ADMIN: {
    email: 'divino@grupochama.com.br',
    password: '123456789',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin']
  },
  MASTER: {
    email: 'master',
    password: '12makem345',
    role: 'master',
    permissions: ['read', 'write', 'delete', 'admin', 'master']
  },
  REGULAR_USER: {
    email: 'user@test.com',
    password: 'testpass123',
    role: 'user',
    permissions: ['read']
  }
} as const;