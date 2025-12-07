@echo off
REM Script para organizar arquivos .md em docs/

echo ==========================================
echo   Organizando Documentacao
echo ==========================================
echo.

REM Criar estrutura de pastas
echo Criando estrutura de pastas...
if not exist docs\fixes mkdir docs\fixes
if not exist docs\logs mkdir docs\logs
if not exist docs\quickstart mkdir docs\quickstart
if not exist docs\status mkdir docs\status
echo OK
echo.

REM Mover arquivos de fixes/correções
echo Movendo arquivos de fixes...
move /Y ALTERACOES_FINAIS.md docs\fixes\ 2>nul
move /Y CORRECAO_DEBUG_TASK.md docs\fixes\ 2>nul
move /Y CORRECAO_ORDEM_ROTAS.md docs\fixes\ 2>nul
move /Y CORRECAO_VITE_ENV_COOLIFY.md docs\fixes\ 2>nul
move /Y DEBUG_CONFIG_CORRIGIDO.md docs\fixes\ 2>nul
move /Y PROBLEMA_API_RETORNA_HTML.md docs\fixes\ 2>nul
move /Y PROBLEMA_PORTA_3001.md docs\fixes\ 2>nul
move /Y PORTA_3000_ALTERADA.md docs\fixes\ 2>nul
echo OK
echo.

REM Mover arquivos de logs
echo Movendo arquivos de logs...
move /Y LOGS_MELHORADOS.md docs\logs\ 2>nul
move /Y LOGS_MONGODB_IMPLEMENTADOS.md docs\logs\ 2>nul
move /Y LOGS_NO_COOLIFY.md docs\logs\ 2>nul
echo OK
echo.

REM Mover arquivos de quickstart/guias
echo Movendo arquivos de quickstart...
move /Y COMO_RODAR_FULLSTACK.md docs\quickstart\ 2>nul
move /Y DEPLOY_FULLSTACK_SUMMARY.md docs\quickstart\ 2>nul
move /Y GUIA_RAPIDO_COOLIFY.md docs\quickstart\ 2>nul
move /Y INICIO_RAPIDO.md docs\quickstart\ 2>nul
move /Y SOLUCAO_RAPIDA.md docs\quickstart\ 2>nul
echo OK
echo.

REM Mover arquivos de status
echo Movendo arquivos de status...
move /Y STATUS_ATUAL.md docs\status\ 2>nul
echo OK
echo.

REM Mover troubleshooting
echo Movendo troubleshooting...
move /Y CACHE_FIX_NOW.md docs\troubleshooting\ 2>nul
move /Y ERRO_DEVTOOLS_BLOCKING.md docs\troubleshooting\ 2>nul
move /Y SOLUCAO_DEVTOOLS_BLOCK.md docs\troubleshooting\ 2>nul
move /Y TROUBLESHOOTING_GRID_VAZIA.md docs\troubleshooting\ 2>nul
echo OK
echo.

REM Mover arquivos gerais para docs/
echo Movendo arquivos gerais...
move /Y CONFIGURACAO_API_BASE_URL.md docs\ 2>nul
move /Y DOCUMENTACAO.md docs\ 2>nul
move /Y REORGANIZACAO_ESTRUTURA_BACKEND.md docs\ 2>nul
echo OK
echo.

echo ==========================================
echo   Organizacao Concluida!
echo ==========================================
echo.
echo Estrutura criada:
echo   docs\fixes\           - Correções e fixes
echo   docs\logs\            - Documentação de logs
echo   docs\quickstart\      - Guias rápidos
echo   docs\status\          - Status do projeto
echo   docs\troubleshooting\ - Solução de problemas
echo.

pause
