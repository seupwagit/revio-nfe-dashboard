# Documento de Design

## Visão Geral

Este documento descreve o design técnico do sistema de autenticação e autorização multi-tenant para a plataforma Revio. O sistema implementa uma arquitetura onde usuários autenticam contra uma base global (spedrevio) e então acessam bases satélites específicas de clientes. O design inclui gerenciamento de sessão com JWT, roteamento dinâmico de bases de dados, registro de auditoria e funcionalidade de download de documentos com monitoramento em tempo real via Web Workers.

## Arquitetura

### Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Login Page   │  │ Auth Context │  │ Route Guards │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ User Display │  │ Download UI  │  │ Web Worker   │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS + JWT
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend (Express.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Auth Routes  │  │ Auth         │  │ Token        │          │
│  │              │  │ Middleware   │  │ Manager      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Download     │  │ DB Router    │  │ API Logger   │          │
│  │ Routes       │  │              │  │              │          │
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
│ - tbl_api_log            │  │                          │
│ - tbl_nfe_dow            │  │                          │
│ - tbl_nfe_dow_det        │  │                          │
├──────────────────────────┤  ├──────────────────────────┤
│ Bases Satélites          │  │ Bases Satélites          │
│ - {BANCODEDADOS}         │  │ - {BANCODEDADOS}         │
│   (dinâmico por cliente) │  │   (dinâmico por cliente) │
└──────────────────────────┘  └──────────────────────────┘
```

### Fluxo de Autenticação

```
┌──────┐                                                    ┌──────────┐
│Client│                                                    │ Backend  │
└──┬───┘                                                    └────┬─────┘
   │                                                             │
   │ 1. POST /api/auth/login                                    │
   │    { username, password }                                  │
   ├────────────────────────────────────────────────────────────>
   │                                                             │
   │                    2. Validar credenciais                  │
   │                       em fr_usuario                        │
   │                       (base spedrevio)                     │
   │                                                             │
   │                    3. Verificar status=2                   │
   │                                                             │
   │                    4. Verificar permissões                 │
   │                       em fr_usuario_sistema                │
   │                                                             │
   │                    5. Gerar JWT token                      │
   │                       com dados do usuário                 │
   │                                                             │
   │ 6. Response: { token, user, database }                    │
   │<────────────────────────────────────────────────────────────
   │                                                             │
   │ 7. Armazenar token no localStorage                         │
   │                                                             │
   │ 8. Todas as requisições subsequentes                       │
   │    incluem: Authorization: Bearer {token}                  │
   ├────────────────────────────────────────────────────────────>
   │                                                             │
   │                    9. Validar token                        │
   │                    10. Extrair BANCODEDADOS                │
   │                    11. Rotear para base do cliente         │
   │                                                             │
```

## Componentes e Interfaces

### 1. Frontend Components

#### 1.1 AuthContext

```typescript
interface AuthContextType {
  user: User | null
  database: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => boolean
}

interface User {
  usrCodigo: string
  usrNome: string
  usrLogin: string
  bancoDeDados: string
  isAdmin: boolean
}
```

#### 1.2 ProtectedRoute Component

```typescript
interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
}
```

#### 1.3 UserDisplay Component

```typescript
interface UserDisplayProps {
  user: User
  database: string
  onLogout: () => void
}
```

#### 1.4 DownloadManager Component

```typescript
interface DownloadManagerProps {
  selectedKeys: Set<string>
  onDownloadComplete: () => void
}

interface DownloadStatus {
  id: number
  status: '1' | '2' | '3'
  link?: string
  progress: number
}
```

#### 1.5 DownloadMonitor Service (Global)

```typescript
interface DownloadMonitor {
  initialize(usrCodigo: string): void
  shutdown(): void
  isActive(): boolean
  checkPendingDownloads(): Promise<void>
}

// Singleton pattern - uma única instância global
class DownloadMonitorService implements DownloadMonitor {
  private worker: Worker | null
  private usrCodigo: string | null
  private notificationCallback: ((download: DownloadStatus) => void) | null
  
  initialize(usrCodigo: string): void
  shutdown(): void
  isActive(): boolean
  checkPendingDownloads(): Promise<void>
  onDownloadReady(callback: (download: DownloadStatus) => void): void
}
```

### 2. Backend Services

#### 2.1 AuthService

```typescript
interface AuthService {
  validateCredentials(username: string, password: string): Promise<UserData>
  checkDatabaseStatus(usrCodigo: string): Promise<boolean>
  checkPermissions(usrCodigo: string): Promise<Permissions>
  generateToken(userData: UserData): string
  validateToken(token: string): TokenPayload | null
}

