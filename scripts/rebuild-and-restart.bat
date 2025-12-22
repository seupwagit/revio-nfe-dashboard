@echo off
REM Script para rebuild e reiniciar aplicacao fullstack

echo ==========================================
echo   Rebuild e Restart Fullstack
echo ==========================================
echo.

echo [1/4] Matando processos na porta 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 ^| findstr LISTENING') do (
    echo       Matando processo PID: %%a
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 2 /nobreak >nul
echo       OK
echo.

echo [2/4] Limpando cache do Vite...
if exist .vite (
    rmdir /s /q .vite
    echo       Cache limpo
) else (
    echo       Sem cache para limpar
)
echo.

echo [3/4] Fazendo rebuild do frontend...
echo       Isso pode levar alguns segundos...
call npm run build:prod
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERRO: Build falhou!
    echo    Verifique os erros acima
    pause
    exit /b 1
)
echo       Build concluido!
echo.

echo [4/4] Iniciando servidor fullstack...
echo.

REM Configurar variavel de ambiente
set SERVE_FRONTEND=true
set BACKOFFICE_PORT=3000
set NODE_ENV=development

echo   Frontend: http://localhost:3000
echo   Backend API: http://localhost:3000/api
echo   Health Check: http://localhost:3000/api/health
echo.
echo ==========================================
echo   Servidor Iniciando...
echo ==========================================
echo.

REM Iniciar servidor
npx tsx src/backend/index.ts
