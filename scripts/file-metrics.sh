#!/bin/bash
# Gerar métricas de arquivos do projeto
# Seguindo regras de organização de arquivos

set -e

echo "📊 MÉTRICAS DE ARQUIVOS"
echo "======================"

# Contadores
small_files=0
medium_files=0
large_files=0
xlarge_files=0
total_lines=0
total_files=0

# Função para processar arquivo
process_file() {
  local file="$1"
  local lines=$(wc -l < "$file" 2>/dev/null || echo 0)
  
  total_files=$((total_files + 1))
  total_lines=$((total_lines + lines))
  
  if [ $lines -le 100 ]; then
    small_files=$((small_files + 1))
  elif [ $lines -le 300 ]; then
    medium_files=$((medium_files + 1))
  elif [ $lines -le 500 ]; then
    large_files=$((large_files + 1))
  else
    xlarge_files=$((xlarge_files + 1))
  fi
}

echo ""
echo "🔍 Analisando arquivos TypeScript/JavaScript..."
while IFS= read -r -d '' file; do
  process_file "$file"
done < <(find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -print0 2>/dev/null | grep -zv node_modules | grep -zv dist | grep -zv build)

echo ""
echo "📋 DISTRIBUIÇÃO POR TAMANHO:"
echo "  📄 Pequenos (≤100 linhas):  $small_files arquivos"
echo "  📄 Médios (101-300 linhas):  $medium_files arquivos"
echo "  📄 Grandes (301-500 linhas): $large_files arquivos"
echo "  📄 Muito grandes (>500):     $xlarge_files arquivos"

echo ""
echo "📊 ESTATÍSTICAS GERAIS:"
echo "  📁 Total de arquivos:        $total_files"
echo "  📝 Total de linhas:          $total_lines"
if [ $total_files -gt 0 ]; then
  avg_lines=$((total_lines / total_files))
  echo "  📈 Média de linhas/arquivo:   $avg_lines"
fi

echo ""
echo "🎯 METAS DE QUALIDADE:"
if [ $xlarge_files -eq 0 ]; then
  echo "  ✅ Arquivos > 500 linhas: $xlarge_files (Meta: 0)"
else
  echo "  ❌ Arquivos > 500 linhas: $xlarge_files (Meta: 0)"
fi

large_percentage=0
if [ $total_files -gt 0 ]; then
  large_percentage=$(( (large_files + xlarge_files) * 100 / total_files ))
fi

if [ $large_percentage -le 10 ]; then
  echo "  ✅ Arquivos > 300 linhas: ${large_percentage}% (Meta: < 10%)"
else
  echo "  ⚠️  Arquivos > 300 linhas: ${large_percentage}% (Meta: < 10%)"
fi

medium_percentage=0
if [ $total_files -gt 0 ]; then
  medium_percentage=$(( (medium_files + large_files + xlarge_files) * 100 / total_files ))
fi

if [ $medium_percentage -le 30 ]; then
  echo "  ✅ Arquivos > 200 linhas: ${medium_percentage}% (Meta: < 30%)"
else
  echo "  ⚠️  Arquivos > 200 linhas: ${medium_percentage}% (Meta: < 30%)"
fi

echo ""
echo "📈 TOP 10 MAIORES ARQUIVOS:"
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" 2>/dev/null | \
  grep -v node_modules | grep -v dist | grep -v build | \
  xargs wc -l 2>/dev/null | \
  sort -nr | \
  head -10 | \
  while read lines file; do
    if [ "$file" != "total" ]; then
      if [ $lines -gt 500 ]; then
        echo "  ❌ $lines linhas: $file"
      elif [ $lines -gt 300 ]; then
        echo "  ⚠️  $lines linhas: $file"
      else
        echo "  ✅ $lines linhas: $file"
      fi
    fi
  done

echo ""
echo "💡 RECOMENDAÇÕES:"
if [ $xlarge_files -gt 0 ]; then
  echo "  🔧 Refatore arquivos > 500 linhas imediatamente"
fi

if [ $large_percentage -gt 10 ]; then
  echo "  🔧 Considere dividir arquivos > 300 linhas"
fi

if [ $xlarge_files -eq 0 ] && [ $large_percentage -le 10 ]; then
  echo "  🎉 Estrutura de arquivos está bem organizada!"
fi

echo ""
echo "📖 Para estratégias de refatoração:"
echo "   Consulte: .kiro/steering/file-organization-rules.md"