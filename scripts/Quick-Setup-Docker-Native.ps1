# Script PowerShell para instalacao rapida do Docker nativo
# Encoding: UTF-8 without BOM
# Compatibilidade: Windows PowerShell 5.1+ e PowerShell Core 7+

[CmdletBinding()]
param()

# Configurar UTF-8 rigorosamente para toda a sessao
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::InputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

# Configurar politica de execucao se necessario
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force -ErrorAction SilentlyContinue

Write-Host "[INFO] Instalacao Rapida - Docker Nativo no WSL" -ForegroundColor Cyan
Write-Host "[INFO] EVITA Docker Desktop para melhor performance" -ForegroundColor Green
Write-Host ""

# Verificar se WSL Ubuntu está disponível
Write-Host "1. Verificando WSL Ubuntu..." -ForegroundColor Yellow
$wslDistros = wsl --list --quiet 2>$null
$ubuntuFound = $false
if ($LASTEXITCODE -eq 0) {
    $wslDistrosString = $wslDistros -join " "
    if ($wslDistrosString -match "Ubuntu") {
        $ubuntuFound = $true
    }
}

if (-not $ubuntuFound) {
    Write-Host "   [ERROR] Ubuntu nao encontrado no WSL" -ForegroundColor Red
    Write-Host "   [TIP] Instale Ubuntu: wsl --install -d Ubuntu" -ForegroundColor Blue
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host "   [OK] Ubuntu encontrado" -ForegroundColor Green

# Iniciar Ubuntu se necessário
Write-Host ""
Write-Host "2. Iniciando Ubuntu..." -ForegroundColor Yellow
$runningDistros = wsl --list --running --quiet 2>$null
$ubuntuRunning = $false
if ($LASTEXITCODE -eq 0) {
    $runningDistrosString = $runningDistros -join " "
    if ($runningDistrosString -match "Ubuntu") {
        $ubuntuRunning = $true
    }
}

if (-not $ubuntuRunning) {
    Write-Host "   [INFO] Iniciando Ubuntu..." -ForegroundColor Yellow
    wsl -d Ubuntu --exec echo "Ubuntu iniciado" 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Ubuntu iniciado" -ForegroundColor Green
        Start-Sleep -Seconds 2
    }
}
else {
    Write-Host "   [OK] Ubuntu ja esta rodando" -ForegroundColor Green
}

# Executar instalação do Docker nativo
Write-Host ""
Write-Host "3. Instalando Docker nativo..." -ForegroundColor Yellow
Write-Host "   [INFO] Executando script de instalacao..." -ForegroundColor Gray

try {
    $env:WSL_UTF8 = 1
    # Usar caminho atual do projeto
    $currentPath = (Get-Location).Path.Replace('\', '/').Replace('C:', '/mnt/c')
    $cleanPath = $currentPath
    $installCommand = @"
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export LANGUAGE=C.UTF-8
cd "$cleanPath"
chmod +x scripts/wsl-setup-docker-native.sh
./scripts/wsl-setup-docker-native.sh
"@

    wsl -d Ubuntu bash -c $installCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[SUCCESS] Docker nativo instalado com sucesso!" -ForegroundColor Green
    }
    else {
        throw "Script retornou codigo de erro: $LASTEXITCODE"
    }
}
catch {
    Write-Host ""
    Write-Host "[ERROR] Erro na instalacao do Docker" -ForegroundColor Red
    Write-Host "[TIP] Tente manualmente:" -ForegroundColor Blue
    Write-Host "   wsl -d Ubuntu" -ForegroundColor Gray
    Write-Host "   cd /mnt/c/Drive/Projetos/revio-nfe-dashboard" -ForegroundColor Gray
    Write-Host "   ./scripts/wsl-setup-docker-native.sh" -ForegroundColor Gray
    Read-Host "Pressione Enter para sair"
    exit 1
}

# Reiniciar WSL para aplicar mudanças
Write-Host ""
Write-Host "4. Reiniciando WSL..." -ForegroundColor Yellow
Write-Host "   [INFO] Aplicando configuracoes..." -ForegroundColor Gray

wsl --shutdown
Start-Sleep -Seconds 3
wsl -d Ubuntu --exec echo "WSL reiniciado" 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   [OK] WSL reiniciado com sucesso" -ForegroundColor Green
}

# Testar instalação
Write-Host ""
Write-Host "5. Testando instalacao..." -ForegroundColor Yellow

try {
    $testCommand = @"
export LC_ALL=C.UTF-8
export LANG=C.UTF-8
export LANGUAGE=C.UTF-8
docker --version
docker compose version
"@

    $testResult = wsl -d Ubuntu bash -c $testCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Docker funcionando corretamente" -ForegroundColor Green
        Write-Host "   [INFO] Versoes instaladas:" -ForegroundColor Gray
        $testResult | ForEach-Object { Write-Host "      $_" -ForegroundColor White }
    }
    else {
        Write-Host "   [WARN] Teste falhou, mas instalacao pode estar OK" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "   [WARN] Erro no teste, mas instalacao pode estar OK" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=========================================================" -ForegroundColor Gray
Write-Host "[SUCCESS] Instalacao concluida!" -ForegroundColor Green
Write-Host ""
Write-Host "[BENEFITS] Vantagens do Docker nativo:" -ForegroundColor Cyan
Write-Host "   - Performance superior (sem overhead do Docker Desktop)" -ForegroundColor White
Write-Host "   - Menor uso de memoria (~200MB vs ~1GB)" -ForegroundColor White
Write-Host "   - Startup mais rapido" -ForegroundColor White
Write-Host "   - Controle total sobre configuracao" -ForegroundColor White
Write-Host ""
Write-Host "[NEXT] Proximos passos:" -ForegroundColor Cyan
Write-Host "   1. Testar debug: .\scripts\Debug-Start-WSL.ps1" -ForegroundColor White
Write-Host "   2. Diagnostico: .\scripts\Debug-Diagnose-WSL.ps1" -ForegroundColor White
Write-Host "   3. Ver logs: .\scripts\Debug-Logs-WSL.ps1" -ForegroundColor White
Write-Host ""
Write-Host "[TIP] Para usar Docker sem sudo no WSL:" -ForegroundColor Blue
Write-Host "   wsl -d Ubuntu" -ForegroundColor Gray
Write-Host "   newgrp docker" -ForegroundColor Gray
Write-Host ""

Read-Host "Pressione Enter para continuar"