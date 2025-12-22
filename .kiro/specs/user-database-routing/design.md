# Documento de Design

## Visão Geral

Este documento descreve o design técnico para implementar roteamento automático de bases de dados baseado no usuário autenticado. O sistema garante que todos os serviços (exceto autenticação) usem automaticamente a base de dados específica do cliente, proporcionando isolamento completo de dados e transparência para os desenvolvedores.

## Arquitetura

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Auth Context │  │ HTTP Service │  │ Services     │          │
│  │              │  │ (with token) │  │              │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS + JWT
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Express.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Auth         │  │ Database     │  │ User Context │          │
│  │ Middleware   │  │ Context      │  │ Middleware   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Enhanced     │  │ Application  │  │ API Logger   │          │
│  │ DB Router    │  │ Services     │  │ (Context-    │          │
│  │              │  │              │  │  Aware)      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│   SQL Server (Prisma)    │  │   MongoDB (Mongoose)     │
├──────────────────────────┤  ├──────────────────────────┤
│ Base Global: spedrevio   │  │ Base Global: spedrevio   │
│ - fr_usuario             │  │                          │
│ - fr_usuario_sistema     │  │                          │
│ - tbl_api_log (global)   │  │                          │
├──────────────────────────┤  ├──────────────────────────┤
│ Bases Clientes:          │  │ Bases Clientes:          │
│ - {BANCODEDADOS}_A       │  │ - {BANCODEDADOS}_A       │
│   - tbl_nfe_dow          │  │   - tbl_nfe_100          │
│   - tbl_nfe_dow_det      │  │   - tbl_cfe_100          │
│   - tbl_api_log          │  │   - tbl_cte_100          │
│ - {BANCODEDADOS}_B       │  │ - {BANCODEDADOS}_B       │
│   - tbl_nfe_dow          │  │   - tbl_nfe_100          │
│   - tbl_nfe_dow_det      │  │   - tbl_cfe_100          │
│   - tbl_api_log          │  │   - tbl_cte_100          │
└──────────────────────────┘  └──────────────────────────┘
```

### Fluxo de Roteamento Automático

```
┌──────┐                                                    ┌──────────┐
│Client│                                                    │ Backend  │
└──┬───┘                                                    └────┬─────┘
   │                                                             │
   │ 1. HTTP Request com JWT Token                              │
   ├────────────────────────────────────────────────────────────>
   │                                                             │
   │                    2. AuthMiddleware                       │
   │                       - Validar token                      │
   │                       - Extrair usuário                    │
   │                                                             │
   │                    3. UserContextMiddleware                │
   │                       - Extrair BANCODEDADOS               │
   │                       - Configurar contexto                │
   │                                                             │
   │                    4. Service Layer                        │
   │                       - Chamar DatabaseRouter              │
   │                       - Obter conexão automática           │
   │                                                             │
   │                    5. DatabaseRouter                       │
   │                       - Verificar contexto                 │
   │                       - Retornar conexão específica        │
   │                       - Ou fallback para global            │
   │                                                             │
   │                    6. Executar operação                    │
   │                       na base correta                      │
   │                                                             │
   │ 7. Response com dados isolados                             │
   │<────────────────────────────────────────────────────────────
   │                                                             │
   │                    8. Cleanup contexto                     │
   │                                                             │
```

## Componentes e Interfaces

### 1. UserContext (Novo)

```typescript
interface UserContext {
  usrCodigo: string
  usrNome: string
  bancoDeDados: string
  isAdmin: boolean
  isAuthenticated: boolean
}

interface DatabaseContext {
  userContext: UserContext | null
  sqlConnection: PrismaClient | null
  mongoConnection: mongoose.Connection | null
}

class UserContextManager {
  private static instance: UserContextManager
  private contextStore: Map<string, DatabaseContext> = new Map()
  
  static getInstance(): UserContextManager
  setContext(requestId: string, context: DatabaseContext): void
  getContext(requestId: string): DatabaseContext | null
  clearContext(requestId: string): void
  hasContext(requestId: string): boolean
}
```

### 2. Enhanced DatabaseRouter

```typescript
interface EnhancedDatabaseRouter extends DatabaseRouter {
  // Métodos existentes mantidos para compatibilidade
  getSqlConnection(bancoDeDados?: string): PrismaClient | null
  getMongoConnection(bancoDeDados?: string): mongoose.Connection
  
