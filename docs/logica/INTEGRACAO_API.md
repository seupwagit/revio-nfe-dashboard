# 🔌 Integração com API Revio

## 📋 Visão Geral

O SpedRevio Dashboard integra-se com a API Revio para buscar documentos fiscais eletrônicos. A comunicação é feita via HTTP REST com autenticação Bearer Token.

## 🌐 Endpoints

### Base URL
```
https://api.revio.digital
```

### Proxy Local
```
http://localhost:3000/api
```

## 🔐 Autenticação

### Bearer Token
```http
Authorization: Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6...
```

**Características:**
- Token JWT (JSON Web Token)
- Expira em 24 horas
- Renovação manual necessária
- Armazenado em `.env`

### Como Gerar Novo Token

Consulte: [COMO_GERAR_NOVO_TOKEN.md](../../COMO_GERAR_NOVO_TOKEN.md)

## 📡 Endpoints Utilizados

### 1. Consultar Documentos

**Endpoint:** `/WebView/Consultar`  
**Método:** `GET`  
**Descrição:** Busca documentos fiscais com filtros

#### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `host` | string | ✅ | IP do servidor do banco |
| `database` | string | ✅ | Nome do banco de dados |
| `collection` | string | ✅ | Nome da collection (tbl_nfe_100, tbl_cfe_100, tbl_cte_100) |
| `dtIni` | string | ✅ | Data início (YYYY-MM-DD) |
| `dtFin` | string | ✅ | Data fim (YYYY-MM-DD) |
| `pg` | number | ✅ | Número da página (inicia em 1) |
| `size` | number | ✅ | Quantidade de registros por página |
| `cnpjEmit` | string | ❌ | CNPJ do emitente (apenas números) |
| `cnpjDest` | string | ❌ | CNPJ do destinatário (apenas números) |

#### Exemplo de Requisição

```typescript
const params = {
  host: '10.0.0.8',
  database: 'C67624577000145',
  collection: 'tbl_nfe_100',
  dtIni: '2025-10-01',
  dtFin: '2025-10-31',
  pg: 1,
  size: 50,
  cnpjEmit: '06239190000857'
}

const response = await axios.get('/WebView/Consultar', { params })
```

#### Resposta

```json
{
  "status": "sucesso",
  "lista": [
    {
      "_id": "20642ef6ff478392c18ee47c1f62cce0",
      "CHV_NFE": "35251106239190000857550000044025071115620267",
      "CNPJ_EMIT": "06239190000857",
      "NOME_EMIT": "INFOCO DISTRIBUIDORA E LOGISTICA LTDA",
      "IE": "206402895113",
      "IND_OPER": "1",
      "DT_DOC": "2025-11-27T21:52:09Z",
      "VL_DOC": 6849.11,
      "PROTOCOLADA": "Não",
      "TIPO": "Recebida",
      "ORIGEM": "Robô do Download Sefaz",
      "STATUS_MANIFESTACAO": ""
    }
  ]
}
```

### 2. Contador de Documentos

**Endpoint:** `/WebView/ContadorConsulta`  
**Método:** `GET`  
**Descrição:** Retorna o total de documentos que atendem aos filtros

#### Parâmetros

Mesmos parâmetros do endpoint `/WebView/Consultar`, exceto `pg` e `size`.

#### Exemplo de Requisição

```typescript
const params = {
  host: '10.0.0.8',
  database: 'C67624577000145',
  collection: 'tbl_nfe_100',
  dtIni: '2025-10-01',
  dtFin: '2025-10-31'
}

const response = await axios.get('/WebView/ContadorConsulta', { params })
```

#### Resposta

```json
{
  "total": 152
}
```

## 🔄 Fluxo de Requisição

```
┌──────────────┐
│   Frontend   │
│  (React App) │
└──────┬───────┘
       │ 1. Requisição
       ▼
┌──────────────────┐
│   Axios Client   │
│  (src/services/  │
│     api.ts)      │
└──────┬───────────┘
       │ 2. HTTP Request
       ▼
┌──────────────────┐
│  Proxy Node.js   │
│ (proxy-server.   │
│     cjs)         │
└──────┬───────────┘
       │ 3. Forward + Auth
       ▼
┌──────────────────┐
│    API Revio     │
│ (api.revio.      │
│   digital)       │
└──────┬───────────┘
       │ 4. Response
       ▼
┌──────────────────┐
│   Mapeamento     │
│   de Dados       │
└──────┬───────────┘
       │ 5. Dados Formatados
       ▼
┌──────────────────┐
│   Grid/UI        │
└──────────────────┘
```

## 🛡️ Tratamento de Erros

### Códigos de Status HTTP

| Código | Significado | Ação |
|--------|-------------|------|
| 200 | Sucesso | Processar dados |
| 401 | Não autorizado | Token inválido/expirado |
| 403 | Proibido | Sem permissão |
| 404 | Não encontrado | Endpoint incorreto |
| 500 | Erro do servidor | Tentar novamente |

