# 🎨 Guia Visual de Deploy no Coolify

## 📸 Passo a Passo com Imagens

### Passo 1: Validar Configuração Local

```bash
npm run validate:deploy
```

**Resultado esperado:**
```
╔════════════════════════════════════════════════════════╗
║                                                        ║
║        ✅ Todas as validações passaram!               ║
║        Pronto para deploy no Coolify! 🚀              ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
```

---

### Passo 2: Acessar Coolify Dashboard

1. Abra seu navegador
2. Acesse: `https://seu-coolify.com`
3. Faça login

**Tela inicial:**
```
┌─────────────────────────────────────────┐
│  Coolify Dashboard                      │
├─────────────────────────────────────────┤
│                                         │
│  [+ New Resource]                       │
│                                         │
│  Projects:                              │
│  ├─ Project 1                          │
│  ├─ Project 2                          │
│  └─ ...                                │
│                                         │
└─────────────────────────────────────────┘
```

---

### Passo 3: Criar Novo Resource

Clique em **[+ New Resource]**

**Opções:**
```
┌─────────────────────────────────────────┐
│  Select Resource Type                   │
├─────────────────────────────────────────┤
│                                         │
│  ○ Application                          │ ← Selecione esta
│  ○ Database                             │
│  ○ Service                              │
│  ○ Docker Compose                       │
│                                         │
└─────────────────────────────────────────┘
```

---

### Passo 4: Configurar Repositório

**Formulário:**
```
┌─────────────────────────────────────────┐
│  Application Configuration              │
├─────────────────────────────────────────┤
│                                         │
│  Name: nf-dashboard                     │
│                                         │
│  Source:                                │
│  ○ Git Repository                       │ ← Selecione
│  ○ Docker Image                         │
│                                         │
│  Repository URL:                        │
│  [https://github.com/user/repo.git]    │
│                                         │
│  Branch:                                │
│  [main]                                 │
│                                         │
│  [Continue]                             │
│                                         │
└─────────────────────────────────────────┘
```

---

### Passo 5: Configurar Build

**Build Settings:**
```
┌─────────────────────────────────────────┐
│  Build Configuration                    │
├─────────────────────────────────────────┤
│                                         │
│  Build Pack:                            │
│  ○ Nixpacks                             │
│  ● Dockerfile                           │ ← Selecione
│  ○ Docker Compose                       │
│                                         │
│  Dockerfile:                            │
│  [Dockerfile.fullstack]                 │ ← Digite isto
│                                         │
│  Build Context:                         │
│  [.]                                    │
│                                         │
│  [Continue]                             │
│                                         │
└─────────────────────────────────────────┘
```

---

### Passo 6: Configurar Portas

**Port Configuration:**
```
┌─────────────────────────────────────────┐
│  Port Mapping                           │
├─────────────────────────────────────────┤
│                                         │
│  Exposed Ports:                         │
│  ┌───────────────────────────────────┐ │
│  │ Container Port: 3000              │ │ ← Frontend
│  │ Public Port: 80                   │ │
│  │ Protocol: HTTP                    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [+ Add Port]                           │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Container Port: 3001              │ │ ← Backend
│  │ Public Port: (auto)               │ │
│  │ Protocol: HTTP                    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  [Continue]                             │
│                                         │
└─────────────────────────────────────────┘
```

---

### Passo 7: Configurar Variáveis de Ambiente

**Environment Variables:**
```
┌─────────────────────────────────────────┐
│  Environment Variables                  │
├─────────────────────────────────────────┤
│                                         │
│  [+ Add Variable]                       │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Key: NODE_ENV                     │ │
│  │ Value: production                 │ │
│  │ □ Secret                          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Key: VITE_MONGODB_CONNECTION_...  │ │
│  │ Value: mongodb://...              │ │
│  │ ☑ Secret                          │ │ ← Marque para senhas
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ Key: VITE_API_BASE_URL            │ │
│  │ Value: https://apinfe.revio...    │ │
│  │ □ Secret                          │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ... (adicione todas as variáveis)     │
│                                         │
│  [Continue]                             │
│                                         │
└─────────────────────────────────────────┘
```

