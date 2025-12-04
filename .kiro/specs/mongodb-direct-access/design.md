# Design Document

## Overview

Este documento descreve o design da migração do sistema de consulta de documentos fiscais de uma arquitetura baseada em REST API para acesso direto ao MongoDB. A migração visa melhorar performance, reduzir latência e simplificar a arquitetura, mantendo todas as funcionalidades existentes da interface visual.

O sistema continuará sendo uma aplicação React + TypeScript + Vite que consulta documentos fiscais (NF-e, CF-e, CT-e), mas ao invés de fazer requisições HTTP para uma API REST intermediária, fará consultas diretas ao MongoDB usando o driver nativo.

## Architecture

### Current Architecture (REST API)

```
┌─────────────┐      HTTP/REST      ┌─────────────┐      MongoDB      ┌─────────────┐
│   React     │ ──────────────────> │  REST API   │ ───────────────> │   MongoDB   │
│   Frontend  │ <────────────────── │  (Express)  │ <─────────────── │   Database  │
└─────────────┘      JSON           └─────────────┘      Native       └─────────────┘
```

### New Architecture (Direct MongoDB)

```
┌─────────────┐      MongoDB Driver      ┌─────────────┐
│   React     │ ──────────────────────> │   MongoDB   │
│   Frontend  │ <────────────────────── │   Database  │
└─────────────┘      Native Protocol     └─────────────┘
```

### Architecture Layers

1. **Presentation Layer** (React Components)
   - Mantém todos componentes visuais existentes
   - Dashboards, Grids, Filtros, Busca Natural
   - Não sofre alterações significativas

2. **Service Layer** (MongoDB Services)
   - Nova camada que substitui `api.ts`
   - Implementa conexão e queries MongoDB
   - Mantém mesma interface pública para compatibilidade

3. **Data Layer** (MongoDB Collections)
   - Collections: tbl_nfe_100, tbl_cfe_100, tbl_cte_100
   - Database dinâmica baseada em perfil (futuro)
   - Índices otimizados para queries comuns

4. **Cache Layer** (Browser Cache)
   - Mantém sistema de cache existente
   - Adapta para trabalhar com queries MongoDB
   - Cache de resultados e agregações

## Components and Interfaces

### 1. MongoDB Connection Service

**Responsabilidade:** Gerenciar conexão com MongoDB

```typescript
// src/services/mongoConnection.ts

interface MongoConnectionConfig {
  connectionString: string
  database: string
  options?: MongoClientOptions
}

interface MongoConnection {
  client: MongoClient
  db: Db
  isConnected: boolean
}

class MongoConnectionService {
  private connection: MongoConnection | null
  private config: MongoConnectionConfig
  
  async connect(): Promise<void>
  async disconnect(): Promise<void>
  async switchDatabase(database: string): Promise<void>
  getDatabase(): Db
  getCollection(name: string): Collection
  isHealthy(): Promise<boolean>
}
```

**Features:**
- Singleton pattern para reutilizar conexão
- Reconnection automática com backoff exponencial
- Health check periódico
- Suporte para troca dinâmica de database

### 2. MongoDB Query Service

**Responsabilidade:** Executar queries e mapear resultados

```typescript
// src/services/mongoQuery.ts

interface QueryOptions {
  collection: string
  database?: string
  filter?: Filter<Document>
  projection?: Document
  sort?: Sort
  skip?: number
  limit?: number
}

interface QueryResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

class MongoQueryService {
  async find<T>(options: QueryOptions): Promise<QueryResult<T>>
  async findOne<T>(options: QueryOptions): Promise<T | null>
  async count(options: Omit<QueryOptions, 'projection' | 'sort' | 'skip' | 'limit'>): Promise<number>
  async estimatedCount(collection: string, database?: string): Promise<number>
  async aggregate<T>(pipeline: Document[], options: Omit<QueryOptions, 'filter' | 'projection' | 'sort'>): Promise<T[]>
}
```

**Features:**
- Abstração sobre driver MongoDB
- Mapeamento automático de resultados
- Suporte para paginação eficiente
- Queries otimizadas com índices

### 3. Document Mapper Service

**Responsabilidade:** Mapear documentos MongoDB para tipos TypeScript

