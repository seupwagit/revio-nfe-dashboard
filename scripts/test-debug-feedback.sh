#!/bin/bash
# Script para testar feedback do debug
# Encoding: UTF-8 without BOM

set -e

# Forcar UTF-8 rigorosamente
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export LANGUAGE=C.UTF-8

echo ""
echo "=========================================="
echo "🧪 TESTE DE FEEDBACK DO DEBUG"
echo "=========================================="
echo ""

echo "[1/5] 🔍 Testando feedback visual..."
sleep 1
echo "✅ [OK] Emojis e cores funcionando"

echo ""
echo "[2/5] ⏳ Testando indicador de progresso..."
for i in {1..5}; do
    echo "   Progresso... ${i}/5"
    sleep 0.5
done
echo "✅ [OK] Indicador de progresso funcionando"

echo ""
echo "[3/5] 📊 Testando diferentes tipos de status..."
echo "✅ [OK] Status de sucesso"
echo "⚠️  [WARN] Status de aviso"
echo "❌ [ERROR] Status de erro (simulado)"
echo "💡 [TIP] Status de dica"
echo "🔧 [INFO] Status informativo"

echo ""
echo "[4/5] 🎯 Testando separadores visuais..."
echo "=========================================="
echo "   SEÇÃO DE TESTE"
echo "=========================================="
echo "✅ [OK] Separadores funcionando"

echo ""
echo "[5/5] 📋 Testando listagem de informações..."
echo "🌐 URLs disponíveis:"
echo "   Frontend: http://localhost:4000"
echo "   Backend:  http://localhost:4001"
echo "   Health:   http://localhost:4001/api/health"
echo ""
echo "📋 Comandos úteis:"
echo "   Ver logs:    docker compose logs -f"
echo "   Parar:       docker compose down"
echo "   Status:      docker compose ps"

echo ""
echo "=========================================="
echo "✅ TESTE DE FEEDBACK CONCLUÍDO!"
echo "=========================================="
echo ""
echo "💡 O feedback visual está funcionando corretamente!"
echo "🎯 Pronto para usar no debug do VS Code!"
echo ""