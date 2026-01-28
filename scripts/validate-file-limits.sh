#!/bin/bash
# Validar limites de arquivos (máximo 500 linhas)
# Seguindo regras de organização de arquivos

set -e

echo "🔍 Validando limites de arquivos (máximo 500 linhas)..."

# Contadores
total_files=0
oversized_files=0
large_files=0

# Função para verificar arquivo
check_file() {
  local file="$1"
  local lines=$(wc -l < "$file" 2>/dev/null || echo 0)
  
  total_files=$((total_files + 1))
  
  if [ $lines -gt 500 ]; then
    echo "❌ $file: $lines linhas (limite: 500)"
    oversized_files=$((oversized_files + 1))
  elif [ $lines -gt 300 ]; then
    echo "⚠️  $file: $lines linhas (recomendado: < 300)"
    large_files=$((large_files + 1))
  fi
}

echo ""
echo "📋 Verificando arquivos TypeScript/JavaScript..."
while IFS= read -r -d '' file; do
  check_file "$file"
done < <(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -print0 2>/dev/null | grep -zv node_modules | grep -zv dist | grep -zv build)

echo ""
echo "📋 Verificando arquivos Markdown..."
while IFS= read -r -d '' file; do
  check_file "$file"
done < <(find . -name "*.md" -print0 2>/dev/null | grep -zv node_modules)

echo ""
echo "📋 Verificando scripts..."
while IFS= read -r -d '' file; do
  check_file "$file"
done < <(find scripts -name "*.sh" -o -name "*.bat" -o -name "*.ps1" -print0 2>/dev/null)

echo ""
echo "=========================================="
if [ $oversized_files -eq 0 ]; then
  echo "✅ VALIDAÇÃO DE LIMITES PASSOU!"
else
  echo "❌ VALIDAÇÃO DE LIMITES FALHOU!"
fi
echo "=========================================="
echo ""
echo "📊 Estatísticas:"
echo "  📁 Total de arquivos verificados: $total_files"
echo "  ❌ Arquivos > 500 linhas: $oversized_files"
echo "  ⚠️  Arquivos > 300 linhas: $large_files"
echo "  ✅ Arquivos dentro do limite: $((total_files - oversized_files - large_files))"

if [ $oversized_files -gt 0 ]; then
  echo ""
  echo "💡 Para corrigir arquivos grandes:"
  echo "  1. Divida por responsabilidade"
  echo "  2. Extraia funções para módulos separados"
  echo "  3. Use barrel exports (index.ts) para manter compatibilidade"
  echo ""
  echo "📖 Consulte: .kiro/steering/file-organization-rules.md"
  exit 1
fi

if [ $large_files -gt 0 ]; then
  echo ""
  echo "💡 Considere refatorar arquivos > 300 linhas para melhor manutenibilidade"
fi

echo ""
echo "✅ Todos os arquivos estão dentro do limite de 500 linhas!"