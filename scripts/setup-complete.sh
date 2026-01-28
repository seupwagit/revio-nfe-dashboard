#!/bin/bash
# Setup completo do projeto seguindo regras WSL/pnpm/monorepo
# Script principal para configuração do ambiente

set -e

echo "=========================================="
echo "🚀 SETUP COMPLETO - FISCAL SYSTEM"
echo "=========================================="
echo ""

# Verificar se estamos no WSL
if [[ ! -f /proc/version ]] || ! grep -qi microsoft /proc/version; then
    echo "❌ Este script deve ser executado no WSL Ubuntu"
    echo "💡 Execute: wsl -d Ubuntu"
    exit 1
fi

echo "✅ Executando no WSL Ubuntu"

# Verificar Node.js
echo ""
echo "[1/8] 🔍 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado!"
    echo "💡 Instale Node.js 20+:"
    echo "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -"
    echo "   sudo apt-get install -y nodejs"
    exit 1
fi

node_version=$(node --version)
echo "✅ Node.js encontrado: $node_version"

# Verificar pnpm
echo ""
echo "[2/8] 📦 Verificando pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "⚠️ pnpm não encontrado, instalando..."
    corepack enable
    corepack prepare pnpm@latest --activate
fi

pnpm_version=$(pnpm --version)
echo "✅ pnpm encontrado: $pnpm_version"

# Validar estrutura do monorepo
echo ""
echo "[3/8] 🏗️ Validando estrutura do monorepo..."
if [[ -f "scripts/validate-monorepo.sh" ]]; then
    chmod +x scripts/validate-monorepo.sh
    ./scripts/validate-monorepo.sh
else
    echo "⚠️ Script de validação não encontrado, continuando..."
fi

# Validar limites de arquivos
echo ""
echo "[4/8] 📏 Validando limites de arquivos..."
if [[ -f "scripts/validate-file-limits.sh" ]]; then
    chmod +x scripts/validate-file-limits.sh
    ./scripts/validate-file-limits.sh
else
    echo "⚠️ Script de validação de arquivos não encontrado, continuando..."
fi

# Limpar instalações anteriores
echo ""
echo "[5/8] 🧹 Limpando instalações anteriores..."
rm -rf node_modules apps/*/node_modules packages/*/node_modules
echo "✅ Cache limpo"

# Instalar dependências
echo ""
echo "[6/8] 📦 Instalando dependências..."
echo "⏳ Isso pode levar alguns minutos..."

# Configurar cache do pnpm
pnpm config set store-dir ~/.pnpm-store

# Instalar dependências do workspace
pnpm install --frozen-lockfile

echo "✅ Dependências instaladas"

# Verificar instalação
echo ""
echo "[7/8] ✅ Verificando instalação..."

# Verificar se workspaces foram instalados
if [[ -d "apps/frontend/node_modules" ]]; then
    echo "  ✅ Frontend dependencies instaladas"
else
    echo "  ⚠️ Frontend dependencies não encontradas"
fi

if [[ -d "apps/backend/node_modules" ]]; then
    echo "  ✅ Backend dependencies instaladas"
else
    echo "  ⚠️ Backend dependencies não encontradas"
fi

if [[ -d "packages/shared/node_modules" ]]; then
    echo "  ✅ Shared dependencies instaladas"
else
    echo "  ⚠️ Shared dependencies não encontradas"
fi

# Gerar métricas
echo ""
echo "[8/8] 📊 Gerando métricas do projeto..."
if [[ -f "scripts/file-metrics.sh" ]]; then
    chmod +x scripts/file-metrics.sh
    ./scripts/file-metrics.sh
else
    echo "⚠️ Script de métricas não encontrado, continuando..."
fi

echo ""
echo "=========================================="
echo "✅ SETUP COMPLETO FINALIZADO!"
echo "=========================================="
echo ""
echo "🎯 Próximos passos:"
echo ""
echo "1️⃣ Desenvolvimento:"
echo "   pnpm dev                    # Iniciar frontend + backend"
echo "   pnpm --filter @fiscal/frontend dev  # Apenas frontend"
echo "   pnpm --filter @fiscal/backend dev   # Apenas backend"
echo ""
echo "2️⃣ Build:"
echo "   pnpm build                  # Build completo"
echo "   pnpm --filter @fiscal/shared build  # Build shared primeiro"
echo ""
echo "3️⃣ Testes:"
echo "   pnpm test                   # Executar todos os testes"
echo "   pnpm lint                   # Verificar código"
echo "   pnpm type-check             # Verificar tipos"
echo ""
echo "4️⃣ Validação:"
echo "   pnpm validate               # Validar estrutura + arquivos"
echo "   ./scripts/file-metrics.sh   # Métricas de arquivos"
echo ""
echo "5️⃣ Debug no VS Code:"
echo "   - Abra VS Code neste diretório"
echo "   - Pressione F5"
echo "   - Selecione configuração de debug"
echo ""
echo "🌐 URLs de desenvolvimento:"
echo "   Frontend: http://localhost:4000"
echo "   Backend:  http://localhost:4001"
echo "   Health:   http://localhost:4001/api/health"
echo ""
echo "📖 Documentação:"
echo "   README.md                   # Guia principal"
echo "   .kiro/steering/             # Regras do projeto"
echo "   docs/                       # Documentação técnica"
echo ""
echo "💡 Todas as operações agora usam WSL + pnpm conforme as regras!"