# 🏗️ Arquitetura do Sistema

## Visão Geral

O sistema é composto por 3 camadas principais:

1. **Frontend** - React SPA
2. **Backoffice** - Node.js API
3. **Databases** - MongoDB (documentos) + SQL Server (configurações)

## Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│                     React + TypeScript                       │
│                        Porta 3000                            │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Dashboard │  │Analytics │  │  Grid    │  │ Detalhes │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Services Layer                         │    │
│  │  - API Client (Axios)                              │    │
│  │  - Cache (StreamingCache)                          │    │
│  │  - State Management (Context API)                  │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP/REST
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                      BACKOFFICE API                          │
│                   Node.js + Express                          │
│                        Porta 3000                            │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │                  Routes Layer                       │    │
│  │  /api/health      - Health checks                  │    │
│  │  /api/analytics   - Agregações                     │    │
│  │  /api/documents   - CRUD documentos                │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │               Database Layer                        │    │
│  │  - Mongoose (MongoDB)                              │    │
│  │  - Prisma (SQL Server)                             │    │
│  └────────────────────────────────────────────────────┘    │
└────────────┬──────────────────────────┬─────────────────────┘
             │                          │
             ↓                          ↓
┌────────────────────┐      ┌────────────────────┐
│      MongoDB       │      │    SQL Server      │
│   (Documentos)     │      │  (Configurações)   │
│                    │      │                    │
│  - tbl_nfe_100     │      │  - configurations  │
│  - tbl_cfe_100     │      │  - users           │
│  - tbl_cte_100     │      │  - audit_logs      │
│                    │      │                    │
│  Porta: 27017      │      │  Porta: 1433       │
│  Driver: Mongoose  │      │  Driver: Prisma    │
└────────────────────┘      └────────────────────┘
```

## Camadas Detalhadas

### 1. Frontend (React)

#### Responsabilidades
- Renderização da UI
- Gerenciamento de estado local
- Cache de dados
- Validação de formulários
- Navegação entre páginas

#### Tecnologias
- **React 18** - Biblioteca UI
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Recharts** - Visualização de dados

#### Estrutura
```
src/
├── components/     # Componentes reutilizáveis
├── pages/          # Páginas/Rotas
├── services/       # Comunicação com API
├── contexts/       # Estado global
├── types/          # TypeScript types
├── utils/          # Funções auxiliares
└── config/         # Configurações
```

### 2. Backoffice API (Node.js)

#### Responsabilidades
- Autenticação e autorização
- Validação de dados
- Lógica de negócio
- Agregações complexas
- Gerenciamento de conexões DB

#### Tecnologias
- **Express** - Framework web
- **TypeScript** - Type safety
- **Mongoose** - MongoDB ODM
- **Prisma** - SQL Server ORM

#### Estrutura
```
server/backoffice/
├── index.ts        # Entry point
├── database/       # Conexões
│   ├── mongodb.ts  # Mongoose
│   └── prisma.ts   # Prisma
└── routes/         # Endpoints
    ├── health.ts
    ├── analytics.ts
    └── documents.ts
```

### 3. Databases

#### MongoDB (Documentos Fiscais)

**Uso**: Armazenamento de documentos fiscais (NF-e, CF-e, CT-e)

**Características**:
- Schema flexível
- Alta performance em leitura
- Agregações complexas
- Escalabilidade horizontal

**Collections**:
```javascript
// tbl_nfe_100
{
  _id: ObjectId,
  DT_DOC: Date,
  VL_DOC: Number,
  EMIT_XNOME: String,
  CNPJ_EMIT: String,
  CNPJ_DEST: String,
  IND_OPER: String,
  PROTOCOLADA: String,
  // ... outros campos
}
```

#### SQL Server (Configurações)

**Uso**: Configurações, usuários, auditoria

**Características**:
- Schema rígido
- Transações ACID
- Integridade referencial
- Suporte a Linux

**Tabelas**:
```sql
-- configurations
CREATE TABLE configurations (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  key NVARCHAR(255) UNIQUE,
  value NVARCHAR(MAX),
  created_at DATETIME2,
  updated_at DATETIME2
);

-- users
CREATE TABLE users (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  email NVARCHAR(255) UNIQUE,
  name NVARCHAR(255),
  role NVARCHAR(50),
  created_at DATETIME2,
  updated_at DATETIME2
);

-- audit_logs
CREATE TABLE audit_logs (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  user_id UNIQUEIDENTIFIER,
  action NVARCHAR(100),
  entity NVARCHAR(100),
  entity_id NVARCHAR(255),
  details NVARCHAR(MAX),
  created_at DATETIME2
);
```

## Fluxos de Dados

### Fluxo 1: Buscar Analytics

```
1. Usuário acessa /analytics
   ↓
2. React chama fetchAnalyticsAggregation()
   ↓
3. Axios POST /api/analytics/aggregate
   ↓
4. Backoffice recebe request
   ↓
5. Mongoose executa aggregation pipeline
   ↓
6. MongoDB processa agregação
   ↓
