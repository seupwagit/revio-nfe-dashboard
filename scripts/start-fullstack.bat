@echo off
REM Script para iniciar aplicacao fullstack no Windows

echo ==========================================
echo   SpedRevio Fullstack Application
echo ==========================================
echo.

REM Configurar variavel de ambiente
set SERVE_FRONTEND=true
set BACKOFFICE_PORT=3000
set NODE_ENV=development

echo Iniciando servidor fullstack na porta 3000...
echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:3000/api
echo   Health Check: http://localhost:3000/api/health
echo.

REM Iniciar servidor
npx tsx src/backend/index.ts