interface UserData {
  usrCodigo: string
  usrNome: string
  usrLogin: string
  usrSenha: string
  bancoDeDados: string
  ativo: number
}

interface Permissions {
  ussAcessoExterno: 'S' | 'N'
  ussAcessar: 'S' | 'N'
  ussAdministrador: 'S' | 'N'
}

interface TokenPayload {
  usrCodigo: string
  usrNome: string
  bancoDeDados: string
  isAdmin: boolean
  iat: number
  exp: number
}
```

#### 2.2 DatabaseRouter

```typescript
interface DatabaseRouter {
  getSqlConnection(bancoDeDados: string): PrismaClient
  getMongoConnection(bancoDeDados: string): mongoose.Connection
  resetToGlobal(): void
}

interface ConnectionConfig {
  sqlServer: {
    host: string
    port: number
    user: string
    password: string
    database: string
  }
  mongodb: {
    connectionString: string
    database: string
  }
}
```

#### 2.3 APILogger

```typescript
interface APILogger {
  logRequest(req: Request, usrCodigo?: string): Promise<void>
  logError(error: Error, req: Request, usrCodigo?: string): Promise<void>
  logSuccess(message: string, req: Request, usrCodigo?: string): Promise<void>
}

interface LogEntry {
  dthr: Date
  ip: string
  caminhoAcessado: string
  mensagem: string
  usrCodigo?: number
  tipo: 'INFO' | 'ERROR' | 'FAILED_LOGIN'
}
```

#### 2.4 DownloadService

```typescript
interface DownloadService {
  scheduleDownload(keys: string[], usrCodigo: string): Promise<DownloadRecord>
  getDownloadStatus(usrCodigo: string): Promise<DownloadRecord | null>
  markDownloadStarted(downloadId: number): Promise<void>
}

interface DownloadRecord {
  id: number
  usrCodigo: number
  status: '1' | '2' | '3'
  link?: string
  dthrAdd: Date
  dthrEdit?: Date
  tipoDoc: string
}

interface DownloadDetail {
  idDet: number
  id: number
  chv: string
  status: number
  dthrAdd: Date
}
```

### 3. Middleware

#### 3.1 AuthMiddleware

```typescript
interface AuthMiddleware {
  verifyToken(req: Request, res: Response, next: NextFunction): void
  requireAdmin(req: Request, res: Response, next: NextFunction): void
  attachDatabase(req: Request, res: Response, next: NextFunction): void
}

// Estende Request do Express
interface AuthenticatedRequest extends Request {
  user?: TokenPayload
  dbConnection?: {
    sql: PrismaClient
    mongo: mongoose.Connection
  }
}
```

#### 3.2 ErrorHandler

```typescript
interface ErrorHandler {
  handleError(error: Error, req: Request, res: Response, next: NextFunction): void
  handle401(res: Response, message?: string): void
  handle403(res: Response, message?: string): void
  handle500(res: Response, error: Error): void
}
```

## Modelos de Dados

### SQL Server (Prisma Schema)

```prisma
model FrUsuario {
  usrCodigo           String   @id @map("USR_CODIGO") @db.VarChar(90)
  usrLogin            String   @unique @map("USR_LOGIN") @db.VarChar(180)
  usrSenha            String?  @map("USR_SENHA") @db.VarChar(128)
  usrNome             String   @map("USR_NOME") @db.VarChar(60)
  usrEmail            String?  @map("USR_EMAIL") @db.VarChar(180)
  empresa             String?  @map("EMPRESA") @db.VarChar(90)
  cnpj                String?  @map("CNPJ") @db.VarChar(36)
  ativo               Int?     @map("ATIVO")
  bancoDeDados        String?  @map("BANCODEDADOS") @db.VarChar(90)
  dthrAdd             DateTime? @map("DTHR_ADD")
  dthrEdit            DateTime? @map("DTHR_EDIT")
  
  usuarioSistema      FrUsuarioSistema[]
  
  @@map("fr_usuario")
}

