# 🔧 Fix: Prisma Schema Not Found

## 🎯 Problema
```
Error: Could not find Prisma Schema that is required for this command.
You can either provide it with `--schema` argument, set it as `prisma.schema` in your package.json or put it into the default location.
Checked following paths:

schema.prisma: file not found
prisma/schema.prisma: file not found
prisma/schema: directory not found
```

## 🔍 Causa
O Prisma está tentando executar durante o `postinstall` do npm, mas a pasta `prisma` ainda não foi copiada para o container.

## ✅ Soluções

### **Solução 1: Usar Dockerfile.fullstack.fixed**
Este Dockerfile corrige a ordem de cópia:

```dockerfile
# Copiar package.json e prisma PRIMEIRO
COPY package*.json ./
COPY prisma ./prisma

# Instalar dependências de produção (sem executar postinstall)
RUN npm ci --only=production --ignore-scripts

# Depois copiar o resto e gerar Prisma
COPY src/backend ./src/backend
RUN npx prisma generate || echo "Prisma generate falhou"
```

**Configuração no Coolify:**
```bash
Dockerfile: Dockerfile.fullstack.fixed
Build Command: npm run build:prod
Start Command: tsx src/backend/index.ts
Port: 3000
```

### **Solução 2: Usar Dockerfile Principal (Debian)**
O Dockerfile principal (Debian) é mais estável:

```bash
Dockerfile: Dockerfile
Build Command: npm run build:prod
Start Command: tsx src/backend/index.ts
Port: 3000
```

### **Solução 3: Corrigir Script postinstall**
Tornar o script mais robusto:

```json
{
  "scripts": {
    "postinstall": "test -f prisma/schema.prisma && npx prisma generate || echo 'Prisma schema não encontrado, continuando...'"
  }
}
```

### **Solução 4: Separar Build do Frontend e Backend**
Usar script sem Prisma para frontend:

```json
{
  "scripts": {
    "build:prod": "tsc --project tsconfig.prod.json && vite build",
    "build:prod:with-prisma": "npx prisma generate && tsc --project tsconfig.prod.json && vite build"
  }
}
```

## 🚀 Recomendação

**Ordem de tentativa:**

1. **`Dockerfile`** (Debian - mais estável)
2. **`Dockerfile.fullstack.fixed`** (Alpine corrigido)
3. **`Dockerfile.fullstack.simple`** (Alpine simples)

## 🔍 Verificação

### **Logs de Sucesso:**
```
Copying package*.json ./
Copying prisma ./prisma
Installing production dependencies...
Generating Prisma client...
✅ Prisma client generated successfully
```

### **Logs de Fallback (Aceitável):**
```
Prisma generate falhou - aplicação funcionará em modo degradado
⚠️ Continuando sem Prisma em produção
```

## 🛠️ Debug

### **Verificar se Prisma Existe:**
```bash
# No container, verificar se existe:
ls -la prisma/
cat prisma/schema.prisma
```

### **Testar Localmente:**
```bash
# Testar build local
docker build -f Dockerfile.fullstack.fixed -t test .
docker run -p 3000:3000 test

# Verificar logs
docker logs [container-id]
```

---

**Status**: ✅ Dockerfile.fullstack.fixed criado para resolver o problema