@echo off
echo ========================================
echo   Liberando Portas - SpedRevio
echo ========================================
echo.

echo Verificando porta 3000 (Frontend)...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3000') DO (
    echo Matando processo %%P na porta 3000
    taskkill /PID %%P /F
)

echo.
echo Verificando porta 3001 (Backend)...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :3001') DO (
    echo Matando processo %%P na porta 3001
    taskkill /PID %%P /F
)

echo.
echo Verificando porta 9229 (Debug Backend)...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :9229') DO (
    echo Matando processo %%P na porta 9229
    taskkill /PID %%P /F
)

echo.
echo Verificando porta 9222 (Chrome Debug)...
FOR /F "tokens=5" %%P IN ('netstat -ano ^| findstr :9222') DO (
    echo Matando processo %%P na porta 9222
    taskkill /PID %%P /F
)

echo.
echo ========================================
echo   Portas liberadas!
echo ========================================
pause
