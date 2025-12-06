# Correção de Validação de Resposta da API

## Problema
No Coolify, o frontend estava apresentando erro:
```
Cannot destructure property 'totalPages' of '_.pagination' as it is undefined
```

## Causa Raiz
Quando o backend retornava um erro (status 500), a resposta tinha formato:
```json
{
  "success": false,
  "error": "mensagem de erro",
  "errorType": "MongoNetworkError",
  "errorCode": "ECONNREFUSED"
}
```

Mas o frontend esperava sempre ter a propriedade `pagination`:
```typescript
const { totalPages } = response.pagination  // ❌ Erro se pagination não existe
```

## Solução Implementada

### 1. Validação de Resposta no Frontend
**Arquivo:** `src/contexts/NFContext.tsx`

Adicionada validação antes de acessar `pagination`:
```typescript
// Validar resposta da API
if (!response) {
  throw new Error('Resposta vazia da API')
}

// Verificar se houve erro no backend
if (response.success === false) {
  const errorMsg = (response as any).error || 'Erro desconhecido no servidor'
  console.error('❌ Erro retornado pelo backend:', errorMsg)
  throw new Error(errorMsg)
}

if (!response.data) {
  throw new Error('Resposta inválida da API: dados não encontrados')
}

if (!response.pagination) {
  console.error('❌ Resposta da API sem paginação:', response)
  throw new Error('Resposta inválida da API: paginação não encontrada')
}

const dados = response.data
const { totalPages } = response.pagination
```

### 2. Interceptor de Erros HTTP
**Arquivo:** `src/services/mongoApi.ts`

Adicionado interceptor no axios para capturar erros HTTP:
```typescript
// Interceptor para tratar erros HTTP
this.client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Erro HTTP na API MongoDB:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })
    
    // Se o backend retornou um erro estruturado, propagar
    if (error.response?.data) {
      throw new Error(error.response.data.error || error.response.data.message || error.message)
    }
    
    throw error
  }
)
```

### 3. Endpoint de Debug
**Arquivo:** `src/server/index.ts`

Adicionado endpoint para verificar variáveis de ambiente:
```typescript
app.get('/api/debug/env', (_req, res) => {
  res.json({
    VITE_DB_HOST: process.env.VITE_DB_HOST || 'NÃO DEFINIDO',
    VITE_DB_DATABASE: process.env.VITE_DB_DATABASE || 'NÃO DEFINIDO',
    VITE_MONGODB_CONNECTION_STRING: process.env.VITE_MONGODB_CONNECTION_STRING ? 'DEFINIDO' : 'NÃO DEFINIDO',
    BACKOFFICE_PORT: process.env.BACKOFFICE_PORT || '3000',
    NODE_ENV: process.env.NODE_ENV || 'development'
  })
})
```

## Como Diagnosticar no Coolify

### 1. Verificar Variáveis de Ambiente
```bash
curl https://seu-dominio.com/api/debug/env
```

### 2. Verificar Health Check
```bash
curl https://seu-dominio.com/api/health
```

### 3. Verificar Logs do Container
No Coolify, acessar "Logs" do serviço e procurar por:
- `❌ ERRO CRÍTICO: Falha ao conectar MongoDB`
- `🔌 Erro de Conectividade MongoDB`
- `🔐 Erro de Autenticação MongoDB`

## Possíveis Causas do Erro no Coolify

### 1. MongoDB não acessível
```
🔌 Erro de Conectividade MongoDB:
   - MongoDB pode estar offline
   - Verifique se o host está acessível
```

**Solução:**
- Verificar se o serviço MongoDB está rodando
- Verificar se o host/IP está correto nas variáveis de ambiente
- Verificar regras de firewall e rede

### 2. Credenciais inválidas
```
🔐 Erro de Autenticação MongoDB:
   - Credenciais inválidas
   - Verifique usuário e senha no .env
```

**Solução:**
- Verificar `VITE_MONGODB_CONNECTION_STRING` no Coolify
- Verificar usuário e senha do MongoDB
- Verificar `authSource` na connection string

### 3. Variáveis de ambiente não configuradas
```
❌ ERRO CRÍTICO: VITE_MONGODB_CONNECTION_STRING não configurado
```

**Solução:**
- Adicionar variáveis de ambiente no Coolify:
  - `VITE_MONGODB_CONNECTION_STRING`
  - `VITE_DB_HOST`
  - `VITE_DB_DATABASE`

## Checklist de Deploy no Coolify

- [ ] Variáveis de ambiente configuradas
- [ ] MongoDB acessível do container
- [ ] Health check retorna status 200
- [ ] Endpoint `/api/debug/env` mostra variáveis corretas
- [ ] Logs não mostram erros de conexão
- [ ] Frontend consegue carregar dados

## Resultado

✅ Frontend agora valida resposta da API antes de acessar propriedades
✅ Erros do backend são capturados e exibidos corretamente
✅ Logs detalhados ajudam a diagnosticar problemas
✅ Endpoint de debug facilita troubleshooting no Coolify
