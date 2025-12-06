@echo off
echo ========================================
echo   Teste de Conexao MongoDB
echo ========================================
echo.

echo [1/4] Testando ping para 10.0.0.8...
ping -n 1 10.0.0.8 > nul 2>&1
if %errorlevel% equ 0 (
    echo   ✅ Servidor responde ao ping
) else (
    echo   ❌ Servidor NAO responde ao ping
    echo.
    echo   Verifique:
    echo   - Servidor esta ligado?
    echo   - Firewall bloqueando?
    echo   - VPN conectada?
    goto :end
)

echo.
echo [2/4] Testando porta 27017...
powershell -Command "Test-NetConnection -ComputerName 10.0.0.8 -Port 27017 -InformationLevel Quiet" > nul 2>&1
if %errorlevel% equ 0 (
    echo   ✅ Porta 27017 esta acessivel
) else (
    echo   ❌ Porta 27017 NAO esta acessivel
    echo.
    echo   Possíveis causas:
    echo   - Firewall bloqueando porta 27017
    echo   - MongoDB nao esta rodando
    echo   - MongoDB configurado para localhost apenas
    goto :end
)

echo.
echo [3/4] Testando MongoDB Proxy...
curl -s http://localhost:3000/health > nul 2>&1
if %errorlevel% equ 0 (
    echo   ✅ MongoDB Proxy esta rodando
    echo.
    echo [4/4] Status do MongoDB Proxy:
    curl -s http://localhost:3000/health
) else (
    echo   ❌ MongoDB Proxy NAO esta rodando
    echo.
    echo   Para iniciar:
    echo   npm run mongodb-proxy
)

:end
echo.
echo ========================================
pause