```typescript
// src/services/documentMapper.ts

interface MappingRule {
  mongoField: string
  appField: string
  transform?: (value: any) => any
}

class DocumentMapperService {
  private mappings: Map<string, MappingRule[]>
  
  mapDocument(doc: Document, type: 'nfe' | 'cfe' | 'cte'): NotaFiscal | CupomFiscal | ConhecimentoTransporte
  mapDocuments(docs: Document[], type: 'nfe' | 'cfe' | 'cte'): DocumentoFiscal[]
  registerMapping(type: string, rules: MappingRule[]): void
}
```

**Features:**
- Mapeamento configurável por tipo de documento
- Transformações customizadas de valores
- Validação de tipos com Zod
- Compatibilidade com estrutura REST API

### 4. Fiscal Documents Service

**Responsabilidade:** API pública para consulta de documentos (substitui api.ts)

```typescript
// src/services/fiscalDocuments.ts

interface FetchOptions {
  dataInicio?: string
  dataFim?: string
  cnpjEmit?: string
  cnpjDest?: string
  status?: string
  collection?: string
  database?: string
  page?: number
  pageSize?: number
}

interface ProgressCallback {
  (current: number, total: number, data: any[], fromCache?: boolean): void
}

class FiscalDocumentsService {
  async fetchDocuments(
    options: FetchOptions,
    onProgress?: ProgressCallback
  ): Promise<DocumentoFiscal[]>
  
  async fetchCount(options: Omit<FetchOptions, 'page' | 'pageSize'>): Promise<number>
  
  async fetchStats(options: Omit<FetchOptions, 'page' | 'pageSize'>): Promise<DashboardStats>
  
  async searchNatural(query: string, options: FetchOptions): Promise<DocumentoFiscal[]>
}
```

**Features:**
- Interface compatível com api.ts existente
- Integração com cache layer
- Suporte para busca natural com IA
- Callbacks de progresso para UI

### 5. Cache Service (Adaptado)

**Responsabilidade:** Cache de resultados MongoDB

```typescript
// src/services/mongoCache.ts

interface CacheEntry {
  data: any[]
  timestamp: number
  complete: boolean
  query: QueryOptions
}

class MongoCacheService {
  getCacheKey(options: FetchOptions): string
  getFromCache(key: string): CacheEntry | null
  updateCache(key: string, data: any[], complete: boolean): void
  clearExpired(): void
  clearAll(): void
  getStats(): CacheStats
}
```

**Features:**
- Adaptação do streamingCache.ts existente
- Cache baseado em hash de query
- Expiração configurável (90 minutos)
- Limpeza automática

### 6. Natural Search Service (Adaptado)

**Responsabilidade:** Converter linguagem natural em queries MongoDB

```typescript
// src/services/naturalSearch.ts

interface NaturalSearchResult {
  query: Filter<Document>
  confidence: number
  explanation: string
}

class NaturalSearchService {
  async parseQuery(text: string): Promise<NaturalSearchResult>
  async executeSearch(text: string, options: FetchOptions): Promise<DocumentoFiscal[]>
}
```

**Features:**
- Integração com Google Gemini
- Conversão de linguagem natural para MongoDB query
- Validação de queries geradas
- Fallback para busca simples

## Data Models

### MongoDB Collections Schema

#### tbl_nfe_100 (NF-e)

```typescript
interface NFe_MongoDB {
  _id: ObjectId
  NUMERO: string
  SERIE: string
  MODELO: string
  CHV_NFE: string
  DT_DOC: string
  VL_DOC: number
  PROTOCOLADA: 'Sim' | 'Não'
  TIPO: string
  IND_OPER: '0' | '1'
  NAT_OPER: string
  
  // Emitente
  CNPJ_EMIT: string
  NOME_EMIT: string
  FANTASIA_EMIT?: string
  IE?: string
  END_EMIT?: string
  MUN_EMIT?: string
  UF_EMIT?: string
  
  // Destinatário
  CNPJ_DEST: string
  NOME_DEST: string
  IE_DEST?: string
  END_DEST?: string
  MUN_DEST?: string
  UF_DEST?: string
  
  // Totais
  VL_BC_ICMS?: number
  VL_ICMS?: number
  VL_IPI?: number
  VL_PIS?: number
  VL_COFINS?: number
  VL_FRETE?: number
  VL_SEG?: number
  VL_DESC?: number
  VL_OUTRO?: number
  
  // Transporte
  MOD_FRETE?: string
  TRANSP_CNPJ?: string
  TRANSP_NOME?: string
  VEIC_PLACA?: string
  VEIC_UF?: string
  
  // Pagamento
  FORMA_PAG?: string
  VL_PAG?: number
  
  // Itens
  itens?: Array<{
    codigo: string
    descricao: string
    quantidade: number
    valorUnitario: number
    valorTotal: number
    ncm?: string
    cfop?: string
    unidade?: string
  }>
  
  // Informações adicionais
  INF_ADIC?: string
  OBS?: string
  ORIGEM?: string
  STATUS_MANIFESTACAO?: string
}
```

