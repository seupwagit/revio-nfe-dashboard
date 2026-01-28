# Setup pnpm for the monorepo
Write-Host "Setting up pnpm for the monorepo..." -ForegroundColor Cyan

Write-Host "`n1. Checking if pnpm is installed..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version 2>$null
    Write-Host "✅ pnpm is already installed (version: $pnpmVersion)" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm not found. Installing pnpm..." -ForegroundColor Red
    
    Write-Host "Installing pnpm via npm..." -ForegroundColor Yellow
    npm install -g pnpm@9.0.0
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install pnpm via npm" -ForegroundColor Red
        Write-Host "`nPlease install pnpm manually:" -ForegroundColor Yellow
        Write-Host "  npm install -g pnpm@9.0.0" -ForegroundColor White
        Write-Host "  or visit: https://pnpm.io/installation" -ForegroundColor White
        exit 1
    }
    
    Write-Host "✅ pnpm installed successfully" -ForegroundColor Green
}

Write-Host "`n2. Verifying pnpm version..." -ForegroundColor Yellow
$currentVersion = pnpm --version
Write-Host "Current pnpm version: $currentVersion" -ForegroundColor White

Write-Host "`n3. Setting up workspace..." -ForegroundColor Yellow
Write-Host "Installing dependencies with pnpm..." -ForegroundColor White
pnpm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host "`n4. Building shared package..." -ForegroundColor Yellow
pnpm --filter '@fiscal/shared' build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to build shared package" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ Setup complete!" -ForegroundColor Green
Write-Host "`nAvailable commands:" -ForegroundColor Cyan
Write-Host "  pnpm dev              # Start both frontend and backend" -ForegroundColor White
Write-Host "  pnpm dev:frontend     # Start frontend only" -ForegroundColor White
Write-Host "  pnpm dev:backend      # Start backend only" -ForegroundColor White
Write-Host "  pnpm build            # Build all packages" -ForegroundColor White
Write-Host "  pnpm test             # Run all tests" -ForegroundColor White
Write-Host "`nThe .npmrc file ensures everyone uses pnpm@9.0.0" -ForegroundColor Gray