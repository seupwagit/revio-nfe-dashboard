# PowerShell script to remove old src directory
Write-Host "Removing old src directory..." -ForegroundColor Yellow

try {
    if (Test-Path "src") {
        Write-Host "Found src directory, attempting removal..." -ForegroundColor Blue
        
        # Try to remove with force
        Remove-Item -Path "src" -Recurse -Force -ErrorAction Stop
        
        if (Test-Path "src") {
            Write-Host "Directory still exists, trying alternative method..." -ForegroundColor Yellow
            
            # Alternative method: remove contents first, then directory
            Get-ChildItem -Path "src" -Recurse | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
            Remove-Item -Path "src" -Force -ErrorAction Stop
        }
        
        if (-not (Test-Path "src")) {
            Write-Host "✅ Successfully removed old src directory" -ForegroundColor Green
        } else {
            Write-Host "❌ Failed to remove src directory" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "✅ src directory does not exist (already removed)" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Error removing src directory: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}