#### tbl_cfe_100 (CF-e)

```typescript
interface CFe_MongoDB {
  _id: ObjectId
  NUMERO: string
  SERIE: string
  NUM_SAT: string
  CHV_NFE: string
  DT_DOC: string
  VL_DOC: number
  PROTOCOLADA: 'Sim' | 'Não'
  
  // Emitente
  CNPJ_EMIT: string
  NOME_EMIT: string
  FANTASIA_EMIT?: string
  IE?: string
  
  // Destinatário (opcional)
  CPF_CNPJ_DEST?: string
  NOME_DEST?: string
  
  // Totais
  VL_DESC_SUBTOT?: number
  VL_ACRES_SUBTOT?: number
  
  // Pagamento
  FORMA_PAG: string
  VL_PAG: number
  
  // Itens
  itens?: Array<{
    codigo: string
    descricao: string
    quantidade: number
    valorUnitario: number
    valorTotal: number
    unidade?: string
    desconto?: number
  }>
}
```

#### tbl_cte_100 (CT-e)

```typescript
interface CTe_MongoDB {
  _id: ObjectId
  NUMERO: string
  SERIE: string
  MODELO: string
  CHV_NFE: string
  DT_DOC: string
  VL_DOC: number
  PROTOCOLADA: 'Sim' | 'Não'
  TP_SERV: string
  
  // Tomador
  toma?: {
    tipo: string
    CNPJ: string
    xNome: string
    IE?: string
  }
  
  // Remetente
  rem?: {
    CNPJ: string
    xNome: string
    xMun?: string
    UF?: string
  }
  
  // Destinatário
  dest?: {
    CNPJ: string
    xNome: string
    xMun?: string
    UF?: string
  }
  
  // Expedidor
  exped?: {
    CNPJ?: string
    xNome?: string
  }
  
  // Recebedor
  receb?: {
    CNPJ?: string
    xNome?: string
  }
  
  // Carga
  infCarga?: {
    proPred: string
    vCarga?: number
    qCarga?: number
    cUnid?: string
  }
  
  // Valores
  vPrest?: {
    vTPrest: number
    vRec: number
  }
  
  imp?: {
    ICMS?: {
      vICMS?: number
      vBC?: number
    }
  }
  
  // Rodoviário
  rodo?: {
    RNTRC?: string
    veic?: {
      placa?: string
      UF?: string
    }
    moto?: {
      CPF?: string
      xNome?: string
    }
  }
}
```

### Application Types (Mantidos)

Os tipos TypeScript existentes em `src/types/index.ts` serão mantidos:
- `DocumentoFiscal`
- `NotaFiscal`
- `CupomFiscal`
- `ConhecimentoTransporte`
- `DashboardStats`
- `Filtros`

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*


### Property Reflection

Após análise dos critérios de aceitação, identifiquei as seguintes redundâncias:

**Redundâncias Identificadas:**

1. **Propriedades 1.4 e 6.4** (Mapeamento de campos): Ambas testam que documentos MongoDB são mapeados corretamente para o formato da aplicação. Podem ser consolidadas em uma única propriedade abrangente.

2. **Propriedades de Error Handling** (9.2, 10.4, 11.4, 17.5, 18.2): Todas testam que erros são logados e mensagens claras são retornadas. Podem ser consolidadas em uma propriedade geral de error handling.

3. **Propriedades de Cache** (15.1 e 15.2): A verificação de cache antes de consultar e o retorno de dados cacheados são aspectos da mesma propriedade de cache hit.

4. **Propriedades de Paginação** (16.2 e 16.3): Retornar apenas registros da página atual e usar skip/limit otimizado são aspectos da mesma propriedade de paginação correta.

**Propriedades Consolidadas:**

Após reflexão, manterei as propriedades mais abrangentes e eliminarei as redundantes, resultando em um conjunto enxuto de propriedades que fornecem validação única.

