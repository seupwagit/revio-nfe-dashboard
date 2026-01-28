#!/bin/bash
# Teste completo da implementação WSL/pnpm/monorepo
# Valida todas as regras prioritárias implementadas

set -e

echo "=========================================="
echo "🧪 TESTE COMPLETO DA IMPLEMENTAÇÃO"
echo "=========================================="
echo ""

# Verificar se estamos no WSL
if [[ ! -f /proc/version ]] || ! grep -qi microsoft /proc/version; then
    echo "❌ Este script deve ser executado no WSL Ubuntu"
    echo "💡 Execute: wsl -d Ubuntu bash -c \"cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && ./scripts/test-implementation.sh\""
    exit 1
fi

echo "✅ Executando no WSL Ubuntu"

# Contadores de testes
total_tests=0
passed_tests=0
failed_tests=0

# Função para executar teste
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    total_tests=$((total_tests + 1))
    echo ""
    echo "[$total_tests] 🧪 $test_name"
    
    if eval "$test_command"; then
        echo "  ✅ PASSOU"
        passed_tests=$((passed_tests + 1))
    else
        echo "  ❌ FALHOU"
        failed_tests=$((failed_tests + 1))
    fi
}

# Teste 1: Verificar Node.js
run_test "Node.js disponível" "command -v node &> /dev/null"

# Teste 2: Verificar pnpm
run_test "pnpm disponível" "command -v pnpm &> /dev/null"

# Teste 3: Verificar Docker
run_test "Docker disponível" "command -v docker &> /dev/null"

# Teste 4: Verificar estrutura de monorepo
run_test "Estrutura de monorepo" "[[ -f pnpm-workspace.yaml && -f package.json && -d apps/frontend && -d apps/backend && -d packages/shared ]]"

# Teste 5: Verificar Dockerfile único
run_test "Dockerfile único" "[[ -f Dockerfile && $(find . -maxdepth 1 -name 'Dockerfile*' | wc -l) -eq 1 ]]"

# Teste 6: Verificar steering files
run_test "Steering files organizados" "[[ -f .kiro/steering/wsl-docker-rules.md && -f .kiro/steering/file-organization-rules.md && -f .kiro/steering/monorepo-workspace-rules.md ]]"

# Teste 7: Verificar scripts de validação
run_test "Scripts de validação" "[[ -x scripts/validate-monorepo.sh && -x scripts/validate-file-limits.sh && -x scripts/file-metrics.sh ]]"

# Teste 8: Verificar configuração pnpm workspace
run_test "Configuração pnpm workspace" "grep -q 'packages:' pnpm-workspace.yaml && grep -q 'apps/\\*' pnpm-workspace.yaml"

# Teste 9: Verificar package.json root
run_test "Package.json root configurado" "grep -q '\"packageManager\": \"pnpm@' package.json && grep -q '\"private\": true' package.json"

# Teste 10: Executar validação de estrutura
run_test "Validação de estrutura" "./scripts/validate-monorepo.sh"

# Teste 11: Executar validação de limites
run_test "Validação de limites de arquivos" "./scripts/validate-file-limits.sh"

# Teste 12: Verificar se pnpm install funciona
run_test "pnpm install funcional" "pnpm install --dry-run"

# Teste 13: Verificar se Docker build funciona
run_test "Docker build funcional" "docker build -t test-fiscal-system . --dry-run 2>/dev/null || docker build -t test-fiscal-system . --no-cache --quiet"

# Teste 14: Verificar health check no Dockerfile
run_test "Health check no Dockerfile" "grep -q 'HEALTHCHECK' Dockerfile"

# Teste 15: Verificar cache do pnpm no Dockerfile
run_test "Cache pnpm no Dockerfile" "grep -q 'pnpm config set store-dir' Dockerfile"

echo ""
echo "=========================================="
echo "📊 RESULTADOS DOS TESTES"
echo "=========================================="
echo ""
echo "📋 Resumo:"
echo "  🧪 Total de testes: $total_tests"
echo "  ✅ Testes passaram: $passed_tests"
echo "  ❌ Testes falharam: $failed_tests"

if [ $failed_tests -eq 0 ]; then
    echo ""
    echo "🎉 TODOS OS TESTES PASSARAM!"
    echo "✅ Implementação WSL/pnpm/monorepo está completa e funcional"
    echo ""
    echo "🚀 Próximos passos:"
    echo "  1. Execute: pnpm install"
    echo "  2. Execute: pnpm dev"
    echo "  3. Abra VS Code e pressione F5 para debug"
    echo ""
    echo "📖 Documentação:"
    echo "  - README.md (guia principal)"
    echo "  - .kiro/steering/ (regras do projeto)"
    echo "  - docs/fixes/wsl-pnpm-monorepo-implementation-summary.md (resumo completo)"
else
    echo ""
    echo "⚠️ ALGUNS TESTES FALHARAM"
    echo "💡 Verifique os erros acima e corrija antes de continuar"
    echo ""
    echo "🔧 Comandos úteis para correção:"
    echo "  - ./scripts/setup-complete.sh (setup completo)"
    echo "  - ./scripts/validate-monorepo.sh (validar estrutura)"
    echo "  - ./scripts/validate-file-limits.sh (validar arquivos)"
    echo ""
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ IMPLEMENTAÇÃO VALIDADA COM SUCESSO!"
echo "=========================================="