### Exemplo de Tratamento

```typescript
try {
  const response = await api.get('/WebView/Consultar', { params })
  return response.data.lista
} catch (error) {
  if (error.response?.status === 401) {
    console.error('Token expirado. Gere um novo token.')
  } else if (error.response?.status === 500) {
    console.error('Erro no servidor. Tente novamente.')
  }
  return []
}
```

## 🔍 Interceptors

### Request Interceptor

```typescript
api.interceptors.request.use(
  (config) => {
    console.log('🚀 REQUISIÇÃO API')
    console.log('URL:', config.url)
    console.log('Params:', config.params)
    return config
  },
  (error) => {
    console.error('❌ Erro na requisição:', error)
    return Promise.reject(error)
  }
)
```

### Response Interceptor

```typescript
api.interceptors.response.use(
  (response) => {
    console.log('✅ RESPOSTA API')
    console.log('Status:', response.status)
    console.log('Data:', response.data)
    return response
  },
  (error) => {
    console.error('❌ ERRO NA RESPOSTA')
    console.error('Status:', error.response?.status)
    console.error('Data:', error.response?.data)
    return Promise.reject(error)
  }
)
```

## 🚫 CORS e Proxy

### Problema de CORS

A API Revio não permite requisições diretas do browser devido a políticas de CORS.

### Solução: Proxy Node.js

Criamos um servidor proxy local que:
1. Recebe requisições do frontend
2. Adiciona headers de autenticação
3. Encaminha para a API Revio
4. Retorna a resposta ao frontend

**Arquivo:** `proxy-server.cjs`

```javascript
const express = require('express')
const axios = require('axios')
const cors = require('cors')

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api', async (req, res) => {
  try {
    const response = await axios({
      method: req.method,
      url: `https://api.revio.digital${req.url}`,
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      },
      params: req.query
    })
    res.json(response.data)
  } catch (error) {
    res.status(error.response?.status || 500)
       .json(error.response?.data || { error: 'Erro no proxy' })
  }
})

app.listen(3000, () => {
  console.log('🔄 Proxy rodando na porta 3000')
})
```

### Iniciar Proxy

```bash
node proxy-server.cjs
```

## 📊 Rate Limiting

### Limites da API

- **Requisições por minuto:** 60
- **Requisições por hora:** 1000
- **Tamanho máximo de resposta:** 10MB

### Boas Práticas

1. ✅ Cachear resultados quando possível
2. ✅ Usar paginação adequada
3. ✅ Evitar requisições desnecessárias
4. ✅ Implementar debounce em filtros

## 🧪 Testando a API

### Script de Teste

```javascript
// test-api.cjs
const axios = require('axios')

async function testarAPI() {
  try {
    const response = await axios.get('http://localhost:3000/api/WebView/Consultar', {
      params: {
        host: '10.0.0.8',
        database: 'C67624577000145',
        collection: 'tbl_nfe_100',
        dtIni: '2025-10-01',
        dtFin: '2025-10-31',
        pg: 1,
        size: 5
      },
      headers: {
        'Authorization': 'Bearer SEU_TOKEN_AQUI'
      }
    })
    
    console.log('✅ Sucesso!')
    console.log('Total de registros:', response.data.lista.length)
    console.log('Primeiro registro:', response.data.lista[0])
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

testarAPI()
```

### Executar Teste

```bash
node test-api.cjs
```

## 📝 Logs e Debug

### Habilitar Logs Detalhados

```typescript
// src/services/api.ts
const DEBUG = true

if (DEBUG) {
  console.log('📊 Parâmetros:', params)
  console.log('🔑 Token:', token.substring(0, 50) + '...')
}
```

### Logs Úteis

- `🚀 REQUISIÇÃO API` - Antes de enviar
- `✅ RESPOSTA API` - Resposta recebida
- `❌ ERRO NA RESPOSTA` - Erro ocorrido
- `📊 Dados mapeados` - Após mapeamento

## 🔒 Segurança

### Boas Práticas

1. ✅ **Nunca commitar** o token no Git
2. ✅ **Usar .env** para variáveis sensíveis
3. ✅ **Renovar token** regularmente
4. ✅ **Validar entrada** do usuário
5. ✅ **Sanitizar dados** antes de exibir

### Validação de Token

```typescript
export function validateBearerToken(token: string) {
  if (!token || token.length < 100) {
    return { valid: false, message: 'Token muito curto' }
  }
  
  if (!token.startsWith('eyJ')) {
    return { valid: false, message: 'Token não é JWT' }
  }
  
  // Decodificar e verificar expiração
  const payload = JSON.parse(atob(token.split('.')[1]))
  const exp = payload.exp * 1000
  
  if (Date.now() > exp) {
    return { valid: false, message: 'Token expirado' }
  }
  
  return { valid: true, message: 'Token válido' }
}
```

---

**Última Atualização:** 28/11/2025  
**Versão:** 1.0.0  
**API Version:** v1
