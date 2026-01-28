@echo off
echo Migrando dependências para estrutura de monorepo otimizada...

echo.
echo 1. Limpando node_modules existentes...
if exist node_modules (
    rmdir /s /q node_modules
    echo ✅ Root node_modules removido
)

if exist apps\frontend\node_modules (
    rmdir /s /q apps\frontend\node_modules
    echo ✅ Frontend node_modules removido
)

if exist apps\backend\node_modules (
    rmdir /s /q apps\backend\node_modules
    echo ✅ Backend node_modules removido
)

if exist packages\shared\node_modules (
    rmdir /s /q packages\shared\node_modules
    echo ✅ Shared node_modules removido
)

echo.
echo 2. Removendo lockfiles antigos...
if exist package-lock.json (
    del package-lock.json
    echo ✅ package-lock.json removido
)

if exist yarn.lock (
    del yarn.lock
    echo ✅ yarn.lock removido
)

echo.
echo 3. Instalando dependências com nova estrutura...
pnpm install

if %errorlevel% neq 0 (
    echo ❌ Falha na instalação das dependências
    echo.
    echo Tentando com cache limpo...
    pnpm store prune
    pnpm install
    
    if %errorlevel% neq 0 (
        echo ❌ Falha persistente na instalação
        echo.
        echo Verifique:
        echo 1. Se pnpm está instalado: pnpm --version
        echo 2. Se os package.json estão corretos
        echo 3. Se há conflitos de versão
        exit /b 1
    )
)

echo.
echo 4. Verificando instalação...
echo Verificando shared package...
cd packages\shared
pnpm run build
if %errorlevel% neq 0 (
    echo ❌ Falha no build do shared package
    cd ..\..
    exit /b 1
)
cd ..\..

echo.
echo 5. Testando builds...
echo Testando frontend...
pnpm --filter '@fiscal/frontend' run type-check
if %errorlevel% neq 0 (
    echo ❌ Falha no type-check do frontend
    exit /b 1
)

echo Testando backend...
pnpm --filter '@fiscal/backend' run type-check
if %errorlevel% neq 0 (
    echo ❌ Falha no type-check do backend
    exit /b 1
)

echo.
echo ✅ Migração de dependências concluída com sucesso!
echo.
echo Resumo da nova estrutura:
echo 📦 Root: Apenas workspace management (concurrently, typescript)
echo 🎨 Frontend: React, Vite, UI libraries, client-side tools
echo 🔧 Backend: Express, databases, server-side tools, APIs
echo 📚 Shared: Validation (zod) e utilities compartilhadas
echo.
echo Comandos disponíveis:
echo   pnpm dev              # Ambos os servidores
echo   pnpm dev:frontend     # Apenas frontend
echo   pnpm dev:backend      # Apenas backend
echo   pnpm build            # Build de todos os projetos