model FrUsuarioSistema {
  usrCodigo           String   @map("USR_CODIGO") @db.VarChar(90)
  sisCodigo           String   @map("SIS_CODIGO") @db.VarChar(3)
  ussAcessoExterno    String?  @map("USS_ACESSO_EXTERNO") @db.VarChar(1)
  ussAdministrador    String?  @map("USS_ADMINISTRADOR") @db.VarChar(1)
  ussAcessar          String?  @map("USS_ACESSAR") @db.VarChar(1)
  dthrAdd             DateTime? @map("DTHR_ADD")
  dthrEdit            DateTime? @map("DTHR_EDIT")
  
  usuario             FrUsuario @relation(fields: [usrCodigo], references: [usrCodigo], onDelete: Cascade)
  
  @@id([usrCodigo, sisCodigo])
  @@map("fr_usuario_sistema")
}

model TblApiLog {
  id                  Int      @id @default(autoincrement()) @map("ID")
  dthr                DateTime @map("DTHR")
  ip                  String?  @map("IP") @db.VarChar(50)
  caminhoAcessado     String?  @map("CAMINHO_ACESSADO") @db.VarChar(255)
  mensagem            String?  @map("MENSAGEM") @db.VarChar(Max)
  usrCodigo           Int?     @map("USR_CODIGO")
  tipo                String?  @map("TIPO") @db.VarChar(20)
  
  @@map("tbl_api_log")
}

model TblNfeDow {
  id                  Int      @id @map("ID")
  usrCodigo           Int?     @map("USR_CODIGO")
  dthrAdd             DateTime? @map("DTHR_ADD")
  dthrEdit            DateTime? @map("DTHR_EDIT")
  status              String?  @map("STATUS") @db.VarChar(10)
  dataInicial         DateTime? @map("DATA_INICIAL")
  dataFinal           DateTime? @map("DATA_FINAL")
  link                String?  @map("LINK") @db.VarChar(540)
  caminho             String?  @map("CAMINHO") @db.VarChar(540)
  tipoDoc             String?  @map("TIPO_DOC") @db.VarChar(10)
  cnpj                String?  @map("CNPJ") @db.VarChar(36)
  cnpj1               String?  @map("CNPJ1") @db.VarChar(36)
  csv                 Int?     @map("CSV") @default(0)
  
  detalhes            TblNfeDowDet[]
  
  @@map("tbl_nfe_dow")
}