### Correctness Properties

Property 1: MongoDB Connection Establishment
*For any* valid MongoDB connection string, when the system initializes, it should successfully establish a connection to MongoDB without errors
**Validates: Requirements 1.1**

Property 2: Read-Only Operations
*For any* operation executed by the system, only read operations (find, findOne, aggregate, count, estimatedDocumentCount) should be called on MongoDB collections, never write operations (insert, update, delete, drop)
**Validates: Requirements 1.3**

Property 3: Document Mapping Consistency
*For any* MongoDB document retrieved from any collection (tbl_nfe_100, tbl_cfe_100, tbl_cte_100), the mapped application object should contain all required fields with correct types and values matching the MongoDB document
**Validates: Requirements 1.4, 6.1, 6.4**

Property 4: Automatic Reconnection with Backoff
*For any* connection error, the system should attempt reconnection with exponentially increasing delays (backoff), and the number of retry attempts should follow the pattern: delay(n) = min(baseDelay * 2^n, maxDelay)
**Validates: Requirements 1.5, 18.1**

Property 5: Filter to MongoDB Query Translation
*For any* set of application filters (dataInicio, dataFim, cnpjEmit, cnpjDest, status), the system should generate a valid MongoDB query that correctly represents all filter conditions
**Validates: Requirements 2.3**

Property 6: Natural Language to MongoDB Query
*For any* natural language query processed by Google Gemini, the generated MongoDB query should be syntactically valid and executable without errors
**Validates: Requirements 2.4, 17.2**

Property 7: Pagination Correctness
*For any* dataset and page number, the returned results should contain exactly pageSize items (or fewer for the last page), with no duplicates and no missing items across all pages
**Validates: Requirements 2.6, 16.2, 16.3**

Property 8: Date Range Validation
*For any* date range where (dataFim - dataInicio) > VITE_MAX_DATE_RANGE_DAYS, the system should reject the query with a clear validation error message
**Validates: Requirements 3.4**

Property 9: Dynamic Database Switching
*For any* database name, calling switchDatabase(name) should change the active database for subsequent queries without requiring reconnection or system restart
**Validates: Requirements 4.1**

Property 10: Optimized Count Strategy
*For any* count operation without filters, the system should use estimatedDocumentCount(); for any count operation with filters, the system should use countDocuments()
**Validates: Requirements 5.1, 5.3**

Property 11: Pagination Count Calculation
*For any* estimated document count and page size, the calculated total pages should equal ceil(count / pageSize)
**Validates: Requirements 5.2**

Property 12: Cache Hit Optimization
*For any* query with a valid cache entry (not expired), the system should return cached data without executing a MongoDB query
**Validates: Requirements 15.1, 15.2**

Property 13: Cache Expiration
*For any* cache entry where (currentTime - timestamp) > CACHE_DURATION, the system should treat the entry as expired and execute a new MongoDB query
**Validates: Requirements 15.3**

Property 14: Cache Key Uniqueness
*For any* two different filter combinations, the generated cache keys should be different; for any two identical filter combinations, the cache keys should be the same
**Validates: Requirements 15.4**

Property 15: Cache Cleanup
*For any* cache cleanup operation, all entries where (currentTime - timestamp) > CACHE_DURATION should be removed from cache
**Validates: Requirements 15.5**

Property 16: Cursor-Based Pagination
*For any* page request, the MongoDB query should use skip = (page - 1) * pageSize and limit = pageSize
**Validates: Requirements 16.1**

Property 17: Error Logging and User Feedback
*For any* error that occurs (connection, query, validation, timeout), the system should: 1) log complete error details including stack trace to console, 2) return a user-friendly error message without exposing internal details
**Validates: Requirements 9.2, 9.3, 10.4, 11.4, 17.5, 18.2, 18.5**

Property 18: Query Timeout Handling
*For any* MongoDB operation that exceeds the configured timeout, the system should cancel the operation and return a timeout error to the user
**Validates: Requirements 18.3**

Property 19: Data Validation
*For any* data received from MongoDB, if the data fails schema validation (using Zod), the system should reject it with a clear validation error message
**Validates: Requirements 18.4**

## Error Handling

### Error Categories

1. **Connection Errors**
   - MongoDB connection failure
   - Network timeout
   - Authentication failure
   - DNS resolution failure

