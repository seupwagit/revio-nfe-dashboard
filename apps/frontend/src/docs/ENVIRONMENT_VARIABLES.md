# Variáveis de Ambiente - Frontend

## ✅ Status: IMPLEMENTADO

Todos os endereços hardcoded foram substituídos por variáveis de ambiente configuráveis.

## 🔧 Variáveis de Ambiente Disponíveis

### 🌐 **APIs e URLs**

#### **API Principal (Backend)**
```bash
VITE_API_BASE_URL=http://localhost:3001
```
- **Descrição**: URL base do backend da aplicação
- **Padrão**: `http://localhost:3001`
- **Usado em**: httpService, downloadWorker, downloadMonitor

#### **API Externa (Revio NFe)**
```bash
VITE_EXTERNAL_API_URL=http://apinfe.revio.digital/api
```
- **Descrição**: URL da API externa da Revio para consultas NFe
- **Padrão**: `http://apinfe.revio.digital/api`
- **Usado em**: Páginas de teste (TestRealRequest, TestDelphiFormat, DebugAPI)

#### **API Revio (Pública)**
```bash
VITE_REVIO_API_URL=https://api.revio.com.br/api/v1
```
- **Descrição**: URL da API pública da Revio
- **Padrão**: `https://api.revio.com.br/api/v1`
- **Usado em**: GridPaginadaInteligente

#### **API Google (Gemini)**
```bash
VITE_GOOGLE_API_URL=https://generativelanguage.googleapis.com/v1beta
```
- **Descrição**: URL base da API do Google Gemini
- **Padrão**: `https://generativelanguage.googleapis.com/v1beta`
- **Usado em**: BuscaNaturalSimples

### 🔐 **Autenticação**
```bash
VITE_API_BEARER_TOKEN=seu_token_aqui
```
- **Descrição**: Token de autenticação para APIs externas
- **Padrão**: (vazio)
- **Usado em**: Requisições para APIs externas

### 🗄️ **Base de Dados**
```bash
VITE_DB_HOST=localhost
VITE_DB_DATABASE=revio_nfe
VITE_DB_COLLECTION=tbl_nfe_100
```
- **Descrição**: Configurações de conexão com base de dados
- **Padrões**: `localhost`, `revio_nfe`, `tbl_nfe_100`
- **Usado em**: Páginas de teste e debug

### ⚙️ **Configurações Padrão**
```bash
VITE_DEFAULT_PAGE_SIZE=500
VITE_DEFAULT_PAGE=1
VITE_MAX_DATE_RANGE_DAYS=365
VITE_ANALYTICS_PAGE_SIZE=10000
```
- **Descrição**: Configurações padrão da aplicação
- **Usado em**: Paginação, filtros, analytics

## 📁 Arquivos Modificados

### **Configuração Central**
- `src/frontend/config/env.ts` - Configuração centralizada de todas as variáveis

### **Serviços Atualizados**
- `src/frontend/services/httpService.ts` - URL base configurável
- `src/frontend/services/DownloadMonitorService.ts` - URL configurável
- `src/frontend/workers/downloadWorker.ts` - URL configurável
- `src/frontend/contexts/AuthContext.tsx` - Usa httpService.baseURL

### **Páginas de Teste**
- `src/frontend/pages/TestRealRequest.tsx` - API externa configurável
- `src/frontend/pages/TestDelphiFormat.tsx` - API externa configurável
- `src/frontend/pages/DebugAPI.tsx` - API externa configurável

### **Componentes**
- `src/frontend/components/GridPaginadaInteligente.tsx` - API Revio configurável
- `src/frontend/components/BuscaNaturalSimples.tsx` - API Google configurável

## 🔄 Antes vs Depois

### ❌ **Antes (Hardcoded)**
```typescript
// httpService.ts
constructor(baseURL: string = 'http://localhost:3001') {

// TestRealRequest.tsx
const response = await axios.get('http://apinfe.revio.digital/api/WebView/Consultar')

// GridPaginadaInteligente.tsx
const url = `https://api.revio.com.br/api/v1/${collection}/total`
```

### ✅ **Depois (Configurável)**
```typescript
// httpService.ts
constructor(baseURL: string = getDefaultBaseURL()) {

// TestRealRequest.tsx
const response = await axios.get(`${env.api.externalUrl}/WebView/Consultar`)

// GridPaginadaInteligente.tsx
const url = `${env.api.revioApiUrl}/${collection}/total`
```

## 🚀 Como Usar

### **Desenvolvimento Local**
```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3001
VITE_EXTERNAL_API_URL=http://apinfe.revio.digital/api
VITE_API_BEARER_TOKEN=seu_token_de_desenvolvimento
```

### **Produção**
```bash
# .env.production
VITE_API_BASE_URL=https://api.sua-empresa.com
VITE_EXTERNAL_API_URL=https://apinfe.revio.digital/api
VITE_API_BEARER_TOKEN=seu_token_de_producao
```

### **Staging/Teste**
```bash
# .env.staging
VITE_API_BASE_URL=https://api-staging.sua-empresa.com
VITE_EXTERNAL_API_URL=http://apinfe-test.revio.digital/api
VITE_API_BEARER_TOKEN=seu_token_de_teste
```

## 🎯 Benefícios

1. **🔧 Flexibilidade**: URLs podem ser alteradas sem modificar código
2. **🌍 Multi-ambiente**: Diferentes configurações para dev/staging/prod
3. **🔒 Segurança**: Tokens não ficam hardcoded no código
4. **📦 Deploy**: Builds podem ser reutilizados em diferentes ambientes
5. **🧪 Testes**: Fácil configuração para diferentes ambientes de teste
6. **🔄 Manutenção**: Mudanças de URL centralizadas em um local

## ⚠️ URLs que Permanecem Hardcoded

Alguns URLs permanecem hardcoded intencionalmente:

### **Fallbacks de Desenvolvimento**
```typescript
// Apropriado - fallback para desenvolvimento local
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
```

### **Links Externos Fixos**
```typescript
// Apropriado - link oficial da empresa
<a href="https://revio.global" target="_blank">Site Oficial</a>
```

Estes URLs devem permanecer hardcoded pois são:
- Fallbacks seguros para desenvolvimento
- Links oficiais que não mudam
- Configurações padrão apropriadas

## 🔍 Validação

Para verificar se todas as variáveis estão configuradas:

```typescript
import { validateEnv } from './config/env'

// Chama na inicialização da aplicação
validateEnv()
```

A função `validateEnv()` verifica se as variáveis obrigatórias estão definidas e exibe avisos se necessário.

O frontend agora é completamente configurável via variáveis de ambiente! 🎉