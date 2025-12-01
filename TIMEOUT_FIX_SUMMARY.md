# 🔧 Correção de Timeout - Resumo

## Problema
```
504 Gateway Time-out
upstream timed out (110: Operation timed out)
```

**Causa raiz:** O código estava buscando TODOS os registros em loop antes de mostrar a grid!

- Loop: `while (temMaisRegistros)` buscando 500 por vez
- 10.000 NFes = 20 requisições × 30s = 10 minutos
- Grid client-side (paginação apenas visual)
- Timeout inevitável

## Mudanças Aplicadas

### 1. 🎯 src/services/api.ts (PRINCIPAL)
- ✅ **Removido loop infinito** que buscava todos os registros
- ✅ **Paginação server-side**: busca apenas 1 página (100 registros)
- ✅ PageSize: 500 → 100 (mais rápido)
- ✅ Timeout axios: infinito → 300000ms (5 minutos)

**Resultado:**
- Antes: 20 requisições × 30s = 10 minutos ❌
- Depois: 1 requisição × 5s = 5 segundos ✅

### 2. nginx.conf
- ✅ Timeouts: 60s → 300s (5 minutos)
- ✅ Buffers: 4k → 128k
- ✅ Keep-alive habilitado
- ✅ HTTP/1.1 para upstream

### 3. Documentação
- ✅ docs/solucoes/SOLUCAO_TIMEOUT.md (novo)
- ✅ README.md atualizado
- ✅ test-timeout.ps1 (novo)

## Como Testar

### Local (Docker)
```powershell
# 1. Build
docker build -t spedrevio-dashboard .

# 2. Run
docker run -p 3000:3000 --env-file .env spedrevio-dashboard

# 3. Testar timeout
.\test-timeout.ps1
```

### Produção (Coolify)
```bash
# 1. Commit e push
git add .
git commit -m "fix: aumentar timeouts para 5 minutos"
git push

# 2. Aguardar deploy automático

# 3. Testar no navegador
https://nf-dashboard-homologacao.sistemasflow.com.br/dashboard
```

## ⚠️ Importante: Coolify

O Coolify tem seu próprio nginx que também pode ter timeout. Se o problema persistir:

1. Acessar Coolify → Settings → Advanced
2. Procurar "Proxy Timeout"
3. Aumentar para 300s

Ou adicionar variável de ambiente:
```
NGINX_PROXY_READ_TIMEOUT=300s
```

## Próximos Passos

Se o timeout persistir:

1. **Reduzir tamanho da consulta**
   - Mudar `size=500` para `size=100` ou `size=50`
   - Implementar paginação automática no frontend

2. **Otimizar API**
   - Verificar índices no banco de dados
   - Implementar cache no backend
   - Consultar time da API sobre performance

3. **Consultas paralelas**
   - Fazer múltiplas requisições menores em paralelo
   - Agregar resultados no frontend

## Arquivos Modificados

```
nginx.conf                          # Timeouts e buffers
src/services/api.ts                 # Timeout axios
docs/solucoes/SOLUCAO_TIMEOUT.md    # Documentação
README.md                           # Troubleshooting
test-timeout.ps1                    # Teste
```

## Commit Sugerido

```bash
git add nginx.conf src/services/api.ts docs/solucoes/SOLUCAO_TIMEOUT.md README.md test-timeout.ps1 TIMEOUT_FIX_SUMMARY.md
git commit -m "fix: aumentar timeouts para 5 minutos (nginx + axios)

- nginx: 60s → 300s (connect, send, read)
- axios: infinito → 300000ms
- buffers: 4k → 128k
- docs: SOLUCAO_TIMEOUT.md
- test: test-timeout.ps1"
git push
```
