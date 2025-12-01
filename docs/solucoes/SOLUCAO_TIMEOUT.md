# Solução: Timeout na API

## Problema

```
upstream timed out (110: Operation timed out) while connecting to upstream
```

A API externa (`177.234.150.32:443`) estava demorando mais de 60 segundos para responder, causando timeout no nginx.

## Causa

- Consultas grandes (500 registros de NFe)
- API externa lenta
- Timeout padrão do nginx muito baixo (60s)

## Solução Aplicada

### 1. Aumentar Timeouts no nginx.conf

```nginx
# Timeouts aumentados para APIs lentas
proxy_connect_timeout 180s;  # 3 minutos para conectar
proxy_send_timeout 180s;     # 3 minutos para enviar request
proxy_read_timeout 180s;     # 3 minutos para ler resposta
```

### 2. Configurar Buffers

```nginx
# Buffers para respostas grandes
proxy_buffering on;
proxy_buffer_size 4k;
proxy_buffers 8 4k;
proxy_busy_buffers_size 8k;
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

## Alternativas Futuras

Se o problema persistir:

1. **Paginação menor**: Reduzir `size=500` para `size=100`
2. **Timeouts maiores**: Aumentar para 300s (5 minutos)
3. **Cache**: Implementar cache de respostas lentas
4. **Otimização da API**: Trabalhar com o time da API para melhorar performance

## Monitoramento

Verificar logs do nginx:
```bash
# No Coolify, acessar logs do container
docker logs <container-id> 2>&1 | grep "upstream timed out"
```
