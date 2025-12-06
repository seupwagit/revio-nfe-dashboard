# 📡 Documentação da API

## Base URL

```
http://localhost:3000/api
```

## Autenticação

Atualmente sem autenticação. JWT será implementado em versão futura.

## Endpoints

### Health Checks

#### GET /health

Verifica status geral do servidor e conexões.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-12-02T10:00:00.000Z",
  "databases": {
    "mongodb": {
      "status": "connected",
      "database": "C67624577000145"
    },
    "sqlserver": {
      "status": "connected"
    }
  },
  "environment": {
    "nodeVersion": "v22.18.0",
    "platform": "linux"
  }
}
```

#### GET /health/mongodb

Verifica conexão MongoDB e lista collections.

**Response**:
```json
{
  "status": "ok",
  "database": "C67624577000145",
  "collections": 3,
  "collectionNames": ["tbl_nfe_100", "tbl_cfe_100", "tbl_cte_100"]
}
```

#### GET /health/prisma

Verifica conexão SQL Server.

**Response**:
```json
{
  "status": "ok",
  "message": "SQL Server conectado"
}
```

---

### Analytics

#### POST /analytics/aggregate

Executa agregações complexas no MongoDB para gerar dados de analytics.

**Request Body**:
```json
{
  "collection": "tbl_nfe_100",
  "dtIni": "2024-01-01",
  "dtFin": "2024-12-31",
  "cnpjEmit": "12345678000190",  // opcional
  "cnpjDest": "98765432000100"   // opcional
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "faturamentoDiario": [
      {
        "data": "2024-01-01",
        "valor": 150000.50,
        "quantidade": 45
      }
    ],
    "topEmitentes": [
      {
        "nome": "Empresa XYZ Ltda",
        "valor": 500000.00,
        "quantidade": 120
      }
    ],
    "distribuicaoTipos": [
      {
        "name": "Saída",
        "value": 800000.00,
        "quantidade": 200
      },
      {
        "name": "Entrada",
        "value": 200000.00,
        "quantidade": 50
      }
    ],
    "distribuicaoStatus": [
      {
        "name": "Protocolada",
        "value": 230
      },
      {
        "name": "Não Protocolada",
        "value": 20
      }
    ],
    "evolucao": [
      {
        "mes": "2024-01",
        "valor": 1000000.00,
        "quantidade": 250
      }
    ],
    "stats": {
      "totalNotas": 250,
      "totalValor": 1000000.00,
      "mediaValor": 4000.00,
      "maiorNota": 50000.00,
      "menorNota": 100.00
    }
  },
  "executionTime": 1234
}
```

---

### Documents

#### GET /documents

Busca documentos fiscais com paginação.

**Query Parameters**:
- `collection` (required): Nome da collection (`tbl_nfe_100`, `tbl_cfe_100`, `tbl_cte_100`)
- `dtIni` (optional): Data início (YYYY-MM-DD)
- `dtFin` (optional): Data fim (YYYY-MM-DD)
- `page` (optional): Número da página (default: 1)
- `size` (optional): Tamanho da página (default: 100)
- `cnpjEmit` (optional): CNPJ do emitente
- `cnpjDest` (optional): CNPJ do destinatário

**Example**:
```
GET /documents?collection=tbl_nfe_100&dtIni=2024-01-01&dtFin=2024-12-31&page=1&size=50
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "DT_DOC": "2024-01-15T00:00:00.000Z",
      "VL_DOC": 1500.50,
      "EMIT_XNOME": "Empresa ABC Ltda",
      "CNPJ_EMIT": "12345678000190",
      "CNPJ_DEST": "98765432000100",
      "IND_OPER": "1",
      "PROTOCOLADA": "Sim"
    }
  ],
  "pagination": {
    "page": 1,
    "size": 50,
    "total": 1250,
    "totalPages": 25
  },
  "executionTime": 45
}
```

#### GET /documents/count

Conta documentos fiscais com filtros.

**Query Parameters**:
- `collection` (required): Nome da collection
- `dtIni` (optional): Data início
- `dtFin` (optional): Data fim
- `cnpjEmit` (optional): CNPJ do emitente
- `cnpjDest` (optional): CNPJ do destinatário

**Example**:
```
GET /documents/count?collection=tbl_nfe_100&dtIni=2024-01-01&dtFin=2024-12-31
```

**Response**:
```json
{
  "success": true,
  "count": 1250
}
```

---

## Códigos de Status

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Bad Request - Parâmetros inválidos |
| 500 | Internal Server Error |
| 503 | Service Unavailable - Database não conectado |

## Erros

Formato padrão de erro:

```json
{
  "success": false,
  "error": "Mensagem de erro detalhada"
}
```

## Rate Limiting

Atualmente sem rate limiting. Será implementado em versão futura.

**Planejado**:
- 100 requests/minuto por IP
- 1000 requests/hora por IP

## Exemplos de Uso

### JavaScript (Axios)

```javascript
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:3000/api'
})

// Analytics
const analytics = await api.post('/analytics/aggregate', {
  collection: 'tbl_nfe_100',
  dtIni: '2024-01-01',
  dtFin: '2024-12-31'
})

// Documents
const documents = await api.get('/documents', {
  params: {
    collection: 'tbl_nfe_100',
    page: 1,
    size: 100
  }
})
```

### cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Analytics
curl -X POST http://localhost:3000/api/analytics/aggregate \
  -H "Content-Type: application/json" \
  -d '{
    "collection": "tbl_nfe_100",
    "dtIni": "2024-01-01",
    "dtFin": "2024-12-31"
  }'

# Documents
curl "http://localhost:3000/api/documents?collection=tbl_nfe_100&page=1&size=50"
```

### Python (requests)

```python
import requests

base_url = 'http://localhost:3000/api'

# Analytics
response = requests.post(f'{base_url}/analytics/aggregate', json={
    'collection': 'tbl_nfe_100',
    'dtIni': '2024-01-01',
    'dtFin': '2024-12-31'
})
analytics = response.json()

# Documents
response = requests.get(f'{base_url}/documents', params={
    'collection': 'tbl_nfe_100',
    'page': 1,
    'size': 100
})
documents = response.json()
```

---

**Versão**: 1.0.0  
**Última Atualização**: 02/12/2024
