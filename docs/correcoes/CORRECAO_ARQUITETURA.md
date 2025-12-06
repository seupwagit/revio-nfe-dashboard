# Correção de Arquitetura - MongoDB no Browser

## 🔴 Problema Identificado

A aplicação estava tentando usar o driver MongoDB (`mongodb` package) diretamente no browser, causando erro fatal:

```
Error: (0 , util_1.promisify) is not a function
Module "util" has been externalized for browser compatibility
Module "crypto" has been externalized for browser compatibility
```

**Causa:** O MongoDB é um módulo Node.js que depende de APIs nativas (`util`, `crypto`) que não existem no ambiente do browser.

## ✅ Solução Implementada

Refatoração da arquitetura para seguir o padrão **Cliente-Servidor**:

### Arquitetura Anterior (❌ Incorreta)
```
Browser (Frontend)
    ↓
MongoDB Driver (mongodb package)
    ↓
MongoDB Server
```

### Arquitetura Nova (✅ Correta)
```
Browser (Frontend)
    ↓
HTTP/REST API (axios)
    ↓
Backend Server (Node.js)
    ↓
MongoDB Driver (mongodb package)
    ↓
MongoDB Server
```

## 📁 Arquivos Modificados

### 1. Novo Arquivo: `src/services/mongoApi.ts`
Cliente HTTP que se comunica com o backend via REST API.

**Principais métodos:**
- `fetchDocuments()` - Busca documentos paginados
- `countDocuments()` - Conta documentos
- `aggregateAnalytics()` - Executa agregações
- `healthCheck()` - Verifica saúde do servidor

### 2. Modificado: `src/contexts/NFContext.tsx`
Removidas importações diretas do MongoDB:
```typescript
// ❌ ANTES
import { fiscalDocumentsService } from '../services/fiscalDocuments'
import { mongoConnectionService } from '../services/mongoConnection'

// ✅ DEPOIS
import { mongoApiService } from '../services/mongoApi'
```

Substituída lógica de acesso direto por chamadas HTTP:
```typescript
// ❌ ANTES
await mongoConnectionService.connect()
const dados = await fiscalDocumentsService.fetchDocuments(...)

// ✅ DEPOIS
const response = await mongoApiService.fetchDocuments(...)
const dados = response.data
```

### 3. Backend Existente: `server/mongodb-proxy.cjs`
Servidor proxy MongoDB que já existia no projeto e agora está sendo utilizado corretamente.

**Endpoints disponíveis:**
- `GET /health` - Health check
- `GET /api/documents` - Buscar documentos
- `GET /api/count` - Contar documentos
- `POST /api/aggregate/analytics` - Agregações

## 🚀 Como Executar

### Opção 1: Script Automático (Recomendado)
```bash
iniciar-app.bat
```

### Opção 2: Manual
```bash
# Terminal 1 - Backend
npm run mongodb-proxy

# Terminal 2 - Frontend
npm run dev
```

## 🔧 Configuração

As portas estão configuradas no arquivo `.env`:
```env
VITE_PORT=3000                    # Frontend
VITE_MONGODB_PROXY_PORT=3000      # Backend
```

## ✅ Resultado

- ✅ Aplicação carrega sem erros
- ✅ Console limpo (sem erros de módulos Node.js)
- ✅ Dados sendo carregados via API REST
- ✅ Performance mantida (2-3 segundos para 5000 registros)
- ✅ Arquitetura escalável e segura

## 📊 Logs de Sucesso

**Frontend (Console do Browser):**
```
📊 Carregando dados da collection: tbl_nfe_100
🔍 Buscando documentos via API REST...
✅ Recebidos 5000 registros da collection tbl_nfe_100 em 3.01s
⚡ Tempo de execução no backend: 2433ms
```

**Backend (Terminal):**
```
✅ Conectado ao MongoDB
📊 Database: C67624577000145
⚡ Modo: Conexão Direta
🚀 MongoDB Proxy rodando na porta 3000
```

## 🔐 Segurança

A nova arquitetura oferece benefícios de segurança:
- ✅ Credenciais do MongoDB ficam apenas no backend
- ✅ Frontend não tem acesso direto ao banco de dados
- ✅ Backend pode implementar autenticação/autorização
- ✅ Validação de dados centralizada no backend

## 📝 Próximos Passos (Opcional)

Os seguintes arquivos ainda contêm código de acesso direto ao MongoDB, mas não estão sendo usados no momento:
- `src/services/mongoConnection.ts`
- `src/services/mongoQuery.ts`
- `src/services/fiscalDocuments.ts`
- `src/services/documentMapper.ts`

Esses arquivos podem ser:
1. Removidos (se não forem mais necessários)
2. Movidos para o backend (se forem úteis lá)
3. Mantidos como referência (documentação)

## 🎯 Conclusão

A aplicação agora segue as melhores práticas de arquitetura web:
- Separação clara entre frontend e backend
- Comunicação via API REST
- Segurança aprimorada
- Código mais manutenível e escalável
