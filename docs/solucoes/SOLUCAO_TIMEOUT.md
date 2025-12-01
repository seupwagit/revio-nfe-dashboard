# Solução: Timeout na API

## Problema

```
upstream timed out (110: Operation timed out) while connecting to upstream
```

A API externa (`177.234.150.32:443`) estava demorando mais de 60 segundos para responder, causando timeout no nginx.

## Causa Raiz

**O código estava buscando TODOS os registros antes de mostrar a grid!**

```typescript
// ❌ ANTES: Loop infinito buscando tudo
while (temMaisRegistros) {
  // Busca 500 registros
  // Se tem 10.000 NFes = 20 requisições sequenciais!
  // Timeout garantido
}
```

Problemas:
- Loop buscando 500 registros por vez até acabar
- Se tem 10.000 NFes = 20 requisições de 500 cada
- Cada requisição demora ~30s = 10 minutos total
- Grid client-side (paginação apenas visual)
- Timeout inevitável

## Solução Aplicada

### 1. ✅ PAGINAÇÃO SERVER-SIDE (Principal)

```typescript
// ✅ DEPOIS: Busca apenas 1 página
export async function fetchNotasFiscais(filtros: Filtros) {
  const pageSize = 100  // Reduzido de 500 para 100
  const page = 1        // Apenas primeira página
  
  // 1 requisição rápida (~5s)
  const response = await api.get('/WebView/Consultar', { 
    params: { pg: page, size: pageSize, ... }
  })
  
  return response.data // 100 registros
}
```

**Resultado:**
- Antes: 20 requisições × 30s = 10 minutos ❌
- Depois: 1 requisição × 5s = 5 segundos ✅

### 2. Aumentar Timeouts no nginx.conf (5 minutos)

```nginx
# Timeouts aumentados para APIs lentas
proxy_connect_timeout 300s;  # 5 minutos para conectar
proxy_send_timeout 300s;     # 5 minutos para enviar request
proxy_read_timeout 300s;     # 5 minutos para ler resposta
```

### 3. Configurar Buffers Maiores

```nginx
# Buffers para respostas grandes (128k)
proxy_buffering on;
proxy_buffer_size 128k;
proxy_buffers 8 128k;
proxy_busy_buffers_size 256k;
proxy_max_temp_file_size 0;

# Keep-alive para conexões upstream
proxy_http_version 1.1;
proxy_set_header Connection "";
```

### 4. Timeout no Frontend (axios)

```typescript
const api = axios.create({
  baseURL: env.api.baseUrl,
  timeout: 300000, // 5 minutos (300000ms)
  headers: { ... }
})
```

## Como Aplicar

1. Commit das alterações:
```bash
git add nginx.conf
git commit -m "fix: aumentar timeouts do nginx para 180s"
git push
```

2. Rebuild no Coolify (automático via webhook)

## Verificação

Após o deploy, testar a consulta que estava falhando:
```
GET /api/WebView/Consultar?host=10.0.0.8&collection=tbl_nfe_100&database=...&pg=1&size=500&dtIni=2025-11-01&dtFin=2025-12-01
```

## ⚠️ Importante: Coolify Nginx

O Coolify tem seu próprio nginx na frente que também pode ter timeout. Se o problema persistir:

1. **Acessar configurações do Coolify**:
   - Ir em Settings → Advanced
   - Procurar por "Proxy Timeout" ou similar
   - Aumentar para 300s (5 minutos)

2. **Ou adicionar variável de ambiente no Coolify**:
   ```
   NGINX_PROXY_READ_TIMEOUT=300s
   ```

## Próximos Passos (Futuro)

Para implementar paginação completa server-side:

1. **Adicionar controles de paginação**
   ```typescript
   // Passar página como parâmetro
   fetchNotasFiscais(filtros, page = 1)
   ```

2. **Buscar total de registros**
   ```typescript
   // Usar endpoint /Contador para saber quantas páginas existem
   const total = await fetchContador(filtros)
   const totalPages = Math.ceil(total / pageSize)
   ```

3. **Atualizar GridAvancada**
   - Remover `getPaginationRowModel()` (client-side)
   - Adicionar botões "Próxima/Anterior"
   - Fazer nova requisição ao mudar de página

4. **Loading state**
   - Mostrar spinner ao trocar de página
   - Desabilitar botões durante carregamento

## Monitoramento

Verificar logs do nginx:
```bash
# No Coolify, acessar logs do container
docker logs <container-id> 2>&1 | grep "upstream timed out"
```
