@echo off
REM Script para reiniciar aplicacao fullstack (mata porta 3000 e reinicia)

echo ==========================================
echo   Reiniciando SpedRevio Fullstack
echo ==========================================
echo.

echo Procurando processos na porta 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo Matando processo PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)

echo Aguardando 2 segundos...
timeout /t 2 /nobreak >nul

echo.
echo Iniciando servidor fullstack...
echo.

REM Configurar variavel de ambiente
set SERVE_FRONTEND=true
set BACKOFFICE_PORT=3000
set NODE_ENV=development

echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:3000/api
echo   Health Check: http://localhost:3000/api/health
echo.

REM Iniciar servidor
npx tsx src/server/index.ts