7. Backoffice retorna JSON
   ↓
8. React atualiza estado
   ↓
9. Recharts renderiza gráficos
```

### Fluxo 2: Buscar Documentos (Grid)

```
1. Usuário acessa /notas
   ↓
2. React chama fetchDocuments()
   ↓
3. Axios GET /api/documents?page=1&size=100
   ↓
4. Backoffice recebe request
   ↓
5. Mongoose executa find() com paginação
   ↓
6. MongoDB retorna documentos
   ↓
7. Backoffice retorna JSON paginado
   ↓
8. React atualiza tabela
   ↓
9. TanStack Table renderiza grid
```

### Fluxo 3: Salvar Configuração

```
1. Usuário altera configuração
   ↓
2. React chama saveConfiguration()
   ↓
3. Axios POST /api/config
   ↓
4. Backoffice valida dados
   ↓
5. Prisma executa upsert
   ↓
6. SQL Server salva configuração
   ↓
7. Prisma retorna resultado
   ↓
8. Backoffice retorna sucesso
   ↓
9. React mostra notificação
```

## Padrões de Design

### 1. Repository Pattern

Abstração do acesso a dados:

```typescript
// MongoDB Repository
class DocumentRepository {
  async findByDateRange(dtIni: Date, dtFin: Date) {
    return await DocumentModel.find({
      DT_DOC: { $gte: dtIni, $lte: dtFin }
    })
  }
}

// SQL Server Repository
class ConfigRepository {
  async findByKey(key: string) {
    return await prisma.configuration.findUnique({
      where: { key }
    })
  }
}
```

### 2. Service Layer

Lógica de negócio isolada:

```typescript
class AnalyticsService {
  async getAggregatedData(params) {
    // Validação
    // Lógica de negócio
    // Chamada ao repository
    // Transformação de dados
    return result
  }
}
```

### 3. Middleware Pattern

Processamento de requests:

```typescript
app.use(cors())
app.use(express.json())
app.use(authMiddleware)
app.use(loggingMiddleware)
app.use(errorHandler)
```

## Segurança

### Camadas de Segurança

1. **Frontend**
   - Validação de entrada
   - Sanitização de dados
   - HTTPS only

2. **API**
   - CORS configurado
   - Rate limiting
   - JWT validation
   - Input validation

3. **Database**
   - Conexões criptografadas
   - Prepared statements
   - Least privilege principle

### Autenticação

```
┌────────┐                ┌────────┐                ┌────────┐
│ Client │                │  API   │                │   DB   │
└───┬────┘                └───┬────┘                └───┬────┘
    │                         │                         │
    │  POST /login            │                         │
    ├────────────────────────>│                         │
    │                         │  Verify credentials     │
    │                         ├────────────────────────>│
    │                         │<────────────────────────┤
    │  JWT Token              │                         │
    │<────────────────────────┤                         │
    │                         │                         │
    │  GET /api/data          │                         │
    │  Authorization: Bearer  │                         │
    ├────────────────────────>│                         │
    │                         │  Validate JWT           │
    │                         │  Query data             │
    │                         ├────────────────────────>│
    │                         │<────────────────────────┤
    │  Data                   │                         │
    │<────────────────────────┤                         │
```

## Escalabilidade

### Horizontal Scaling

```
┌─────────────┐
│ Load        │
│ Balancer    │
└──────┬──────┘
       │
       ├──────────┬──────────┬──────────┐
       ↓          ↓          ↓          ↓
   ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
   │ API 1  │ │ API 2  │ │ API 3  │ │ API N  │
   └────────┘ └────────┘ └────────┘ └────────┘
       │          │          │          │
       └──────────┴──────────┴──────────┘
                  │
       ┌──────────┴──────────┐
       ↓                     ↓
   ┌────────┐           ┌────────┐
   │MongoDB │           │  SQL   │
   │Replica │           │ Always │
   │  Set   │           │   On   │
   └────────┘           └────────┘
```

### Caching Strategy

```
┌────────┐
│ Client │
└───┬────┘
    │
    ↓
┌────────────┐
│ Browser    │ ← 90min TTL
│ Cache      │
└───┬────────┘
    │ Cache Miss
    ↓
┌────────────┐
│ API        │
└───┬────────┘
    │
    ↓
┌────────────┐
│ Redis      │ ← 60min TTL (futuro)
│ Cache      │
└───┬────────┘
    │ Cache Miss
    ↓
┌────────────┐
│ Database   │
└────────────┘
```

## Monitoramento

### Métricas Importantes

1. **Performance**
   - Response time
   - Throughput
   - Error rate

2. **Resources**
   - CPU usage
   - Memory usage
   - Disk I/O

3. **Database**
   - Query time
   - Connection pool
   - Slow queries

### Logging

```typescript
// Structured logging
logger.info('Request received', {
  method: req.method,
  path: req.path,
  userId: req.user?.id,
  timestamp: new Date()
})
```

---

**Versão**: 1.0.0  
**Última Atualização**: 02/12/2024
