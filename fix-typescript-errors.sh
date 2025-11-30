#!/bin/bash

# Script para corrigir erros de TypeScript

echo "🔧 Corrigindo erros de TypeScript..."

# Remover Dashboard.old.tsx se existir
if [ -f "src/pages/Dashboard.old.tsx" ]; then
  rm "src/pages/Dashboard.old.tsx"
  echo "✅ Removido Dashboard.old.tsx"
fi

# Remover grids antigas que não são mais usadas
if [ -f "src/pages/GridNFe.tsx" ]; then
  rm "src/pages/GridNFe.tsx"
  echo "✅ Removido GridNFe.tsx (usando GridNFeSimples)"
fi

if [ -f "src/pages/GridCFe.tsx" ]; then
  rm "src/pages/GridCFe.tsx"
  echo "✅ Removido GridCFe.tsx (usando GridCFeSimples)"
fi

if [ -f "src/pages/GridCTe.tsx" ]; then
  rm "src/pages/GridCTe.tsx"
  echo "✅ Removido GridCTe.tsx (usando GridCTeSimples)"
fi

echo "✅ Limpeza concluída!"
echo "🔍 Executando TypeScript check..."

npx tsc --noEmit

echo "✅ Pronto!"