2. **Query Errors**
   - Invalid query syntax
   - Query timeout
   - Index not found
   - Collection not found

3. **Data Errors**
   - Schema validation failure
   - Type conversion error
   - Missing required fields
   - Invalid data format

4. **Application Errors**
   - Cache corruption
   - Invalid configuration
   - Resource exhaustion
   - Unexpected exceptions

### Error Handling Strategy

```typescript
interface ErrorResponse {
  code: string
  message: string
  details?: any
  timestamp: Date
  retryable: boolean
}

class ErrorHandler {
  handle(error: Error): ErrorResponse
  isRetryable(error: Error): boolean
  shouldReconnect(error: Error): boolean
  getUserMessage(error: Error): string
}
```

### Reconnection Strategy

```typescript
interface ReconnectionConfig {
  maxRetries: number
  baseDelay: number
  maxDelay: number
  backoffMultiplier: number
}

class ReconnectionManager {
  private retries: number = 0
  private config: ReconnectionConfig
  
  async reconnect(): Promise<void> {
    while (this.retries < this.config.maxRetries) {
      const delay = this.calculateDelay()
      await this.sleep(delay)
      
      try {
        await this.connection.connect()
        this.retries = 0
        return
      } catch (error) {
        this.retries++
        this.logRetry(error)
      }
    }
    
    throw new Error('Max reconnection attempts reached')
  }
  
  private calculateDelay(): number {
    const delay = this.config.baseDelay * Math.pow(this.config.backoffMultiplier, this.retries)
    return Math.min(delay, this.config.maxDelay)
  }
}
```

## Testing Strategy

### Unit Testing

**Framework:** Jest

**Coverage:**
- Service layer functions (connection, query, mapping)
- Utility functions (cache key generation, date validation)
- Error handling logic
- Data transformation functions

**Approach:**
- Mock MongoDB driver using `jest.mock('mongodb')`
- Test individual functions in isolation
- Focus on edge cases and error conditions
- Validate type conversions and mappings

**Example:**
```typescript
describe('MongoQueryService', () => {
  it('should use estimatedDocumentCount for queries without filters', async () => {
    const mockCollection = {
      estimatedDocumentCount: jest.fn().mockResolvedValue(1000)
    }
    
    const service = new MongoQueryService(mockCollection)
    const count = await service.count({ collection: 'test' })
    
    expect(mockCollection.estimatedDocumentCount).toHaveBeenCalled()
    expect(count).toBe(1000)
  })
})
```

### Property-Based Testing

**Framework:** fast-check (JavaScript/TypeScript property-based testing library)

**Configuration:** Minimum 100 iterations per property test

**Coverage:**
- Document mapping (Property 3)
- Filter translation (Property 5)
- Pagination correctness (Property 7)
- Cache key generation (Property 14)
- Date range validation (Property 8)

**Approach:**
- Generate random inputs using fast-check arbitraries
- Verify properties hold for all generated inputs
- Use shrinking to find minimal failing cases
- Tag each test with property reference

**Example:**
```typescript
import fc from 'fast-check'

describe('Property Tests', () => {
  /**
   * Feature: mongodb-direct-access, Property 7: Pagination Correctness
   */
  it('should paginate without duplicates or missing items', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ id: fc.string(), value: fc.integer() }), { minLength: 100, maxLength: 1000 }),
        fc.integer({ min: 1, max: 50 }),
        (dataset, pageSize) => {
          const pages = paginateData(dataset, pageSize)
          const allItems = pages.flat()
          
          // No duplicates
          const uniqueIds = new Set(allItems.map(item => item.id))
          expect(uniqueIds.size).toBe(allItems.length)
          
          // No missing items
          expect(allItems.length).toBe(dataset.length)
          
          // Correct page sizes
          pages.slice(0, -1).forEach(page => {
            expect(page.length).toBe(pageSize)
          })
        }
      ),
      { numRuns: 100 }
    )
  })
  
  /**
   * Feature: mongodb-direct-access, Property 14: Cache Key Uniqueness
   */
  it('should generate unique cache keys for different filters', () => {
    fc.assert(
      fc.property(
        fc.record({
          dataInicio: fc.date(),
          dataFim: fc.date(),
          cnpjEmit: fc.option(fc.string()),
          cnpjDest: fc.option(fc.string())
        }),
        fc.record({
          dataInicio: fc.date(),
          dataFim: fc.date(),
          cnpjEmit: fc.option(fc.string()),
          cnpjDest: fc.option(fc.string())
        }),
        (filters1, filters2) => {
          const key1 = generateCacheKey(filters1)
          const key2 = generateCacheKey(filters2)
          
          if (JSON.stringify(filters1) === JSON.stringify(filters2)) {
            expect(key1).toBe(key2)
          } else {
            expect(key1).not.toBe(key2)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
```

