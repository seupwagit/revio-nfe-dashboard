# 📦 Guia de Dockerfiles

## 🎯 Arquivos Disponíveis

Este projeto tem 2 Dockerfiles diferentes:

### 1. `Dockerfile` (Padrão - Frontend Only)
**Uso:** Deploy apenas do frontend (SPA estático)

**Características:**
- ✅ Apenas frontend (React + Vite)
- ✅ Serve estático com `serve`
- ✅ Porta 3000
- ✅ Mais leve e rápido
- ❌ Sem backend Node.js

**Quando usar:**
- Deploy simples de frontend
- Backend separado em outro serviço
- Coolify com configuração padrão

### 2. `Dockerfile.fullstack` (Frontend + Backend)
**Uso:** Deploy completo com frontend e backend juntos

**Características:**
- ✅ Frontend (React + Vite)
- ✅ Backend (Node.js + Express)
- ✅ Portas 3000 (frontend) e 3000 (backend)
- ✅ Script de inicialização robusto
- ✅ Health check integrado
- ⚠️ Mais pesado (2 processos)

**Quando usar:**
- Deploy fullstack em um único container
- Backend precisa rodar junto com frontend
- Coolify com configuração customizada

---

## 🔧 Correções Aplicadas

### Problema Original
```
error TS2339: Property 'VITE_XXX' does not exist
error TS7016: Could not find a declaration file for module 'react-dom/client'
error TS2307: Cannot find module 'vitest'
```

### Solução Aplicada em AMBOS os Dockerfiles

#### 1. Instalar TODAS as dependências
**Antes:**
```dockerfile
RUN npm ci --only=production
```

**Depois:**
```dockerfile
RUN npm ci  # Instala TODAS as dependências
```

#### 2. Copiar configuração TypeScript
**Antes:**
```dockerfile
COPY package*.json ./
```

**Depois:**
```dockerfile
COPY package*.json ./
COPY tsconfig*.json ./  # ← Adiciona tsconfig.prod.json
```

#### 3. Usar build de produção
**Antes:**
```dockerfile
RUN npm run build
```

**Depois:**
```dockerfile
RUN npm run build:prod  # ← Usa tsconfig.prod.json
```

---

## 🚀 Como Usar no Coolify

### Opção 1: Frontend Only (Recomendado para começar)

**No Coolify:**
1. Build Pack: **Dockerfile**
2. Dockerfile: **Dockerfile** (deixe em branco ou padrão)
3. Port: **3000**

**Resultado:**
- Frontend funcionando em `https://seu-dominio.com`
- Backend precisa estar em outro serviço

### Opção 2: Fullstack (Frontend + Backend)

**No Coolify:**
1. Build Pack: **Dockerfile**
2. Dockerfile: **Dockerfile.fullstack**
3. Ports: **3000** (frontend), **3000** (backend)

**Resultado:**
- Frontend em `https://seu-dominio.com`
- Backend em `https://seu-dominio.com:3000` ou via proxy

---

## 📊 Comparação

| Característica | Dockerfile | Dockerfile.fullstack |
|----------------|------------|---------------------|
| **Tamanho** | ~150MB | ~250MB |
| **Build Time** | ~2 min | ~3 min |
| **Processos** | 1 (serve) | 2 (serve + tsx) |
| **Portas** | 3000 | 3000, 3000 |
| **Complexidade** | Simples | Média |
| **Uso de CPU** | Baixo | Médio |
| **Uso de RAM** | ~50MB | ~150MB |

---

## ✅ Checklist de Deploy

### Para `Dockerfile` (Frontend Only)

- [ ] Variáveis de ambiente configuradas
- [ ] `npm run build:prod` funciona localmente
- [ ] Porta 3000 configurada no Coolify
- [ ] Backend em serviço separado (se necessário)

### Para `Dockerfile.fullstack`

- [ ] Variáveis de ambiente configuradas
- [ ] `npm run build:prod` funciona localmente
- [ ] `npm run backend` funciona localmente
- [ ] Portas 3000 e 3000 configuradas
- [ ] MongoDB acessível
- [ ] Script `start-fullstack.sh` existe

---

## 🔍 Troubleshooting

### Erro: "Cannot find module 'react-dom/client'"

**Causa:** DevDependencies não instaladas

**Solução:**
```dockerfile
# Mudar de:
RUN npm ci --only=production

# Para:
RUN npm ci
```

### Erro: "Property 'VITE_XXX' does not exist"

**Causa:** Tipos TypeScript não atualizados

**Solução:**
1. Verificar `src/vite-env.d.ts`
2. Adicionar variável faltante
3. Rebuild

### Erro: "Expected 4 arguments, but got 3"

**Causa:** Erros de tipo em arquivos de teste

**Solução:**
```dockerfile
# Usar build:prod que exclui testes
RUN npm run build:prod
```

### Build muito lento

**Solução:**
1. Usar cache de dependências:
```dockerfile
COPY package*.json ./
RUN npm ci
COPY . .  # ← Copiar código depois
```

2. Otimizar `.dockerignore`:
```
node_modules
dist
.git
tests
coverage
```

---

## 📝 Recomendações

### Para Desenvolvimento
Use `Dockerfile` (mais simples e rápido)

### Para Produção
- **Pequeno/Médio:** `Dockerfile` (frontend) + serviço separado (backend)
- **Grande/Enterprise:** `Dockerfile.fullstack` (tudo junto)

### Para Coolify
1. **Comece com `Dockerfile`** (mais fácil de debugar)
2. **Migre para `Dockerfile.fullstack`** se precisar de backend junto

---

## 🎯 Próximos Passos

1. **Escolha o Dockerfile apropriado**
2. **Configure no Coolify**
3. **Adicione variáveis de ambiente**
4. **Deploy!**

---

**Dúvidas?** Consulte:
- [DEPLOY_NOW.md](DEPLOY_NOW.md) - Guia rápido
- [DEPLOY_COOLIFY.md](DEPLOY_COOLIFY.md) - Guia completo
- [TROUBLESHOOTING_BUILD.md](TROUBLESHOOTING_BUILD.md) - Solução de problemas
