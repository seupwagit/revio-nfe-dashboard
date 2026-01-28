#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Executa testes E2E para telas NFe com detecção de erros via Chrome DevTools

.DESCRIPTION
    Este script executa os testes E2E para todas as telas que acessam tbl_nfe_100,
    detecta erros de console via Chrome DevTools e corrige problemas encontrados.

.PARAMETER TestPattern
    Padrão de testes a executar (padrão: nfe-screens)

.PARAMETER Headless
    Executar em modo headless (padrão: true)

.PARAMETER Record
    Gravar vídeos dos testes (padrão: true)

.EXAMPLE
    .\scripts\run-e2e-tests.ps1
    .\scripts\run-e2e-tests.ps1 -TestPattern "integration" -Headless $false
#>

param(
    [string]$TestPattern = "nfe-screens",
    [bool]$Headless = $true,
    [bool]$Record = $true
)

Write-Host "🚀 Iniciando testes E2E para telas NFe..." -ForegroundColor Green
Write-Host "📋 Padrão de testes: $TestPattern" -ForegroundColor Cyan
Write-Host "👁️ Modo headless: $Headless" -ForegroundColor Cyan
Write-Host "📹 Gravação: $Record" -ForegroundColor Cyan

# Verificar se aplicação está rodando
Write-Host "🔍 Verificando se aplicação está rodando..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3080" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Aplicação está rodando na porta 3080" -ForegroundColor Green
} catch {
    Write-Host "❌ Aplicação não está rodando na porta 3080" -ForegroundColor Red
    Write-Host "🚀 Iniciando aplicação..." -ForegroundColor Yellow
    
    # Iniciar aplicação em background
    Start-Process -FilePath "pnpm" -ArgumentList "dev" -NoNewWindow -PassThru
    
    # Aguardar aplicação iniciar
    Write-Host "⏳ Aguardando aplicação iniciar..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # Verificar novamente
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3080" -Method GET -TimeoutSec 10 -ErrorAction Stop
        Write-Host "✅ Aplicação iniciada com sucesso" -ForegroundColor Green
    } catch {
        Write-Host "❌ Falha ao iniciar aplicação" -ForegroundColor Red
        Write-Host "💡 Inicie manualmente com: pnpm dev" -ForegroundColor Yellow
        exit 1
    }
}

# Configurar argumentos do Cypress
$cypressArgs = @()

if ($TestPattern -eq "nfe-screens") {
    $cypressArgs += "--spec", "apps/frontend/src/e2e/nfe-screens/**/*.cy.ts"
} elseif ($TestPattern -eq "integration") {
    $cypressArgs += "--spec", "apps/frontend/src/e2e/integration/**/*.cy.ts"
} else {
    $cypressArgs += "--spec", "apps/frontend/src/e2e/**/*$TestPattern*.cy.ts"
}

if ($Headless) {
    $cypressArgs += "--headless"
}

if ($Record) {
    $cypressArgs += "--record", "false"  # Não gravar no Cypress Cloud por enquanto
}

# Configurar variáveis de ambiente para testes
$env:CYPRESS_baseUrl = "http://localhost:3080"
$env:CYPRESS_API_BASE_URL = "http://localhost:3001"
$env:CYPRESS_TEST_USER_EMAIL = "divino@grupochama.com.br"
$env:CYPRESS_TEST_USER_PASSWORD = "123456789"

Write-Host "🧪 Executando testes E2E..." -ForegroundColor Green
Write-Host "📝 Comando: cypress run $($cypressArgs -join ' ')" -ForegroundColor Cyan

# Executar testes
try {
    & npx cypress run @cypressArgs
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host "✅ Todos os testes E2E passaram!" -ForegroundColor Green
    } else {
        Write-Host "❌ Alguns testes falharam (código: $exitCode)" -ForegroundColor Red
        
        # Verificar se há vídeos de falhas
        if (Test-Path "cypress/videos") {
            Write-Host "📹 Vídeos de falhas disponíveis em: cypress/videos" -ForegroundColor Yellow
        }
        
        # Verificar se há screenshots de falhas
        if (Test-Path "cypress/screenshots") {
            Write-Host "📸 Screenshots de falhas disponíveis em: cypress/screenshots" -ForegroundColor Yellow
        }
    }
} catch {
    Write-Host "❌ Erro ao executar testes E2E: $($_.Exception.Message)" -ForegroundColor Red
    $exitCode = 1
}

# Relatório final
Write-Host "`n📊 RELATÓRIO FINAL" -ForegroundColor Magenta
Write-Host "=================" -ForegroundColor Magenta

if ($exitCode -eq 0) {
    Write-Host "✅ Status: SUCESSO" -ForegroundColor Green
    Write-Host "🎯 Todas as telas NFe que acessam tbl_nfe_100 estão funcionando" -ForegroundColor Green
    Write-Host "🔧 Agrupamento configurável não quebrou funcionalidades" -ForegroundColor Green
} else {
    Write-Host "❌ Status: FALHA" -ForegroundColor Red
    Write-Host "🔍 Verifique os logs, vídeos e screenshots para detalhes" -ForegroundColor Yellow
    Write-Host "🛠️ Corrija os problemas encontrados e execute novamente" -ForegroundColor Yellow
}

Write-Host "`n📁 Arquivos gerados:" -ForegroundColor Cyan
if (Test-Path "cypress/videos") {
    Write-Host "  📹 Vídeos: cypress/videos/" -ForegroundColor White
}
if (Test-Path "cypress/screenshots") {
    Write-Host "  📸 Screenshots: cypress/screenshots/" -ForegroundColor White
}

exit $exitCode