**Variáveis essenciais:**
- ✅ `NODE_ENV=production`
- ✅ `PORT=3000`
- ✅ `BACKOFFICE_PORT=3001`
- ✅ `VITE_MONGODB_CONNECTION_STRING=...` (Secret)
- ✅ `VITE_API_BASE_URL=...`
- ✅ `VITE_API_BEARER_TOKEN=...` (Secret)
- ✅ `VITE_DB_HOST=...`
- ✅ `VITE_DB_DATABASE=...`

---

### Passo 8: Configurar Domínio

**Domain Configuration:**
```
┌─────────────────────────────────────────┐
│  Domain Settings                        │
├─────────────────────────────────────────┤
│                                         │
│  Domain:                                │
│  [nf-dashboard.seudominio.com.br]      │
│                                         │
│  SSL/TLS:                               │
│  ☑ Enable SSL                          │
│  ● Let's Encrypt (Auto)                │ ← Recomendado
│  ○ Custom Certificate                  │
│                                         │
│  Force HTTPS:                           │
│  ☑ Redirect HTTP to HTTPS              │
│                                         │
│  [Continue]                             │
│                                         │
└─────────────────────────────────────────┘
```

---

### Passo 9: Configurar Health Check

**Health Check:**
```
┌─────────────────────────────────────────┐
│  Health Check Configuration             │
├─────────────────────────────────────────┤
│                                         │
│  Enable Health Check:                   │
│  ☑ Enabled                              │
│                                         │
│  Path:                                  │
│  [/api/health]                          │
│                                         │
│  Port:                                  │
│  [3001]                                 │
│                                         │
│  Interval:                              │
│  [30] seconds                           │
│                                         │
│  Timeout:                               │
│  [10] seconds                           │
│                                         │
│  Retries:                               │
│  [3]                                    │
│                                         │
│  Start Period:                          │
│  [40] seconds                           │
│                                         │
│  [Continue]                             │
│                                         │
└─────────────────────────────────────────┘
```

---

### Passo 10: Revisar e Deploy

**Review:**
```
┌─────────────────────────────────────────┐
│  Review Configuration                   │
├─────────────────────────────────────────┤
│                                         │
│  Name: nf-dashboard                     │
│  Repository: github.com/user/repo       │
│  Branch: main                           │
│  Dockerfile: Dockerfile.fullstack       │
│                                         │
│  Ports:                                 │
│  ├─ 3000 → 80 (Frontend)               │
│  └─ 3001 (Backend)                     │
│                                         │
│  Domain: nf-dashboard.seudominio.com.br│
│  SSL: Enabled (Let's Encrypt)          │
│                                         │
│  Environment Variables: 15 configured   │
│  Health Check: Enabled                  │
│                                         │
│  [← Back]  [Deploy Now]                │
│                                         │
└─────────────────────────────────────────┘
```

Clique em **[Deploy Now]**

---

### Passo 11: Acompanhar Deploy

**Build Logs:**
```
┌─────────────────────────────────────────┐
│  Deployment Logs                        │
├─────────────────────────────────────────┤
│                                         │
│  [Building] Step 1/10: FROM node:20...  │
│  [Building] Step 2/10: WORKDIR /app...  │
│  [Building] Step 3/10: COPY package...  │
│  [Building] Step 4/10: RUN npm ci...    │
│  [Building] Step 5/10: COPY . .         │
│  [Building] Step 6/10: RUN npm run...   │
│  [Building] ✅ Build completed          │
│                                         │
│  [Deploying] Starting container...      │
│  [Deploying] Container started          │
│  [Deploying] Health check passed        │
│  [Deploying] ✅ Deployment successful   │
│                                         │
│  Status: ● Running                      │
│  URL: https://nf-dashboard.seu...       │
│                                         │
└─────────────────────────────────────────┘
```

