# Steering: Organização de Constantes e Tipos - Regras Obrigatórias

## **REGRAS CRÍTICAS DE ORGANIZAÇÃO**

### **Evitar Hardcode de Literais - Regra Obrigatória**

**SEMPRE organizar literais em classes de constantes:**

```typescript
// ❌ INCORRETO - Hardcode de literais
export class UserService {
  async login(email: string, password: string) {
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    
    const token = jwt.sign({ email }, 'my-secret-key', { expiresIn: '1h' });
    
    return {
      success: true,
      message: 'Login successful',
      token
    };
  }
  
  async validateRole(role: string) {
    if (role === 'admin' || role === 'user' || role === 'viewer') {
      return true;
    }
    return false;
  }
}

// ✅ CORRETO - Constantes organizadas
// constants/auth.constants.ts
export class AuthConstants {
  static readonly PASSWORD = {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128
  } as const;
  
  static readonly JWT = {
    SECRET_KEY: process.env.JWT_SECRET || 'fallback-secret',
    EXPIRES_IN: '1h',
    ISSUER: 'fiscal-system'
  } as const;
  
  static readonly MESSAGES = {
    LOGIN_SUCCESS: 'Login realizado com sucesso',
    LOGIN_FAILED: 'Credenciais inválidas',
    PASSWORD_TOO_SHORT: 'Senha deve ter pelo menos 8 caracteres',
    TOKEN_EXPIRED: 'Token expirado',
    UNAUTHORIZED: 'Acesso não autorizado'
  } as const;
  
  static readonly ROLES = {
    ADMIN: 'admin',
    USER: 'user',
    VIEWER: 'viewer'
  } as const;
  
  static readonly VALID_ROLES = [
    AuthConstants.ROLES.ADMIN,
    AuthConstants.ROLES.USER,
    AuthConstants.ROLES.VIEWER
  ] as const;
}

// services/user.service.ts
import { AuthConstants } from '../constants/auth.constants';

export class UserService {
  async login(email: string, password: string) {
    if (password.length < AuthConstants.PASSWORD.MIN_LENGTH) {
      throw new Error(AuthConstants.MESSAGES.PASSWORD_TOO_SHORT);
    }
    
    const token = jwt.sign(
      { email }, 
      AuthConstants.JWT.SECRET_KEY, 
      { 
        expiresIn: AuthConstants.JWT.EXPIRES_IN,
        issuer: AuthConstants.JWT.ISSUER
      }
    );
    
    return {
      success: true,
      message: AuthConstants.MESSAGES.LOGIN_SUCCESS,
      token
    };
  }
  
  async validateRole(role: string): boolean {
    return AuthConstants.VALID_ROLES.includes(role as any);
  }
}
```

### **Estrutura de Constantes Obrigatória**

**Organização por domínio:**
```
src/constants/
├── auth.constants.ts          # Autenticação e autorização
├── api.constants.ts           # URLs, endpoints, códigos HTTP
├── database.constants.ts      # Nomes de tabelas, campos, queries
├── validation.constants.ts    # Regras de validação, regex
├── ui.constants.ts           # Textos da interface, cores, tamanhos
├── business.constants.ts     # Regras de negócio, limites
└── index.ts                  # Re-exportação centralizada
```

**Padrões de nomenclatura:**
```typescript
// ✅ CORRETO - Nomenclatura consistente
export class ApiConstants {
  static readonly ENDPOINTS = {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh'
    },
    DOCUMENTS: {
      LIST: '/api/documents',
      COUNT: '/api/documents/count',
      STATS: '/api/documents/stats'
    }
  } as const;
  
  static readonly HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  } as const;
  
  static readonly TIMEOUTS = {
    REQUEST: 30000,      // 30 segundos
    CONNECTION: 10000,   // 10 segundos
    RETRY_DELAY: 1000    // 1 segundo
  } as const;
}
```

## **Separação de Tipos Complexos - Regra Obrigatória**

### **NUNCA definir múltiplos tipos complexos no mesmo arquivo**

**❌ INCORRETO - Múltiplos tipos no mesmo arquivo:**
```typescript
// types/mixed.types.ts (ARQUIVO PROBLEMÁTICO)
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferences: UserPreferences;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer'
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'pt' | 'en';
  notifications: boolean;
}

export class UserValidator {
  static validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

export interface Document {
  id: string;
  title: string;
  content: string;
  author: User;
  status: DocumentStatus;
}

export enum DocumentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

export class DocumentService {
  async create(doc: Document): Promise<Document> {
    // implementação
  }
}
```

