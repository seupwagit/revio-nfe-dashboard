# 🔧 Troubleshooting - Erros de Build

## ❌ Erro: TypeScript Compilation Failed

### Sintomas
```
error TS2339: Property 'VITE_XXX' does not exist on type 'ImportMetaEnv'
error TS7016: Could not find a declaration file for module 'react-dom/client'
error TS2307: Cannot find module 'vitest' or its corresponding type declarations
```

### Causa
1. Variáveis de ambiente não declaradas em `src/vite-env.d.ts`
2. DevDependencies não instaladas durante build
3. Arquivos de teste incluídos na compilação

### Solução Aplicada

#### 1. Atualizado `src/vite-env.d.ts`
Adicionadas todas as variáveis de ambiente:
```typescript
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_API_BEARER_TOKEN: string
  // ... todas as outras variáveis
  readonly VITE_API_GOOGLE_GEMINI: string
  readonly VITE_MONGODB_CONNECTION_STRING: string
  readonly VITE_CACHE_DURATION_MINUTES: string
  // etc.
}
```

#### 2. Criado `tsconfig.prod.json`
Configuração específica para produção que exclui testes:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "skipLibCheck": true,
    "noEmit": true
  },
  "exclude": [
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.spec.ts",
    "**/*.spec.tsx",
    "tests"
  ]
}
```

#### 3. Adicionado script `build:prod`
```json
{
  "scripts": {
    "build:prod": "tsc --project tsconfig.prod.json && vite build"
  }
}
```

#### 4. Atualizado `Dockerfile.fullstack`
```dockerfile
# Instalar TODAS as dependências (incluindo devDependencies)
RUN npm ci

# Build usando tsconfig.prod.json
RUN npm run build:prod
```

### Verificação Local

Antes de fazer deploy, teste localmente:

```bash
# 1. Limpar node_modules
rm -rf node_modules

# 2. Instalar dependências
npm ci

# 3. Testar build de produção
npm run build:prod

# 4. Se passar, testar Docker
npm run docker:build
```

---

## ❌ Erro: Module Not Found

### Sintomas
```
error TS2307: Cannot find module 'vitest'
error TS2307: Cannot find module 'fast-check'
```

### Causa
DevDependencies não instaladas durante build.

### Solução
No `Dockerfile.fullstack`, usar `npm ci` (sem `--only=production`) no estágio de build:

```dockerfile
# Estágio de Build
RUN npm ci  # ← Instala TODAS as dependências

# Estágio de Produção
RUN npm ci --only=production  # ← Apenas produção
```

---

## ❌ Erro: Property Does Not Exist

### Sintomas
```
error TS2339: Property 'VITE_XXX' does not exist on type 'ImportMetaEnv'
```

### Causa
Variável de ambiente usada no código mas não declarada em `src/vite-env.d.ts`.

### Solução
Adicionar a variável em `src/vite-env.d.ts`:

```typescript
interface ImportMetaEnv {
  // ... outras variáveis
  readonly VITE_NOVA_VARIAVEL: string  // ← Adicione aqui
}
```

---

## ❌ Erro: Build Timeout

### Sintomas
```
Build timeout after 10 minutes
```

### Causa
Build muito lento ou travado.

### Solução

#### 1. Otimizar Dockerfile
```dockerfile
# Cache de dependências
COPY package*.json ./
RUN npm ci
# Depois copiar código
COPY . .
```

#### 2. Usar .dockerignore
```
node_modules
dist
.git
tests
coverage
```

#### 3. Aumentar timeout no Coolify
Settings → Build → Timeout → 20 minutes

---

## ❌ Erro: Out of Memory

### Sintomas
```
FATAL ERROR: Reached heap limit Allocation failed
```

### Causa
Build consome muita memória.

### Solução

#### 1. Aumentar memória no Dockerfile
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build:prod
```

#### 2. Aumentar recursos no Coolify
Settings → Resources → Memory → 2GB

---

## ❌ Erro: Permission Denied

### Sintomas
```
EACCES: permission denied
```

### Causa
Permissões incorretas no container.

### Solução
```dockerfile
# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001
USER nodejs
```

---

## 🔍 Debug de Build

### Ver logs detalhados
```bash
# Local
npm run build:prod -- --debug

# Docker
docker build -f Dockerfile.fullstack --progress=plain .
```

### Testar estágios individualmente
```bash
# Apenas estágio de build
docker build -f Dockerfile.fullstack --target frontend-builder -t test-build .

# Entrar no container
docker run -it test-build sh
```

### Verificar variáveis de ambiente
```bash
# No container
docker exec container_name env | grep VITE
```

---

## ✅ Checklist de Build

Antes de fazer deploy:

- [ ] `npm run build:prod` funciona localmente
- [ ] `npm run docker:build` funciona
- [ ] Todas as variáveis em `vite-env.d.ts`
- [ ] `tsconfig.prod.json` exclui testes
- [ ] `.dockerignore` configurado
- [ ] DevDependencies instaladas no build
- [ ] Memória suficiente alocada

---

## 📚 Recursos

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Build Guide](https://vitejs.dev/guide/build.html)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

## 🆘 Ainda com problemas?

1. Verifique logs completos no Coolify
2. Teste build localmente primeiro
3. Compare com `Dockerfile.fullstack` de referência
4. Verifique se todas as dependências estão em `package.json`
