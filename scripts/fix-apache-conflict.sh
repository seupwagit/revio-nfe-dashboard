#!/bin/bash

echo "🔧 CORREÇÃO DE CONFLITO APACHE2"
echo "==============================="

# Verificar se Apache2 está instalado e rodando
if systemctl list-unit-files | grep -q apache2.service; then
    echo "📋 Apache2 detectado no sistema"
    
    if systemctl is-active --quiet apache2; then
        echo "❌ Apache2 está ATIVO - causando conflito na porta 80"
        echo "🛠️ Parando Apache2..."
        sudo systemctl stop apache2
        
        echo "🛠️ Desabilitando Apache2 para não iniciar automaticamente..."
        sudo systemctl disable apache2
        
        echo "✅ Apache2 parado e desabilitado com sucesso!"
    else
        echo "✅ Apache2 já está parado"
    fi
    
    # Verificar status final
    if systemctl is-active --quiet apache2; then
        echo "❌ ERRO: Apache2 ainda está ativo"
        exit 1
    else
        echo "✅ Conflito resolvido - Apache2 está parado"
    fi
else
    echo "ℹ️ Apache2 não está instalado no sistema"
fi

echo ""
echo "🎯 PRÓXIMOS PASSOS:"
echo "=================="
echo "1. Tente executar o debug novamente no VS Code (F5)"
echo "2. Acesse: http://localhost:4000 (frontend)"
echo "3. Acesse: http://localhost:4001 (backend)"
echo "4. Se ainda houver problemas, execute: ./scripts/debug-port-check.sh"

echo ""
echo "💡 DICA: Para evitar este problema no futuro:"
echo "   - Apache2 foi desabilitado e não iniciará automaticamente"
echo "   - Se precisar do Apache2 para outros projetos, use portas diferentes"