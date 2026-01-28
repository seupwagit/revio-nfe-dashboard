@echo off
echo Building monorepo packages...

echo.
echo 1. Building shared package...
cd packages\shared
call npm install
call npm run build
cd ..\..

echo.
echo 2. Installing frontend dependencies...
cd apps\frontend
call npm install
cd ..\..

echo.
echo 3. Installing backend dependencies...
cd apps\backend
call npm install
cd ..\..

echo.
echo 4. Installing root dependencies...
call npm install

echo.
echo Monorepo build complete!
echo.
echo To start development:
echo   Frontend: npm run dev:frontend
echo   Backend:  npm run dev:backend
echo   Both:     npm run dev