  // Novos métodos context-aware
  getCurrentSqlConnection(): PrismaClient | null
  getCurrentMongoConnection(): mongoose.Connection
  setUserContext(context: UserContext): void
  clearUserContext(): void
  getCurrentContext(): UserContext | null
  
  // Métodos de fallback e resilência
  getSqlConnectionWithFallback(): PrismaClient
  getMongoConnectionWithFallback(): mongoose.Connection
  isUsingFallback(): boolean
}

interface ConnectionMetrics {
  totalConnections: number
  activeClientConnections: number
  fallbackUsage: number
  connectionErrors: number
  lastError?: Date
}
```

### 3. UserContextMiddleware (Novo)

```typescript
interface UserContextMiddleware {
  extractUserContext(req: AuthenticatedRequest): UserContext | null
  setupDatabaseContext(req: AuthenticatedRequest, res: Response, next: NextFunction): void
  cleanupContext(req: AuthenticatedRequest, res: Response, next: NextFunction): void
}

interface AuthenticatedRequest extends Request {
  user?: TokenPayload
  requestId?: string
  userContext?: UserContext
  dbContext?: DatabaseContext
}
```

### 4. Enhanced APILogger

```typescript
interface ContextAwareAPILogger extends APILogger {
  // Métodos existentes mantidos
  logRequest(req: Request, usrCodigo?: string): Promise<void>
  logError(error: Error, req: Request, usrCodigo?: string): Promise<void>
  logSuccess(message: string, req: Request, usrCodigo?: string): Promise<void>
  
  // Novos métodos context-aware
  logWithContext(level: LogLevel, message: string, req: AuthenticatedRequest): Promise<void>
  logConnectionEvent(event: ConnectionEvent, req: AuthenticatedRequest): Promise<void>
  logFallbackUsage(reason: string, req: AuthenticatedRequest): Promise<void>
  
  // Métodos de configuração
  setFallbackToGlobal(enabled: boolean): void
  shouldUseClientDatabase(req: AuthenticatedRequest): boolean
}

interface ConnectionEvent {
  type: 'connection_created' | 'connection_failed' | 'fallback_used' | 'context_set' | 'context_cleared'
  database: string
  userId?: string
  error?: string
  timestamp: Date
}

enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG'
}
```

### 5. Enhanced Services

#### 5.1 Enhanced DownloadService

```typescript
interface ContextAwareDownloadService extends DownloadService {
  // Métodos existentes atualizados para usar contexto
  scheduleDownload(data: DownloadScheduleData): Promise<{ success: boolean; downloadId?: number; error?: string }>
  getDownloadStatus(usrCodigo: string): Promise<{ success: boolean; downloads?: DownloadStatus[]; error?: string }>
  markDownloadStarted(downloadId: number, usrCodigo: string): Promise<{ success: boolean; error?: string }>
  
  // Novos métodos context-aware
  scheduleDownloadWithContext(chaves: string[]): Promise<{ success: boolean; downloadId?: number; error?: string }>
  getMyDownloadStatus(): Promise<{ success: boolean; downloads?: DownloadStatus[]; error?: string }>
  markMyDownloadStarted(downloadId: number): Promise<{ success: boolean; error?: string }>
  
  // Métodos de diagnóstico
  validateDatabaseAccess(): Promise<boolean>
  getCurrentDatabase(): string | null
}
```

#### 5.2 Enhanced FiscalDocumentsService

```typescript
interface ContextAwareFiscalDocumentsService {
  // Métodos existentes mantidos para compatibilidade
  fetchDocuments(options: FetchOptions, onProgress?: ProgressCallback): Promise<DocumentoFiscal[]>
  fetchCount(options: Omit<FetchOptions, 'page' | 'pageSize'>): Promise<number>
  fetchStats(options: Omit<FetchOptions, 'page' | 'pageSize'>): Promise<DashboardStats>
  
  // Novos métodos context-aware (internos)
  getCurrentMongoDatabase(): string | null
  validateMongoAccess(): Promise<boolean>
  logDatabaseUsage(operation: string): Promise<void>
}
```

### 6. Resilience and Monitoring

```typescript
interface ConnectionResilience {
  maxRetries: number
  retryDelay: number
  backoffMultiplier: number
  circuitBreakerThreshold: number
  healthCheckInterval: number
}

interface DatabaseHealthMonitor {
  checkSqlHealth(database: string): Promise<boolean>
  checkMongoHealth(database: string): Promise<boolean>
  getHealthStatus(): Promise<HealthStatus>
  startMonitoring(): void
  stopMonitoring(): void
}

