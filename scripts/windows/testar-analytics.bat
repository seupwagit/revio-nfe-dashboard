@echo off
echo ========================================
echo   Teste de Analytics MongoDB
echo ========================================
echo.

echo [1/3] Verificando se o servidor esta rodando...
curl -s http://localhost:3000/health > nul 2>&1
if %errorlevel% equ 0 (
    echo   ✅ Servidor esta rodando!
    echo.
    echo [2/3] Detalhes do servidor:
    curl -s http://localhost:3000/health
    echo.
    echo.
    echo [3/3] Abrindo Analytics no navegador...
    start http://localhost:5173/analytics
    echo   ✅ Navegador aberto!
    echo.
    echo ========================================
    echo   Tudo funcionando! 🎉
    echo ========================================
) else (
    echo   ❌ Servidor NAO esta rodando!
    echo.
    echo Para iniciar o servidor:
    echo   npm run aggregation
    echo.
    echo Ou use o atalho:
    echo   iniciar-completo.bat
)
echo.
pause
