# Steering: Monorepo e Workspaces - Regras Prioritárias

## **Estrutura de Monorepo Obrigatória**

### **Organização de Workspaces**

**SEMPRE usar esta estrutura:**
```
project-root/
├── apps/                    # Aplicações
│   ├── frontend/           # React app
│   └── backend/            # Node.js API
├── packages/               # Pacotes compartilhados
│   ├── shared/            # Tipos, constantes, utils
│   ├── ui/                # Componentes UI (se necessário)
│   └── config/            # Configurações compartilhadas
├── docs/                  # Documentação (max 500 linhas/arquivo)
├── scripts/               # Scripts utilitários
├── .kiro/                 # Configurações Kiro
│   └── steering/          # Múltiplos arquivos de steering
├── pnpm-workspace.yaml    # Configuração workspace
├── package.json           # Root package.json
└── Dockerfile             # ÚNICO arquivo Docker
```

### **Configuração Workspace Obrigatória**

**pnpm-workspace.yaml:**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**package.json (root):**
```json
{
  "name": "fiscal-system",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "pnpm --parallel --filter './apps/*' dev",
    "build": "pnpm --recursive build",
    "test": "pnpm --recursive test",
    "lint": "pnpm --recursive lint",
    "type-check": "pnpm --recursive type-check"
  }
}
```

## **Separação de Responsabilidades**

### **Frontend (apps/frontend/)**

**OBRIGATÓRIO:**
- ✅ Comunicar APENAS via APIs REST com o backend
- ✅ Gerenciar apenas estado da UI e validações de formulário
- ✅ Usar Context API para estado global da aplicação
- ✅ PODE depender de packages/shared para tipos, constantes e schemas

**PROIBIDO:**
- ❌ NUNCA acessar diretamente bancos de dados
- ❌ NUNCA usar bibliotecas de acesso a dados (Prisma, MongoDB drivers, etc.)
- ❌ NUNCA implementar lógica de negócio complexa

### **Backend (apps/backend/)**

**OBRIGATÓRIO:**
- ✅ Responsável por TODA lógica de negócio
- ✅ Único ponto de acesso aos bancos de dados
- ✅ Implementar autenticação e autorização
- ✅ Validar TODOS os dados recebidos do frontend
- ✅ Gerenciar conexões e transações de banco
- ✅ PODE depender de packages/shared para tipos, constantes e schemas

### **Shared (packages/shared/)**

**OBRIGATÓRIO:**
- ✅ Contém tipos, interfaces e enums compartilhados
- ✅ Schemas de validação (Zod/Valibot)
- ✅ Constantes e configurações compartilhadas
- ✅ Códigos e formatos de erro padronizados

**PROIBIDO:**
- ❌ NUNCA deve depender de código específico do frontend ou backend

## **Regras de Dependência**

### **Backend Routes (apps/backend/src/routes/)**

**PODE depender de:**
- ✅ services (apps/backend/src/services/)
- ✅ utils (apps/backend/src/utils/)
- ✅ types (apps/backend/src/types/)
- ✅ middleware (apps/backend/src/middleware/)
- ✅ packages/shared

**NUNCA deve depender de:**
- ❌ Componentes frontend
- ❌ Código específico do frontend

### **Backend Services (apps/backend/src/services/)**

**PODE depender de:**
- ✅ Outros services
- ✅ utils (apps/backend/src/utils/)
- ✅ types (apps/backend/src/types/)
- ✅ packages/shared

**NUNCA deve depender de:**
- ❌ routes ou middleware
- ❌ Código específico do frontend

### **Frontend Components (apps/frontend/src/components/)**

**PODE depender de:**
- ✅ services (apps/frontend/src/services/)
- ✅ hooks (apps/frontend/src/hooks/)
- ✅ utils (apps/frontend/src/utils/)
- ✅ packages/shared

**NUNCA deve depender de:**
- ❌ Backend code diretamente
- ❌ Bibliotecas de acesso a dados