**✅ CORRETO - Tipos separados por responsabilidade:**
```typescript
// types/user/user.interface.ts
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  preferences: UserPreferences;
}

// types/user/user-role.enum.ts
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer'
}

// types/user/user-preferences.interface.ts
export interface UserPreferences {
  theme: 'light' | 'dark';
  language: 'pt' | 'en';
  notifications: boolean;
}

// validators/user.validator.ts
export class UserValidator {
  static validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// types/document/document.interface.ts
import { User } from '../user/user.interface';
import { DocumentStatus } from './document-status.enum';

export interface Document {
  id: string;
  title: string;
  content: string;
  author: User;
  status: DocumentStatus;
}

// types/document/document-status.enum.ts
export enum DocumentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// services/document.service.ts
import { Document } from '../types/document/document.interface';

export class DocumentService {
  async create(doc: Document): Promise<Document> {
    // implementação
  }
}

// types/index.ts (Re-exportação centralizada)
export * from './user/user.interface';
export * from './user/user-role.enum';
export * from './user/user-preferences.interface';
export * from './document/document.interface';
export * from './document/document-status.enum';
```

### **Estrutura de Tipos Obrigatória**

**Organização hierárquica por domínio:**
```
src/types/
├── auth/
│   ├── auth-request.interface.ts
│   ├── auth-response.interface.ts
│   ├── jwt-payload.interface.ts
│   └── index.ts
├── user/
│   ├── user.interface.ts
│   ├── user-role.enum.ts
│   ├── user-preferences.interface.ts
│   ├── user-create-dto.interface.ts
│   └── index.ts
├── document/
│   ├── document.interface.ts
│   ├── document-status.enum.ts
│   ├── document-filter.interface.ts
│   └── index.ts
├── api/
│   ├── api-response.interface.ts
│   ├── api-error.interface.ts
│   ├── pagination.interface.ts
│   └── index.ts
└── index.ts
```

### **Regras de Separação**

**1. Um tipo complexo por arquivo:**
```typescript
// ✅ CORRETO - Um enum por arquivo
// types/document/document-status.enum.ts
export enum DocumentStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived'
}

// ✅ CORRETO - Uma interface por arquivo
// types/document/document.interface.ts
export interface Document {
  id: string;
  title: string;
  status: DocumentStatus;
}

// ✅ CORRETO - Uma classe por arquivo
// validators/document.validator.ts
export class DocumentValidator {
  static validateTitle(title: string): boolean {
    return title.length >= 3 && title.length <= 100;
  }
}
```

**2. Tipos relacionados podem compartilhar diretório:**
```typescript
// types/pagination/
├── pagination-request.interface.ts
├── pagination-response.interface.ts
└── sort-order.enum.ts
```

**3. EVITAR arquivos index.ts - Importar diretamente:**
```typescript
// ❌ INCORRETO - Usar index.ts para re-exportação
// types/document/index.ts
export * from './document.interface';
export * from './document-status.enum';
export * from './document-filter.interface';

// types/index.ts
export * from './auth';
export * from './user';
export * from './document';

// ✅ CORRETO - Importar diretamente dos arquivos específicos
// services/document.service.ts
import { Document } from '../types/document/document.interface';
import { DocumentStatus } from '../types/document/document-status.enum';
import { DocumentFilter } from '../types/document/document-filter.interface';
```

## **Evitar Arquivos de Classe para Exportação - Regra Obrigatória**

### **NUNCA criar classes apenas para exportar dependências**

**❌ INCORRETO - Classe apenas para exportação:**
```typescript
// utils/exports.class.ts (ARQUIVO PROBLEMÁTICO)
export class ExportsManager {
  static readonly userService = new UserService();
  static readonly documentService = new DocumentService();
  static readonly authService = new AuthService();
  
  static getServices() {
    return {
      user: this.userService,
      document: this.documentService,
      auth: this.authService
    };
  }
}

// Uso problemático
import { ExportsManager } from './utils/exports.class';
const services = ExportsManager.getServices();
```

**✅ CORRETO - Importação direta:**
```typescript
// services/user.service.ts
export class UserService {
  // implementação real
}

// services/document.service.ts  
export class DocumentService {
  // implementação real
}

// services/auth.service.ts
export class AuthService {
  // implementação real
}

// Uso correto - importar diretamente
import { UserService } from './services/user.service';
import { DocumentService } from './services/document.service';
import { AuthService } from './services/auth.service';

const userService = new UserService();
const documentService = new DocumentService();
const authService = new AuthService();
```

### **EVITAR arquivos index.ts - Regra Obrigatória**

