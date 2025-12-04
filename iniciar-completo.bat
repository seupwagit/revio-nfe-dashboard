@echo off
echo ========================================
echo   Revio Dashboard - Inicializacao Completa
echo ========================================
echo.
echo Este script vai iniciar:
echo   1. Frontend (Vite) na porta 5173
echo   2. Servidor de Agregacao MongoDB na porta 3002
echo.
echo Pressione CTRL+C para encerrar tudo
echo.
pause

REM Iniciar em duas janelas separadas
start "Revio - Frontend" cmd /k "npm run dev"
timeout /t 3 /nobreak > nul
start "Revio - Agregacao MongoDB" cmd /k "npm run aggregation"

echo.
echo ========================================
echo   Servicos Iniciados!
echo ========================================
echo.
echo Frontend:     http://localhost:5173
echo Analytics:    http://localhost:5173/analytics
echo Health Check: http://localhost:3000/health
echo.
echo Para encerrar, feche as janelas dos terminais
echo.
