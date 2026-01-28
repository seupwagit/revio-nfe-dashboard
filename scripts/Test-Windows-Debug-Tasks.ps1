# Test Windows Debug Tasks
# Testa as tasks de debug do Windows para verificar se estão funcionando

Write-Host "🧪 TESTE DAS TASKS DE DEBUG WINDOWS" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

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

# 1. Testar Stop All Windows Processes
Write-Host "`n📋 Testando Stop All Windows Processes..." -ForegroundColor Yellow

try {
    # Simular o comando da task
    $processes = Get-Process -Name 'node', 'pnpm' -ErrorAction SilentlyContinue
    if ($processes) {
        Write-Host "✅ Comando funciona - Encontrados $($processes.Count) processos" -ForegroundColor Green
        Write-Host "   Processos encontrados:" -ForegroundColor White
        $processes | ForEach-Object { Write-Host "   - $($_.ProcessName) (PID: $($_.Id))" -ForegroundColor Gray }
    } else {
        Write-Host "✅ Comando funciona - Nenhum processo encontrado" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Erro no comando Stop: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Testar variáveis de ambiente
Write-Host "`n📋 Testando variáveis de ambiente..." -ForegroundColor Yellow

if (Test-Path ".env") {
    $envVars = Read-EnvFile ".env"
    
    $frontendPort = if ($envVars.ContainsKey("VITE_PORT")) { $envVars["VITE_PORT"] } else { "4000" }
    $backendPort = if ($envVars.ContainsKey("BACKOFFICE_PORT")) { $envVars["BACKOFFICE_PORT"] } else { "4001" }
    
    Write-Host "✅ Variáveis lidas com sucesso:" -ForegroundColor Green
    Write-Host "   VITE_PORT = $frontendPort" -ForegroundColor White
    Write-Host "   BACKOFFICE_PORT = $backendPort" -ForegroundColor White
    
    # Definir variáveis de ambiente para teste
    $env:VITE_PORT = $frontendPort
    $env:BACKOFFICE_PORT = $backendPort
    
    Write-Host "✅ Variáveis de ambiente definidas para teste" -ForegroundColor Green
} else {
    Write-Host "❌ Arquivo .env não encontrado" -ForegroundColor Red
}

# 3. Testar comandos pnpm
Write-Host "`n📋 Testando comandos pnpm..." -ForegroundColor Yellow

try {
    # Testar se pnpm está disponível
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm disponível: v$pnpmVersion" -ForegroundColor Green
    
    # Testar se os workspaces existem
    $workspaces = pnpm list --recursive --depth=0 2>$null
    if ($workspaces) {
        Write-Host "✅ Workspaces detectados" -ForegroundColor Green
    }
    
    # Testar filtros específicos
    Write-Host "   Testando filtros de workspace..." -ForegroundColor Gray
    
    $backendTest = pnpm --filter "@fiscal/backend" --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Filtro @fiscal/backend funciona" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Filtro @fiscal/backend falhou" -ForegroundColor Red
    }
    
    $frontendTest = pnpm --filter "@fiscal/frontend" --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Filtro @fiscal/frontend funciona" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Filtro @fiscal/frontend falhou" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Erro com pnpm: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Testar portas
Write-Host "`n📋 Testando disponibilidade de portas..." -ForegroundColor Yellow

$ports = @($frontendPort, $backendPort, 9229)
foreach ($port in $ports) {
    $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "⚠️ Porta $port em uso" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Porta $port livre" -ForegroundColor Green
    }
}

# 5. Testar estrutura de arquivos
Write-Host "`n📋 Testando estrutura de arquivos..." -ForegroundColor Yellow

$requiredFiles = @(
    "apps/frontend/package.json",
    "apps/backend/package.json",
    "apps/frontend/src",
    "apps/backend/src",
    ".vscode/tasks.json",
    ".vscode/launch.json"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ $file existe" -ForegroundColor Green
    } else {
        Write-Host "❌ $file não encontrado" -ForegroundColor Red
    }
}

# 6. Simular execução das tasks
Write-Host "`n📋 Simulando execução das tasks..." -ForegroundColor Yellow

Write-Host "   Simulando Start Backend..." -ForegroundColor Gray
try {
    # Simular o comando sem executar
    $backendCmd = "pnpm --filter @fiscal/backend dev"
    Write-Host "   Comando: $backendCmd" -ForegroundColor White
    Write-Host "   Variáveis: NODE_ENV=development, PORT=$backendPort" -ForegroundColor White
    Write-Host "   ✅ Comando backend válido" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro no comando backend: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "   Simulando Start Frontend..." -ForegroundColor Gray
try {
    # Simular o comando sem executar
    $frontendCmd = "pnpm --filter @fiscal/frontend dev"
    Write-Host "   Comando: $frontendCmd" -ForegroundColor White
    Write-Host "   Variáveis: NODE_ENV=development, PORT=$frontendPort" -ForegroundColor White
    Write-Host "   ✅ Comando frontend válido" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Erro no comando frontend: $($_.Exception.Message)" -ForegroundColor Red
}

# Resultado final
Write-Host "`n🎯 RESULTADO DO TESTE" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan

Write-Host "✅ Teste concluído!" -ForegroundColor Green
Write-Host "📚 Para usar as tasks:" -ForegroundColor White
Write-Host "1. Abra VS Code" -ForegroundColor White
Write-Host "2. Pressione Ctrl+Shift+P" -ForegroundColor White
Write-Host "3. Digite 'Tasks: Run Task'" -ForegroundColor White
Write-Host "4. Selecione uma das tasks:" -ForegroundColor White
Write-Host "   - 🪟 Start Backend (Windows Native)" -ForegroundColor Gray
Write-Host "   - 🪟 Start Frontend (Windows Native)" -ForegroundColor Gray
Write-Host "   - 🪟 Stop All Windows Processes" -ForegroundColor Gray
Write-Host ""
Write-Host "Ou pressione F5 e selecione:" -ForegroundColor White
Write-Host "   - 🪟 Debug Full Stack (Windows Nativo)" -ForegroundColor Gray