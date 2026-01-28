# Setup Windows Native Debug
# Configura o ambiente para debug nativo no Windows

Write-Host "🪟 SETUP DEBUG WINDOWS NATIVO" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan

# Função para ler variáveis do arquivo .env
function Read-EnvFile {
    param([string]$FilePath)
    
    $envVars = @{}
    if (Test-Path $FilePath) {
        Get-Content $FilePath | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                # Remove aspas se existirem
                $value = $value -replace '^"(.*)"$', '$1'
                $value = $value -replace "^'(.*)'$", '$1'
                $envVars[$key] = $value
            }
        }
    }
    return $envVars
}

# Verificar se Node.js está instalado
Write-Host "📋 Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js não encontrado. Instale o Node.js 20+" -ForegroundColor Red
    exit 1
}

# Verificar se pnpm está instalado
Write-Host "📋 Verificando pnpm..." -ForegroundColor Yellow
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm encontrado: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm não encontrado. Instalando..." -ForegroundColor Yellow
    npm install -g pnpm
    Write-Host "✅ pnpm instalado" -ForegroundColor Green
}

# Verificar se as dependências estão instaladas
Write-Host "📋 Verificando dependências..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    pnpm install
    Write-Host "✅ Dependências instaladas" -ForegroundColor Green
} else {
    Write-Host "📋 Verificando integridade das dependências..." -ForegroundColor Yellow
    
    # Verificar se os workspaces estão funcionando
    $workspaceTest = pnpm list --recursive --depth=0 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Problemas detectados com dependências. Reinstalando..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
        pnpm install
        Write-Host "✅ Dependências reinstaladas" -ForegroundColor Green
    } else {
        Write-Host "✅ Dependências já instaladas e funcionando" -ForegroundColor Green
    }
    
    # Verificar workspaces específicos
    Write-Host "📋 Verificando workspaces..." -ForegroundColor Yellow
    $backendCheck = pnpm --filter "@fiscal/backend" --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Workspace @fiscal/backend OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Workspace @fiscal/backend com problemas" -ForegroundColor Red
    }
    
    $frontendCheck = pnpm --filter "@fiscal/frontend" --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Workspace @fiscal/frontend OK" -ForegroundColor Green
    } else {
        Write-Host "❌ Workspace @fiscal/frontend com problemas" -ForegroundColor Red
    }
}

# Verificar arquivo .env
Write-Host "📋 Verificando arquivo .env..." -ForegroundColor Yellow
if (!(Test-Path ".env")) {
    Write-Host "❌ Arquivo .env não encontrado" -ForegroundColor Red
    if (Test-Path ".env.example") {
        Write-Host "📋 Copiando .env.example para .env..." -ForegroundColor Yellow
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Arquivo .env criado" -ForegroundColor Green
    } else {
        Write-Host "❌ Arquivo .env.example também não encontrado" -ForegroundColor Red
        exit 1
    }
}

# Ler variáveis do arquivo .env
Write-Host "📋 Lendo variáveis de ambiente..." -ForegroundColor Yellow
$envVars = Read-EnvFile ".env"

# Definir portas padrão se não estiverem no .env
$frontendPort = if ($envVars.ContainsKey("VITE_PORT")) { $envVars["VITE_PORT"] } else { "4000" }
$backendPort = if ($envVars.ContainsKey("BACKOFFICE_PORT")) { $envVars["BACKOFFICE_PORT"] } else { "4001" }
$debugPort = "9229"

Write-Host "✅ Portas configuradas:" -ForegroundColor Green
Write-Host "   Frontend: $frontendPort" -ForegroundColor White
Write-Host "   Backend:  $backendPort" -ForegroundColor White
Write-Host "   Debug:    $debugPort" -ForegroundColor White

# Verificar portas em uso
Write-Host "📋 Verificando portas..." -ForegroundColor Yellow
$ports = @($frontendPort, $backendPort, $debugPort)
$portsInUse = @()

foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        $portsInUse += $port
        Write-Host "❌ Porta $port em uso" -ForegroundColor Red
    } else {
        Write-Host "✅ Porta $port livre" -ForegroundColor Green
    }
}

if ($portsInUse.Count -gt 0) {
    Write-Host "⚠️ Algumas portas estão em uso. Deseja finalizar os processos? (y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -eq 'y' -or $response -eq 'Y') {
        Write-Host "🛑 Finalizando processos nas portas em uso..." -ForegroundColor Yellow
        foreach ($port in $portsInUse) {
            $processes = Get-NetTCPConnection -LocalPort $port | Select-Object -ExpandProperty OwningProcess
            foreach ($processId in $processes) {
                try {
                    Stop-Process -Id $processId -Force
                    Write-Host "✅ Processo $processId finalizado" -ForegroundColor Green
                } catch {
                    Write-Host "❌ Erro ao finalizar processo $processId" -ForegroundColor Red
                }
            }
        }
    }
}

# Validar variáveis críticas do .env
Write-Host "📋 Validando configurações críticas..." -ForegroundColor Yellow
$criticalVars = @("VITE_API_BASE_URL", "VITE_API_BEARER_TOKEN", "VITE_DB_HOST")
$missingVars = @()

foreach ($var in $criticalVars) {
    if (!$envVars.ContainsKey($var) -or [string]::IsNullOrWhiteSpace($envVars[$var])) {
        $missingVars += $var
        Write-Host "❌ Variável $var não encontrada ou vazia" -ForegroundColor Red
    } else {
        Write-Host "✅ Variável $var configurada" -ForegroundColor Green
    }
}

if ($missingVars.Count -gt 0) {
    Write-Host "⚠️ Algumas variáveis críticas estão faltando:" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "   - $var" -ForegroundColor Red
    }
    Write-Host "Configure essas variáveis no arquivo .env antes de continuar" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎯 CONFIGURAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "Para debugar:" -ForegroundColor White
Write-Host "1. Pressione F5 no VS Code" -ForegroundColor White
Write-Host "2. Selecione: '🪟 Debug Full Stack (Windows Nativo)'" -ForegroundColor White
Write-Host "3. Acesse: http://localhost:$frontendPort" -ForegroundColor White
Write-Host ""
Write-Host "URLs disponíveis:" -ForegroundColor White
Write-Host "- Frontend: http://localhost:$frontendPort" -ForegroundColor White
Write-Host "- Backend:  http://localhost:$backendPort" -ForegroundColor White
Write-Host "- Debug:    localhost:$debugPort" -ForegroundColor White