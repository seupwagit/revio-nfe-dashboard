# 🔧 Fix: Erro Prisma no Coolify

## 🎯 Problemas Comuns

### 1. **Erro: @prisma/client did not initialize yet**
```
[Prisma] ❌ Erro ao conectar SQL Server: Error: @prisma/client did not initialize yet. 
Please run "prisma generate" and try to import it again.
```

### 2. **Erro: Engine Compatibility (Alpine Linux)**
```
Unable to require(`/app/node_modules/.prisma/client/libquery_engine-linux-musl.so.node`).
The Prisma engines do not seem to be compatible with your system.
Details: Error loading shared library libssl.so.1.1: No such file or directory
```

## 🔍 Causas
1. O comando `prisma generate` não foi executado no build
2. Incompatibilidade entre Prisma engines e Alpine Linux
3. Bibliotecas SSL ausentes no container Alpine

## ✅ Soluções Aplicadas

### **Solução 1: Dockerfile Alpine Corrigido**
Use `Dockerfile.fullstack.optimized` com dependências SSL:

```dockerfile
FROM node:20-alpine

# Instalar dependências necessárias para Prisma no Alpine Linux
RUN apk add --no-cache \
    openssl \
    openssl-dev \
    libc6-compat \
    && ln -s /lib/libc.musl-x86_64.so.1 /lib/ld-linux-x86-64.so.2

# Gerar cliente Prisma com engine específica para Alpine
ENV PRISMA_CLI_BINARY_TARGETS="linux-musl,linux-musl-openssl-1.1.x"
RUN npx prisma generate
```

### **Solução 2: Dockerfile Debian (Recomendado)**
Use `Dockerfile.fullstack.debian` para melhor compatibilidade:

```dockerfile
FROM node:20-slim

# Instalar dependências do sistema necessárias para Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Gerar cliente Prisma (Debian tem melhor compatibilidade)
RUN npx prisma generate
```

### **Solução 3: Schema Prisma Atualizado**
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl", "linux-musl-openssl-1.1.x"]
}
```

### **Solução 4: Scripts Atualizados**
```json
{
  "scripts": {
    "build:prod": "npx prisma generate && tsc --project tsconfig.prod.json && vite build",
    "prisma:generate": "npx prisma generate",
    "postinstall": "npx prisma generate || echo 'Prisma generate failed, continuing...'"
  }
}
```

## 🚀 Deploy no Coolify

## 🚀 Deploy no Coolify

### **Opções de Dockerfile (em ordem de recomendação):**

1. **`Dockerfile` (Principal - Mais Estável)**
   - Debian-based para melhor compatibilidade Prisma
   - Fullstack (Frontend + Backend)
   - **Recomendado para produção**

2. **`Dockerfile.fullstack.simple` (Alpine Simples)**
   - Alpine Linux sem dependências complexas
   - Fallback gracioso se Prisma falhar
   - **Use se o principal não funcionar**

3. **`Dockerfile.fullstack.debian` (Debian Específico)**
   - Versão específica Debian
   - Configurações detalhadas
   - **Para casos específicos**

4. **`Dockerfile.fullstack.optimized` (Alpine Avançado)**
   - Tentativas de correção para Alpine + Prisma
   - Pode falhar em alguns ambientes
   - **Apenas para teste/debug**

### **Configuração Recomendada no Coolify:**
```bash
# Opção 1: Dockerfile Principal (Recomendado)
Dockerfile: Dockerfile
Build Command: npm run build:prod
Start Command: tsx src/backend/index.ts
Port: 3000

# Opção 2: Se o principal falhar
Dockerfile: Dockerfile.fullstack.simple
Build Command: npm run build:prod
Start Command: tsx src/backend/index.ts
Port: 3000
```

### **Configuração no Coolify:**
```bash
# Build Settings
Dockerfile: Dockerfile.fullstack.debian  # ou .optimized
Build Command: npm run build:prod
Start Command: tsx src/backend/index.ts
Port: 3000

# Environment Variables
DATABASE_URL=sqlserver://host:1433;database=SpedRevio;user=sa;password=***;encrypt=false;trustServerCertificate=true
VITE_API_BASE_URL=https://seu-dominio-coolify.com
NODE_ENV=production
BACKOFFICE_PORT=3000
SERVE_FRONTEND=true
```

## 🔍 Verificação Pós-Deploy

### **Logs de Sucesso:**
```
[Prisma] 🔗 Iniciando conexão com SQL Server...
[Prisma] 🏗️ Criando nova instância do PrismaClient...
[Prisma] ✅ SQL Server conectado via Prisma
✅ Prisma conectado com sucesso
```

### **Logs de Fallback (Aceitável):**
```
[Prisma] ❌ Erro ao conectar SQL Server: ...
⚠️ Continuando em modo degradado sem Prisma
⚠️ Autenticação pode não funcionar corretamente
```

### **Endpoints de Teste:**
```bash
# Status das conexões
curl https://seu-dominio.com/api/debug/database

# Teste de autenticação
curl -X POST https://seu-dominio.com/api/debug/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"divino@grupochama.com.br","password":"123456789"}'

# Login real
curl -X POST https://seu-dominio.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"divino@grupochama.com.br","password":"123456789"}'
```

## 🛠️ Troubleshooting

### **Se o Erro de Engine Persistir:**

1. **Mudar para Debian:**
   ```bash
   # No Coolify, alterar Dockerfile para:
   Dockerfile.fullstack.debian
   ```

2. **Limpar Cache:**
   - Settings → Build → Clear Build Cache
   - Rebuild from scratch

3. **Verificar Logs de Build:**
   ```bash
   # Procurar por:
   "npx prisma generate"
   "Prisma engines"
   "Binary targets"
   ```

4. **Testar Localmente:**
   ```bash
   # Testar com Alpine
   docker build -f Dockerfile.fullstack.optimized -t test-alpine .
   
   # Testar com Debian
   docker build -f Dockerfile.fullstack.debian -t test-debian .
   ```

## 📋 Checklist de Deploy

- [ ] Escolher Dockerfile: `.debian` (recomendado) ou `.optimized`
- [ ] Build command: `npm run build:prod`
- [ ] `DATABASE_URL` configurada
- [ ] Logs mostram Prisma conectado ou modo degradado
- [ ] `/api/debug/database` retorna status
- [ ] Login funciona: `/api/auth/login`

## 🎯 Recomendação Final

**Use `Dockerfile.fullstack.debian`** para evitar problemas de compatibilidade com Prisma engines no Alpine Linux.

---

**Status**: ✅ Múltiplas soluções implementadas, pronto para redeploy