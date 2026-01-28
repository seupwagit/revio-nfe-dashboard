# WSL/pnpm/Monorepo - Implementação Completa

## 🎯 **Resumo das Correções Aplicadas**

**TASK**: Implementar regras prioritárias WSL/Docker/pnpm/Monorepo  
**STATUS**: ✅ **COMPLETO**  
**USER REQUEST**: Comandos devem usar WSL, Docker otimizado, pnpm obrigatório, arquivos limitados a 500 linhas

## ✅ **Correções Implementadas**

### **1. Agent Steering Reorganizado**

**ANTES**: Um arquivo grande (>1000 linhas)
**DEPOIS**: Múltiplos arquivos especializados (cada <500 linhas)

**Arquivos criados:**
- `.kiro/steering/wsl-docker-rules.md` - Regras WSL e Docker
- `.kiro/steering/file-organization-rules.md` - Organização de arquivos
- `.kiro/steering/monorepo-workspace-rules.md` - Regras de monorepo
- `.kiro/steering/code-quality-rules.md` - Qualidade de código
- `.kiro/steering/performance-optimization-rules.md` - Otimizações

**Benefícios:**
- 🚀 Performance do agent melhorada
- 🎯 Regras específicas por contexto
- 🔧 Manutenção facilitada

### **2. Dockerfile Otimizado**

**ANTES**: Dockerfile complexo com múltiplos estágios não otimizados
**DEPOIS**: Dockerfile único compatível com Coolify

**Principais mudanças:**
```dockerfile
# Multi-stage otimizado para Coolify
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

# Cache inteligente do pnpm
RUN pnpm config set store-dir /pnpm-store

# Health check obrigatório para Coolify
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:$PORT/api/health || exit 1
```

**Otimizações aplicadas:**
- ✅ Multi-stage build para reduzir tamanho
- ✅ Cache inteligente do pnpm
- ✅ Health check para Coolify
- ✅ Alpine Linux para menor footprint
- ✅ ARGs para flexibilidade de ambiente

### **3. Package.json Root Corrigido**

**ANTES**: Configuração complexa com scripts redundantes
**DEPOIS**: Configuração limpa seguindo regras de monorepo

```json
{
  "name": "fiscal-system",
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "pnpm --parallel --filter './apps/*' dev",
    "build": "pnpm --recursive build",
    "test": "pnpm --recursive test",
    "lint": "pnpm --recursive lint",
    "type-check": "pnpm --recursive type-check",
    "clean": "pnpm --recursive clean",
    "validate": "pnpm run validate:structure && pnpm run validate:files"
  }
}
```

### **4. Scripts de Setup Corrigidos**

**ANTES**: Scripts usavam npm e comandos Windows nativos
**DEPOIS**: Todos os scripts usam WSL e pnpm

**Scripts atualizados:**
- `scripts/setup-local-debug.bat` → Usa WSL + pnpm
- `scripts/Setup-Local-Debug.ps1` → Usa WSL + pnpm
- `scripts/setup-complete.sh` → Setup completo via WSL

**Exemplo de comando corrigido:**
```bash
# ANTES (proibido)
npm install

# DEPOIS (obrigatório)
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm install"
```

### **5. Scripts de Validação Criados**

**Novos scripts para garantir conformidade:**

**`scripts/validate-monorepo.sh`:**
- Valida estrutura de workspaces
- Verifica configuração pnpm
- Confirma Dockerfile único
- Valida dependências workspace

**`scripts/validate-file-limits.sh`:**
- Verifica limite de 500 linhas
- Identifica arquivos que precisam refatoração
- Gera relatório de conformidade

**`scripts/file-metrics.sh`:**
- Métricas detalhadas de arquivos
- Distribuição por tamanho
- Recomendações de refatoração

## 🔧 **Regras Implementadas**

### **WSL Obrigatório**

**TODOS os comandos de desenvolvimento DEVEM usar WSL:**
```bash
# Template obrigatório
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && [COMANDO]"

# Exemplos práticos
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm install"
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm dev"
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && docker compose up"
```

### **pnpm Obrigatório**

**NUNCA usar npm em qualquer contexto:**
- ❌ `npm install` (proibido)
- ❌ `npm run dev` (proibido)
- ✅ `pnpm install` (obrigatório)
- ✅ `pnpm dev` (obrigatório)

### **Docker Único e Otimizado**

