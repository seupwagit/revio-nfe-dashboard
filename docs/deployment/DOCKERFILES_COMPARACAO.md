# 📦 Comparação dos Dockerfiles

## Dockerfiles Disponíveis

Você tem **3 Dockerfiles** no projeto:

### 1. `Dockerfile` (Frontend Apenas)
**Uso**: Deploy apenas do frontend (sem backend integrado)

**Características**:
- ✅ Build do frontend com Vite
- ✅ Serve com `serve` (servidor estático)
- ❌ Sem backend Node.js
- ❌ Sem MongoDB
- ❌ Sem rotas de API

**Quando usar**:
- Frontend e backend separados
- Backend em outro serviço/container

**Porta**: 3000 (apenas frontend estático)

---

### 2. `Dockerfile.fullstack` (Fullstack Completo)
**Uso**: Frontend + Backend juntos (versão completa)

**Características**:
- ✅ Build do frontend
- ✅ Backend Node.js com Express
- ✅ MongoDB via Mongoose
- ✅ Todas as variáveis de ambiente
- ✅ Script de inicialização (`start-fullstack.sh`)
- ⚠️ Mais complexo

**Quando usar**:
- Deploy fullstack com script de inicialização
- Precisa de logs detalhados do startup

**Porta**: 3000

---

### 3. `Dockerfile.fullstack.optimized` (Fullstack Otimizado) ⭐ **RECOMENDADO**
**Uso**: Frontend + Backend juntos (versão otimizada)

**Características**:
- ✅ Build do frontend
- ✅ Backend Node.js com Express
- ✅ MongoDB via Mongoose
- ✅ Mais simples e direto
- ✅ Sem script intermediário
- ✅ Inicia com `tsx` diretamente
- ✅ Mais rápido

**Quando usar**:
- Deploy fullstack no Coolify (RECOMENDADO)
- Quer simplicidade e performance

**Porta**: 3000

---

## Qual Está Sendo Usado no Coolify?

Para verificar qual Dockerfile o Coolify está usando:

### Opção 1: Ver no Coolify
1. Acesse Coolify
2. Vá para seu serviço
3. Settings → Build
4. Procure por **"Dockerfile Path"** ou **"Dockerfile"**

### Opção 2: Ver no Git
Se o Coolify está configurado para auto-deploy:
- Ele usa o Dockerfile especificado na configuração
- Padrão: `Dockerfile` (se não especificado)

### Opção 3: Ver nos Logs
Nos logs do build do Coolify, procure por:
```
Building with Dockerfile: <nome-do-arquivo>
```

## Recomendação

### ⭐ Use: `Dockerfile.fullstack.optimized`

**Por quê?**
- ✅ Mais simples
- ✅ Mais rápido
- ✅ Menos camadas
- ✅ Inicia direto com tsx
- ✅ Sem scripts intermediários
- ✅ Melhor para Coolify

### Como Configurar no Coolify

1. Acesse Coolify
2. Vá para seu serviço
3. Settings → Build
4. **Dockerfile Path**: `Dockerfile.fullstack.optimized`
5. Save
6. Redeploy

## Comparação Técnica

| Característica | Dockerfile | Dockerfile.fullstack | Dockerfile.fullstack.optimized |
|----------------|------------|---------------------|-------------------------------|
| Frontend | ✅ | ✅ | ✅ |
| Backend | ❌ | ✅ | ✅ |
| MongoDB | ❌ | ✅ | ✅ |
| Script startup | ❌ | ✅ | ❌ |
| Complexidade | Baixa | Alta | Média |
| Tamanho | Pequeno | Grande | Médio |
| Velocidade | Rápido | Lento | Rápido |
| Recomendado | ❌ | ⚠️ | ✅ |

## Diferenças Principais

### Dockerfile vs Dockerfile.fullstack.optimized

```dockerfile
# Dockerfile (Frontend apenas)
CMD ["serve", "-s", "dist", "-l", "3000"]

# Dockerfile.fullstack.optimized (Fullstack)
CMD ["tsx", "src/server/index.ts"]
```

### Dockerfile.fullstack vs Dockerfile.fullstack.optimized

```dockerfile
# Dockerfile.fullstack
COPY start-fullstack.sh /app/start.sh
CMD ["/app/start.sh"]

# Dockerfile.fullstack.optimized (mais direto)
CMD ["tsx", "src/server/index.ts"]
```

## Estrutura de Cada Dockerfile

### Dockerfile (Frontend)
```
1. Build frontend (Vite)
2. Copiar dist/
3. Instalar serve
4. Servir arquivos estáticos
```

### Dockerfile.fullstack
```
1. Build frontend (Vite)
2. Copiar dist/
3. Copiar src/server/
4. Instalar tsx
5. Copiar script start-fullstack.sh
6. Executar script
```

### Dockerfile.fullstack.optimized
```
1. Build frontend (Vite)
2. Copiar dist/
3. Copiar src/server/
4. Instalar tsx
5. Executar tsx diretamente
```

## Variáveis de Ambiente

Todos os Dockerfiles fullstack precisam das mesmas variáveis:

### Build Arguments (Build Time)
```bash
VITE_API_BASE_URL=https://seu-dominio.com
VITE_MONGODB_PROXY_PORT=
VITE_DB_HOST=mongodb-host
VITE_DB_DATABASE=database
VITE_MONGODB_CONNECTION_STRING=mongodb://...
```

### Environment Variables (Runtime)
```bash
SERVE_FRONTEND=true
BACKOFFICE_PORT=3000
NODE_ENV=production
VITE_MONGODB_CONNECTION_STRING=mongodb://...
```

## Como Mudar o Dockerfile no Coolify

### Passo 1: Configurar
1. Coolify → Seu Serviço
2. Settings → Build
3. **Dockerfile Path**: `Dockerfile.fullstack.optimized`
4. Save

### Passo 2: Redeploy
1. Clique em "Deploy" ou "Redeploy"
2. Aguarde build completar
3. Verifique logs

### Passo 3: Verificar
```bash
# Testar API
curl https://seu-dominio.com/api/health

# Testar Frontend
curl https://seu-dominio.com/
```

## Troubleshooting

### Como saber qual Dockerfile foi usado?

Veja os logs do build no Coolify. Procure por:
```
Step 1/X : FROM node:20-alpine AS frontend-builder
```

Se aparecer `frontend-builder`, está usando um dos fullstack.

### Build falha com Dockerfile.fullstack.optimized

**Causa**: Variáveis de ambiente faltando

**Solução**: Adicionar todas as variáveis VITE_* como Build Arguments

### API retorna HTML

**Causa**: Usando `Dockerfile` (frontend apenas)

**Solução**: Mudar para `Dockerfile.fullstack.optimized`

## Recomendação Final

### ✅ Use: `Dockerfile.fullstack.optimized`

**Configuração no Coolify**:
```
Dockerfile Path: Dockerfile.fullstack.optimized
Port: 3000
```

**Variáveis**:
```bash
# Build Arguments
VITE_API_BASE_URL=https://seu-dominio.com
VITE_MONGODB_PROXY_PORT=

# Environment Variables
SERVE_FRONTEND=true
BACKOFFICE_PORT=3000
```

## Resumo

- **3 Dockerfiles** disponíveis
- **Dockerfile.fullstack.optimized** é o recomendado
- Verifique qual está configurado no Coolify
- Mude para o otimizado se necessário
- Redeploy após mudar

---

**Próximo passo**: Verificar qual Dockerfile está configurado no Coolify e mudar para `Dockerfile.fullstack.optimized` se necessário.
