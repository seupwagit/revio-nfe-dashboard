@echo off
echo ========================================
echo   SpedRevio Dashboard - Inicializacao
echo ========================================
echo.
echo Iniciando servidores...
echo.

REM Inicia o MongoDB Proxy em uma nova janela
echo [1/2] Iniciando MongoDB Proxy (Backend)...
start "MongoDB Proxy - Backend" cmd /k "npm run mongodb-proxy"
timeout /t 3 /nobreak > nul

REM Inicia o Vite Dev Server em uma nova janela
echo [2/2] Iniciando Vite Dev Server (Frontend)...
start "Vite Dev Server - Frontend" cmd /k "npm run dev"

echo.
echo ========================================
echo   Servidores iniciados com sucesso!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend:  http://localhost:3000
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause > nul