### Integration Testing

**Framework:** Jest with Testcontainers

**Coverage:**
- MongoDB connection and queries
- End-to-end data flow
- Cache integration
- Error scenarios

**Approach:**
- Use Testcontainers to spin up real MongoDB instance
- Test against real database with test data
- Verify complete workflows
- Test error recovery

**Example:**
```typescript
import { MongoDBContainer } from '@testcontainers/mongodb'

describe('Integration Tests', () => {
  let container: MongoDBContainer
  let service: FiscalDocumentsService
  
  beforeAll(async () => {
    container = await new MongoDBContainer().start()
    service = new FiscalDocumentsService(container.getConnectionString())
  })
  
  afterAll(async () => {
    await container.stop()
  })
  
  it('should fetch documents from MongoDB', async () => {
    const docs = await service.fetchDocuments({
      dataInicio: '2024-01-01',
      dataFim: '2024-01-31',
      collection: 'tbl_nfe_100'
    })
    
    expect(docs).toBeInstanceOf(Array)
    expect(docs.length).toBeGreaterThan(0)
  })
})
```

### End-to-End Testing

**Framework:** Cypress

**Coverage:**
- Dashboard rendering with MongoDB data
- Grid pagination and filtering
- Natural search functionality
- Excel export
- Error messages display

**Approach:**
- Test complete user workflows
- Verify UI updates correctly
- Test user interactions
- Validate error handling in UI

**Example:**
```typescript
describe('Dashboard E2E', () => {
  it('should display dashboard with MongoDB data', () => {
    cy.visit('/dashboard')
    cy.get('[data-testid="total-notas"]').should('exist')
    cy.get('[data-testid="valor-total"]').should('exist')
    cy.get('[data-testid="chart"]').should('be.visible')
  })
  
  it('should filter data by date range', () => {
    cy.visit('/dashboard')
    cy.get('[data-testid="date-start"]').type('2024-01-01')
    cy.get('[data-testid="date-end"]').type('2024-01-31')
    cy.get('[data-testid="apply-filter"]').click()
    cy.get('[data-testid="loading"]').should('not.exist')
    cy.get('[data-testid="grid"]').should('contain', '2024-01')
  })
})
```

## Implementation Notes

### MongoDB Driver Configuration

```typescript
const clientOptions: MongoClientOptions = {
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true,
  retryReads: true,
  compressors: ['zlib'],
  zlibCompressionLevel: 6
}
```

### Index Recommendations

Para otimizar performance das queries mais comuns:

```javascript
// tbl_nfe_100
db.tbl_nfe_100.createIndex({ "DT_DOC": 1 })
db.tbl_nfe_100.createIndex({ "CNPJ_EMIT": 1, "DT_DOC": 1 })
db.tbl_nfe_100.createIndex({ "CNPJ_DEST": 1, "DT_DOC": 1 })
db.tbl_nfe_100.createIndex({ "PROTOCOLADA": 1, "DT_DOC": 1 })
db.tbl_nfe_100.createIndex({ "CHV_NFE": 1 })

// tbl_cfe_100
db.tbl_cfe_100.createIndex({ "DT_DOC": 1 })
db.tbl_cfe_100.createIndex({ "CNPJ_EMIT": 1, "DT_DOC": 1 })
db.tbl_cfe_100.createIndex({ "NUM_SAT": 1 })

// tbl_cte_100
db.tbl_cte_100.createIndex({ "DT_DOC": 1 })
db.tbl_cte_100.createIndex({ "rem.CNPJ": 1, "DT_DOC": 1 })
db.tbl_cte_100.createIndex({ "dest.CNPJ": 1, "DT_DOC": 1 })
```

### Environment Variables

