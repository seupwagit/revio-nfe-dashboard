# Docker Desktop WSL Setup - Guia Rápido

## Problema Identificado

O debug WSL falha com erro:
```
The command 'docker-compose' could not be found in this WSL 2 distro.
We recommend to activate the WSL integration in Docker Desktop settings.
```

## Solução Recomendada: Docker Desktop

### 1. Instalar Docker Desktop (se não instalado)

1. **Baixar**: https://www.docker.com/products/docker-desktop
2. **Executar** o instalador no Windows
3. **Reiniciar** o Windows se solicitado

### 2. Configurar WSL Integration

1. **Abrir Docker Desktop** no Windows
2. **Ir em Settings** (ícone de engrenagem)
3. **Selecionar Resources > WSL Integration**
4. **Habilitar**:
   - ✅ "Enable integration with my default WSL distro"
   - ✅ "Ubuntu" (na lista de distribuições)
5. **Clicar "Apply & Restart"**

### 3. Verificar Configuração

**No PowerShell Windows:**
```powershell
# Testar configuração
.\scripts\Debug-Diagnose-WSL.ps1
```

**Ou executar script de verificação:**
```bash
# No WSL Ubuntu
./scripts/wsl-setup-docker-desktop.sh
```

### 4. Testar Debug

```powershell
# Iniciar debug
.\scripts\Debug-Start-WSL.ps1
```

## Solução Alternativa: Docker Nativo

Se preferir instalar Docker diretamente no WSL:

```bash
# No WSL Ubuntu
./scripts/wsl-setup-docker.sh
```

## Troubleshooting

### Docker Desktop não inicia
1. **Verificar Hyper-V** habilitado no Windows
2. **Verificar WSL 2** instalado
3. **Reiniciar** Docker Desktop

### WSL Integration não funciona
1. **Desabilitar e reabilitar** WSL Integration
2. **Reiniciar** Docker Desktop
3. **Executar**: `wsl --shutdown` e reiniciar WSL

### Containers não iniciam
1. **Verificar recursos** do Docker Desktop
2. **Aumentar memória** em Settings > Resources > Advanced
3. **Verificar espaço em disco**

## Comandos Úteis

### Verificar Status
```powershell
# Diagnóstico completo
.\scripts\Debug-Diagnose-WSL.ps1

# Teste rápido
.\scripts\Debug-Test-WSL.ps1
```

### Gerenciar Debug
```powershell
# Iniciar
.\scripts\Debug-Start-WSL.ps1

# Parar
.\scripts\Debug-Stop-WSL.ps1

# Ver logs
.\scripts\Debug-Logs-WSL.ps1
```

### Verificar Docker
```bash
# No WSL Ubuntu
docker --version
docker compose version
docker info
```

## Configuração Recomendada

### Docker Desktop Settings
- **Memory**: 4GB mínimo (8GB recomendado)
- **CPUs**: 2 mínimo (4 recomendado)
- **Disk**: 20GB mínimo
- **WSL Integration**: Habilitado para Ubuntu

### .wslconfig (Opcional)
Criar `C:\Users\%USERNAME%\.wslconfig`:
```ini
[wsl2]
memory=8GB
processors=4
swap=2GB
```

## Próximos Passos

1. ✅ **Configurar Docker Desktop** com WSL Integration
2. ✅ **Testar** com `.\scripts\Debug-Diagnose-WSL.ps1`
3. ✅ **Iniciar debug** com `.\scripts\Debug-Start-WSL.ps1`
4. ✅ **Abrir VS Code** e pressionar F5 para debug

## Links Úteis

- [Docker Desktop WSL 2 Backend](https://docs.docker.com/desktop/wsl/)
- [WSL 2 Installation Guide](https://docs.microsoft.com/en-us/windows/wsl/install)
- [Docker Compose Documentation](https://docs.docker.com/compose/)