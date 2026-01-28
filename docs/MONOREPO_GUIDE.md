# 🚀 Guia do Monorepo - Sistema Fiscal

## 📋 Visão Geral

O sistema foi migrado para uma arquitetura monorepo usando **pnpm workspaces** para melhor organização, builds otimizados e desenvolvimento mais eficiente.

## 📁 Estrutura do Projeto

```
project-root/
├── apps/
│   ├── frontend/                    # React frontend application
│   │   ├── src/                     # Código fonte do frontend
│   │   ├── package.json             # Dependências do frontend
│   │   ├── tsconfig.json            # Config TypeScript frontend
│   │   └── vite.config.ts           # Config Vite com proxy
│   └── backend/                     # Node.js backend application
│       ├── src/                     # Código fonte do backend
│       ├── package.json             # Dependências do backend
│       └── tsconfig.json            # Config TypeScript backend
├── packages/
│   └── shared/                      # Código compartilhado
│       ├── src/
│       │   ├── constants/           # Constantes compartilhadas
│       │   ├── types/               # Tipos TypeScript
│       │   └── index.ts             # Entry point
│       ├── package.json             # Config do pacote shared
│       └── tsconfig.json            # Config TypeScript shared
├── src/                             # 📁 LEGACY - Código antigo (manter por enquanto)
├── package.json                     # Root package.json com workspaces
├── pnpm-workspace.yaml              # Configuração do workspace
└── tsconfig.json                    # Root TypeScript config
```

## 🛠️ Comandos de Desenvolvimento

### Comandos Principais (Monorepo)

```bash
# Instalar todas as dependências
pnpm install

# Desenvolvimento - Rodar frontend e backend simultaneamente
pnpm dev

# Desenvolvimento - Rodar apenas frontend
pnpm dev:frontend

# Desenvolvimento - Rodar apenas backend
pnpm dev:backend

# Build - Compilar todos os projetos
pnpm build

# Build - Compilar apenas shared
pnpm build:shared

# Build - Compilar apenas frontend
pnpm build:frontend

# Build - Compilar apenas backend
pnpm build:backend

# Testes - Rodar todos os testes
pnpm test

# Lint - Verificar código em todos os projetos
pnpm lint

# Type Check - Verificar tipos em todos os projetos
pnpm type-check
```

### Comandos Legacy (Compatibilidade)

```bash
# Os comandos antigos ainda funcionam com prefixo legacy:
pnpm legacy:dev          # Equivale ao antigo npm run dev
pnpm legacy:build        # Equivale ao antigo npm run build
pnpm legacy:backend      # Equivale ao antigo npm run backend
# ... todos os outros comandos antigos
```

## 🔧 Configuração de Desenvolvimento

### 1. Instalar pnpm (se não tiver)

```bash
npm install -g pnpm@9.0.0
```

### 2. Instalar dependências

```bash
pnpm install
```

### 3. Compilar shared package

```bash
pnpm build:shared
```

### 4. Iniciar desenvolvimento

```bash
# Opção 1: Rodar tudo simultaneamente
pnpm dev

# Opção 2: Rodar separadamente
pnpm dev:backend    # Terminal 1
pnpm dev:frontend   # Terminal 2
```

## 📦 Usando o Pacote Shared

### No Frontend (apps/frontend)

```typescript
// Importar constantes compartilhadas
import { 
  LOADING_STEPS, 
  DOCUMENT_STATUS, 
  API_ENDPOINTS 
} from '@fiscal/shared/constants/loading-steps';

// Importar tipos compartilhados
import { 
  DocumentStatusResponse 
} from '@fiscal/shared/types/document-status-response';
import { 
  DANFEViewerProps 
} from '@fiscal/shared/types/danfe-viewer-props';

// Usar constantes
const status = STATUS_TO_LOADING_STEP[DOCUMENT_STATUS.PDF_READY];
const endpoint = buildEndpoint.danfeStatus(documentId);
```

### No Backend (apps/backend)

```typescript
// Importar constantes compartilhadas
import { 
  DOCUMENT_STATUS, 
  LOADING_STEPS 
} from '@fiscal/shared/constants/loading-steps';

// Importar tipos compartilhados
import { 
  DocumentStatusResponse 
} from '@fiscal/shared/types/document-status-response';

// Usar em rotas
const response: DocumentStatusResponse = {
  success: true,
  status: DOCUMENT_STATUS.PDF_READY,
  // ...
};
```

## 🔄 Migração Gradual

### Status Atual

- ✅ **Estrutura Monorepo**: Configurada e funcional
- ✅ **Pacote Shared**: Criado com constantes e tipos
- ✅ **Scripts de Build**: Configurados para desenvolvimento
- ✅ **Compatibilidade**: Scripts legacy mantidos
- ⏳ **Migração de Arquivos**: Opcional - código atual funciona

### Próximos Passos (Opcionais)

1. **Migrar arquivos gradualmente**:
   ```bash
   # Mover arquivos do frontend
   cp -r src/frontend/* apps/frontend/src/
   
   # Mover arquivos do backend  
   cp -r src/backend/* apps/backend/src/
   ```

2. **Atualizar imports**:
   ```typescript
   // Trocar imports relativos por imports do shared
   import { LOADING_STEPS } from '@fiscal/shared/constants/loading-steps';
   ```

3. **Testar nova estrutura**:
   ```bash
   pnpm build:shared
   pnpm dev
   ```

## 🎯 Benefícios do Monorepo

### ✅ **Organização**
- Separação clara entre frontend, backend e código compartilhado
- Estrutura padronizada e escalável
- Dependências organizadas por contexto

### ✅ **Performance**
- Builds paralelos com pnpm workspaces
- Cache compartilhado entre projetos
- Otimização de dependências

### ✅ **Desenvolvimento**
- Tipos compartilhados garantem consistência
- Constantes centralizadas evitam duplicação
- Hot reload funciona em todos os projetos

### ✅ **Manutenibilidade**
- Mudanças em tipos são refletidas automaticamente
- Refatorações mais seguras com TypeScript
- Versionamento unificado

## 🚨 Troubleshooting

### Problema: "Cannot find module '@fiscal/shared'"

```bash
# Solução: Compilar o pacote shared
pnpm build:shared
```

### Problema: "Workspace dependency not found"

```bash
# Solução: Reinstalar dependências
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

### Problema: "TypeScript errors in shared imports"

```bash
# Solução: Verificar referências de projeto
pnpm type-check
```

## 📚 Recursos Adicionais

- [pnpm Workspaces Documentation](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [Vite Monorepo Setup](https://vitejs.dev/guide/build.html#multi-page-app)

---

**🎉 O monorepo está configurado e pronto para uso! Você pode continuar desenvolvendo normalmente usando os novos comandos ou os comandos legacy para compatibilidade.**