```bash
# MongoDB Connection
VITE_MONGODB_CONNECTION_STRING=mongodb://revio:zaqwsx2001@10.0.0.8:27017/?authMechanism=SCRAM-SHA-256&authSource=admin&directConnection=true

# Database Configuration
VITE_DB_DATABASE=C67624577000145
VITE_DB_COLLECTION=tbl_nfe_100

# Date Range Limits
VITE_MAX_DATE_RANGE_DAYS=365
VITE_DEFAULT_DATE_RANGE_DAYS=30

# Cache Configuration
VITE_CACHE_DURATION_MINUTES=90

# Query Configuration
VITE_DEFAULT_PAGE_SIZE=5000
VITE_MAX_PAGE_SIZE=20000
VITE_QUERY_TIMEOUT_MS=45000

# Email (Brevo)
BREVO_SMTP_HOST=smtp-relay.brevo.com
BREVO_SMTP_PORT=587
BREVO_SMTP_USER=SEU_USUARIO
BREVO_SMTP_PASS=SUA_SENHA
EMAIL_FROM=no-reply@seudominio.com
EMAIL_FROM_NAME=Seu Produto

# Storage (Wasabi S3)
OBJECT_STORAGE_URL=https://s3.wasabisys.com
OBJECT_STORAGE_KEY=7YDC7UG085G6BS8A714S
OBJECT_STORAGE_SECRET_KEY=HYKatJ4XbvaOsCsz9uJJGm2ZBgZWfsgZ5XHun1Vs
BUCKET_NAME=revio-bucket

# Google Gemini (Natural Search)
VITE_API_GOOGLE_GEMINI=AIzaSyD7EWB19AwBddPuj_MHxYcIq7DgW6w58zM
```

### Migration Checklist

- [ ] Install MongoDB driver: `npm install mongodb`
- [ ] Install fast-check for property tests: `npm install --save-dev fast-check @types/fast-check`
- [ ] Create MongoDB connection service
- [ ] Create MongoDB query service
- [ ] Create document mapper service
- [ ] Adapt fiscal documents service
- [ ] Adapt cache service for MongoDB queries
- [ ] Update natural search to generate MongoDB queries
- [ ] Update all components to use new services
- [ ] Remove axios and REST API dependencies
- [ ] Update environment variables
- [ ] Create comprehensive test suite
- [ ] Update documentation
- [ ] Perform performance testing
- [ ] Deploy and monitor

## Performance Considerations

### Query Optimization

1. **Use Projections:** Only fetch required fields
2. **Leverage Indexes:** Ensure queries use appropriate indexes
3. **Batch Operations:** Use aggregation pipeline for complex queries
4. **Connection Pooling:** Reuse connections efficiently
5. **Cursor Management:** Close cursors after use

### Caching Strategy

1. **Cache Frequently Accessed Data:** Dashboard stats, recent documents
2. **Cache Aggregations:** Expensive calculations
3. **Invalidate on Time:** 90-minute expiration
4. **Memory Management:** Limit cache size, cleanup expired entries

### Monitoring

1. **Query Performance:** Log slow queries (> 1s)
2. **Connection Health:** Monitor connection pool
3. **Cache Hit Rate:** Track cache effectiveness
4. **Error Rate:** Monitor and alert on errors
5. **Resource Usage:** Memory and CPU monitoring

## Security Considerations

1. **Read-Only Access:** Never execute write operations
2. **Connection String Security:** Store in environment variables, never commit
3. **Input Validation:** Validate all user inputs before querying
4. **Query Injection Prevention:** Use parameterized queries
5. **Error Messages:** Don't expose internal details to users
6. **Audit Logging:** Log all database access
7. **Rate Limiting:** Prevent abuse of queries
8. **Authentication:** Verify user permissions (future)

## Documentation Requirements

### docs/SCHEMA.md

Must include:
- Complete schema for each collection (tbl_nfe_100, tbl_cfe_100, tbl_cte_100)
- Field descriptions and types
- Index definitions
- Common queries with examples
- Migration history
- ERD diagrams (textual)

### docs/arquitetura/MONGODB_DIRECT_ACCESS.md

Must include:
- Architecture overview
- Component diagrams
- Data flow diagrams
- Service interfaces
- Error handling strategy
- Performance optimization techniques

### docs/guias/MONGODB_SETUP.md

Must include:
- Environment setup instructions
- Connection string configuration
- Index creation scripts
- Troubleshooting guide
- MCP chrome-devtools setup

### docs/implementacoes/MIGRACAO_REST_TO_MONGODB.md

Must include:
- Migration steps
- Breaking changes
- Compatibility notes
- Rollback procedure
- Testing checklist
