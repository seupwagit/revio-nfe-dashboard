@echo off
echo Setting up pnpm for the monorepo...

echo.
echo 1. Checking if pnpm is installed...
pnpm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ pnpm not found. Installing pnpm...
    
    echo Installing pnpm via npm...
    npm install -g pnpm@9.0.0
    
    if %errorlevel% neq 0 (
        echo ❌ Failed to install pnpm via npm
        echo.
        echo Please install pnpm manually:
        echo   npm install -g pnpm@9.0.0
        echo   or visit: https://pnpm.io/installation
        exit /b 1
    )
    
    echo ✅ pnpm installed successfully
) else (
    echo ✅ pnpm is already installed
    pnpm --version
)

echo.
echo 2. Verifying pnpm version...
for /f "tokens=*" %%i in ('pnpm --version') do set PNPM_VERSION=%%i
echo Current pnpm version: %PNPM_VERSION%

echo.
echo 3. Setting up workspace...
echo Installing dependencies with pnpm...
pnpm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

echo.
echo 4. Building shared package...
pnpm --filter '@fiscal/shared' build

if %errorlevel% neq 0 (
    echo ❌ Failed to build shared package
    exit /b 1
)

echo.
echo ✅ Setup complete!
echo.
echo Available commands:
echo   pnpm dev              # Start both frontend and backend
echo   pnpm dev:frontend     # Start frontend only
echo   pnpm dev:backend      # Start backend only
echo   pnpm build            # Build all packages
echo   pnpm test             # Run all tests
echo.
echo The .npmrc file ensures everyone uses pnpm@9.0.0