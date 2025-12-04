# 🔗 Estrutura da URL da API Revio

Documentação completa sobre como a URL da API é construída.

## 📋 Componentes da URL

### Estrutura Completa

```
https://apinfe.revio.digital/api/WebView/Consultar?host=10.0.0.8&...
└─────┬─────────────────────┘ └┬┘ └──┬───┘ └───┬───┘ └────────┬────────┘
      │                        │     │         │              │
   Base URL                  API  Controller Route      Parameters
```

### Detalhamento

| Componente | Valor | Descrição |
|------------|-------|-----------|
| **Base URL** | `https://apinfe.revio.digital` | Domínio da API |
| **API Path** | `/api` | Prefixo da API REST |
| **Controller** | `/WebView` | Controlador (grupo de rotas) |
| **Route** | `/Consultar` | Rota específica |
| **Parameters** | `?host=10.0.0.8&...` | Query parameters |

### URL Final

```
https://apinfe.revio.digital/api/WebView/Consultar?host=10.0.0.8&cnpjEmit=&cnpjDest=&pg=1&size=500&collection=tbl_nfe_100&database=C67624577000145&dtIni=2025-08-28&dtFin=2025-08-28
```

## 🔧 Configuração no Código

### .env

```env
# ⚠️ IMPORTANTE: Não incluir /api na base URL
# O /api é adicionado automaticamente no código
VITE_API_BASE_URL=https://apinfe.revio.digital
```

### src/services/api.ts

```typescript
const api = axios.create({
  baseURL: env.api.baseUrl + '/api', // Adiciona /api automaticamente
  // ...
})
```

### Chamadas da API

```typescript
// No código, use apenas o controller + route
api.get('/WebView/Consultar', { params })

// Axios monta automaticamente:
// https://apinfe.revio.digital/api/WebView/Consultar?params...
```

## 📊 Exemplos

### Exemplo 1: Consulta Básica

**Configuração:**
```env
VITE_API_BASE_URL=https://apinfe.revio.digital
```

**Código:**
```typescript
api.get('/WebView/Consultar', {
  params: {
    host: '10.0.0.8',
    collection: 'tbl_nfe_100',
    database: 'C67624577000145',
    pg: 1,
    size: 500,
    dtIni: '2025-08-28',
    dtFin: '2025-08-28'
  }
})
```

**URL Gerada:**
```
https://apinfe.revio.digital/api/WebView/Consultar?host=10.0.0.8&collection=tbl_nfe_100&database=C67624577000145&pg=1&size=500&dtIni=2025-08-28&dtFin=2025-08-28
```

### Exemplo 2: Com Proxy Local

**Configuração:**
```env
VITE_API_BASE_URL=http://localhost:3001
```

**Código:**
```typescript
api.get('/WebView/Consultar', { params })
```

**URL Gerada:**
```
http://localhost:3001/api/WebView/Consultar?params...
```

**Proxy redireciona para:**
```
https://apinfe.revio.digital/api/WebView/Consultar?params...
```

## 🎯 Rotas Disponíveis

### 1. Consultar Documentos

```
GET /api/WebView/Consultar
```

**Parâmetros:**
- `host` - IP do servidor MongoDB
- `database` - Nome do banco de dados
- `collection` - Nome da coleção
- `pg` - Número da página
- `size` - Tamanho da página
- `dtIni` - Data inicial (YYYY-MM-DD)
- `dtFin` - Data final (YYYY-MM-DD)
- `cnpjEmit` - CNPJ do emitente (opcional)
- `cnpjDest` - CNPJ do destinatário (opcional)

### 2. Contador de Documentos

```
GET /api/WebView/ContadorConsulta
```

**Parâmetros:** (mesmos da consulta)

### 3. Outras Rotas

```
GET /api/WebView/ObterDocumento
GET /api/WebView/ListarCollections
GET /api/WebView/ListarDatabases
```

## ⚠️ Erros Comuns

### Erro 1: URL Duplicada

**Problema:**
```env
VITE_API_BASE_URL=https://apinfe.revio.digital/api
```

**Resultado:**
```
https://apinfe.revio.digital/api/api/WebView/Consultar ❌
```

**Solução:**
```env
VITE_API_BASE_URL=https://apinfe.revio.digital
```

### Erro 2: Falta /api

**Problema:**
```typescript
const api = axios.create({
  baseURL: env.api.baseUrl, // Sem /api
})
```

**Resultado:**
```
https://apinfe.revio.digital/WebView/Consultar ❌
```

**Solução:**
```typescript
const api = axios.create({
  baseURL: env.api.baseUrl + '/api', // Com /api
})
```

### Erro 3: Proxy Incorreto

**Problema:**
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

**Resultado:**
```
http://localhost:3001/api/api/WebView/Consultar ❌
```

**Solução:**
```env
VITE_API_BASE_URL=http://localhost:3001
```

## 🔍 Como Verificar

### Via Console do Navegador

```javascript
// Ver base URL configurada
console.log(import.meta.env.VITE_API_BASE_URL)

// Ver URL completa nos logs
// Procure por: "Full URL: https://..."
```

### Via Chrome DevTools MCP

Peça ao Kiro:
```
"Mostre a URL completa que está sendo usada para consultar a API"
"Verifique se a URL está correta"
```

### Via Network Tab

1. Abra DevTools (F12)
2. Vá em Network
3. Faça uma busca
4. Veja a URL da requisição

**Deve ser:**
```
https://apinfe.revio.digital/api/WebView/Consultar?...
```

## 💡 Dicas

1. **Nunca inclua /api no .env** - É adicionado automaticamente
2. **Use HTTPS em produção** - Mais seguro
3. **Proxy apenas para dev** - Resolve CORS
4. **Verifique logs** - Confirme URL gerada
5. **Teste com curl** - Valide fora da aplicação

## 📚 Recursos

- [Configuração da API](./api-url-config.md)
- [Documentação da API Revio](./revio-api-documentacao-adriano.md)
- [Troubleshooting](../debug/troubleshooting.md)

---

**Última atualização:** 01/12/2024
