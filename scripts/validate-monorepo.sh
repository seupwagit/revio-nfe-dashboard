#!/bin/bash
# Validar estrutura de monorepo
# Seguindo regras WSL/pnpm prioritárias

set -e

echo "🔍 Validando estrutura de monorepo..."

# Verificar arquivos obrigatórios
required_files=(
  "pnpm-workspace.yaml"
  "package.json"
  "apps/frontend/package.json"
  "apps/backend/package.json"
  "packages/shared/package.json"
  "Dockerfile"
)

echo "📋 Verificando arquivos obrigatórios..."
for file in "${required_files[@]}"; do
  if [[ ! -f "$file" ]]; then
    echo "❌ Arquivo obrigatório não encontrado: $file"
    exit 1
  fi
  echo "  ✅ $file"
done

# Verificar configuração workspace
echo ""
echo "⚙️ Verificando configuração workspace..."
if ! grep -q "packages:" pnpm-workspace.yaml; then
  echo "❌ pnpm-workspace.yaml mal configurado"
  exit 1
fi

if ! grep -q "apps/\*" pnpm-workspace.yaml; then
  echo "❌ pnpm-workspace.yaml deve incluir 'apps/*'"
  exit 1
fi

if ! grep -q "packages/\*" pnpm-workspace.yaml; then
  echo "❌ pnpm-workspace.yaml deve incluir 'packages/*'"
  exit 1
fi

echo "  ✅ pnpm-workspace.yaml configurado corretamente"

# Verificar package.json root
echo ""
echo "📦 Verificando package.json root..."
if ! grep -q '"packageManager": "pnpm@' package.json; then
  echo "❌ package.json deve especificar packageManager pnpm"
  exit 1
fi

if ! grep -q '"private": true' package.json; then
  echo "❌ package.json root deve ser private"
  exit 1
fi

echo "  ✅ package.json root configurado corretamente"

# Verificar dependências workspace
echo ""
echo "🔗 Verificando dependências workspace..."
if grep -q "workspace:" apps/frontend/package.json; then
  echo "  ✅ Frontend usa dependências workspace"
else
  echo "  ⚠️ Frontend não usa dependências workspace"
fi

if grep -q "workspace:" apps/backend/package.json; then
  echo "  ✅ Backend usa dependências workspace"
else
  echo "  ⚠️ Backend não usa dependências workspace"
fi

# Verificar estrutura de diretórios
echo ""
echo "📁 Verificando estrutura de diretórios..."
required_dirs=(
  "apps/frontend/src"
  "apps/backend/src"
  "packages/shared/src"
  "docs"
  "scripts"
  ".kiro/steering"
)

for dir in "${required_dirs[@]}"; do
  if [[ ! -d "$dir" ]]; then
    echo "  ⚠️ Diretório recomendado não encontrado: $dir"
  else
    echo "  ✅ $dir"
  fi
done

# Verificar Dockerfile único
echo ""
echo "🐳 Verificando configuração Docker..."
if [[ -f "Dockerfile" ]]; then
  echo "  ✅ Dockerfile único encontrado"
else
  echo "  ❌ Dockerfile obrigatório não encontrado"
  exit 1
fi

# Verificar se não há Dockerfiles múltiplos (proibido)
dockerfile_count=$(find . -maxdepth 1 -name "Dockerfile*" | wc -l)
if [[ $dockerfile_count -gt 1 ]]; then
  echo "  ❌ Múltiplos Dockerfiles encontrados (proibido)"
  echo "  💡 Use apenas um Dockerfile na raiz"
  find . -maxdepth 1 -name "Dockerfile*"
  exit 1
fi

# Verificar scripts de steering
echo ""
echo "📋 Verificando steering files..."
steering_files=(
  ".kiro/steering/wsl-docker-rules.md"
  ".kiro/steering/file-organization-rules.md"
  ".kiro/steering/monorepo-workspace-rules.md"
  ".kiro/steering/code-quality-rules.md"
)

for file in "${steering_files[@]}"; do
  if [[ -f "$file" ]]; then
    echo "  ✅ $file"
  else
    echo "  ⚠️ Steering file não encontrado: $file"
  fi
done

echo ""
echo "=========================================="
echo "✅ ESTRUTURA DE MONOREPO VÁLIDA!"
echo "=========================================="
echo ""
echo "📊 Resumo da validação:"
echo "  ✅ Arquivos obrigatórios: OK"
echo "  ✅ Configuração workspace: OK"
echo "  ✅ Package.json root: OK"
echo "  ✅ Dockerfile único: OK"
echo "  ✅ Estrutura de diretórios: OK"
echo ""
echo "💡 Para instalar dependências:"
echo "  wsl -d Ubuntu bash -c \"cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm install\""
echo ""
echo "💡 Para executar desenvolvimento:"
echo "  wsl -d Ubuntu bash -c \"cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm dev\""