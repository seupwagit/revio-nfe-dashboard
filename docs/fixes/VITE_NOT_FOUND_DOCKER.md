# 🐛 Erro: vite: not found no Docker Build

## Problema

```
sh: vite: not found
ERROR: process "/bin/sh -c npm run build:prod" did not complete successfully: exit code: 127
```

## Causa

O `npm ci` estava instalando apenas dependências de **produção**, mas o **Vite é uma devDependency**.

Para fazer o build, precisamos das devDependencies (Vite, TypeScript, etc).

## Solução

### Dockerfile.fullstack.optimized

```dockerfile
# ❌ ERRADO (não instala devDependencies)
RUN npm ci

# ✅ CORRETO (instala TODAS as dependências)
RUN npm ci --include=dev
```

## Por que isso acontece?

### package.json

```json
{
  "devDependencies": {
    "vite": "^5.4.21",        // ← Necessário para build
    "typescript": "^5.6.3",   // ← Necessário para build
    "@vitejs/plugin-react": "^4.3.4"
  },
  "dependencies": {
    "react": "^18.3.1",       // ← Necessário em runtime
    "express": "^4.21.2"      // ← Necessário em runtime
  }
}
```

### npm ci

- `npm ci` - Instala dependencies + devDependencies (padrão)
- `npm ci --only=production` - Instala APENAS dependencies
- `npm ci --include=dev` - Instala TODAS (explícito)

## Estrutura Correta do Dockerfile

### Estágio 1: Build (precisa de devDependencies)

```dockerfile
FROM node:20-alpine AS frontend-builder

WORKDIR /app

COPY package*.json ./
COPY tsconfig*.json ./

# Instalar TODAS as dependências (incluindo dev)
RUN npm ci --include=dev

COPY . .

# Build (usa Vite, TypeScript, etc)
RUN npm run build:prod
```

### Estágio 2: Produção (só precisa de dependencies)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Instalar APENAS dependências de produção
RUN npm ci --only=production

# Copiar build do frontend
COPY --from=frontend-builder /app/dist ./dist

# Copiar código do backend
COPY src/server ./src/server
```

## Diferença Entre os Estágios

| Estágio | Dependências | Por quê? |
|---------|--------------|----------|
| Build | ALL (dev + prod) | Precisa de Vite, TypeScript para compilar |
| Produção | APENAS prod | Não precisa de ferramentas de build |

## Correção Aplicada

```dockerfile
# Linha 16 do Dockerfile.fullstack.optimized

# Antes:
RUN npm ci

# Depois:
RUN npm ci --include=dev
```

## Testar Localmente

```bash
# Simular o build do Docker
docker build -f Dockerfile.fullstack.optimized -t test .

# Deve completar sem erros
```

## Verificar no Coolify

Após correção, os logs devem mostrar:

```
✓ 2329 modules transformed.
dist/index.html                   0.61 kB
dist/assets/index-XXX.css        52.32 kB
dist/assets/index-XXX.js      1,117.68 kB
✓ built in 7.09s
```

**NÃO deve mostrar**:
```
sh: vite: not found
```

## Outros Comandos npm ci

```bash
# Instalar tudo (padrão)
npm ci

# Instalar tudo (explícito)
npm ci --include=dev

# Instalar só produção
npm ci --only=production
npm ci --omit=dev

# Instalar só dev
npm ci --only=dev
npm ci --omit=prod
```

## Por que Usar Multi-Stage Build?

```dockerfile
# Estágio 1: Build
# - Instala TODAS as dependências
# - Faz build do frontend
# - Gera dist/
# - Descartado após build

# Estágio 2: Produção
# - Instala APENAS dependências de produção
# - Copia dist/ do estágio 1
# - Imagem final menor
```

**Benefício**: Imagem final não contém Vite, TypeScript, etc (economiza espaço).

## Tamanho da Imagem

### Sem Multi-Stage
```
Image size: ~800MB
Includes: node_modules completo (dev + prod)
```

### Com Multi-Stage
```
Image size: ~400MB
Includes: node_modules apenas prod
```

## Checklist

- [ ] `npm ci --include=dev` no estágio de build
- [ ] `npm ci --only=production` no estágio de produção
- [ ] Build local funciona
- [ ] Commit e push
- [ ] Deploy no Coolify
- [ ] Logs mostram build bem-sucedido
- [ ] Sem erro "vite: not found"

## Comandos

```bash
# 1. Verificar correção
cat Dockerfile.fullstack.optimized | grep "npm ci"

# Deve mostrar:
# RUN npm ci --include=dev

# 2. Commit
git add Dockerfile.fullstack.optimized
git commit -m "fix: instalar devDependencies para build do Vite"
git push

# 3. Deploy no Coolify
```

## Resumo

**Problema**: Vite não encontrado no build
**Causa**: `npm ci` não instalava devDependencies
**Solução**: `npm ci --include=dev` no estágio de build
**Resultado**: Build funciona corretamente

---

**Status**: ✅ Corrigido
**Próximo passo**: Commit, push e redeploy no Coolify
