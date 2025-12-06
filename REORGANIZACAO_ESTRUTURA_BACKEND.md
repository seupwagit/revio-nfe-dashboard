# 📁 Reorganização da Estrutura do Backend

**Data:** 2025-12-05  
**Mudança:** Backend movido de `server/backoffice` para `src/server`  
**Status:** ✅ Completo

---

## 🎯 Objetivo

Mover o código do backend (backoffice) para dentro da pasta `src` para manter uma estrutura mais organizada e consistente com convenções modernas de projetos TypeScript.

---

## 📋 Mudança Realizada

### Antes

```
projeto/
├── src/                    # Frontend
│   ├── components/
│   ├── services/
│   └── ...
├── server/                 # Backend
│   └── backoffice/
│       ├── index.ts
│       ├── database/
│       ├── routes/
│       └── utils/
└── ...
```

### Depois

```
projeto/
├── src/
│   ├── components/         # Frontend
│   ├── services/
│   ├── server/            # Backend (NOVO LOCAL)
│   │   ├── index.ts
│   │   ├── database/
│   │   │   ├── mongodb.ts
│   │   │   └── prisma.ts
│   │   ├── routes/
│   │   │   ├── analytics.ts
│   │   │   ├── documents.ts
│   │   │   └── health.ts
│   │   └── utils/
│   │       └── dateFilter.ts
│   └── ...
├── server/                # Scripts legados
│   ├── backoffice.cjs
│   └── mongodb-proxy.ts
└── ...
```

---

## ✅ Arquivos Movidos

| Arquivo Original | Novo Local |
|------------------|------------|
| `server/backoffice/index.ts` | `src/server/index.ts` |
| `server/backoffice/database/mongodb.ts` | `src/server/database/mongodb.ts` |
| `server/backoffice/database/prisma.ts` | `src/server/database/prisma.ts` |
| `server/backoffice/routes/analytics.ts` | `src/server/routes/analytics.ts` |
| `server/backoffice/routes/documents.ts` | `src/server/routes/documents.ts` |
| `server/backoffice/routes/health.ts` | `src/server/routes/health.ts` |
| `server/backoffice/utils/dateFilter.ts` | `src/server/utils/dateFilter.ts` |
| `server/backoffice/utils/logger.ts` | `src/server/utils/logger.ts` |

---

## 🔧 Arquivos Atualizados

### 1. `.vscode/launch.json`

```json
// ANTES
"runtimeArgs": ["tsx", "--inspect=9229", "server/backoffice/index.ts"]

// DEPOIS
"runtimeArgs": ["tsx", "--inspect=9229", "src/server/index.ts"]
```

### 2. `.vscode/tasks.json`

```json
// ANTES
"command": "npx tsx --inspect=9229 server/backoffice/index.ts"

// DEPOIS
"command": "npx tsx --inspect=9229 src/server/index.ts"
```

### 3. `package.json`

```json
// ANTES
"backend": "npx tsx server/backoffice/index.ts",
"backend:debug": "npx tsx --inspect=9229 server/backoffice/index.ts"

// DEPOIS
"backend": "npx tsx src/server/index.ts",
"backend:debug": "npx tsx --inspect=9229 src/server/index.ts"
```

### 4. `start-fullstack.sh`

```bash
# ANTES
tsx server/backoffice/index.ts 2>&1 | while IFS= read -r line; do

# DEPOIS
tsx src/server/index.ts 2>&1 | while IFS= read -r line; do
```

### 5. `Dockerfile.fullstack`

```dockerfile
# ANTES
COPY server ./server

# DEPOIS
COPY src/server ./src/server
```

### 6. `scripts/validation/validate-deploy.mjs`

```javascript
// ANTES
'server/backoffice/index.ts'

// DEPOIS
'src/server/index.ts'
```

### 7. `scripts/monitoring/auto-monitor.mjs`

```javascript
// ANTES
startProcess("Backend", "npx", ["tsx", "server/backoffice/index.ts"]);

// DEPOIS
startProcess("Backend", "npx", ["tsx", "src/server/index.ts"]);
```

---

## 📁 Pasta `server/` Mantida

A pasta `server/` ainda existe com arquivos legados:

```
server/
├── backoffice.cjs          # Script legado (pode ser removido futuramente)
└── mongodb-proxy.ts        # Proxy MongoDB (pode ser removido futuramente)
```

**Nota:** Estes arquivos podem ser removidos em uma limpeza futura se não forem mais necessários.

---

## 🎯 Benefícios da Mudança

### 1. **Estrutura Mais Organizada**
- Todo código TypeScript em `src/`
- Separação clara entre frontend e backend
- Mais fácil de navegar

### 2. **Convenções Modernas**
- Segue padrão de projetos TypeScript modernos
- Facilita configuração de ferramentas (ESLint, TypeScript)
- Melhor para monorepos futuros

