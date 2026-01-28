@echo off
echo Testing monorepo setup...

echo.
echo 1. Testing shared package build...
cd packages\shared
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Shared package build failed
    exit /b 1
)
echo ✅ Shared package built successfully
cd ..\..

echo.
echo 2. Testing frontend TypeScript compilation...
cd apps\frontend
call npm run type-check
if %errorlevel% neq 0 (
    echo ❌ Frontend type check failed
    exit /b 1
)
echo ✅ Frontend types are valid
cd ..\..

echo.
echo 3. Testing backend TypeScript compilation...
cd apps\backend
call npm run type-check
if %errorlevel% neq 0 (
    echo ❌ Backend type check failed
    exit /b 1
)
echo ✅ Backend types are valid
cd ..\..

echo.
echo 4. Testing shared package imports...
node -e "
try {
  const shared = require('./packages/shared/dist/index.js');
  console.log('✅ Shared package imports working');
  console.log('Available exports:', Object.keys(shared));
} catch (error) {
  console.log('❌ Shared package import failed:', error.message);
  process.exit(1);
}
"

echo.
echo 🎉 All tests passed! Monorepo is working correctly.
echo.
echo To start development:
echo   Frontend only: npm run dev:frontend
echo   Backend only:  npm run dev:backend  
echo   Both servers:  npm run dev