**❌ INCORRETO - Usar index.ts para re-exportação:**
```typescript
// types/index.ts (ARQUIVO PROBLEMÁTICO)
export * from './user/user.interface';
export * from './user/user-role.enum';
export * from './document/document.interface';
export * from './document/document-status.enum';

// services/index.ts (ARQUIVO PROBLEMÁTICO)
export * from './user.service';
export * from './document.service';
export * from './auth.service';

// constants/index.ts (ARQUIVO PROBLEMÁTICO)
export * from './auth.constants';
export * from './api.constants';
export * from './database.constants';

// Uso problemático
import { User, UserRole, Document, DocumentStatus } from '../types';
import { UserService, DocumentService } from '../services';
import { AuthConstants, ApiConstants } from '../constants';
```

**✅ CORRETO - Importação direta dos arquivos específicos:**
```typescript
// Uso correto - importar diretamente
import { User } from '../types/user/user.interface';
import { UserRole } from '../types/user/user-role.enum';
import { Document } from '../types/document/document.interface';
import { DocumentStatus } from '../types/document/document-status.enum';
import { UserService } from '../services/user.service';
import { DocumentService } from '../services/document.service';
import { AuthConstants } from '../constants/auth.constants';
import { ApiConstants } from '../constants/api.constants';
```

### **Benefícios da Importação Direta**

**1. Clareza e Transparência:**
```typescript
// ✅ CORRETO - Fica claro de onde vem cada tipo/classe
import { User } from '../types/user/user.interface';
import { UserRole } from '../types/user/user-role.enum';
import { AuthConstants } from '../constants/auth.constants';

// ❌ INCORRETO - Não fica claro a origem
import { User, UserRole, AuthConstants } from '../exports';
```

**2. Tree Shaking Mais Eficiente:**
```typescript
// ✅ CORRETO - Bundler pode otimizar melhor
import { UserService } from '../services/user.service';
// Apenas UserService é incluído no bundle

// ❌ INCORRETO - Pode incluir código desnecessário
import { UserService } from '../services';
// Pode incluir outros serviços não utilizados
```

**3. Detecção de Dependências Circulares:**
```typescript
// ✅ CORRETO - Dependências circulares são detectadas facilmente
// user.service.ts
import { Document } from '../types/document/document.interface';

// document.service.ts  
import { User } from '../types/user/user.interface';
// Erro detectado imediatamente se houver ciclo

// ❌ INCORRETO - Dependências circulares mascaradas
// user.service.ts
import { Document } from '../types';

// document.service.ts
import { User } from '../types';
// Ciclo pode passar despercebido
```

## **Estrutura de Diretórios Recomendada**

### **Organização sem index.ts:**
```
src/
├── constants/
│   ├── auth.constants.ts
│   ├── api.constants.ts
│   ├── database.constants.ts
│   └── validation.constants.ts
├── types/
│   ├── user/
│   │   ├── user.interface.ts
│   │   ├── user-role.enum.ts
│   │   └── user-preferences.interface.ts
│   ├── document/
│   │   ├── document.interface.ts
│   │   ├── document-status.enum.ts
│   │   └── document-filter.interface.ts
│   └── auth/
│       ├── auth-request.interface.ts
│       ├── auth-response.interface.ts
│       └── jwt-payload.interface.ts
├── services/
│   ├── user.service.ts
│   ├── document.service.ts
│   └── auth.service.ts
└── validators/
    ├── user.validator.ts
    ├── document.validator.ts
    └── auth.validator.ts
```

## **Detecção e Correção Automática**

### **Identificar Arquivos Problemáticos**

**Script de detecção obrigatório:**
```bash
#!/bin/bash
# scripts/detect-organization-issues.sh

echo "🔍 Detectando problemas de organização..."

# Detectar arquivos com múltiplos tipos complexos
echo "📋 Verificando múltiplos tipos por arquivo..."
find src -name "*.ts" -not -path "*/node_modules/*" | while read file; do
  interfaces=$(grep -c "^export interface" "$file")
  enums=$(grep -c "^export enum" "$file")
  classes=$(grep -c "^export class" "$file")
  types=$(grep -c "^export type" "$file")
  
  total=$((interfaces + enums + classes + types))
  
  if [ $total -gt 1 ]; then
    echo "❌ $file: $total tipos complexos encontrados"
    echo "   - Interfaces: $interfaces"
    echo "   - Enums: $enums"
    echo "   - Classes: $classes"
    echo "   - Types: $types"
    echo ""
  fi
done

# Detectar arquivos index.ts
echo "📁 Verificando arquivos index.ts..."
find src -name "index.ts" | while read file; do
  echo "❌ Arquivo index.ts encontrado: $file"
  echo "   Refatore para usar importações diretas"
  echo ""
done

# Detectar classes de exportação
echo "📦 Verificando classes de exportação..."
find src -name "*.ts" -not -path "*/node_modules/*" | while read file; do
  export_classes=$(grep -c "static readonly.*=" "$file")
  if [ $export_classes -gt 3 ] && grep -q "static get" "$file"; then
    echo "⚠️ Possível classe de exportação: $file"
    echo "   Verifique se não é apenas para exportar dependências"
    echo ""
  fi
done

echo "✅ Verificação concluída"
```

