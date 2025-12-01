# Teste de timeout - verifica se a API responde em até 5 minutos
# Para testar localmente com Docker

Write-Host "🧪 Testando timeout da API..." -ForegroundColor Cyan
Write-Host ""

# URL do container local
$baseUrl = "http://localhost:3000"

# Teste 1: Health check rápido
Write-Host "1️⃣ Health check (deve ser rápido)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/" -TimeoutSec 10
    Write-Host "✅ Health check OK" -ForegroundColor Green
} catch {
    Write-Host "❌ Health check falhou: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Teste 2: Consulta grande (pode demorar)
Write-Host "2️⃣ Consulta grande de NFe (pode demorar até 5 minutos)..." -ForegroundColor Yellow
Write-Host "   Aguarde..." -ForegroundColor Gray

$startTime = Get-Date

try {
    # Timeout de 6 minutos (360s) para dar margem
    $headers = @{
        "Authorization" = "Bearer $env:VITE_API_BEARER_TOKEN"
    }
    
    $params = @{
        host = "10.0.0.8"
        collection = "tbl_nfe_100"
        database = "C67624577000145"
        pg = 1
        size = 500
        dtIni = "2025-11-01"
        dtFin = "2025-12-01"
    }
    
    $queryString = ($params.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join "&"
    $url = "$baseUrl/api/WebView/Consultar?$queryString"
    
    Write-Host "   URL: $url" -ForegroundColor Gray
    
    $response = Invoke-WebRequest -Uri $url -Headers $headers -TimeoutSec 360
    
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "✅ Consulta OK em $([math]::Round($duration, 2))s" -ForegroundColor Green
    Write-Host "   Status: $($response.StatusCode)" -ForegroundColor Gray
    Write-Host "   Tamanho: $($response.Content.Length) bytes" -ForegroundColor Gray
    
} catch {
    $endTime = Get-Date
    $duration = ($endTime - $startTime).TotalSeconds
    
    Write-Host "❌ Consulta falhou após $([math]::Round($duration, 2))s" -ForegroundColor Red
    Write-Host "   Erro: $_" -ForegroundColor Red
    
    if ($duration -gt 290) {
        Write-Host ""
        Write-Host "⚠️  Timeout detectado!" -ForegroundColor Yellow
        Write-Host "   A API demorou mais de 5 minutos para responder." -ForegroundColor Yellow
        Write-Host "   Considere:" -ForegroundColor Yellow
        Write-Host "   - Reduzir o tamanho da consulta (size=500 → size=100)" -ForegroundColor Yellow
        Write-Host "   - Verificar performance da API externa" -ForegroundColor Yellow
        Write-Host "   - Implementar paginação no frontend" -ForegroundColor Yellow
    }
    
    exit 1
}

Write-Host ""
Write-Host "✅ Todos os testes passaram!" -ForegroundColor Green
