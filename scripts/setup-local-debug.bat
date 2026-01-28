@echo off
echo ========================================
echo 🚀 SETUP LOCAL DEBUG ENVIRONMENT (WSL)
echo ========================================
echo.

REM Check if WSL is available
echo [1/6] 🔍 Checking WSL availability...
wsl --list --quiet >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ WSL not available!
    echo 💡 Please install WSL: wsl --install -d Ubuntu
    echo 💡 After installation, restart this script
    pause
    exit /b 1
)

echo ✅ WSL available

REM Check if Ubuntu distribution exists
echo.
echo [2/6] 🐧 Checking Ubuntu distribution...
wsl -d Ubuntu echo "Ubuntu OK" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Ubuntu distribution not found!
    echo 💡 Install Ubuntu: wsl --install -d Ubuntu
    pause
    exit /b 1
)

echo ✅ Ubuntu distribution found

REM Check if Node.js is installed in WSL
echo.
echo [3/6] 🔍 Checking Node.js in WSL...
wsl -d Ubuntu bash -c "node --version" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not found in WSL!
    echo 💡 Install Node.js in WSL:
    echo    wsl -d Ubuntu
    echo    curl -fsSL https://deb.nodesource.com/setup_20.x ^| sudo -E bash -
    echo    sudo apt-get install -y nodejs
    pause
    exit /b 1
)

echo ✅ Node.js found in WSL
wsl -d Ubuntu bash -c "node --version"

REM Check if pnpm is available in WSL
echo.
echo [4/6] 📦 Checking pnpm in WSL...
wsl -d Ubuntu bash -c "pnpm --version" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ pnpm not found in WSL!
    echo 💡 Install pnpm in WSL:
    echo    wsl -d Ubuntu bash -c "corepack enable && corepack prepare pnpm@latest --activate"
    pause
    exit /b 1
)

echo ✅ pnpm found in WSL
wsl -d Ubuntu bash -c "pnpm --version"

REM Install dependencies using WSL and pnpm
echo.
echo [5/6] 📦 Installing dependencies via WSL...
echo Installing backend dependencies...
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard/apps/backend && pnpm install"
if %errorlevel% neq 0 (
    echo ❌ Failed to install backend dependencies
    echo 💡 Check the error messages above
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

echo Installing shared dependencies...
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard/packages/shared && pnpm install"
if %errorlevel% neq 0 (
    echo ⚠️ Warning: Failed to install shared dependencies
    echo 💡 This might not be critical for basic debugging
) else (
    echo ✅ Shared dependencies installed
)

echo Installing frontend dependencies (optional)...
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard/apps/frontend && pnpm install"
if %errorlevel% neq 0 (
    echo ⚠️ Warning: Failed to install frontend dependencies
    echo 💡 Backend debugging will still work
) else (
    echo ✅ Frontend dependencies installed
)

REM Verify setup
echo.
echo [6/6] ✅ Verifying setup...
if not exist "apps\backend\node_modules" (
    echo ❌ Backend node_modules not found
    echo 💡 Dependencies installation may have failed
    pause
    exit /b 1
)

echo ✅ Backend dependencies verified

echo.
echo ========================================
echo ✅ WSL DEBUG SETUP COMPLETE!
echo ========================================
echo.
echo 🎯 Next steps:
echo   1. Open VS Code in this project
echo   2. Press F5 to start debugging
echo   3. Select "🖥️ Debug Backend (Local)"
echo   4. Set breakpoints and start debugging!
echo.
echo 🌐 URLs after debug starts:
echo   Backend: http://localhost:4001
echo   Health:  http://localhost:4001/api/health
echo.
echo 📋 Available debug configurations:
echo   • 🖥️ Debug Backend (Local) - Recommended
echo   • 🐧 Debug Backend (WSL Docker) - Requires Docker in WSL
echo   • 🚀 Debug Full Stack (Docker) - Complete environment
echo.
echo 💡 All commands now use WSL and pnpm as required
echo.
pause