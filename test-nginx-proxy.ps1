# Test Nginx Proxy Configuration

Write-Host "=== Testando configuração do Nginx ===" -ForegroundColor Cyan
Write-Host ""

# Build da imagem
Write-Host "1. Building Docker image..." -ForegroundColor Yellow
docker build -t nf-dashboard-test .
if ($LASTEXITCODE -ne 0) { exit 1 }

Write-Host ""
Write-Host "2. Starting container..." -ForegroundColor Yellow
docker run -d --name nf-test -p 3000:3000 nf-dashboard-test

# Aguardar o container iniciar
Write-Host ""
Write-Host "3. Waiting for container to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Testar o proxy
Write-Host ""
Write-Host "4. Testing proxy endpoint..." -ForegroundColor Yellow
Write-Host "   Request: http://localhost:3000/api/WebView/ContadorConsulta?..." -ForegroundColor Gray
Write-Host ""

$token = "eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgwNTQ5MjBGOTg3QkVEN0E1OUI1ODYwQjMzRjkiLCJ4NXQiOiIyNWc2Z1JoNmdGU1NENWg3N1hwWnRZWUxNX2siLCJ0eXAiOiJhdCtqd3QifQ.eyJpc3MiOiJodHRwczovL2lkc2VydmVyLnJldmlvLmRpZ2l0YWwvIiwiZXhwIjoxNzM0NzEwNzU4LCJpYXQiOjE3MzQ2MjQzNTgsInNjb3BlIjoiYXBpMSIsImp0aSI6ImZjYTUzYzk0LTlhMjItNDk1MC1hMmQyLWQxMzIzMWJmOTAwNSIsInN1YiI6IjEiLCJvaV9wcnN0IjoiY2xpZW50IiwiY2xpZW50X2lkIjoiY2xpZW50Iiwib2lfdGtuX2lkIjoiMGQ1OTVmZjYtMDY1MS00MjZhLWI2NjQtZmY1MjVhMmE4ZDVkIn0.Yzoi4HFu6UpeqwkbdF_kWylbW7hhV_gufFXPu6R0AtV9KbUpjojpKod2WQLt6TWvxmL4BtZS6Zq2hvdL0zavhSoXvxVoNK0ARiM0K5FM6swRycXtFSe8-2EGfQYT1qNe4IHZxydadJoPv6qDHNMr8pJIAWfjAKMrAv0tiHRkAU3L_-7ccULuVzamkZfpVd_JEurWX3CpanZREMakwm0Yio6tqWLeXNus-b7ygBWyGVPqVMmHGMl54v4mbzxCEV_edj0SwdOguLYDepw-Q6UWA_HZ7qk9KonFK5DZtT6haFP0b83lD-QxLihAt31Qz_aEAllm-i3EE5rXt9lJ9Tgbxb2Zy1ZEirzB6fDNsnY4wgwiFFXI7qh7Igbc0D1qaCkAtfRTBkkkgkEeP-QI6NNMQiLfjDaTqdZ2zxPsS-WWWJ_tnaQjySV0treNeZNaUpLnTVqI5EVkbGfEKqJ1V7IYImbKYmuEOm0BOM9TXDlOKEYUgLlECLruQMnk0RW0pwOVUftt1h3UkyT8ySDMzEpQFhtoCEpXMQanqwMuntnlQoru80e0cISmh2JNzn-8lwRvzkO9V3Xwcy0AyPLYxgd5PeW82k3XMe2TQonY5vZRgDmgUm5iMr1mPIPR0_we0OOjiLDWahKqNomJUn9cj4Y5UACDC023VzNv3ewqwQxHT_U"

$url = "http://localhost:3000/api/WebView/ContadorConsulta?host=10.0.0.8&collection=tbl_nfe_100&database=C67624577000145&dtIni=2025-11-01&dtFin=2025-12-01&cnpjEmit=&cnpjDest="

try {
    $response = Invoke-WebRequest -Uri $url -Headers @{
        "Authorization" = "Bearer $token"
    } -UseBasicParsing
    
    Write-Host "✅ Success! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Gray
    Write-Host $response.Content
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
}

Write-Host ""
Write-Host "5. Checking nginx logs..." -ForegroundColor Yellow
docker logs nf-test

Write-Host ""
Write-Host "6. Cleanup..." -ForegroundColor Yellow
docker stop nf-test | Out-Null
docker rm nf-test | Out-Null

Write-Host ""
Write-Host "=== Test complete ===" -ForegroundColor Cyan