---

### Passo 12: Verificar Aplicação

**Abra o navegador:**
```
URL: https://nf-dashboard.seudominio.com.br
```

**Tela esperada:**
```
┌─────────────────────────────────────────┐
│  SpedRevio Dashboard                    │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  Dashboard Fiscal               │   │
│  │                                 │   │
│  │  Total de Documentos: 5.199     │   │
│  │  Valor Total: R$ 22.964.757,68  │   │
│  │  Autorizados: 2.476             │   │
│  │  Cancelados: 0                  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ... (resto do dashboard)               │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🎯 Checklist Visual

### Antes do Deploy
```
┌─────────────────────────────────────────┐
│  Pre-Deploy Checklist                   │
├─────────────────────────────────────────┤
│                                         │
│  □ Código commitado no Git              │
│  □ .env configurado localmente          │
│  □ npm run validate:deploy passou       │
│  □ Build local funciona                 │
│  □ MongoDB acessível                    │
│  □ Variáveis de ambiente preparadas     │
│                                         │
└─────────────────────────────────────────┘
```

### Durante o Deploy
```
┌─────────────────────────────────────────┐
│  Deploy Progress                        │
├─────────────────────────────────────────┤
│                                         │
│  ✅ Repository connected                │
│  ✅ Dockerfile found                    │
│  ⏳ Building image...                   │
│  ⏳ Starting container...               │
│  ⏳ Health check...                     │
│  ⏳ SSL certificate...                  │
│                                         │
└─────────────────────────────────────────┘
```

### Após o Deploy
```
┌─────────────────────────────────────────┐
│  Post-Deploy Verification               │
├─────────────────────────────────────────┤
│                                         │
│  □ Frontend carrega (/)                 │
│  □ Backend responde (/api/health)       │
│  □ Dashboard mostra dados               │
│  □ Filtros funcionam                    │
│  □ Grid carrega documentos              │
│  □ SSL ativo (HTTPS)                    │
│  □ Logs sem erros                       │
│                                         │
└─────────────────────────────────────────┘
```

---

## 🔍 Troubleshooting Visual

### Problema: Build Falha

**Logs:**
```
❌ Error: Cannot find module 'xyz'
```

**Solução:**
```
1. Verificar package.json
2. npm install localmente
3. Commit e push
4. Redeploy
```

---

### Problema: Container não inicia

**Logs:**
```
❌ Error: VITE_MONGODB_CONNECTION_STRING is not defined
```

**Solução:**
```
1. Ir para Environment Variables
2. Adicionar variável faltante
3. Redeploy
```

---

### Problema: Health Check Falha

**Logs:**
```
❌ Health check failed: Connection refused
```

**Solução:**
```
1. Verificar se backend está rodando
2. Verificar porta do health check (3001)
3. Verificar path (/api/health)
4. Ver logs do container
```

---

## 📊 Dashboard do Coolify

**Visão Geral:**
```
┌─────────────────────────────────────────┐
│  nf-dashboard                           │
├─────────────────────────────────────────┤
│                                         │
│  Status: ● Running                      │
│  Uptime: 2h 34m                         │
│  CPU: 12%                               │
│  Memory: 256MB / 512MB                  │
│  Network: ↓ 1.2MB ↑ 0.8MB              │
│                                         │
│  [Logs] [Restart] [Stop] [Redeploy]    │
│                                         │
│  Recent Deployments:                    │
│  ├─ ✅ v1.0.3 (2 hours ago)            │
│  ├─ ✅ v1.0.2 (1 day ago)              │
│  └─ ✅ v1.0.1 (2 days ago)             │
│                                         │
└─────────────────────────────────────────┘
```

---

**Pronto! Sua aplicação está no ar! 🚀**
