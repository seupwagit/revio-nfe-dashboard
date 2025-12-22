@echo off
echo ========================================
echo   Organizando Arquivos do Projeto
echo ========================================
echo.

REM Criar estrutura de diretorios
echo Criando estrutura de diretorios...
if not exist "docs\deploy" mkdir "docs\deploy"
if not exist "docs\debug" mkdir "docs\debug"
if not exist "docs\troubleshooting" mkdir "docs\troubleshooting"
if not exist "scripts\windows" mkdir "scripts\windows"
if not exist "scripts\monitoring" mkdir "scripts\monitoring"
if not exist "scripts\validation" mkdir "scripts\validation"
if not exist "scripts\analysis" mkdir "scripts\analysis"
if not exist "scripts\testing" mkdir "scripts\testing"

echo.
echo Movendo arquivos de documentacao...

REM Deploy docs
move /Y "DEPLOY_COMPLETE.md" "docs\deploy\" 2>nul
move /Y "DEPLOY_COOLIFY.md" "docs\deploy\" 2>nul
move /Y "DEPLOY_FIX_SUMMARY.md" "docs\deploy\" 2>nul
move /Y "DEPLOY_NOW.md" "docs\deploy\" 2>nul
move /Y "DEPLOY_README.md" "docs\deploy\" 2>nul
move /Y "DEPLOY_VISUAL_GUIDE.md" "docs\deploy\" 2>nul
move /Y "DOCKERFILE_GUIDE.md" "docs\deploy\" 2>nul
move /Y "FIX_APPLIED.md" "docs\deploy\" 2>nul

REM Debug docs
move /Y "DEBUG_QUICKSTART.md" "docs\debug\" 2>nul
move /Y "MONITORAMENTO_AUTOMATICO.md" "docs\debug\" 2>nul

REM Troubleshooting docs
move /Y "TROUBLESHOOTING_BUILD.md" "docs\troubleshooting\" 2>nul
move /Y "CORRECAO_DIFERENCA_ULTIMO_ANO.md" "docs\troubleshooting\" 2>nul
move /Y "RESUMO_CORRECAO.md" "docs\troubleshooting\" 2>nul

echo.
echo Movendo scripts Windows...

REM Scripts Windows
move /Y "contar-documentos.bat" "scripts\windows\" 2>nul
move /Y "iniciar-app.bat" "scripts\windows\" 2>nul
move /Y "iniciar-completo.bat" "scripts\windows\" 2>nul
move /Y "iniciar-monitoramento.bat" "scripts\windows\" 2>nul
move /Y "testar-analytics.bat" "scripts\windows\" 2>nul
move /Y "testar-mongodb.bat" "scripts\windows\" 2>nul
move /Y "testar-precisao-dados.bat" "scripts\windows\" 2>nul
move /Y "testar-ultimo-ano.bat" "scripts\windows\" 2>nul

echo.
echo Movendo scripts de analise...

REM Scripts de analise
move /Y "analise-completa-documentos.cjs" "scripts\analysis\" 2>nul
move /Y "analise-diferenca-199.cjs" "scripts\analysis\" 2>nul
move /Y "comparar-periodos-telas.cjs" "scripts\analysis\" 2>nul
move /Y "contar-documentos-total.cjs" "scripts\analysis\" 2>nul
move /Y "verificar-datas-documentos.cjs" "scripts\analysis\" 2>nul

echo.
echo Movendo scripts de teste...

REM Scripts de teste
move /Y "test-mongodb-connection.cjs" "scripts\testing\" 2>nul
move /Y "test-sqlserver-connection.ts" "scripts\testing\" 2>nul
move /Y "testar-correcao-limite-5000.cjs" "scripts\testing\" 2>nul

echo.
echo Movendo scripts de monitoramento...

REM Scripts de monitoramento (ja existentes em scripts/)
if exist "scripts\auto-monitor.mjs" (
    move /Y "scripts\auto-monitor.mjs" "scripts\monitoring\" 2>nul
)
if exist "scripts\validate-deploy.mjs" (
    move /Y "scripts\validate-deploy.mjs" "scripts\validation\" 2>nul
)

echo.
echo ========================================
echo   Organizacao concluida!
echo ========================================
echo.
echo Estrutura criada:
echo   docs\deploy\          - Documentacao de deploy
echo   docs\debug\           - Documentacao de debug
echo   docs\troubleshooting\ - Solucao de problemas
echo   scripts\windows\      - Scripts .bat
echo   scripts\analysis\     - Scripts de analise .cjs
echo   scripts\testing\      - Scripts de teste
echo   scripts\monitoring\   - Scripts de monitoramento
echo   scripts\validation\   - Scripts de validacao
echo.
pause
