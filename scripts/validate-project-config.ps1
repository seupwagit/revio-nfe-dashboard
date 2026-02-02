# Validate Windows Debug Configuration
# Verifica se a configuração de debug Windows está correta

Write-Host "🔍 VALIDAÇÃO DA CONFIGURAÇÃO DE DEBUG WINDOWS" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

$errors = @()
$warnings = @()

# Função para ler variáveis do arquivo .env
function Read-EnvFile {
    param([string]$FilePath)
    
    $envVars = @{}
    if (Test-Path $FilePath) {
        Get-Content $FilePath | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                $value = $value -replace '^"(.*)"$', '$1'
                $value = $value -replace "^'(.*)'$", '$1'
                $envVars[$key] = $value
            }
        }
    }
    return $envVars
}

# 1. Verificar arquivo .env
Write-Host "📋 Verificando arquivo .env..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    $errors += "❌ Arquivo .env não encontrado"
} else {
    Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green
    
    # Ler variáveis
    $envVars = Read-EnvFile ".env"
    
    # Verificar variáveis de porta
    $requiredPorts = @("VITE_PORT", "BACKOFFICE_PORT")
    foreach ($port in $requiredPorts) {
        if ($envVars.ContainsKey($port)) {
            Write-Host "✅ $port = $($envVars[$port])" -ForegroundColor Green
        } else {
            $warnings += "⚠️ Variável $port não encontrada (usará padrão)"
        }
    }
    
    # Verificar variáveis críticas
    $criticalVars = @("VITE_API_BASE_URL", "VITE_API_BEARER_TOKEN", "VITE_DB_HOST")
    foreach ($var in $criticalVars) {
        if ($envVars.ContainsKey($var) -and ![string]::IsNullOrWhiteSpace($envVars[$var])) {
            Write-Host "✅ $var configurada" -ForegroundColor Green
        } else {
            $warnings += "⚠️ Variável crítica $var não configurada"
        }
    }
}

# 2. Verificar configuração VS Code
Write-Host "`n📋 Verificando configuração VS Code..." -ForegroundColor Yellow

# Verificar tasks.json
if (!(Test-Path ".vscode\tasks.json")) {
    $errors += "❌ Arquivo .vscode\tasks.json não encontrado"
} else {
    $tasksContent = Get-Content ".vscode\tasks.json" -Raw
    if ($tasksContent -match '\$\{env:BACKOFFICE_PORT\}') {
        Write-Host "✅ Task backend usa variável de ambiente" -ForegroundColor Green
    } else {
        $errors += "❌ Task backend não usa variável de ambiente"
    }
    
    if ($tasksContent -match '\$\{env:VITE_PORT\}') {
        Write-Host "✅ Task frontend usa variável de ambiente" -ForegroundColor Green
    } else {
        $errors += "❌ Task frontend não usa variável de ambiente"
    }
}

# Verificar launch.json
if (!(Test-Path ".vscode\launch.json")) {
    $errors += "❌ Arquivo .vscode\launch.json não encontrado"
} else {
    $launchContent = Get-Content ".vscode\launch.json" -Raw
    if ($launchContent -match '\$\{env:BACKOFFICE_PORT\}') {
        Write-Host "✅ Launch backend usa variável de ambiente" -ForegroundColor Green
    } else {
        $warnings += "⚠️ Launch backend pode não usar variável de ambiente"
    }
    
    if ($launchContent -match '\$\{env:VITE_PORT\}') {
        Write-Host "✅ Launch frontend usa variável de ambiente" -ForegroundColor Green
    } else {
        $warnings += "⚠️ Launch frontend pode não usar variável de ambiente"
    }
}

# 3. Verificar Node.js e pnpm
Write-Host "`n📋 Verificando ferramentas..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    $errors += "❌ Node.js não encontrado"
}

try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm: $pnpmVersion" -ForegroundColor Green
} catch {
    $warnings += "⚠️ pnpm não encontrado (será instalado automaticamente)"
}

# 4. Verificar dependências
Write-Host "`n📋 Verificando dependências..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ Dependências instaladas" -ForegroundColor Green
} else {
    $warnings += "⚠️ Dependências não instaladas (execute pnpm install)"
}

# 5. Verificar portas
Write-Host "`n📋 Verificando portas..." -ForegroundColor Yellow
$defaultPorts = @(4000, 4001, 9229)
if ($envVars) {
    $frontendPort = if ($envVars.ContainsKey("VITE_PORT")) { [int]$envVars["VITE_PORT"] } else { 4000 }
    $backendPort = if ($envVars.ContainsKey("BACKOFFICE_PORT")) { [int]$envVars["BACKOFFICE_PORT"] } else { 4001 }
    $ports = @($frontendPort, $backendPort, 9229)
} else {
    $ports = $defaultPorts
}

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $warnings += "⚠️ Porta $port em uso"
    } else {
        Write-Host "✅ Porta $port livre" -ForegroundColor Green
    }
}

# Resultado final
Write-Host "`n" -NoNewline
Write-Host "🎯 RESULTADO DA VALIDAÇÃO" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

if ($errors.Count -eq 0) {
    Write-Host "✅ CONFIGURAÇÃO VÁLIDA!" -ForegroundColor Green
    Write-Host "Você pode usar o debug Windows nativo." -ForegroundColor Green
} else {
    Write-Host "❌ CONFIGURAÇÃO COM PROBLEMAS!" -ForegroundColor Red
    Write-Host "Corrija os erros antes de continuar:" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "   $error" -ForegroundColor Red
    }
}

if ($warnings.Count -gt 0) {
    Write-Host "`n⚠️ AVISOS:" -ForegroundColor Yellow
    foreach ($warning in $warnings) {
        Write-Host "   $warning" -ForegroundColor Yellow
    }
}

Write-Host "`n📚 Para usar o debug:" -ForegroundColor White
Write-Host "1. Pressione F5 no VS Code" -ForegroundColor White
Write-Host "2. Selecione: '🪟 Debug Full Stack (Windows Nativo)'" -ForegroundColor White
if ($envVars -and $envVars.ContainsKey("VITE_PORT")) {
    Write-Host "3. Acesse: http://localhost:$($envVars['VITE_PORT'])" -ForegroundColor White
} else {
    Write-Host "3. Acesse: http://localhost:4000" -ForegroundColor White
}