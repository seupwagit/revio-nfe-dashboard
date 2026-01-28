# Steering: Qualidade de Código - Regras Prioritárias

## **Padrões de Código Obrigatórios**

### **TypeScript - Regras Críticas**

**SEMPRE usar TypeScript strict mode:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

**Nomenclatura obrigatória:**
```typescript
// ✅ CORRETO
interface UserData {
  userId: string;
  userName: string;
}

class AuthService {
  private readonly apiClient: ApiClient;
}

const API_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout'
} as const;

// ❌ INCORRETO
interface userData {  // PascalCase obrigatório
  user_id: string;   // camelCase obrigatório
}
```

### **Organização de Imports**

**Ordem obrigatória de imports:**
```typescript
// 1. Node.js built-ins
import path from 'path';
import fs from 'fs';

// 2. External libraries
import express from 'express';
import mongoose from 'mongoose';

// 3. Internal packages (workspace)
import { UserDTO } from '@fiscal/shared/types';
import { API_ENDPOINTS } from '@fiscal/shared/constants';

// 4. Relative imports (mesmo diretório/subdiretórios)
import { AuthService } from './auth.service';
import { validateUser } from '../utils/validation';
```

### **Error Handling Padronizado**

**SEMPRE usar classes de erro tipadas:**
```typescript
// packages/shared/src/errors/base-error.class.ts
export abstract class BaseError extends Error {
  abstract readonly statusCode: number;
  abstract readonly errorCode: string;
  abstract readonly isOperational: boolean;

  constructor(message: string, public readonly context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
  }
}

// packages/shared/src/errors/validation-error.class.ts
export class ValidationError extends BaseError {
  readonly statusCode = 400;
  readonly errorCode = 'VALIDATION_ERROR';
  readonly isOperational = true;
}
```

**Tratamento de erros obrigatório:**
```typescript
// ✅ CORRETO - Com tratamento específico
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    logger.warn('Validation failed', { error: error.message, context: error.context });
    throw error;
  }
  
  logger.error('Unexpected error', { error: error.message });
  throw new InternalServerError('Operation failed');
}

// ❌ INCORRETO - Sem tratamento específico
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  console.log(error); // Não usar console.log
  throw error; // Não re-throw sem tratamento
}
```

## **Validação de Dados**

### **Schemas de Validação Obrigatórios**

**SEMPRE usar Zod para validação:**
```typescript
// packages/shared/src/schemas/user.schema.ts
import { z } from 'zod';

export const UserCreateSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  role: z.enum(['admin', 'user', 'viewer'])
});

export type UserCreateDTO = z.infer<typeof UserCreateSchema>;
```

**Validação no backend obrigatória:**
```typescript
// apps/backend/src/routes/users.ts
import { UserCreateSchema } from '@fiscal/shared/schemas';

router.post('/users', async (req, res, next) => {
  try {
    // SEMPRE validar entrada
    const validatedData = UserCreateSchema.parse(req.body);
    
    const user = await userService.create(validatedData);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors
      });
    }
    next(error);
  }
});
```

## **Logging Estruturado**

### **Padrões de Log Obrigatórios**

**SEMPRE usar logs estruturados:**
```typescript
// apps/backend/src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Uso obrigatório com contexto
logger.info('User created', {
  userId: user.id,
  email: user.email,
  action: 'user_creation',
  timestamp: new Date().toISOString()
});
```

**Prefixos obrigatórios para Coolify:**
```typescript
// Para facilitar busca nos logs do Coolify
console.log('[API] 📥 Request received', { method: req.method, path: req.path });
console.error('[ERROR] ❌ Database connection failed', { error: error.message });
console.warn('[WARN] ⚠️ Rate limit exceeded', { ip: req.ip });
```

## **Testes - Padrões Obrigatórios**

### **Estrutura de Testes**