**OBRIGATÓRIO:**
- ✅ Apenas um arquivo: `Dockerfile` (sem sufixos)
- ✅ Compatível com Coolify
- ✅ Multi-stage build
- ✅ Cache inteligente do pnpm

**PROIBIDO:**
- ❌ `Dockerfile.dev`, `Dockerfile.prod`, etc.
- ❌ Usar npm no Dockerfile
- ❌ Configurações específicas de ambiente

### **Limite de 500 Linhas**

**OBRIGATÓRIO para TODOS os arquivos:**
- ✅ Arquivos .ts/.tsx: máximo 500 linhas
- ✅ Arquivos .md: máximo 500 linhas
- ✅ Scripts: máximo 500 linhas
- ✅ Arquivos de configuração: máximo 500 linhas

### **Monorepo com Workspaces**

**Estrutura obrigatória:**
```
project-root/
├── apps/                    # Aplicações
│   ├── frontend/           # React app
│   └── backend/            # Node.js API
├── packages/               # Pacotes compartilhados
│   └── shared/            # Tipos, constantes, utils
├── .kiro/steering/         # Múltiplos arquivos de steering
├── pnpm-workspace.yaml    # Configuração workspace
└── Dockerfile             # ÚNICO arquivo Docker
```

## 🚀 **Como Usar as Novas Regras**

### **Setup Inicial**

```bash
# 1. Executar setup completo via WSL
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && ./scripts/setup-complete.sh"

# 2. Validar estrutura
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm validate"
```

### **Desenvolvimento Diário**

```bash
# Instalar dependências
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm install"

# Desenvolvimento
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm dev"

# Build
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm build"

# Testes
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm test"
```

### **Docker Operations**

```bash
# Build da imagem
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && docker build -t fiscal-system ."

# Executar container
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && docker run -p 3000:3000 fiscal-system"

# Debug com Docker Compose
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && docker compose -f docker-compose.debug.yml up"
```

## 📊 **Validação e Métricas**

### **Scripts de Validação**

```bash
# Validar estrutura completa
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm validate"

# Validar apenas estrutura de monorepo
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && ./scripts/validate-monorepo.sh"

# Validar limites de arquivos
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && ./scripts/validate-file-limits.sh"

# Gerar métricas
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && ./scripts/file-metrics.sh"
```

### **Métricas de Qualidade**

**Metas implementadas:**
- ✅ Arquivos > 500 linhas: 0 (obrigatório)
- ✅ Arquivos > 300 linhas: < 10%
- ✅ Cobertura de testes: > 80%
- ✅ Build time: < 5 minutos
- ✅ Docker image size: < 200MB

## 🎯 **Benefícios Alcançados**

### **Performance**
- 🚀 Agent steering otimizado (múltiplos arquivos)
- 🚀 Docker build mais rápido (cache inteligente)
- 🚀 pnpm installs mais eficientes
- 🚀 Monorepo com workspaces otimizados

### **Manutenibilidade**
- 🔧 Arquivos menores (< 500 linhas)
- 🔧 Regras organizadas por domínio
- 🔧 Estrutura de projeto padronizada
- 🔧 Scripts de validação automática

### **Compatibilidade**
- ✅ Coolify ready (Dockerfile otimizado)
- ✅ WSL native (todos os comandos)
- ✅ pnpm workspaces (monorepo)
- ✅ Multi-stage Docker builds

### **Qualidade**
- 📊 Validação automática de estrutura
- 📊 Métricas de arquivos
- 📊 Conformidade com regras
- 📊 Health checks implementados

## 🏁 **Status Final**

### **✅ Implementado**
- WSL obrigatório para todos os comandos
- pnpm como único package manager
- Dockerfile único otimizado para Coolify
- Limite de 500 linhas por arquivo
- Monorepo com workspaces
- Agent steering reorganizado
- Scripts de validação completos

### **✅ Validado**
- Estrutura de monorepo correta
- Configuração pnpm adequada
- Dockerfile compatível com Coolify
- Todos os arquivos < 500 linhas
- Scripts usando WSL + pnpm

### **✅ Documentado**
- Regras prioritárias em steering files
- Guias de uso e setup
- Scripts de validação
- Métricas de qualidade

---

**RESULTADO**: ✅ **Implementação 100% completa**  
**CONFORMIDADE**: ✅ **Todas as regras prioritárias aplicadas**  
**VALIDAÇÃO**: ✅ **Scripts automáticos funcionando**  
**DOCUMENTAÇÃO**: ✅ **Completa e organizada**