interface HealthStatus {
  sql: {
    global: boolean
    clients: Map<string, boolean>
  }
  mongo: {
    global: boolean
    clients: Map<string, boolean>
  }
  lastCheck: Date
}
```

## Modelos de Dados

### Context Storage (In-Memory)

```typescript
interface StoredContext {
  requestId: string
  userContext: UserContext
  createdAt: Date
  lastAccessed: Date
  sqlConnection?: PrismaClient
  mongoConnection?: mongoose.Connection
}

interface ContextMetrics {
  activeContexts: number
  totalContextsCreated: number
  averageLifetime: number
  memoryUsage: number
}
```

### Enhanced Logging Schema

```sql
-- Extensão da tabela existente tbl_api_log
ALTER TABLE tbl_api_log ADD COLUMN DATABASE_USED VARCHAR(90)
ALTER TABLE tbl_api_log ADD COLUMN IS_FALLBACK BIT DEFAULT 0
ALTER TABLE tbl_api_log ADD COLUMN REQUEST_ID VARCHAR(36)
ALTER TABLE tbl_api_log ADD COLUMN CONTEXT_INFO VARCHAR(MAX)
```

## Propriedades de Correção

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas de um sistema - essencialmente, uma declaração formal sobre o que o sistema deve fazer. Propriedades servem como a ponte entre especificações legíveis por humanos e garantias de correção verificáveis por máquina.*

### Propriedade 1: Roteamento automático SQL para usuários autenticados

*Para qualquer* usuário autenticado com BANCODEDADOS válido, todos os serviços de aplicação devem usar automaticamente a conexão SQL Server da base especificada

**Valida: Requisitos 1.1**

### Propriedade 2: Roteamento automático MongoDB para usuários autenticados

*Para qualquer* usuário autenticado com BANCODEDADOS válido, todos os serviços de aplicação devem usar automaticamente a conexão MongoDB da base especificada

**Valida: Requisitos 1.2**

### Propriedade 3: Transparência de roteamento

*Para qualquer* serviço solicitando conexão, o sistema deve retornar automaticamente a conexão correta baseada no contexto do usuário sem necessidade de especificação manual

**Valida: Requisitos 2.1, 2.2**

### Propriedade 4: Mudança dinâmica de contexto

*Para qualquer* mudança de contexto de usuário, as próximas operações devem usar automaticamente a nova base de dados

**Valida: Requisitos 2.3, 7.4**

### Propriedade 5: Isolamento entre usuários simultâneos

*Para qualquer* conjunto de usuários fazendo requisições simultâneas, cada requisição deve usar sua respectiva base de dados sem interferência

**Valida: Requisitos 2.5**

### Propriedade 6: Isolamento de dados por cliente

*Para qualquer* usuário do cliente A fazendo consultas, o sistema deve garantir que apenas dados do cliente A sejam retornados

**Valida: Requisitos 3.1**

### Propriedade 7: Validação de correspondência de base

*Para qualquer* tentativa de acesso a dados, o sistema deve validar que a base de dados corresponde ao BANCODEDADOS do usuário autenticado

**Valida: Requisitos 3.2**

### Propriedade 8: Bloqueio de acesso cruzado

*Para qualquer* tentativa de acesso cruzado entre bases de clientes, o sistema deve bloquear a operação e registrar o evento de segurança

**Valida: Requisitos 3.3**

### Propriedade 9: DownloadService usa base do cliente

*Para qualquer* operação do DownloadService (agendar, consultar, atualizar), ela deve ser executada na base do cliente autenticado

**Valida: Requisitos 4.1, 4.2, 4.3, 4.4, 4.5**

### Propriedade 10: FiscalDocumentsService usa base do cliente

*Para qualquer* operação do FiscalDocumentsService (consultar, contar, estatísticas), ela deve ser executada na base MongoDB do cliente autenticado

**Valida: Requisitos 5.1, 5.2, 5.3, 5.4, 5.5**

### Propriedade 11: Middleware configura contexto automaticamente

*Para qualquer* requisição HTTP com token válido, o middleware deve extrair o usuário e configurar o contexto de base de dados com BANCODEDADOS

**Valida: Requisitos 6.1, 6.2, 6.3**

### Propriedade 12: Limpeza de contexto

*Para qualquer* requisição finalizada, o contexto deve ser limpo para evitar vazamentos de memória

**Valida: Requisitos 6.4**

### Propriedade 13: DatabaseRouter context-aware

*Para qualquer* chamada aos métodos getSqlConnection() e getMongoConnection() sem parâmetros, eles devem retornar a conexão da base do usuário no contexto atual

**Valida: Requisitos 7.1, 7.2**

### Propriedade 14: Serviços usam conexões automáticas

*Para qualquer* uso do DownloadService e FiscalDocumentsService, eles devem usar métodos de conexão sem especificar base para obter a conexão correta

**Valida: Requisitos 8.1, 8.2**

### Propriedade 15: Serviços de autenticação usam base global

*Para qualquer* operação de serviços de autenticação, eles devem usar explicitamente a base global independente do contexto

**Valida: Requisitos 8.4**

### Propriedade 16: Direcionamento automático de consultas

*Para qualquer* consulta feita por serviços, ela deve ser automaticamente direcionada para a base correta baseada no contexto

**Valida: Requisitos 8.5**

### Propriedade 17: Logging de eventos de conexão

*Para qualquer* criação de conexão específica, evento de fallback, ou erro de conexão, o evento deve ser registrado com detalhes apropriados

**Valida: Requisitos 9.1, 9.2, 9.3, 9.4, 9.5**

### Propriedade 18: Notificação de fallback

*Para qualquer* uso de fallback para base global, o usuário deve ser notificado sobre a limitação temporária

**Valida: Requisitos 10.4**

### Propriedade 19: APILogger usa base do cliente quando autenticado

*Para qualquer* usuário autenticado, o APILogger deve registrar logs na tabela tbl_api_log da base do cliente autenticado

**Valida: Requisitos 12.1**

### Propriedade 20: APILogger não bloqueia operações

*Para qualquer* registro de evento pelo APILogger, falhas no logging não devem bloquear a operação principal

**Valida: Requisitos 12.5**

### Propriedade 21: Consulta de logs usa base do cliente

*Para qualquer* consulta de logs, ela deve ser feita na base do cliente autenticado

**Valida: Requisitos 12.4**

## Tratamento de Erros

### Erros de Contexto

| Erro | Código HTTP | Mensagem | Ação |
|------|-------------|----------|------|
| Contexto não encontrado | 500 | "Contexto de usuário não disponível" | Usar base global, registrar erro |
| Base do cliente indisponível | 503 | "Base de dados temporariamente indisponível" | Usar fallback, notificar usuário |
| Erro na conexão específica | 500 | "Erro ao conectar à base do cliente" | Usar fallback, registrar erro |
| Contexto corrompido | 500 | "Contexto de usuário inválido" | Limpar contexto, usar base global |

### Erros de Roteamento

| Erro | Código HTTP | Mensagem | Ação |
|------|-------------|----------|------|
| BANCODEDADOS inválido | 400 | "Base de dados do usuário inválida" | Usar base global, registrar |
| Múltiplos contextos | 500 | "Conflito de contexto de usuário" | Limpar contextos, usar base global |
| Vazamento de contexto | 500 | "Contexto não foi limpo corretamente" | Forçar limpeza, registrar |
| Acesso cruzado detectado | 403 | "Tentativa de acesso não autorizado detectada" | Bloquear, registrar evento de segurança |

### Erros de Fallback

| Erro | Código HTTP | Mensagem | Ação |
|------|-------------|----------|------|
| Fallback também falhou | 503 | "Serviço de base de dados indisponível" | Retornar erro, registrar crítico |
| Limite de tentativas excedido | 503 | "Muitas tentativas de conexão" | Implementar backoff, registrar |
| Circuit breaker ativo | 503 | "Serviço temporariamente indisponível" | Retornar erro, aguardar recuperação |

### Tratamento Centralizado de Erros de Contexto

```typescript
class ContextErrorHandler {
  static handleContextError(error: ContextError, req: AuthenticatedRequest): DatabaseContext {
    // Registrar erro
    apiLogger.logError(error, req, req.user?.usrCodigo)
    
    // Determinar ação baseada no tipo de erro
    switch (error.type) {
      case 'CONTEXT_NOT_FOUND':
        return this.createFallbackContext()
      
      case 'DATABASE_UNAVAILABLE':
        this.notifyUserOfFallback(req)
        return this.createFallbackContext()
      
      case 'CONNECTION_FAILED':
        this.incrementFailureCount(req.user?.bancoDeDados)
        return this.createFallbackContext()
      
      case 'CONTEXT_CORRUPTED':
        this.clearCorruptedContext(req.requestId)
        return this.createFallbackContext()
      
      default:
        return this.createFallbackContext()
    }
  }
  