### **Processo de Refatoração**

**Quando encontrar arquivo com múltiplos tipos:**

1. **Identificar domínios:** Agrupar tipos por responsabilidade
2. **Criar estrutura de diretórios:** Organizar por domínio
3. **Separar tipos:** Um tipo por arquivo
4. **Atualizar imports:** Usar importações diretas
5. **Remover arquivos index.ts:** Eliminar re-exportações

**Quando encontrar arquivos index.ts:**

1. **Identificar todas as re-exportações**
2. **Localizar arquivos que importam do index.ts**
3. **Substituir por importações diretas**
4. **Remover o arquivo index.ts**
5. **Testar se tudo ainda funciona**

**Quando encontrar classes de exportação:**

1. **Verificar se a classe tem lógica real**
2. **Se apenas exporta dependências, remover**
3. **Substituir por importações diretas**
4. **Mover lógica real para serviços apropriados**

**Exemplo de refatoração completa:**
```typescript
// ANTES: Estrutura problemática

// types/index.ts (PROBLEMÁTICO)
export * from './user.interface';
export * from './user-role.enum';
export * from './document.interface';

// services/exports.class.ts (PROBLEMÁTICO)
export class ServiceExports {
  static readonly userService = new UserService();
  static readonly docService = new DocumentService();
}

// user.service.ts (USO PROBLEMÁTICO)
import { User, UserRole } from '../types';
import { ServiceExports } from './exports.class';

// DEPOIS: Estrutura corrigida

// Remover: types/index.ts
// Remover: services/exports.class.ts

// user.service.ts (USO CORRETO)
import { User } from '../types/user/user.interface';
import { UserRole } from '../types/user/user-role.enum';
import { DocumentService } from './document.service';

export class UserService {
  private documentService = new DocumentService();
  
  // lógica real aqui
}
```

## **Reutilização de Constantes**

### **Constantes Compartilhadas**

**Criar hierarquia de constantes:**
```typescript
// constants/shared/common.constants.ts
export class CommonConstants {
  static readonly PAGINATION = {
    DEFAULT_PAGE: 1,
    DEFAULT_SIZE: 50,
    MAX_SIZE: 1000,
    MIN_SIZE: 1
  } as const;
  
  static readonly DATE_FORMATS = {
    ISO: 'YYYY-MM-DD',
    BRAZILIAN: 'DD/MM/YYYY',
    TIMESTAMP: 'YYYY-MM-DD HH:mm:ss'
  } as const;
  
  static readonly REGEX = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
    CPF: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
  } as const;
}

// constants/business/fiscal.constants.ts
import { CommonConstants } from '../shared/common.constants';

export class FiscalConstants {
  static readonly DOCUMENT_TYPES = {
    NFE: 'nfe',
    CTE: 'cte',
    CFE: 'cfe'
  } as const;
  
  static readonly STATUS = {
    AUTHORIZED: 'autorizada',
    CANCELLED: 'cancelada',
    PENDING: 'pendente'
  } as const;
  
  // Reutilizar constantes compartilhadas
  static readonly PAGINATION = CommonConstants.PAGINATION;
  static readonly DATE_FORMAT = CommonConstants.DATE_FORMATS.BRAZILIAN;
}
```

### **Constantes Específicas por Módulo**

```typescript
// constants/modules/danfe.constants.ts
export class DanfeConstants {
  static readonly PDF = {
    MAX_SIZE_MB: 10,
    QUALITY: 100,
    FORMAT: 'A4',
    ORIENTATION: 'portrait'
  } as const;
  
  static readonly CACHE = {
    TTL_SECONDS: 3600,      // 1 hora
    MAX_ENTRIES: 1000,
    CLEANUP_INTERVAL: 300   // 5 minutos
  } as const;
  
  static readonly TEMP_FILES = {
    MAX_AGE_HOURS: 24,
    CLEANUP_INTERVAL: 3600, // 1 hora
    MAX_SIZE_MB: 100
  } as const;
}
```

