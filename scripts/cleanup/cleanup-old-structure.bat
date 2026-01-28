@echo off
echo Cleaning up old monorepo structure...

echo.
echo WARNING: This will remove the old src/ directory!
echo Make sure the new apps/ structure is working properly first.
echo.
set /p confirm="Continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo Cleanup cancelled.
    exit /b 0
)

echo.
echo 1. Removing old src directory...
if exist src\ (
    rmdir /s /q src\
    echo Old src\ directory removed.
) else (
    echo Old src\ directory not found.
)

echo.
echo 2. Removing temporary files...
del /q temp_*.* 2>nul
del /q debug-*.html 2>nul
del /q cookies.txt 2>nul
del /q simple-worker-test.js 2>nul
del /q check-users.js 2>nul
del /q mcp-cursor-executed.txt 2>nul
del /q $null 2>nul

echo.
echo 3. Removing old Docker files...
del /q Dockerfile.fullstack.debian 2>nul
del /q Dockerfile.fullstack.fixed 2>nul
del /q Dockerfile.fullstack.simple 2>nul

echo.
echo 4. Removing backup directories...
if exist backup_* (
    rmdir /s /q backup_* 2>nul
    echo Backup directories removed.
)

if exist bkp_temporario\ (
    rmdir /s /q bkp_temporario\
    echo Temporary backup removed.
)

echo.
echo 5. Cleaning up temp directory...
if exist temp\ (
    rmdir /s /q temp\
    echo Temp directory cleaned.
)

echo.
echo Cleanup complete!
echo.
echo Your monorepo structure is now clean:
echo   apps/frontend/  - React frontend
echo   apps/backend/   - Node.js backend  
echo   packages/shared/ - Shared code
echo   docs/           - Documentation
echo   scripts/        - Build scripts