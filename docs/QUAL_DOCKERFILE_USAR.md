# 📦 Qual Dockerfile Usar?

## Você tem 3 Dockerfiles

### 1️⃣ `Dockerfile`
**Frontend apenas** (sem backend)
- ❌ Não use para fullstack
- ✅ Use se backend estiver separado

### 2️⃣ `Dockerfile.fullstack`
**Fullstack com script**
- ⚠️ Mais complexo
- ⚠️ Usa script intermediário
- ⚠️ Mais lento

### 3️⃣ `Dockerfile.fullstack.optimized` ⭐
**Fullstack otimizado**
- ✅ **RECOMENDADO**
- ✅ Mais simples
- ✅ Mais rápido
- ✅ Direto ao ponto

## Qual Está no Coolify?

### Verificar
1. Coolify → Seu Serviço
2. Settings → Build
3. Ver **"Dockerfile Path"**

### Mudar para o Recomendado
1. **Dockerfile Path**: `Dockerfile.fullstack.optimized`
2. Save
3. Redeploy

## Comparação Rápida

| | Dockerfile | fullstack | fullstack.optimized |
|---|:---:|:---:|:---:|
| Frontend | ✅ | ✅ | ✅ |
| Backend | ❌ | ✅ | ✅ |
| Complexidade | Baixa | Alta | Média |
| Velocidade | Rápida | Lenta | Rápida |
| **Recomendado** | ❌ | ⚠️ | ✅ |

## Configuração no Coolify

```
Dockerfile: Dockerfile.fullstack.optimized
Port: 3000
```

**Variáveis**:
```bash
VITE_API_BASE_URL=https://seu-dominio.com
VITE_MONGODB_PROXY_PORT=
SERVE_FRONTEND=true
```

## Resumo

⭐ **Use**: `Dockerfile.fullstack.optimized`

É o mais simples, rápido e adequado para o Coolify.

---

**Documentação completa**: [docs/deployment/DOCKERFILES_COMPARACAO.md](docs/deployment/DOCKERFILES_COMPARACAO.md)