### 3. **Build Simplificado**
- Todo código fonte em um lugar
- Mais fácil configurar tsconfig
- Melhor para ferramentas de análise

### 4. **Imports Mais Claros**
```typescript
// ANTES
import { connectMongoDB } from '../../server/backoffice/database/mongodb'

// DEPOIS
import { connectMongoDB } from '@/server/database/mongodb'
```

---

## 🧪 Como Testar

### 1. Desenvolvimento Local

```bash
# Iniciar backend
npm run backend

# Ou com debug
npm run backend:debug

# Ou full stack
npm run dev
```

### 2. Debug no VS Code

1. Pressione **F5**
2. Selecione "🚀 Full Stack Debug"
3. Backend deve iniciar normalmente

### 3. Docker

```bash
# Build
docker build -f Dockerfile.fullstack -t nf-dashboard:latest .

# Run
docker run -p 3000:3000 -p 3000:3000 --env-file .env nf-dashboard:latest
```

### 4. Verificar Logs

```bash
# Iniciar backend
npm run backend

# Deve aparecer:
# 🚀 Iniciando Backoffice Server...
# 📊 Conectando ao MongoDB (Mongoose)...
# ✅ MongoDB conectado com sucesso!
# ✅ Backoffice Server rodando!
```

---

## 🚨 Problemas Conhecidos

### 1. Imports Relativos

Se houver imports relativos no código do backend, eles ainda funcionam:

```typescript
// src/server/index.ts
import analyticsRoutes from './routes/analytics'  // ✅ Funciona
import documentsRoutes from './routes/documents'  // ✅ Funciona
```

### 2. Paths no tsconfig

Se usar path aliases, atualize `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@/server/*": ["src/server/*"],
      "@/*": ["src/*"]
    }
  }
}
```

### 3. Documentação Antiga

Alguns arquivos de documentação ainda referenciam o caminho antigo. Eles serão atualizados gradualmente.

---

## 📊 Checklist de Migração

### ✅ Arquivos Movidos
- [x] `index.ts`
- [x] `database/mongodb.ts`
- [x] `database/prisma.ts`
- [x] `routes/analytics.ts`
- [x] `routes/documents.ts`
- [x] `routes/health.ts`
- [x] `utils/dateFilter.ts`
- [x] `utils/logger.ts`

### ✅ Configurações Atualizadas
- [x] `.vscode/launch.json`
- [x] `.vscode/tasks.json`
- [x] `package.json`
- [x] `start-fullstack.sh`
- [x] `Dockerfile.fullstack`
- [x] `scripts/validation/validate-deploy.mjs`
- [x] `scripts/monitoring/auto-monitor.mjs`

### ✅ Testes
- [x] Backend inicia localmente
- [x] Debug funciona no VS Code
- [x] Docker build funciona
- [ ] Deploy no Coolify (pendente)

---

## 🚀 Próximos Passos

### 1. Commit e Push

```bash
git add .
git commit -m "refactor: mover backend de server/backoffice para src/server"
git push origin main
```

### 2. Deploy no Coolify

1. Fazer push das alterações
2. Coolify fará build automaticamente
3. Verificar logs do deploy
4. Testar aplicação

### 3. Limpeza Futura (Opcional)

```bash
# Remover pasta server/ se não for mais necessária
rm -rf server/
```

---

## 📚 Estrutura Final

```
revio-nfe-dashboard/
├── src/
│   ├── components/              # Frontend React
│   ├── services/                # Serviços frontend
│   ├── server/                  # Backend Node.js ⭐ NOVO
│   │   ├── index.ts            # Servidor Express
│   │   ├── database/           # Conexões DB
│   │   │   ├── mongodb.ts
│   │   │   └── prisma.ts
│   │   ├── routes/             # Rotas API
│   │   │   ├── analytics.ts
│   │   │   ├── documents.ts
│   │   │   └── health.ts
│   │   └── utils/              # Utilitários
│   │       ├── dateFilter.ts
│   │       └── logger.ts
│   ├── config/
│   ├── types/
│   └── main.tsx
├── .vscode/                     # Configurações VS Code
├── docs/                        # Documentação
├── scripts/                     # Scripts utilitários
├── prisma/                      # Schema Prisma
├── public/                      # Assets públicos
├── Dockerfile.fullstack         # Docker config
├── start-fullstack.sh           # Script de inicialização
├── package.json
└── tsconfig.json
```

---

## ✅ Resumo

| Item | Status |
|------|--------|
| Arquivos movidos | ✅ Completo |
| Configurações atualizadas | ✅ Completo |
| Scripts atualizados | ✅ Completo |
| Dockerfile atualizado | ✅ Completo |
| Testes locais | ✅ Funcionando |
| Documentação | ✅ Criada |
| Deploy Coolify | ⏳ Pendente |

---

**🎉 Backend reorganizado com sucesso! 🚀**

**Agora todo o código TypeScript está em `src/`!**
