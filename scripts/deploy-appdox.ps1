# =============================================================================
# Script de Deploy local - Revio NFe Dashboard
# Alvo: root@10.0.0.5:1157 (appdox.revio.digital)
# =============================================================================

$ErrorActionPreference = "Stop"

$SSH_USER = "root"
$SSH_HOST = "10.0.0.5"
$SSH_PORT = "1157"
$REMOTE_TARGET = "$SSH_USER@$SSH_HOST"
$DOMAIN = "appdox.revio.digital"

$BUNDLE_FILE = "appdox-deploy-bundle.tar.gz"
$REMOTE_TMP = "/tmp"

$PROJECT_ROOT = Resolve-Path "$PSScriptRoot\.."

Write-Host "Iniciando build e deploy unificado para $DOMAIN..." -ForegroundColor Cyan

# 0. Limpeza Remota Inicial (Opcional, mas garante ambiente limpo)
Write-Host "Executando limpeza remota (PM2 stop)..." -ForegroundColor Yellow
ssh -p $SSH_PORT $REMOTE_TARGET "pm2 stop appdox-backend || true"

# 1. Build Unificado na Raiz
Write-Host "Executando build unificado (pnpm run build)..." -ForegroundColor Yellow
Set-Location $PROJECT_ROOT
pnpm run build

# 2. Criar Bundle Unificado Otimizado
Write-Host "Criando bundle unificado..." -ForegroundColor Yellow
$BUNDLE_DIR = "$PROJECT_ROOT\deploy_bundle"
if (Test-Path $BUNDLE_DIR) { Remove-Item -Recurse -Force $BUNDLE_DIR }
New-Item -ItemType Directory -Path $BUNDLE_DIR | Out-Null

# Estrutura do Backend e Shared
New-Item -ItemType Directory -Path "$BUNDLE_DIR\apps\backend\dist" -Force | Out-Null
New-Item -ItemType Directory -Path "$BUNDLE_DIR\packages\shared\dist" -Force | Out-Null

Copy-Item -Path "$PROJECT_ROOT\apps\backend\dist\*" -Destination "$BUNDLE_DIR\apps\backend\dist\" -Recurse -Force
Copy-Item -Path "$PROJECT_ROOT\apps\backend\package.json" -Destination "$BUNDLE_DIR\apps\backend\package.json" -Force
Copy-Item -Path "$PROJECT_ROOT\packages\shared\dist\*" -Destination "$BUNDLE_DIR\packages\shared\dist\" -Recurse -Force
Copy-Item -Path "$PROJECT_ROOT\packages\shared\package.json" -Destination "$BUNDLE_DIR\packages\shared\package.json" -Force

# Frontend (colocamos na raiz do bundle para o Nginx servir mais facilmente ou em dist/)
New-Item -ItemType Directory -Path "$BUNDLE_DIR\dist" -Force | Out-Null
Copy-Item -Path "$PROJECT_ROOT\apps\frontend\dist\*" -Destination "$BUNDLE_DIR\dist\" -Recurse -Force

# Infra Monorepo e Database
Copy-Item -Path "$PROJECT_ROOT\package.json" -Destination "$BUNDLE_DIR\package.json"
Copy-Item -Path "$PROJECT_ROOT\pnpm-workspace.yaml" -Destination "$BUNDLE_DIR\pnpm-workspace.yaml"
Copy-Item -Path "$PROJECT_ROOT\.env" -Destination "$BUNDLE_DIR\.env"
Copy-Item -Path "$PROJECT_ROOT\prisma" -Destination "$BUNDLE_DIR\prisma" -Recurse -Force

# Compactar Bundle Otimizado
Write-Host "Compactando bundle unificado (removendo testes)..." -ForegroundColor Yellow
Set-Location $BUNDLE_DIR

# Exclusões rigorosas conforme solicitado
$EXCLUDES = @(
    "--exclude=cypress",
    "--exclude=tests",
    "--exclude=__tests__",
    "--exclude=*.test.ts",
    "--exclude=*.spec.ts",
    "--exclude=*.test.js",
    "--exclude=*.spec.js",
    "--exclude=node_modules"
)

tar $EXCLUDES -czf "$PROJECT_ROOT\$BUNDLE_FILE" .

# 3. SCP
Write-Host "Enviando para o servidor..." -ForegroundColor Yellow
Set-Location $PROJECT_ROOT
scp -P $SSH_PORT "$BUNDLE_FILE" "scripts\setup-remote-nginx.sh" "${REMOTE_TARGET}:${REMOTE_TMP}/"

# 4. SSH
Write-Host "Executando configuracao remota..." -ForegroundColor Yellow
$REMOTE_EXEC = "chmod +x $REMOTE_TMP/setup-remote-nginx.sh; $REMOTE_TMP/setup-remote-nginx.sh"
ssh -p $SSH_PORT $REMOTE_TARGET $REMOTE_EXEC

# 5. Limpeza
Write-Host "Limpando temporarios locais..." -ForegroundColor Yellow
Remove-Item "$PROJECT_ROOT\$BUNDLE_FILE"
if (Test-Path $BUNDLE_DIR) { Remove-Item -Recurse -Force $BUNDLE_DIR }

# 6. Validacao
Write-Host "Validando API Health Check..." -ForegroundColor Yellow
# Aguardar um pouco mais para o deploy remoto finalizar (pnpm install etc)
Start-Sleep -Seconds 15
$HEALTH_URL = "https://$DOMAIN/api/health"
try {
    $res = Invoke-RestMethod -Uri $HEALTH_URL -Method Get
    if ($res.status -eq "ok" -or $res.message -eq "Healthy") {
        Write-Host "Deploy realizado com sucesso!" -ForegroundColor Green
    }
    else {
        Write-Warning "Health check respondeu, mas status nao e OK: $($res | ConvertTo-Json)"
    }
}
catch {
    Write-Warning "Health check falhou na primeira tentativa ($HEALTH_URL). Verifique os logs no PM2 remotamente."
}

