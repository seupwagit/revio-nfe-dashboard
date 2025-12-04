# 🔧 CORREÇÃO URGENTE: Cache do Docker

## ❌ Erro Atual

```
sh: vite: not found
exit code: 127
```

## 🎯 Causa

Docker está usando cache antigo onde devDependencies não foram instaladas.

## ✅ Solução Rápida (2 passos)

### 1. Limpar Cache no Coolify

1. Acesse seu projeto no Coolify
2. **Settings** → **Build** → **"Clear Build Cache"**
3. Clique em **"Redeploy"**

### 2. Commit Correção do Dockerfile

```bash
git add Dockerfile
git commit -m "fix: forçar instalação de devDependencies com --include=dev"
git push origin main
```

## 📊 O que mudou no Dockerfile

```dockerfile
# ANTES
RUN npm ci

# DEPOIS  
RUN npm ci --include=dev
```

Isso garante que Vite e outras devDependencies sejam instaladas.

## ✅ Verificação

Após limpar cache e redeploy, o build deve mostrar:

```
✓ Step 5/8: RUN npm ci --include=dev
  added 370 packages in 28s
✓ Step 7/8: RUN npm run build:prod
  ✓ 2329 modules transformed
  ✓ built in ~7s
✓ Build completed successfully!
```

## 🚨 IMPORTANTE

**SEMPRE limpe o cache do Docker no Coolify quando:**
- Mudar comandos RUN no Dockerfile
- Adicionar/remover dependências
- Build falhar com "command not found"

---

**Ação necessária:** Limpar cache no Coolify AGORA e redeploy! 🚀
