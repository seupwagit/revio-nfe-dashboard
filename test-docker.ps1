Write-Host "🔨 Building Docker image..." -ForegroundColor Cyan
docker build -t revio-test .

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build successful!" -ForegroundColor Green
Write-Host ""

Write-Host "🚀 Starting container..." -ForegroundColor Cyan
docker run -d --name revio-test-container -p 8080:3000 revio-test

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Container failed to start!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Container started!" -ForegroundColor Green
Write-Host ""

Write-Host "⏳ Waiting 5 seconds for container to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""
Write-Host "🔍 Testing container..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri http://localhost:8080 -Method Head -UseBasicParsing
    Write-Host "✅ Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "❌ Request failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Container logs:" -ForegroundColor Cyan
docker logs revio-test-container

Write-Host ""
Write-Host "🧹 Cleaning up..." -ForegroundColor Yellow
docker stop revio-test-container
docker rm revio-test-container

Write-Host ""
Write-Host "✅ Test complete! If you saw a 200 OK response, the container works locally." -ForegroundColor Green
Write-Host "   If it works locally but not on Coolify, check Coolify's proxy configuration." -ForegroundColor Yellow
