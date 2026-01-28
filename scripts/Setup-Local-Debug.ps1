# Setup Local Debug Environment via WSL
# PowerShell script following WSL/pnpm priority rules

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "🚀 SETUP LOCAL DEBUG ENVIRONMENT (WSL)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if command exists in WSL
function Test-WSLCommand($cmdname) {
    $result = wsl -d Ubuntu bash -c "command -v $cmdname" 2>$null
    return $LASTEXITCODE -eq 0
}

# Check if WSL is available
Write-Host "[1/6] 🔍 Checking WSL availability..." -ForegroundColor Yellow
try {
    $wslList = wsl --list --quiet 2>$null
    if ($LASTEXITCODE -ne 0) {
        throw "WSL not available"
    }
    Write-Host "✅ WSL available" -ForegroundColor Green
} catch {
    Write-Host "❌ WSL not available!" -ForegroundColor Red
    Write-Host "💡 Please install WSL: wsl --install -d Ubuntu" -ForegroundColor Blue
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Ubuntu distribution exists
Write-Host ""
Write-Host "[2/6] 🐧 Checking Ubuntu distribution..." -ForegroundColor Yellow
try {
    wsl -d Ubuntu echo "Ubuntu OK" 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        throw "Ubuntu not found"
    }
    Write-Host "✅ Ubuntu distribution found" -ForegroundColor Green
} catch {
    Write-Host "❌ Ubuntu distribution not found!" -ForegroundColor Red
    Write-Host "💡 Install Ubuntu: wsl --install -d Ubuntu" -ForegroundColor Blue
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if Node.js is installed in WSL
Write-Host ""
Write-Host "[3/6] 🔍 Checking Node.js in WSL..." -ForegroundColor Yellow
if (-not (Test-WSLCommand "node")) {
    Write-Host "❌ Node.js not found in WSL!" -ForegroundColor Red
    Write-Host "💡 Install Node.js in WSL:" -ForegroundColor Blue
    Write-Host "   wsl -d Ubuntu" -ForegroundColor Blue
    Write-Host "   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -" -ForegroundColor Blue
    Write-Host "   sudo apt-get install -y nodejs" -ForegroundColor Blue
    Read-Host "Press Enter to exit"
    exit 1
}

$nodeVersion = wsl -d Ubuntu bash -c "node --version"
Write-Host "✅ Node.js found in WSL: $nodeVersion" -ForegroundColor Green

# Check if pnpm is available in WSL
Write-Host ""
Write-Host "[4/6] 📦 Checking pnpm in WSL..." -ForegroundColor Yellow
if (-not (Test-WSLCommand "pnpm")) {
    Write-Host "❌ pnpm not found in WSL!" -ForegroundColor Red
    Write-Host "💡 Install pnpm in WSL:" -ForegroundColor Blue
    Write-Host "   wsl -d Ubuntu bash -c 'corepack enable && corepack prepare pnpm@latest --activate'" -ForegroundColor Blue
    Read-Host "Press Enter to exit"
    exit 1
}

$pnpmVersion = wsl -d Ubuntu bash -c "pnpm --version"
Write-Host "✅ pnpm found in WSL: $pnpmVersion" -ForegroundColor Green

# Install dependencies using WSL and pnpm
Write-Host ""
Write-Host "[5/6] 📦 Installing dependencies via WSL..." -ForegroundColor Yellow

Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
try {
    wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard/apps/backend && pnpm install"
    if ($LASTEXITCODE -ne 0) {
        throw "Backend dependencies installation failed"
    }
    Write-Host "✅ Backend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install backend dependencies" -ForegroundColor Red
    Write-Host "💡 Check the error messages above" -ForegroundColor Blue
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Installing shared dependencies..." -ForegroundColor Cyan
try {
    wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard/packages/shared && pnpm install"
    if ($LASTEXITCODE -ne 0) {
        throw "Shared dependencies installation failed"
    }
    Write-Host "✅ Shared dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Warning: Failed to install shared dependencies" -ForegroundColor Yellow
    Write-Host "💡 This might not be critical for basic debugging" -ForegroundColor Blue
}

Write-Host "Installing frontend dependencies (optional)..." -ForegroundColor Cyan
try {
    wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard/apps/frontend && pnpm install"
    if ($LASTEXITCODE -ne 0) {
        throw "Frontend dependencies installation failed"
    }
    Write-Host "✅ Frontend dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Warning: Failed to install frontend dependencies" -ForegroundColor Yellow
    Write-Host "💡 Backend debugging will still work" -ForegroundColor Blue
}

# Verify setup
Write-Host ""
Write-Host "[6/6] ✅ Verifying setup..." -ForegroundColor Yellow
if (-not (Test-Path "apps\backend\node_modules")) {
    Write-Host "❌ Backend node_modules not found" -ForegroundColor Red
    Write-Host "💡 Dependencies installation may have failed" -ForegroundColor Blue
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "✅ Backend dependencies verified" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ WSL DEBUG SETUP COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "🎯 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Open VS Code in this project" -ForegroundColor White
Write-Host "  2. Press F5 to start debugging" -ForegroundColor White
Write-Host "  3. Select '🖥️ Debug Backend (Local)'" -ForegroundColor White
Write-Host "  4. Set breakpoints and start debugging!" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URLs after debug starts:" -ForegroundColor Cyan
Write-Host "  Backend: http://localhost:4001" -ForegroundColor White
Write-Host "  Health:  http://localhost:4001/api/health" -ForegroundColor White
Write-Host ""
Write-Host "📋 Available debug configurations:" -ForegroundColor Cyan
Write-Host "  • 🖥️ Debug Backend (Local) - Recommended" -ForegroundColor White
Write-Host "  • 🐧 Debug Backend (WSL Docker) - Requires Docker in WSL" -ForegroundColor White
Write-Host "  • 🚀 Debug Full Stack (Docker) - Complete environment" -ForegroundColor White
Write-Host ""
Write-Host "💡 All commands now use WSL and pnpm as required" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to continue"