## **Comandos de Workspace**

### **Comandos pnpm Obrigatórios**

**Instalar dependência em workspace específico:**
```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm --filter @fiscal/backend add express"
```

**Executar comando em workspace:**
```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm --filter @fiscal/frontend dev"
```

**Executar em todos os workspaces:**
```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm --recursive build"
```

**Executar em paralelo:**
```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm --parallel --filter './apps/*' dev"
```

### **Scripts Root Obrigatórios**

**package.json (root) deve conter:**
```json
{
  "scripts": {
    "dev": "pnpm --parallel --filter './apps/*' dev",
    "build": "pnpm --recursive build",
    "test": "pnpm --recursive test",
    "lint": "pnpm --recursive lint",
    "type-check": "pnpm --recursive type-check",
    "clean": "pnpm --recursive clean"
  }
}
```

## **Configuração de Workspaces**

### **Package.json de Cada Workspace**

**apps/frontend/package.json:**
```json
{
  "name": "@fiscal/frontend",
  "version": "1.0.0",
  "dependencies": {
    "@fiscal/shared": "workspace:*"
  }
}
```

**apps/backend/package.json:**
```json
{
  "name": "@fiscal/backend",
  "version": "1.0.0",
  "dependencies": {
    "@fiscal/shared": "workspace:*"
  }
}
```

**packages/shared/package.json:**
```json
{
  "name": "@fiscal/shared",
  "version": "1.0.0",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./types": "./dist/types/index.js",
    "./constants": "./dist/constants/index.js"
  }
}
```

## **Migração para Monorepo**

### **Passos de Migração**

**1. Criar estrutura:**
```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && mkdir -p apps/frontend apps/backend packages/shared/src/{types,constants,schemas,errors,dto}"
```

**2. Mover código existente:**
```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && mv src/frontend/* apps/frontend/src/ && mv src/backend/* apps/backend/src/"
```

**3. Configurar workspace:**
```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && echo 'packages:\n  - \"apps/*\"\n  - \"packages/*\"' > pnpm-workspace.yaml"
```

**4. Atualizar dependências:**
```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm install"
```

## **Validação de Estrutura**

### **Script de Validação**

**scripts/validate-monorepo.sh:**
```bash
#!/bin/bash
# Validar estrutura de monorepo

echo "🔍 Validando estrutura de monorepo..."

# Verificar arquivos obrigatórios
required_files=(
  "pnpm-workspace.yaml"
  "package.json"
  "apps/frontend/package.json"
  "apps/backend/package.json"
  "packages/shared/package.json"
)

for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "❌ Arquivo obrigatório não encontrado: $file"
    exit 1
  fi
done

# Verificar configuração workspace
if ! grep -q "packages:" pnpm-workspace.yaml; then
  echo "❌ pnpm-workspace.yaml mal configurado"
  exit 1
fi

# Verificar dependências workspace
if ! grep -q "workspace:" apps/frontend/package.json; then
  echo "⚠️ Frontend não usa dependências workspace"
fi

if ! grep -q "workspace:" apps/backend/package.json; then
  echo "⚠️ Backend não usa dependências workspace"
fi

echo "✅ Estrutura de monorepo válida"
```

## **Troubleshooting Monorepo**

### **Problemas Comuns**

**1. Dependências não encontradas:**
```bash
# Limpar e reinstalar
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && rm -rf node_modules apps/*/node_modules packages/*/node_modules && pnpm install"
```

**2. Build failures:**
```bash
# Build em ordem correta
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm --filter @fiscal/shared build && pnpm --recursive build"
```

**3. Import errors:**
```bash
# Verificar exports do shared
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard/packages/shared && cat package.json | grep -A 10 exports"
```

### **Comandos de Debug**

**Verificar dependências:**
```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm list --depth=0"
```

**Verificar workspaces:**
```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm list --recursive --depth=0"
```

**Verificar links:**
```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm why @fiscal/shared"
```