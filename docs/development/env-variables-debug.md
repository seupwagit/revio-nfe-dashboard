# 🔧 Variáveis de Ambiente para Debug

## Configuração Automática via .env

O Docker debug agora carrega automaticamente todas as variáveis do arquivo `.env` na raiz do projeto.

### 📋 Variáveis Principais Utilizadas

#### Portas
```env
VITE_PORT=4000                    # Frontend Vite Dev Server
BACKOFFICE_PORT=4001             # Backend API Server
```

#### Database MongoDB
```env
VITE_DB_HOST=10.0.0.8
VITE_DB_DATABASE=spedrevio
VITE_DB_COLLECTION=tbl_nfe_100
VITE_MONGODB_CONNECTION_STRING=mongodb://revio:zaqwsx2001@10.0.0.8:27017/...
```

#### Database SQL Server
```env
VITE_DB_SERVER=10.0.0.4
VITE_DB_USER=sa
VITE_DB_PASSWORD=zaqwsx2001
DATABASE_URL="sqlserver://10.0.0.4:1433;database=SpedRevio;..."
```

#### APIs
```env
VITE_API_BASE_URL=http://localhost:4001
VITE_API_BEARER_TOKEN=eyJhbGciOiJSUzI1NiIs...
VITE_EXTERNAL_API_URL=http://apinfe.revio.digital/api
VITE_REVIO_API_URL=https://api.revio.com.br/api/v1
```

#### S3 Storage
```env
VITE_S3_ENDPOINT=https://s3.wasabisys.com
VITE_S3_ACCESS_KEY=7YDC7UG085G6BS8A714S
VITE_S3_SECRET_KEY=HYKatJ4XbvaOsCsz9uJJGm2ZBgZWfsgZ5XHun1Vs
VITE_S3_BUCKET=revio-bucket
VITE_S3_REGION=us-east-1
```

#### Google API
```env
VITE_API_GOOGLE_GEMINI=AIzaSyD7EWB19AwBddPuj_MHxYcIq7DgW6w58zM
VITE_GOOGLE_API_URL=https://generativelanguage.googleapis.com/v1beta
```

### 🚀 Como Usar

#### 1. Verificar Configurações
```bash
# Verificar se todas as variáveis estão carregadas
./scripts/debug-env-check.sh
```

#### 2. Iniciar Debug
```bash
# WSL Ubuntu
./scripts/wsl-debug-start.sh

# Windows
scripts\debug-start.bat
```

#### 3. URLs Geradas Automaticamente
- **Frontend**: `http://localhost:${VITE_PORT}` (padrão: 4000)
- **Backend**: `http://localhost:${BACKOFFICE_PORT}` (padrão: 4001)
- **Debug**: `http://localhost:9229` (fixo)

### 🔄 Fluxo de Configuração

1. **Docker Compose** lê o arquivo `.env` automaticamente
2. **Variáveis** são passadas para os containers
3. **Portas** são mapeadas dinamicamente
4. **URLs** são construídas com base nas variáveis

### 📊 Monitoramento

#### Verificar se Serviços Estão Usando as Configurações Corretas
```bash
# Backend health check
curl http://localhost:${BACKOFFICE_PORT}/api/health

# Frontend
curl http://localhost:${VITE_PORT}

# Ver logs dos containers
docker-compose -f docker-compose.debug.yml logs -f
```

### 🛠️ Troubleshooting

#### Problema: Portas Conflitantes
```bash
# Verificar se portas estão ocupadas
netstat -tulpn | grep :4000
netstat -tulpn | grep :4001

# Alterar portas no .env se necessário
VITE_PORT=5000
BACKOFFICE_PORT=5001
```

#### Problema: Variáveis Não Carregadas
```bash
# Verificar se .env existe
ls -la .env

# Verificar sintaxe do .env (sem espaços ao redor do =)
# ✅ CORRETO: VITE_PORT=4000
# ❌ ERRADO:  VITE_PORT = 4000

# Recriar containers
docker-compose -f docker-compose.debug.yml down
docker-compose -f docker-compose.debug.yml up -d --build
```

#### Problema: Conexão com Databases Externos
```bash
# Testar conectividade MongoDB
telnet 10.0.0.8 27017

# Testar conectividade SQL Server
telnet 10.0.0.4 1433

# Verificar se containers podem acessar hosts externos
docker exec fiscal-backend-debug ping 10.0.0.8
```

### 🔐 Segurança

#### Variáveis Sensíveis
- **Tokens e senhas** são carregados do `.env`
- **Não committar** o arquivo `.env` no Git
- **Usar** `.env.example` para documentar variáveis necessárias

#### Exemplo .env.example
```env
# Portas
VITE_PORT=4000
BACKOFFICE_PORT=4001

# Database MongoDB
VITE_DB_HOST=your_mongodb_host
VITE_DB_DATABASE=your_database
VITE_MONGODB_CONNECTION_STRING=mongodb://user:pass@host:port/db

# Database SQL Server
VITE_DB_SERVER=your_sql_server
VITE_DB_USER=your_sql_user
VITE_DB_PASSWORD=your_sql_password
DATABASE_URL="sqlserver://host:port;database=db;user=user;password=pass"

# APIs
VITE_API_BEARER_TOKEN=your_bearer_token
VITE_API_GOOGLE_GEMINI=your_google_api_key

# S3 Storage
VITE_S3_ACCESS_KEY=your_s3_access_key
VITE_S3_SECRET_KEY=your_s3_secret_key
VITE_S3_BUCKET=your_bucket_name
```

### 📝 Comandos Úteis

```bash
# Verificar configurações
./scripts/debug-env-check.sh

# Iniciar debug
./scripts/wsl-debug-start.sh

# Parar debug
./scripts/wsl-debug-stop.sh

# Ver logs
docker-compose -f docker-compose.debug.yml logs -f

# Executar comando no container
docker exec -it fiscal-backend-debug bash
docker exec -it fiscal-frontend-debug bash

# Verificar variáveis dentro do container
docker exec fiscal-backend-debug env | grep VITE_
docker exec fiscal-frontend-debug env | grep VITE_
```

### ✅ Checklist de Configuração

- [ ] Arquivo `.env` existe na raiz do projeto
- [ ] Variáveis de porta definidas (`VITE_PORT`, `BACKOFFICE_PORT`)
- [ ] Configurações de database definidas
- [ ] Tokens e chaves de API configurados
- [ ] Docker rodando no WSL
- [ ] Portas não conflitantes
- [ ] Containers iniciados com sucesso
- [ ] Serviços respondendo nas URLs corretas

**Agora o debug usa automaticamente todas as configurações do seu arquivo .env! 🎉**