model TblNfeDowDet {
  idDet               Int      @id @default(autoincrement()) @map("ID_DET")
  id                  Int      @map("ID")
  chv                 String?  @map("CHV") @db.VarChar(128)
  status              Int?     @map("STATUS")
  dthrAdd             DateTime? @map("DTHR_ADD")
  
  download            TblNfeDow @relation(fields: [id], references: [id], onDelete: Cascade)
  
  @@map("tbl_nfe_dow_det")
}
```

## Propriedades de Correção

*Uma propriedade é uma característica ou comportamento que deve ser verdadeiro em todas as execuções válidas de um sistema - essencialmente, uma declaração formal sobre o que o sistema deve fazer. Propriedades servem como a ponte entre especificações legíveis por humanos e garantias de correção verificáveis por máquina.*

### Propriedade 1: Autenticação requer todas as validações

*Para qualquer* tentativa de login, o sistema deve validar credenciais, status da base de dados (status=2) e permissões (USS_ACESSO_EXTERNO='S' e USS_ACESSAR='S') antes de gerar um token

**Valida: Requisitos 1.1, 1.2, 1.3**

### Propriedade 2: Token contém informações completas do usuário

*Para qualquer* token JWT gerado, ele deve conter usrCodigo, usrNome, bancoDeDados e isAdmin

**Valida: Requisitos 1.4**

### Propriedade 3: Sessão persiste através de recarregamentos

*Para qualquer* sessão válida armazenada, recarregar a página deve restaurar a sessão se o token ainda for válido

**Valida: Requisitos 2.2**

### Propriedade 4: Token expirado limpa sessão

*Para qualquer* token expirado, o sistema deve limpar a sessão e redirecionar para login

**Valida: Requisitos 2.3, 2.4**

### Propriedade 5: Todas as requisições são registradas

*Para qualquer* chamada de API, um registro deve ser criado em tbl_api_log com timestamp, IP, caminho e tipo

**Valida: Requisitos 4.1, 4.2**

### Propriedade 6: Erros não bloqueiam registro

*Para qualquer* falha no registro de log, a requisição original deve completar normalmente

**Valida: Requisitos 4.5**

### Propriedade 7: Fetch inclui token de autenticação

*Para qualquer* requisição fetch (exceto login), o cabeçalho Authorization deve conter o token Bearer

**Valida: Requisitos 5.2**

### Propriedade 8: Erro 401 redireciona para login

*Para qualquer* resposta HTTP 401, o sistema deve limpar a sessão e redirecionar para a página de login

**Valida: Requisitos 5.4, 6.2**

### Propriedade 9: Rotas protegidas verificam token

*Para qualquer* rota protegida acessada, o sistema deve verificar a presença e validade do token antes de permitir acesso

**Valida: Requisitos 7.1, 7.5**

### Propriedade 10: Conexão de base de dados dinâmica

*Para qualquer* usuário autenticado, todas as consultas de base de dados devem usar a conexão específica do cliente baseada em BANCODEDADOS

**Valida: Requisitos 8.1, 8.2, 8.3, 8.4**

### Propriedade 11: Logout reverte para base global

*Para qualquer* logout de usuário, as conexões de base de dados devem reverter para spedrevio

**Valida: Requisitos 8.5**

### Propriedade 12: Permissões admin controlam acesso

*Para qualquer* usuário com USS_ADMINISTRADOR='S', o sistema deve conceder acesso a rotas administrativas; caso contrário, deve retornar 403

**Valida: Requisitos 9.2, 9.4**

### Propriedade 13: Seleção de documentos persiste

*Para qualquer* documento selecionado na grid, a chave deve ser adicionada ao localStorage e persistir através de recarregamentos

**Valida: Requisitos 13.2, 13.4**

### Propriedade 14: Agendamento cria registros pai e filho

*Para qualquer* agendamento de download, o sistema deve criar um registro em tbl_nfe_dow e registros correspondentes em tbl_nfe_dow_det para cada chave

**Valida: Requisitos 14.2, 14.3**

### Propriedade 15: Web Worker monitora status globalmente

*Para qualquer* download agendado, o Web Worker deve fazer polling a cada 30 segundos até que STATUS='2' e LINK esteja preenchido, independente da página em que o usuário está navegando

**Valida: Requisitos 15.2, 15.4, 15.6**

### Propriedade 16: Download automático limpa localStorage

*Para qualquer* download iniciado automaticamente, o sistema deve limpar as chaves do localStorage e atualizar STATUS para '3'

**Valida: Requisitos 16.2, 16.3**

### Propriedade 17: Rotas de download são autenticadas

*Para qualquer* chamada às rotas de API de download, o sistema deve verificar o token e usar a base de dados do cliente autenticado

**Valida: Requisitos 17.1, 17.2, 17.4**

### Propriedade 18: Web Worker persiste entre navegações

*Para qualquer* navegação entre páginas do sistema, o Web Worker deve permanecer ativo e continuar monitorando downloads

**Valida: Requisitos 15.6, 18.3**

### Propriedade 19: Web Worker inicializa no login

*Para qualquer* login bem-sucedido, o sistema deve inicializar o Web Worker e verificar downloads pendentes imediatamente

**Valida: Requisitos 18.1, 18.2**

## Tratamento de Erros

### Erros de Autenticação

| Erro | Código HTTP | Mensagem | Ação |
|------|-------------|----------|------|
| Credenciais inválidas | 401 | "Usuário ou senha inválidos" | Retornar erro, registrar tentativa |
| Status da base != 2 | 403 | "Base de dados do usuário não está pronta" | Retornar erro, registrar tentativa |
| Sem permissão de acesso | 403 | "Usuário não tem permissão para acessar o sistema" | Retornar erro, registrar tentativa |
| Token expirado | 401 | "Sessão expirada" | Limpar sessão, redirecionar para login |
| Token inválido | 401 | "Token inválido" | Limpar sessão, redirecionar para login |

### Erros de Autorização

| Erro | Código HTTP | Mensagem | Ação |
|------|-------------|----------|------|
| Sem token | 401 | "Autenticação necessária" | Redirecionar para login |
| Acesso admin negado | 403 | "Acesso negado: privilégios administrativos necessários" | Retornar erro |
| Base de dados não encontrada | 500 | "Erro ao conectar à base de dados do cliente" | Retornar erro, registrar |

### Erros de Download

| Erro | Código HTTP | Mensagem | Ação |
|------|-------------|----------|------|
| Nenhuma chave selecionada | 400 | "Nenhum documento selecionado para download" | Retornar erro |
| Erro ao criar registro | 500 | "Erro ao agendar download" | Retornar erro, registrar |
| Download não encontrado | 404 | "Download não encontrado" | Retornar erro |
| Erro no Web Worker | 500 | "Erro ao monitorar download" | Registrar erro, continuar monitoramento |

### Tratamento Centralizado

```typescript
class ErrorHandler {
  static handle(error: Error, req: Request, res: Response) {
    // Registrar erro
    apiLogger.logError(error, req, req.user?.usrCodigo)
    
    // Determinar tipo de erro
    if (error instanceof AuthenticationError) {
      return res.status(401).json({
        success: false,
        error: error.message,
        code: 'AUTH_ERROR'
      })
    }
    
    if (error instanceof AuthorizationError) {
      return res.status(403).json({
        success: false,
        error: error.message,
        code: 'AUTHORIZATION_ERROR'
      })
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        success: false,
        error: error.message,
        code: 'VALIDATION_ERROR'
      })
    }
    
    // Erro genérico
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    })
  }
}
```

## Estratégia de Testes

### Testes Unitários

Os testes unitários verificarão exemplos específicos e casos de borda:

1. **AuthService**
   - Validação de credenciais com usuário válido
   - Validação de credenciais com usuário inválido
   - Verificação de status da base de dados
   - Verificação de permissões
   - Geração de token JWT
   - Validação de token JWT válido e expirado

2. **DatabaseRouter**
   - Criação de conexão SQL Server dinâmica
   - Criação de conexão MongoDB dinâmica
   - Reset para base global

3. **APILogger**
   - Registro de requisição bem-sucedida
   - Registro de erro
   - Falha no registro não bloqueia requisição

4. **DownloadService**
   - Agendamento de download com múltiplas chaves
   - Consulta de status de download
   - Atualização de status para '3'

### Testes Baseados em Propriedades

Os testes baseados em propriedades verificarão propriedades universais que devem ser verdadeiras para todas as entradas:

**Biblioteca**: fast-check (JavaScript/TypeScript)
**Configuração**: Mínimo de 100 iterações por teste

1. **Propriedade 1**: Autenticação completa
   - Gerar usuários aleatórios com diferentes combinações de status e permissões
   - Verificar que apenas usuários com status=2, USS_ACESSO_EXTERNO='S' e USS_ACESSAR='S' recebem token

2. **Propriedade 2**: Token contém dados completos
   - Gerar dados de usuário aleatórios
   - Verificar que todos os tokens gerados contêm usrCodigo, usrNome, bancoDeDados e isAdmin

3. **Propriedade 7**: Fetch inclui token
   - Gerar requisições aleatórias (exceto login)
   - Verificar que todas incluem cabeçalho Authorization

4. **Propriedade 10**: Roteamento de base de dados
   - Gerar nomes de base de dados aleatórios
   - Verificar que conexões sempre usam a base correta do BANCODEDADOS

5. **Propriedade 13**: Persistência de seleção
   - Gerar conjuntos aleatórios de chaves
   - Verificar que localStorage mantém exatamente as chaves selecionadas

6. **Propriedade 14**: Criação de registros de download
   - Gerar arrays aleatórios de chaves
   - Verificar que número de registros em tbl_nfe_dow_det é igual ao número de chaves

### Testes de Integração

1. **Fluxo completo de autenticação**
   - Login → Verificação de token → Acesso a rota protegida → Logout

2. **Fluxo completo de download**
   - Seleção de documentos → Agendamento → Monitoramento → Download automático

3. **Troca de base de dados**
   - Login com usuário A → Consulta base A → Logout → Login com usuário B → Consulta base B

### Cobertura de Testes

- Testes unitários: Casos específicos e exemplos concretos
- Testes de propriedade: Validação de regras universais com entradas geradas aleatoriamente
- Testes de integração: Fluxos completos end-to-end

Cada propriedade de correção deve ter pelo menos um teste de propriedade correspondente, marcado com comentário:

```typescript
/**
 * Feature: authentication-authorization-system, Property 1: Autenticação requer todas as validações
 * Valida: Requisitos 1.1, 1.2, 1.3
 */
test('property: authentication requires all validations', async () => {
  await fc.assert(
    fc.asyncProperty(
      userArbitrary,
      async (user) => {
        const result = await authService.validateCredentials(user.username, user.password)
        
        if (result.success) {
          expect(user.status).toBe(2)
          expect(user.permissions.ussAcessoExterno).toBe('S')
          expect(user.permissions.ussAcessar).toBe('S')
        }
      }
    ),
    { numRuns: 100 }
  )
})
```