## **Validação e Conformidade**

### **Checklist Obrigatório**

**Antes de cada commit:**
- [ ] ✅ Nenhum literal hardcoded em código
- [ ] ✅ Constantes organizadas em classes apropriadas
- [ ] ✅ Máximo um tipo complexo por arquivo
- [ ] ✅ Tipos organizados por domínio
- [ ] ✅ Importações diretas (sem index.ts)
- [ ] ✅ Nenhuma classe apenas para exportação
- [ ] ✅ Script de detecção executado

### **Ferramentas de Validação**

**ESLint rules customizadas:**
```json
{
  "rules": {
    "no-magic-numbers": ["error", { 
      "ignore": [0, 1, -1],
      "ignoreArrayIndexes": true 
    }],
    "prefer-const": "error",
    "no-hardcoded-strings": "error",
    "no-index-imports": "error",
    "prefer-direct-imports": "error"
  }
}
```

**Pre-commit hook:**
```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "🔍 Validando organização de constantes e tipos..."

# Executar script de detecção
./scripts/detect-organization-issues.sh

if [ $? -ne 0 ]; then
  echo "❌ Commit rejeitado: problemas de organização encontrados"
  exit 1
fi

echo "✅ Validação aprovada"
```

## **Exemplos Práticos de Aplicação**

### **Refatoração de Arquivo Problemático**

**ANTES (Arquivo problemático):**
```typescript
// services/auth.service.ts (PROBLEMÁTICO)
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export class AuthService {
  async login(request: LoginRequest): Promise<LoginResponse> {
    if (request.password.length < 8) { // HARDCODE
      throw new Error('Password too short'); // HARDCODE
    }
    
    const token = jwt.sign(
      { email: request.email }, 
      'secret-key', // HARDCODE
      { expiresIn: '1h' } // HARDCODE
    );
    
    return {
      success: true,
      token,
      user: { id: '1', name: 'Test', role: UserRole.USER }
    };
  }
}
```

**DEPOIS (Refatorado corretamente):**
```typescript
// constants/auth.constants.ts
export class AuthConstants {
  static readonly PASSWORD = {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128
  } as const;
  
  static readonly JWT = {
    SECRET: process.env.JWT_SECRET || 'fallback-secret',
    EXPIRES_IN: '1h'
  } as const;
  
  static readonly MESSAGES = {
    PASSWORD_TOO_SHORT: 'Senha deve ter pelo menos 8 caracteres',
    LOGIN_SUCCESS: 'Login realizado com sucesso'
  } as const;
}

// types/auth/login-request.interface.ts
export interface LoginRequest {
  email: string;
  password: string;
}

// types/auth/login-response.interface.ts
import { User } from '../user/user.interface';

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
}

// types/user/user-role.enum.ts
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}

// types/user/user.interface.ts
import { UserRole } from './user-role.enum';

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

// services/auth.service.ts (Refatorado)
import { AuthConstants } from '../constants/auth.constants';
import { LoginRequest, LoginResponse } from '../types/auth';
import { UserRole } from '../types/user';

export class AuthService {
  async login(request: LoginRequest): Promise<LoginResponse> {
    if (request.password.length < AuthConstants.PASSWORD.MIN_LENGTH) {
      throw new Error(AuthConstants.MESSAGES.PASSWORD_TOO_SHORT);
    }
    
    const token = jwt.sign(
      { email: request.email }, 
      AuthConstants.JWT.SECRET,
      { expiresIn: AuthConstants.JWT.EXPIRES_IN }
    );
    
    return {
      success: true,
      token,
      user: { id: '1', name: 'Test', role: UserRole.USER }
    };
  }
}
```

## **Benefícios da Organização**

### **Manutenibilidade**
- ✅ Constantes centralizadas e reutilizáveis
- ✅ Tipos organizados por responsabilidade
- ✅ Fácil localização e modificação
- ✅ Redução de duplicação de código

### **Legibilidade**
- ✅ Código mais limpo e expressivo
- ✅ Intenção clara através de constantes nomeadas
- ✅ Estrutura lógica e previsível
- ✅ Documentação implícita através da organização

### **Robustez**
- ✅ Redução de erros de digitação
- ✅ Validação de tipos mais efetiva
- ✅ Refatoração mais segura
- ✅ Detecção precoce de inconsistências

---

**IMPORTANTE**: Esta regra deve ser aplicada retroativamente a todo código existente. Quando encontrar arquivos que violam essas regras, refatore-os imediatamente seguindo os padrões estabelecidos.