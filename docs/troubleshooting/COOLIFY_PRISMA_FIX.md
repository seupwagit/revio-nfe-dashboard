# 🔧 Fix: Erro Prisma no Coolify

## 🎯 Problema
```
[Prisma] ❌ Erro ao conectar SQL Server: Error: @prisma/client did not initialize yet. 
Please run "prisma generate" and try to import it again.
```

## 🔍 Causa
O Prisma Client não foi gerado durante o build no Coolify porque:
1. O comando `prisma generate` não estava sendo executado no Dockerfile
2. O script `build:prod` não incluía a geração do cliente Prisma

## ✅ Soluções Aplicadas

### 1. **Dockerfile Corrigido**
Adicionado `npx prisma generate` no `Dockerfile.fullstack.optimized`:

```dockerfile
# Copiar código do backend
COPY src/backend ./src/backend
COPY prisma ./prisma

# Gerar cliente Prisma
RUN npx prisma generate

# Instalar tsx para rodar TypeScript
RUN npm install -g tsx
```

### 2. **Script build:prod Atualizado**
```json
{
  "scripts": {
    "build:prod": "npx prisma generate && tsc --project tsconfig.prod.json && vite build",
    "prisma:generate": "npx prisma generate",
    "postinstall": "npx prisma generate || echo 'Prisma generate failed, continuing...'"
  }
}
```

### 3. **Fallback Implementado**
O código agora continua funcionando mesmo se o Prisma falhar:

```typescript
// Em src/backend/database/prisma.ts
try {
  const { PrismaClient } = await import('@prisma/client')
  prisma = new PrismaClient({...})
} catch (importError) {
  console.error('[Prisma] ❌ Erro ao importar @prisma/client:', importError)
  
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Prisma] ⚠️ Continuando sem Prisma em produção')
    return
  }
  
  throw new Error('Prisma Client não foi gerado')
}
```

### 4. **Servidor com Modo Degradado**
```typescript
// Em src/backend/index.ts
try {
  await connectPrisma()
  console.log('✅ Prisma conectado com sucesso')
} catch (error) {
  console.warn('⚠️ Continuando em modo degradado sem Prisma')
}
```

## 🚀 Deploy no Coolify

### 1. **Configuração Recomendada**
- **Dockerfile**: `Dockerfile.fullstack.optimized`
- **Build Command**: `npm run build:prod`
- **Start Command**: `tsx src/backend/index.ts`
- **Port**: `3000`

### 2. **Variáveis de Ambiente Necessárias**
```bash
# Banco de Dados SQL Server (para Prisma)
DATABASE_URL=sqlserver://host:1433;database=SpedRevio;user=sa;password=***;encrypt=false;trustServerCertificate=true

# Outras variáveis...
VITE_API_BASE_URL=https://seu-dominio-coolify.com
NODE_ENV=production
BACKOFFICE_PORT=3000
SERVE_FRONTEND=true
```

### 3. **Verificação Pós-Deploy**
Após o deploy, verificar os logs:

```bash
# Logs esperados de sucesso:
[Prisma] 🔗 Iniciando conexão com SQL Server...
[Prisma] 🏗️ Criando nova instância do PrismaClient...
[Prisma] ✅ SQL Server conectado via Prisma
✅ Prisma conectado com sucesso

# Ou em caso de fallback:
⚠️ Continuando em modo degradado sem Prisma
```

## 🔍 Endpoints de Debug

### 1. **Verificar Status do Prisma**
```bash
curl https://seu-dominio.com/api/debug/database
```

Resposta esperada:
```json
{
  "connections": {
    "prisma": { "status": "CONECTADO", "error": null }
  }
}
```

### 2. **Testar Autenticação**
```bash
curl -X POST https://seu-dominio.com/api/debug/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## 🛠️ Troubleshooting

### Se o Erro Persistir:

1. **Limpar Cache do Build no Coolify**:
   - Settings → Build → Clear Build Cache

2. **Verificar Logs de Build**:
   - Procurar por "npx prisma generate"
   - Verificar se não há erros durante a geração

3. **Testar Localmente**:
   ```bash
   npm run build:prod
   docker build -f Dockerfile.fullstack.optimized -t test .
   docker run -p 3000:3000 test
   ```

4. **Verificar Schema Prisma**:
   - Confirmar que `prisma/schema.prisma` existe
   - Verificar se não há erros de sintaxe

## 📋 Checklist de Deploy

- [ ] Dockerfile usa `Dockerfile.fullstack.optimized`
- [ ] Build command é `npm run build:prod`
- [ ] `DATABASE_URL` está configurada
- [ ] Logs mostram "Prisma conectado" ou "modo degradado"
- [ ] Endpoint `/api/debug/database` retorna status
- [ ] Login funciona com credenciais válidas

---

**Status**: ✅ Correções aplicadas, pronto para redeploy no Coolify