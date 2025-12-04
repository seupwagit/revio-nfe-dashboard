#!/bin/bash

# Script para atualizar todas as referências de porta 5173 para 3000

echo "🔄 Atualizando referências de porta 5173 para 3000..."

# Atualizar em arquivos de documentação
find docs -type f -name "*.md" -exec sed -i 's/5173/3000/g' {} \;

echo "✅ Documentação atualizada!"
echo ""
echo "📝 Arquivos atualizados:"
echo "  - Todos os arquivos .md em docs/"
echo ""
echo "🎯 Nova porta: 3000 (padrão do Coolify)"
