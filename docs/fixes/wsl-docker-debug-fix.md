# Correção: Debug Docker WSL

## Problema Identificado

O debug Docker no WSL não estava executando devido a:
1. Script `wsl-debug-start.sh` com erro de sintaxe na linha de carregamento do .env
2. Falta de scripts de diagnóstico e troubleshooting
3. Configurações do VS Code com propriedades obsoletas
4. Ausência de scripts para Windows facilitarem o uso

## Soluções Implementadas

### 1. Correção do Script Principal
- **Arquivo**: `scripts/wsl-debug-start.sh`
- **Problema**: Linha quebrada no carregamento das variáveis .env
- **Solução**: Corrigida a linha `export $(grep -v '^#' .env | grep -v '^$' | xargs)`

### 2. Scripts de Diagnóstico
Criados novos scripts para facilitar troubleshooting:
- `scripts/wsl-debug-diagnose.sh` - Diagnóstico completo no WSL
- `scripts/wsl-debug-test.sh` - Teste rápido de conectividade
- `scripts/debug-diagnose-wsl.bat` - Diagnóstico do Windows

### 3. Scripts para Windows
Criados scripts .bat para facilitar uso do Windows:
- `scripts/debug-start-wsl.bat` - Iniciar debug do Windows
- `scripts/debug-stop-wsl.bat` - Parar debug do Windows

### 4. Configuração VS Code
- **Arquivo**: `.vscode/launch.json`
- **Problema**: Propriedade `protocol` obsoleta causando warnings
- **Solução**: Removida propriedade `protocol` de todas as configurações

### 5. Documentação Completa
- `docs/troubleshooting/wsl-docker-debug-issues.md` - Guia completo de troubleshooting
- `docs/development/docker-wsl-debug-setup.md` - Documentação atualizada

### 6. Scripts de Setup
- `scripts/wsl-setup-docker.sh` - Instalação automática do Docker no WSL
- Permissões de execução configuradas automaticamente

## Como Usar Agora

### Do Windows (Mais Fácil)
```batch
REM Diagnóstico
scripts\debug-diagnose-wsl.bat

REM Iniciar debug
scripts\debug-start-wsl.bat

REM Parar debug
scripts\debug-stop-wsl.bat
```

### Do WSL Ubuntu
```bash
# Diagnóstico
./scripts/wsl-debug-diagnose.sh

# Iniciar debug
./scripts/wsl-debug-start.sh

# Parar debug
./scripts/wsl-debug-stop.sh

# Teste rápido
./scripts/wsl-debug-test.sh
```

### Do VS Code
1. Pressione `F5`
2. Selecione "🐧 Debug Backend (WSL Docker Nativo)"
3. O ambiente inicia automaticamente

## Recursos Implementados

### Diagnóstico Automático
- ✅ Verificação de WSL
- ✅ Verificação de Docker
- ✅ Verificação de arquivos .env
- ✅ Verificação de portas
- ✅ Verificação de containers
- ✅ Verificação de conectividade

### Carregamento Automático
- ✅ Todas variáveis do .env carregadas automaticamente
- ✅ Portas dinâmicas baseadas no .env
- ✅ Configurações de banco de dados
- ✅ Configurações S3 e APIs

### Monitoramento
- ✅ Health checks automáticos
- ✅ Verificação de serviços
- ✅ Logs estruturados
- ✅ Status dos containers

### Troubleshooting
- ✅ Scripts de diagnóstico
- ✅ Documentação completa
- ✅ Soluções para problemas comuns
- ✅ Comandos úteis

## Arquivos Criados/Modificados

### Scripts Criados
- `scripts/wsl-debug-diagnose.sh`
- `scripts/wsl-debug-test.sh`
- `scripts/wsl-setup-docker.sh`
- `scripts/debug-start-wsl.bat`
- `scripts/debug-stop-wsl.bat`
- `scripts/debug-diagnose-wsl.bat`

### Scripts Corrigidos
- `scripts/wsl-debug-start.sh` - Corrigida linha de carregamento .env

### Configurações Corrigidas
- `.vscode/launch.json` - Removidas propriedades obsoletas

### Documentação Criada
- `docs/troubleshooting/wsl-docker-debug-issues.md`
- `docs/development/docker-wsl-debug-setup.md` (atualizada)

## Verificação

Para verificar se tudo está funcionando:

1. **Diagnóstico**: `scripts\debug-diagnose-wsl.bat`
2. **Iniciar**: `scripts\debug-start-wsl.bat`
3. **Testar**: Acesse http://localhost:4001/api/health
4. **Debug**: Pressione F5 no VS Code

## Benefícios

- ✅ **Facilidade de uso**: Scripts para Windows e WSL
- ✅ **Diagnóstico automático**: Identifica problemas rapidamente
- ✅ **Documentação completa**: Guias detalhados de troubleshooting
- ✅ **Configuração automática**: Carrega .env automaticamente
- ✅ **Monitoramento**: Health checks e verificações
- ✅ **Compatibilidade**: Funciona no Windows e WSL
- ✅ **Debug completo**: VS Code integrado com breakpoints

O ambiente de debug Docker WSL agora está totalmente funcional e fácil de usar!