**Organização obrigatória:**
```
src/
├── __tests__/              # Testes unitários
│   ├── unit/
│   │   ├── services/
│   │   ├── utils/
│   │   └── middleware/
│   ├── integration/        # Testes de integração
│   └── e2e/               # Testes end-to-end
```

**Nomenclatura de testes:**
```typescript
// ✅ CORRETO
describe('AuthService', () => {
  describe('login', () => {
    it('should return token when credentials are valid', async () => {
      // Test implementation
    });

    it('should throw ValidationError when email is invalid', async () => {
      // Test implementation
    });
  });
});

// ❌ INCORRETO
describe('auth service tests', () => {
  it('test login', () => {
    // Não descritivo
  });
});
```

### **Cobertura de Testes Obrigatória**

**Metas mínimas:**
- ✅ **Cobertura geral**: 80%
- ✅ **Funções críticas**: 95%
- ✅ **Services**: 90%
- ✅ **Utils**: 85%

**Configuração Jest obrigatória:**
```json
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## **Performance e Otimização**

### **Regras de Performance**

**SEMPRE usar async/await corretamente:**
```typescript
// ✅ CORRETO - Operações paralelas
const [users, orders, products] = await Promise.all([
  userService.getAll(),
  orderService.getAll(),
  productService.getAll()
]);

// ❌ INCORRETO - Operações sequenciais desnecessárias
const users = await userService.getAll();
const orders = await orderService.getAll();
const products = await productService.getAll();
```

**Cache inteligente obrigatório:**
```typescript
// apps/backend/src/services/cache.service.ts
export class CacheService {
  private cache = new Map<string, { data: any; expiry: number }>();

  set(key: string, data: any, ttlMs: number = 300000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }
}
```

### **Otimizações Obrigatórias**

**Database queries:**
```typescript
// ✅ CORRETO - Query otimizada
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
  },
  where: {
    active: true
  },
  take: 50
});

// ❌ INCORRETO - Query não otimizada
const users = await prisma.user.findMany(); // Busca todos os campos
```

**Memory management:**
```typescript
// ✅ CORRETO - Limpeza de recursos
export class DatabaseService {
  private connections = new Map();

  async cleanup(): Promise<void> {
    for (const [key, connection] of this.connections) {
      await connection.close();
      this.connections.delete(key);
    }
  }
}
```

## **Segurança - Regras Críticas**

### **Validação de Entrada**

**SEMPRE sanitizar dados:**
```typescript
import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Sanitizar HTML
const cleanHtml = purify.sanitize(userInput);

// Validar SQL injection
const safeQuery = query.replace(/['"\\]/g, '\\$&');
```

**Rate limiting obrigatório:**
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);
```

### **Autenticação e Autorização**

**JWT seguro obrigatório:**
```typescript
// SEMPRE usar secret forte
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters');
}

// SEMPRE definir expiração
const token = jwt.sign(
  { userId: user.id, role: user.role },
  JWT_SECRET,
  { expiresIn: '1h', issuer: 'fiscal-system' }
);
```

## **Code Review - Checklist Obrigatório**

### **Antes do Commit**

**Verificações automáticas:**
- [ ] ✅ Lint passou sem erros
- [ ] ✅ Type check passou
- [ ] ✅ Testes passaram (cobertura > 80%)
- [ ] ✅ Build passou
- [ ] ✅ Arquivo < 500 linhas
- [ ] ✅ Imports organizados
- [ ] ✅ Logs estruturados
- [ ] ✅ Error handling implementado
- [ ] ✅ Validação de dados implementada

### **Code Review Manual**

**Pontos obrigatórios:**
- [ ] ✅ Lógica de negócio está no backend
- [ ] ✅ Frontend não acessa banco diretamente
- [ ] ✅ Tipos TypeScript corretos
- [ ] ✅ Nomenclatura consistente
- [ ] ✅ Performance adequada
- [ ] ✅ Segurança implementada
- [ ] ✅ Documentação atualizada