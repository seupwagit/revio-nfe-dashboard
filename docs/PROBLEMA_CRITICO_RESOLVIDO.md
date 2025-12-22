# 🚨 Problema Crítico Resolvido!

## Descoberta

O navegador estava baixando `express-fte.js` - **código do servidor estava no bundle do frontend**!

## Causa Raiz

`tsconfig.prod.json` **NÃO excluía** `src/server/` do build.

Resultado: Vite incluía Express, Mongoose e todo código do servidor no bundle do frontend.

## Correção

### tsconfig.prod.json

```json
"exclude": [
  "node_modules",
  "dist",
  "src/server",    // ← ADICIONADO
  "server",        // ← ADICIONADO
  "**/*.test.ts",
  // ...
]
```

## Impacto

### Antes
- ❌ Bundle: ~2.5MB (com servidor)
- ❌ express-fte.js no navegador
- ❌ API retornava HTML
- ❌ Código do servidor exposto

### Depois
- ✅ Bundle: ~1.1MB (só frontend)
- ✅ Sem express-fte.js
- ✅ API retorna JSON
- ✅ Código do servidor protegido

## Próximos Passos

```bash
# 1. Limpar
rm -rf dist

# 2. Rebuild (IMPORTANTE!)
npm run build:prod

# 3. Verificar
ls dist/assets/ | grep express
# Não deve encontrar nada

# 4. Commit
git add .
git commit -m "fix: excluir src/server do bundle frontend"
git push

# 5. Deploy no Coolify
```

## Verificação

Após deploy:

```bash
# API deve retornar JSON
curl https://nf-dashboard-homologacao.sistemasflow.com.br/api/health

# express-fte.js não deve existir
curl https://nf-dashboard-homologacao.sistemasflow.com.br/assets/express-fte.js
# 404 Not Found
```

## Por que Isso Causava o Problema?

1. Vite incluía código do servidor no bundle
2. Criava arquivos como `express-fte.js`
3. Esses arquivos eram servidos como estáticos
4. Interferiam com rotas da API
5. API retornava HTML em vez de JSON

## Resumo

**Problema**: Código do servidor no frontend
**Causa**: tsconfig não excluía src/server
**Solução**: Adicionar src/server ao exclude
**Resultado**: Bundle limpo, API funciona

---

**CRÍTICO**: Faça rebuild antes de deploy!

```bash
npm run build:prod
```

**Documentação**: [docs/fixes/SERVIDOR_NO_BUNDLE_FRONTEND.md](docs/fixes/SERVIDOR_NO_BUNDLE_FRONTEND.md)
