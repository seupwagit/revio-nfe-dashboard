@echo off
echo ========================================
echo 🧪 TESTING DEBUG SETUP
echo ========================================
echo.

REM Test Node.js
echo [1/4] 🔍 Testing Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js not available
    goto :error
)
echo ✅ Node.js: 
node --version

REM Test npm
echo.
echo [2/4] 🔍 Testing npm...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm not available
    goto :error
)
echo ✅ npm: 
npm --version

REM Test backend dependencies
echo.
echo [3/4] 📦 Testing backend dependencies...
if not exist "apps\backend\node_modules" (
    echo ❌ Backend dependencies not installed
    echo 💡 Run: scripts\setup-local-debug.bat
    goto :error
)
echo ✅ Backend dependencies installed

REM Test environment file
echo.
echo [4/4] 📄 Testing environment file...
if not exist ".env" (
    echo ❌ .env file not found
    echo 💡 Make sure .env exists in project root
    goto :error
)
echo ✅ .env file found

echo.
echo ========================================
echo ✅ DEBUG SETUP TEST PASSED!
echo ========================================
echo.
echo 🎯 Ready to debug:
echo   1. Press F5 in VS Code
echo   2. Select "🖥️ Debug Backend (Local)"
echo   3. Backend will start at http://localhost:4001
echo.
goto :end

:error
echo.
echo ========================================
echo ❌ DEBUG SETUP TEST FAILED!
echo ========================================
echo.
echo 🔧 To fix the issues:
echo   1. Install Node.js 20+ from https://nodejs.org/
echo   2. Run: scripts\setup-local-debug.bat
echo   3. Ensure .env file exists in project root
echo.

:end
pause