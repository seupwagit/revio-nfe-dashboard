# Como Rodar Aplicação Fullstack

## ✅ Servidor Funcionando!

O servidor fullstack está rodando corretamente com:
- ✅ Frontend servido pelo backend
- ✅ MongoDB conectado
- ✅ 14 collections encontradas
- ✅ Porta 3000 ativa

## Comandos

### Windows

```bash
# Opção 1: Usar npm script
npm run fullstack

# Opção 2: Usar script batch diretamente
scripts/start-fullstack.bat

# Opção 3: Definir variável manualmente
set SERVE_FRONTEND=true
npx tsx src/server/index.ts
```

### Linux/Mac

```bash
# Usar script shell
./start-fullstack-simple.sh

# Ou definir variável inline
SERVE_FRONTEND=true npx tsx src/server/index.ts
```

## URLs Disponíveis

Após iniciar o servidor, acesse:

```
Frontend:     http://localhost:3000
Backend API:  http://localhost:3000/api
Health Check: http://localhost:3000/api/health
Debug Env:    http://localhost:3000/api/debug/env
Documents:    http://localhost:3000/api/documents
Analytics:    http://localhost:3000/api/analytics
```

## Logs Esperados

Quando o servidor inicia corretamente, você verá:

```
==========================================
  SpedRevio Fullstack Application
==========================================

Iniciando servidor fullstack na porta 3000...
  Frontend: http://localhost:3000
  Backend API: http://localhost:3000/api
  Health Check: http://localhost:3000/api/health

📁 Servindo frontend estático de: C:\...\dist
🚀 Iniciando Backoffice Server...

📊 Conectando ao MongoDB (Mongoose)...
   Timestamp: 2025-12-06T...
   URI: mongodb://***:***@host:27017/...
   Database: seu-database
   Host: seu-host
🔌 Tentando estabelecer conexão...
✅ MongoDB conectado com sucesso!
   Status: Conectado
   Tempo de conexão: XXms
   ReadyState: 1
   Collections: XX encontradas
     - tbl_nfe_100
     - tbl_cfe_100
     - tbl_cte_100
     - ...

✅ Backoffice Server rodando!
   URL: http://localhost:3000
   Health: http://localhost:3000/api/health
   Analytics: http://localhost:3000/api/analytics
   Documents: http://localhost:3000/api/documents
```

## Verificar se Está Funcionando

### 1. Health Check
```bash
curl http://localhost:3000/api/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "mongodb": {
    "state": "connected",
    "stateCode": 1
  }
}
```

### 2. Debug de Variáveis
```bash
curl http://localhost:3000/api/debug/env
```

### 3. Testar API de Documentos
```bash
curl "http://localhost:3000/api/documents?collection=tbl_nfe_100&dtIni=2024-01-01&dtFim=2024-12-31&page=1&size=10"
```

### 4. Abrir Frontend
```bash
# Windows
start http://localhost:3000

# Linux/Mac
open http://localhost:3000
```

## Troubleshooting

### Porta 3000 já está em uso
```bash
# Windows - Matar processo na porta 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Ou usar script
npm run kill-ports
```

### MongoDB não conecta
```bash
# Verificar variáveis de ambiente
curl http://localhost:3000/api/debug/env

# Verificar se MongoDB está acessível
ping seu-mongodb-host

# Testar conexão direta
mongosh "mongodb://user:pass@host:27017/database"
```

### Frontend não carrega (página em branco)
```bash
# 1. Verificar se dist/ existe
dir dist

# 2. Se não existir, fazer build
npm run build:prod

# 3. Verificar se SERVE_FRONTEND está true
curl http://localhost:3000/api/debug/env

# 4. Reiniciar servidor
# Ctrl+C e depois:
npm run fullstack
```

### Grid não mostra dados
Veja: `TROUBLESHOOTING_GRID_VAZIA.md`

## Parar o Servidor

```bash
# Pressionar Ctrl+C no terminal
```

## Build para Produção

```bash
# 1. Build do frontend
npm run build:prod

# 2. Build Docker
docker build -f Dockerfile.fullstack.optimized -t nf-dashboard:fullstack .

# 3. Rodar container
docker run -p 3000:3000 --env-file .env nf-dashboard:fullstack
```

## Desenvolvimento

### Frontend apenas (Vite dev server)
```bash
npm run dev
# Acessa: http://localhost:5173
```

### Backend apenas
```bash
npm run backend
# Acessa: http://localhost:3000/api
```

### Fullstack (recomendado)
```bash
npm run fullstack
# Acessa: http://localhost:3000
```

## Estrutura

```
http://localhost:3000/
├── /                    → Frontend (React)
├── /dashboard           → Frontend (React Router)
├── /api/health          → Backend (Express)
├── /api/documents       → Backend (Express)
├── /api/analytics       → Backend (Express)
└── /api/debug/env       → Backend (Express)
```

## Variáveis de Ambiente

Arquivo `.env` deve conter:

```bash
# MongoDB
VITE_MONGODB_CONNECTION_STRING=mongodb://user:pass@host:27017/database
VITE_DB_HOST=mongodb-host
VITE_DB_DATABASE=database-name

# Servidor
BACKOFFICE_PORT=3000
SERVE_FRONTEND=true
NODE_ENV=development
```

## Próximos Passos

1. ✅ Servidor rodando
2. ✅ MongoDB conectado
3. ⬜ Abrir http://localhost:3000 no navegador
4. ⬜ Verificar se grid carrega dados
5. ⬜ Se grid estiver vazia, ver `TROUBLESHOOTING_GRID_VAZIA.md`

## Ajuda

- [Troubleshooting Grid](TROUBLESHOOTING_GRID_VAZIA.md)
- [Deploy Fullstack](DEPLOY_FULLSTACK_SUMMARY.md)
- [Documentação Completa](docs/deployment/README.md)
