# 🔧 Fix: Erro de Build no Coolify

## 🎯 Problema
```
ERROR: docker: 'docker buildx build' requires 1 argument
Usage:  docker buildx build [OPTIONS] PATH | URL | -
exit status 1
```

## 🔍 Causa
O Coolify não conseguiu encontrar o Dockerfile ou há um problema na configuração do build context.

## ✅ Soluções

### **Solução 1: Usar Dockerfile Principal**
No Coolify, configure:

```bash
# Build Settings
Dockerfile: Dockerfile
Build Command: npm run build:prod
Start Command: tsx src/backend/index.ts
Port: 3000
```

### **Solução 2: Verificar Configuração no Coolify**

1. **Ir para Settings → Build**
2. **Verificar campos:**
   - **Dockerfile**: `Dockerfile` (sem caminho, apenas o nome)
   - **Build Context**: `.` (ponto, indicando raiz)
   - **Build Command**: `npm run build:prod`

### **Solução 3: Limpar Cache e Rebuild**

1. **Settings → Build → Clear Build Cache**
2. **Deploy → Redeploy**
3. **Ou Force Rebuild from Scratch**

### **Solução 4: Verificar Estrutura do Projeto**

Certifique-se que na raiz do projeto existe:
```
/
├── Dockerfile                    ✅ Deve existir
├── package.json                  ✅ Deve existir
├── src/backend/                  ✅ Deve existir
├── prisma/                       ✅ Deve existir
└── .dockerignore                 ✅ Deve existir
```

## 🚀 Configuração Recomendada no Coolify

### **Opção A: Dockerfile Principal (Recomendado)**
```bash
Repository: seu-repositorio
Branch: main
Dockerfile: Dockerfile
Build Context: .
Build Command: npm run build:prod
Start Command: tsx src/backend/index.ts
Port: 3000
```

### **Opção B: Dockerfile Específico**
```bash
Repository: seu-repositorio
Branch: main
Dockerfile: Dockerfile.fullstack.debian
Build Context: .
Build Command: npm run build:prod
Start Command: tsx src/backend/index.ts
Port: 3000
```

## 🔍 Verificação de Build

### **Logs Esperados de Sucesso:**
```
Step 1/XX : FROM node:20-alpine AS frontend-builder
Step 2/XX : WORKDIR /app
Step 3/XX : COPY package*.json ./
...
Step XX/XX : CMD ["tsx", "src/backend/index.ts"]
Successfully built [image-id]
Successfully tagged [tag]
```

### **Se o Build Falhar:**
1. **Verificar se todos os arquivos estão commitados**
2. **Verificar se o Dockerfile está na raiz**
3. **Verificar se não há erros de sintaxe no Dockerfile**

## 🛠️ Troubleshooting Avançado

### **Teste Local do Dockerfile:**
```bash
# Testar build localmente
docker build -t test-app .

# Se funcionar localmente, o problema é no Coolify
docker run -p 3000:3000 test-app
```

### **Verificar Logs Detalhados no Coolify:**
1. **Ir para Deployments**
2. **Clicar no deployment que falhou**
3. **Ver logs completos do build**
4. **Procurar por erros específicos**

### **Verificar Permissões:**
- Certifique-se que o repositório está público ou o Coolify tem acesso
- Verificar se a branch está correta
- Verificar se não há arquivos corrompidos

## 📋 Checklist de Deploy

- [ ] Dockerfile existe na raiz do projeto
- [ ] package.json existe e está válido
- [ ] src/backend/ existe com código do backend
- [ ] prisma/ existe com schema.prisma
- [ ] Build command: `npm run build:prod`
- [ ] Start command: `tsx src/backend/index.ts`
- [ ] Port: `3000`
- [ ] Todas as variáveis de ambiente configuradas

## 🎯 Variáveis de Ambiente Necessárias

```bash
# Essenciais
DATABASE_URL=sqlserver://host:1433;database=SpedRevio;user=sa;password=***;encrypt=false;trustServerCertificate=true
VITE_API_BASE_URL=https://seu-dominio-coolify.com
NODE_ENV=production
BACKOFFICE_PORT=3000
SERVE_FRONTEND=true

# Opcionais para CORS
FRONTEND_URL=https://seu-dominio-coolify.com
CORS_ORIGIN=https://seu-dominio-coolify.com
```

## 🔄 Processo de Deploy Recomendado

1. **Commit e Push das alterações**
2. **Limpar cache no Coolify**
3. **Configurar Dockerfile: `Dockerfile`**
4. **Configurar variáveis de ambiente**
5. **Deploy**
6. **Verificar logs**
7. **Testar endpoints: `/api/health`, `/api/debug/database`**

---

**Status**: ✅ Dockerfile principal atualizado, pronto para deploy