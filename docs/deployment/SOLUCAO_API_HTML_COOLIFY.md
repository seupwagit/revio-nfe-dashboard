# 🔧 Solução: API Retorna HTML no Coolify

## Problema

Mesmo após deploy, `/api/documents` retorna HTML em vez de JSON.

## Possíveis Causas

### 1. Coolify Usando Proxy Reverso Próprio

O Coolify tem seu próprio proxy reverso (Traefik ou Nginx) que pode estar interferindo.

### 2. Cache do Coolify/CDN

O Coolify ou CDN pode estar cacheando a resposta antiga.

### 3. Build Não Completou

O build pode não ter completado corretamente.

## Soluções

### Solução 1: Desabilitar Nginx Customizado

Se você configurou um nginx.conf customizado no Coolify, **remova-o** temporariamente.

O Coolify deve gerenciar o proxy automaticamente.

**Como fazer:**
1. Coolify → Seu Serviço → Settings
2. Procure por "Custom Nginx" ou "Proxy"
3. Remova configuração customizada
4. Redeploy

### Solução 2: Verificar Logs do Container

```bash
# No Coolify, vá para Logs e procure por:
[API] 📥 GET /api/documents

# Se NÃO aparecer, o request não está chegando no container
# Se aparecer, o container está respondendo corretamente
```

### Solução 3: Testar Diretamente no Container

```bash
# SSH no servidor do Coolify
ssh user@servidor

# Encontrar container
docker ps | grep nf-dashboard

# Testar dentro do container
docker exec -it <container-id> curl http://localhost:3000/api/health

# Deve retornar JSON
```

Se retornar JSON dentro do container, o problema é no proxy do Coolify.

### Solução 4: Configurar Port Mapping Correto

No Coolify:

1. **Port Mapping**: `3000:3000` (não `80:3000`)
2. **Public Port**: Deixe o Coolify gerenciar
3. **Proxy**: Habilitado

### Solução 5: Adicionar Header de Content-Type

Vou adicionar headers explícitos nas rotas da API:

<function_calls>
<invoke name="strReplace">
<parameter name="oldStr">// Endpoint de debug de variáveis de ambiente
app.get('/api/debug/env', (_req, res) => {
  res.json({