# 🐛 Debug Setup - Docker + WSL + VS Code

## Quick Start com Variáveis do .env

### 1. Verificar Configurações
```bash
# Verificar se todas as variáveis do .env estão corretas
./scripts/debug-env-check.sh
```

### 2. Iniciar Debug

#### Windows
```cmd
# Iniciar ambiente de debug
scripts\debug-start.bat
```

#### Linux/WSL (Recomendado)
```bash
# Iniciar ambiente de debug no WSL
./scripts/wsl-debug-start.sh
```

### 3. VS Code Debug
1. Pressionar `F5`
2. Selecionar `🐧 Debug Backend (WSL Docker Nativo)`
3. Colocar breakpoints nos arquivos `.ts`
4. Começar a debugar!

## 🔧 Configuração Automática via .env

O sistema agora carrega **automaticamente** todas as variáveis do arquivo `.env`:

### Portas Dinâmicas
- **Frontend**: `http://localhost:${VITE_PORT}` (padrão: 4000)
- **Backend**: `http://localhost:${BACKOFFICE_PORT}` (padrão: 4001)
- **Debug**: `http://localhost:9229` (fixo)

### Databases Configurados
- **MongoDB**: Usa `VITE_MONGODB_CONNECTION_STRING` do .env
- **SQL Server**: Usa `DATABASE_URL` do .env
- **Conexões externas**: Mantém configurações de produção

### APIs e Serviços
- **Bearer Token**: Carregado automaticamente
- **Google Gemini**: Para busca natural
- **S3 Storage**: Para downloads
- **Revio APIs**: Endpoints externos

## Configurações Criadas

### ✅ Docker
- `Dockerfile.debug` - Container otimizado para desenvolvimento
- `docker-compose.debug.yml` - Orquestração completa com hot reload
- MongoDB configurado para desenvolvimento

### ✅ VS Code
- `.vscode/launch.json` - Configurações de debug
- `.vscode/tasks.json` - Tasks automatizadas
- `.vscode/settings.json` - Configurações do workspace

### ✅ Scripts
- `scripts/debug-start.bat/.sh` - Iniciar ambiente
- `scripts/debug-clean.bat/.sh` - Limpar ambiente
- `scripts/mongo-init.js` - Inicialização do MongoDB

## Portas Utilizadas

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| Frontend | 3000 | Vite Dev Server |
| Backend | 3001 | API REST |
| Debug | 9229 | Node.js Inspector |
| MongoDB | 27017 | Database |

## Configurações de Debug

### Backend (Node.js)
- ✅ Source maps habilitados
- ✅ Hot reload com `tsx watch`
- ✅ Debug port 9229 exposto
- ✅ Volumes montados para desenvolvimento

### Frontend (React)
- ✅ Vite dev server com HMR
- ✅ Chrome DevTools integration
- ✅ Source maps para TypeScript
- ✅ Hot reload preserva estado

### MongoDB
- ✅ Dados persistentes em volume
- ✅ Usuário de desenvolvimento criado
- ✅ Collections inicializadas
- ✅ Connection string: `mongodb://fiscal_user:fiscal_password@localhost:27017/fiscal_dev`

## Troubleshooting

### Problema: Porta ocupada
```bash
# Windows
netstat -ano | findstr :9229
taskkill /PID <PID> /F

# Linux/WSL
lsof -ti:9229 | xargs kill -9
```

### Problema: Containers não iniciam
```bash
# Ver logs detalhados
docker-compose -f docker-compose.debug.yml logs

# Reconstruir containers
docker-compose -f docker-compose.debug.yml up -d --build --force-recreate
```

### Problema: Hot reload não funciona (WSL)
Verificar configuração no `.vscode/settings.json`:
```json
{
  "remote.WSL.fileWatcher.polling": true,
  "remote.WSL.fileWatcher.pollingInterval": 5000
}
```

## Comandos Úteis

```bash
# Ver logs em tempo real
docker-compose -f docker-compose.debug.yml logs -f

# Executar comando no container
docker-compose -f docker-compose.debug.yml exec backend-debug bash

# Reiniciar apenas um serviço
docker-compose -f docker-compose.debug.yml restart backend-debug

# Ver status dos containers
docker-compose -f docker-compose.debug.yml ps

# Parar tudo
docker-compose -f docker-compose.debug.yml down
```

## Próximos Passos

1. ✅ Executar `scripts/debug-start.bat` (Windows) ou `./scripts/debug-start.sh` (Linux)
2. ✅ Abrir VS Code e pressionar `F5`
3. ✅ Selecionar configuração de debug desejada
4. ✅ Colocar breakpoints e começar a debugar!

## Estrutura de Arquivos

```
.
├── .vscode/
│   ├── launch.json          # Configurações de debug
│   ├── tasks.json           # Tasks automatizadas
│   └── settings.json        # Configurações do workspace
├── scripts/
│   ├── debug-start.bat/.sh  # Iniciar debug
│   ├── debug-clean.bat/.sh  # Limpar ambiente
│   └── mongo-init.js        # Init MongoDB
├── docs/development/
│   ├── docker-wsl-debug-setup.md  # Documentação completa
│   └── README-DEBUG.md            # Este arquivo
├── Dockerfile.debug         # Container de desenvolvimento
├── docker-compose.debug.yml # Orquestração de debug
└── .env                     # Variáveis de ambiente
```

## Configuração Completa ✅

- ✅ Docker + WSL2 integration
- ✅ VS Code debug configurations
- ✅ Hot reload para frontend e backend
- ✅ Source maps para TypeScript
- ✅ MongoDB com dados de desenvolvimento
- ✅ Scripts automatizados
- ✅ Documentação completa

**Pronto para debugar! 🚀**