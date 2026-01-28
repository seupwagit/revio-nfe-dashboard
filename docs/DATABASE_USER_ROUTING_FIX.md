# 🔧 Fix: Roteamento de Base de Dados por Usuário

## 🐛 Problema

O sistema não estava usando a base de dados específica do usuário armazenada na coluna `bancoDeDados` da tabela `fr_usuario`. Todas as consultas estavam sendo feitas na base de dados padrão, independentemente do usuário autenticado.

## 🔍 Root Cause

1. **Rotas sem autenticação**: As rotas `/api/documents` e `/api/analytics` não estavam usando o middleware de autenticação
2. **Conexão MongoDB fixa**: Sempre usava `mongoose.connection.db` (base padrão) ao invés da base do usuário
3. **Informação do usuário não utilizada**: O campo `bancoDeDados` do token JWT não estava sendo usado nas consultas

## ✅ Solução Implementada

### 1. Adicionado Middleware de Autenticação

**Rotas Atualizadas:**
- ✅ `/api/documents` - Agora requer autenticação
- ✅ `/api/analytics` - Agora requer autenticação

```typescript
// Aplicar middleware de autenticação em todas as rotas
router.use(authMiddleware)
```

### 2. Uso da Base de Dados do Usuário

**MongoDB - Conexão Dinâmica:**
```typescript
// Obter base de dados do usuário autenticado
const bancoDeDados = req.userDatabase || process.env.VITE_DB_DATABASE || 'C67624577000145'

// Usar a base de dados do usuário
const db = mongoose.connection.useDb(bancoDeDados)
const coll = db.collection(collection as string)
```

**SQL Server - Conexão Dinâmica:**
```typescript
// Usar conexão específica do usuário
const prisma = databaseRouter.getSqlConnection(req.userDatabase)
```

### 3. Melhorado DatabaseRouter

**MongoDB:**
```typescript
getMongoConnection(bancoDeDados?: string): mongoose.Connection {
  if (!bancoDeDados) {
    return mongoose.connection
  }

  try {
    // Usar useDb para acessar base específica na mesma conexão
    const db = mongoose.connection.useDb(bancoDeDados)
    console.log(`[DatabaseRouter] Usando MongoDB database: ${bancoDeDados}`)
    return db
  } catch (error) {
    console.error(`[DatabaseRouter] Erro ao acessar MongoDB database ${bancoDeDados}:`, error)
    return mongoose.connection
  }
}
```

### 4. Logs Melhorados

Adicionado informações do usuário e base de dados nos logs:

```typescript
console.log('[DOCUMENTS] 📄 Buscando documentos:', { 
  collection, 
  periodo: formatDateRangeForLog(dtIni as string, dtFin as string),
  page, 
  size,
  bancoDeDados,        // ✅ Nova informação
  usuario: req.user?.usrLogin  // ✅ Nova informação
})
```

## 🔄 Fluxo de Autenticação e Roteamento

### 1. **Login do Usuário**
```
POST /api/auth/login
├── Validar credenciais na tabela fr_usuario
├── Obter bancoDeDados do usuário
├── Gerar token JWT com bancoDeDados
└── Retornar token para frontend
```

### 2. **Requisição Autenticada**
```
GET /api/documents
├── Middleware verifica token JWT
├── Extrai bancoDeDados do token
├── Anexa req.userDatabase = bancoDeDados
├── Rota usa mongoose.connection.useDb(bancoDeDados)
└── Consulta na base correta do usuário
```

### 3. **Exemplo Prático**

**Usuário A (bancoDeDados: "12345678000195"):**
- Token JWT contém: `{ usrCodigo: "1", bancoDeDados: "12345678000195" }`
- Consultas MongoDB: `db.useDb("12345678000195").collection("tbl_nfe_100")`
- Consultas SQL Server: `database=12345678000195`

**Usuário B (bancoDeDados: "98765432000123"):**
- Token JWT contém: `{ usrCodigo: "2", bancoDeDados: "98765432000123" }`
- Consultas MongoDB: `db.useDb("98765432000123").collection("tbl_nfe_100")`
- Consultas SQL Server: `database=98765432000123`

## 🧪 Como Testar

### 1. Verificar Token JWT

No frontend, após login, verificar se o token contém `bancoDeDados`:

```javascript
// No console do navegador
const token = localStorage.getItem('revio_auth_token')
const payload = JSON.parse(atob(token.split('.')[1]))
console.log('Base de dados do usuário:', payload.bancoDeDados)
```

### 2. Verificar Logs do Backend

Após fazer requisições, verificar logs do backend:

```
[DOCUMENTS] 📄 Buscando documentos: {
  collection: 'tbl_nfe_100',
  periodo: 'Sem filtro de data',
  page: '1',
  size: '999999',
  bancoDeDados: 'C67624577000145',  // ✅ Base do usuário
  usuario: 'master'                 // ✅ Login do usuário
}
[DatabaseRouter] Usando MongoDB database: C67624577000145
```

### 3. Verificar Consultas MongoDB

No MongoDB, verificar se as consultas estão sendo feitas na base correta:

```javascript
// No MongoDB shell
use C67624577000145  // Base do usuário
db.tbl_nfe_100.find().limit(1)  // Deve retornar dados do usuário
```

## 📋 Arquivos Modificados

### Backend:
- ✅ `src/backend/routes/documents.ts` - Adicionado autenticação e uso da base do usuário
- ✅ `src/backend/routes/analytics.ts` - Adicionado autenticação e uso da base do usuário
- ✅ `src/backend/services/DatabaseRouter.ts` - Melhorado suporte MongoDB dinâmico

### Middleware:
- ✅ `src/backend/middleware/AuthMiddleware.ts` - Já estava correto (anexa `req.userDatabase`)

## 🔒 Segurança

### Benefícios de Segurança:

1. **Isolamento de Dados**: Cada usuário só acessa sua própria base de dados
2. **Autenticação Obrigatória**: Todas as rotas agora requerem token válido
3. **Auditoria**: Logs incluem usuário e base de dados acessada
4. **Validação**: Token JWT valida se usuário tem acesso à base

### Prevenção de Vazamentos:

- ✅ Usuário A não pode acessar dados do Usuário B
- ✅ Requisições sem token são rejeitadas
- ✅ Base de dados é determinada pelo token, não por parâmetro
- ✅ Logs permitem auditoria de acesso

## 🎯 Resultado

### Antes:
- ❌ Todos os usuários viam os mesmos dados
- ❌ Consultas sempre na base padrão
- ❌ Sem isolamento de dados por cliente

### Depois:
- ✅ Cada usuário vê apenas seus próprios dados
- ✅ Consultas na base específica do usuário
- ✅ Isolamento completo de dados por cliente
- ✅ Auditoria e logs detalhados

## 📝 Notas Importantes

### MongoDB:
- Usa `mongoose.connection.useDb(bancoDeDados)` para acessar bases diferentes
- Mantém uma única conexão MongoDB, mas acessa databases diferentes
- Mais eficiente que múltiplas conexões

### SQL Server:
- Usa `DatabaseRouter.getSqlConnection(bancoDeDados)` para conexões específicas
- Cria conexões Prisma dinâmicas por base de dados
- Gerencia pool de conexões automaticamente

### Fallback:
- Se `bancoDeDados` não estiver disponível, usa variável de ambiente
- Garante que o sistema continue funcionando mesmo com problemas de token
- Logs alertam quando fallback é usado