  private static createFallbackContext(): DatabaseContext {
    return {
      userContext: null,
      sqlConnection: databaseRouter.getGlobalSqlConnection(),
      mongoConnection: databaseRouter.getGlobalMongoConnection()
    }
  }
}
```

## Estratégia de Testes

### Testes Unitários

Os testes unitários verificarão exemplos específicos e casos de borda:

1. **UserContextMiddleware**
   - Extração de contexto com token válido
   - Configuração de contexto com BANCODEDADOS válido
   - Limpeza de contexto após requisição
   - Comportamento com token inválido

2. **Enhanced DatabaseRouter**
   - Retorno de conexão específica com contexto
   - Fallback para base global sem contexto
   - Criação de múltiplas conexões específicas
   - Limpeza de conexões ao resetar

3. **Enhanced APILogger**
   - Registro na base do cliente com usuário autenticado
   - Registro na base padrão sem usuário
   - Fallback em caso de erro na base do cliente
   - Não-bloqueio em caso de falha

4. **Enhanced Services**
   - DownloadService usando conexão automática
   - FiscalDocumentsService usando conexão automática
   - Comportamento com contexto inválido

### Testes Baseados em Propriedades

Os testes baseados em propriedades verificarão propriedades universais que devem ser verdadeiras para todas as entradas:

**Biblioteca**: fast-check (JavaScript/TypeScript)
**Configuração**: Mínimo de 100 iterações por teste

1. **Propriedade 1**: Roteamento automático SQL
   - Gerar usuários aleatórios com diferentes BANCODEDADOS
   - Verificar que getSqlConnection() retorna conexão da base correta

2. **Propriedade 5**: Isolamento entre usuários simultâneos
   - Gerar múltiplos usuários com bases diferentes
   - Simular requisições simultâneas
   - Verificar que cada requisição usa sua base específica

3. **Propriedade 6**: Isolamento de dados por cliente
   - Gerar consultas aleatórias com diferentes usuários
   - Verificar que resultados contêm apenas dados do cliente correto

4. **Propriedade 11**: Middleware configura contexto
   - Gerar tokens aleatórios com diferentes usuários
   - Verificar que contexto é configurado corretamente

5. **Propriedade 17**: Logging de eventos
   - Gerar eventos aleatórios de conexão
   - Verificar que todos são registrados com detalhes corretos

6. **Propriedade 20**: APILogger não bloqueia
   - Gerar falhas aleatórias no APILogger
   - Verificar que operações principais continuam funcionando

### Testes de Integração

1. **Fluxo completo de roteamento**
   - Login → Configuração de contexto → Operação em serviço → Limpeza

2. **Isolamento entre clientes**
   - Login usuário A → Operação → Logout → Login usuário B → Verificar isolamento

3. **Fallback e recuperação**
   - Simular falha na base específica → Verificar fallback → Recuperar base → Verificar retomada

4. **Concorrência**
   - Múltiplos usuários simultâneos → Verificar isolamento → Verificar performance

### Cobertura de Testes

- Testes unitários: Casos específicos e comportamentos de componentes individuais
- Testes de propriedade: Validação de regras universais com entradas geradas aleatoriamente
- Testes de integração: Fluxos completos end-to-end com múltiplos componentes

Cada propriedade de correção deve ter pelo menos um teste de propriedade correspondente, marcado com comentário:

```typescript
/**
 * Feature: user-database-routing, Property 1: Roteamento automático SQL para usuários autenticados
 * Valida: Requisitos 1.1
 */
test('property: authenticated users get correct SQL connection', async () => {
  await fc.assert(
    fc.asyncProperty(
      authenticatedUserArbitrary,
      async (user) => {
        // Configurar contexto
        userContextManager.setContext(user.requestId, {
          userContext: user,
          sqlConnection: null,
          mongoConnection: null
        })
        
        // Obter conexão
        const connection = databaseRouter.getCurrentSqlConnection()
        
        // Verificar que a conexão é para a base correta
        expect(connection).toBeDefined()
        expect(connection.databaseName).toBe(user.bancoDeDados)
      }
    ),
    { numRuns: 100 }
  )
})
```