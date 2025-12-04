# 🔧 Correção: Docker Cache Corrompido

## ❌ Problema

```
sh: vite: not found
exit code: 127
```

## 🔍 Causa

O Docker está usando cache de uma build anterior onde `npm ci` foi executado com `--only=production`, que não instala devDependencies (incluindo Vite).

## ✅ Solução

### Opção 1: Limpar Cache no Coolify (Recomendado)

1. Acesse seu projeto no Coolify
2. Vá em **Settings** → **Build**
3. Clique em **"Clear Build Cache"**
4. Clique em **"Redeploy"**

### Opção 2: Forçar Reinstalação no Dockerfile

Atualizado `Dockerfile` para forçar instalação completa:

```dockerfile
# ANTES
RUN npm ci

# DEPOIS
RUN npm ci --include=dev
```

Isso garante que devDependencies sejam instaladas mesmo com cache.

### Opção 3: Rebuild sem Cache (Manual)

Se tiver acesso SSH ao servidor Coolify:

```bash
# Limpar cache do Docker
docker builder prune -af

# Rebuild sem cache
docker build --no-cache -f Dockerfile -t app:latest .
```

## 📊 Verificação

Após limpar o cache, o build deve mostrar:

```
#5 [builder 5/7] RUN npm ci --include=dev
#5 28.32 added 370 packages, and audited 371 packages in 28s
#5 28.33 118 packages are looking for funding
```

Note que **370 packages** são instalados (não apenas ~50 de produção).

## 🎯 Por que isso acontece?

O Docker usa cache de layers para acelerar builds. Quando mudamos o comando `RUN npm ci`, mas o `package.json` não mudou, o Docker pode reusar o cache antigo.

**Linha do tempo:**
1. Build 1: `RUN npm ci --only=production` (cache criado)
2. Mudamos para: `RUN npm ci` 
3. Build 2: Docker vê que `package.json` não mudou
4. Docker reusa cache do Build 1 ❌
5. Vite não está instalado → erro

**Solução:**
- Limpar cache força reinstalação completa
- `--include=dev` é mais explícito e evita ambiguidade

## 🔗 Comandos Úteis

### Verificar dependências instaladas
```bash
# No container
docker exec container_name npm list --depth=0

# Deve mostrar vite, typescript, etc.
```

### Verificar tamanho do cache
```bash
docker system df
```

### Limpar todo cache Docker
```bash
docker system prune -a --volumes
```

## ✅ Checklist

Após aplicar a correção:

- [ ] Cache do Docker limpo no Coolify
- [ ] Dockerfile atualizado com `--include=dev`
- [ ] Commit e push das mudanças
- [ ] Redeploy no Coolify
- [ ] Build mostra 370+ packages instalados
- [ ] Vite encontrado e build completa
- [ ] Aplicação funcionando

## 📚 Referências

- [Docker Build Cache](https://docs.docker.com/build/cache/)
- [npm ci documentation](https://docs.npmjs.com/cli/v10/commands/npm-ci)
- [Coolify Build Settings](https://coolify.io/docs)

---

**Status:** ✅ Correção aplicada
**Próximo passo:** Limpar cache no Coolify e redeploy
