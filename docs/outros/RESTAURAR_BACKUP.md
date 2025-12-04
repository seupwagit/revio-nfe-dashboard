# 🔄 Como Restaurar o Backup

## 🚨 RESTAURAÇÃO RÁPIDA

### Opção 1: Restaurar TUDO (PowerShell)
```powershell
# Cole este comando no PowerShell:
Remove-Item -Path "src" -Recurse -Force; Copy-Item -Path "backup_20251130_100333\src" -Destination "src" -Recurse -Force; Write-Host "✅ Backup restaurado!" -ForegroundColor Green
```

### Opção 2: Restaurar Arquivo Específico
```powershell
# GridPaginada.tsx
Copy-Item -Path "backup_20251130_100333\src\components\GridPaginada.tsx" -Destination "src\components\GridPaginada.tsx" -Force

# AnalyticsAPI.tsx
Copy-Item -Path "backup_20251130_100333\src\pages\AnalyticsAPI.tsx" -Destination "src\pages\AnalyticsAPI.tsx" -Force

# analyticsParallel.ts
Copy-Item -Path "backup_20251130_100333\src\services\analyticsParallel.ts" -Destination "src\services\analyticsParallel.ts" -Force
```

### Opção 3: Restaurar Pasta Específica
```powershell
# Restaurar todos os componentes
Copy-Item -Path "backup_20251130_100333\src\components\*" -Destination "src\components\" -Recurse -Force

# Restaurar todos os serviços
Copy-Item -Path "backup_20251130_100333\src\services\*" -Destination "src\services\" -Recurse -Force

# Restaurar todas as páginas
Copy-Item -Path "backup_20251130_100333\src\pages\*" -Destination "src\pages\" -Recurse -Force
```

## ⚠️ IMPORTANTE

Após restaurar:
1. Recarregue a página (Ctrl+F5)
2. Limpe cache do navegador
3. Verifique se funciona

## 📞 Precisa de Ajuda?

Me avise qual arquivo está com problema e eu restauro para você!
