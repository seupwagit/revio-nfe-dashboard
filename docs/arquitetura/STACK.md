# 📚 Stack Tecnológica Completa

## 🎨 Frontend

### Core
- **React 18.3.1** - Biblioteca UI
- **TypeScript 5.6.2** - Linguagem tipada
- **Vite 5.4.2** - Build tool e dev server
- **React Router DOM 6.26.1** - Roteamento SPA

### UI/Styling
- **Tailwind CSS 3.4.10** - Framework CSS utility-first
- **Lucide React 0.441.0** - Ícones modernos
- **PostCSS 8.4.45** - Processador CSS
- **Autoprefixer 10.4.20** - Compatibilidade CSS

### Visualização de Dados
- **Recharts 3.5.1** - Gráficos e charts
- **TanStack React Table 8.21.3** - Tabelas avançadas
- **React Arborist 3.4.0** - Componente de árvore

### HTTP/API
- **Axios 1.13.2** - Cliente HTTP com interceptors

### Markdown & Documentação
- **React Markdown 9.0.1** - Renderização Markdown
- **Remark GFM 4.0.0** - GitHub Flavored Markdown

### Exportação
- **XLSX 0.18.5** - Exportar para Excel

## 🔧 Backend (Backoffice)

### Runtime & Framework
- **Node.js v22.18.0** - Runtime JavaScript/TypeScript
- **Express 4.18.2** - Framework web minimalista
- **TypeScript 5.6.2** - Linguagem tipada no backend
- **CORS 2.8.5** - Cross-Origin Resource Sharing

### Database - Documentos (MongoDB)
- **Mongoose 8.x** - ODM para MongoDB
  - Schemas e validação
  - Middleware e hooks
  - Queries tipadas
  - Conexão gerenciada

### Database - Configurações (SQL Server)
- **Prisma 5.x** - ORM moderno
  - Type-safe queries
  - Migrations automáticas
  - Schema declarativo
  - Suporte a SQL Server em Linux

### Configuração
- **Dotenv 17.2.3** - Variáveis de ambiente

## 🗄️ Bancos de Dados

### MongoDB (Documentos Fiscais)
- **Driver**: Mongoose
- **Host**: 10.0.0.8:27017
- **Database**: C67624577000145
- **Collections**:
  - `tbl_nfe_100` - Notas Fiscais Eletrônicas
  - `tbl_cfe_100` - Cupons Fiscais Eletrônicos
  - `tbl_cte_100` - Conhecimentos de Transporte
- **Autenticação**: SCRAM-SHA-256
- **Uso**: Armazenamento de documentos fiscais

### SQL Server (Configurações)
- **Driver**: Prisma
- **Plataforma**: Linux
- **Uso**: Configurações, usuários, auditoria
- **Tabelas**:
  - `configurations` - Configurações do sistema
  - `users` - Usuários e permissões
  - `audit_logs` - Logs de auditoria

## 🏗️ Arquitetura

### Estrutura de Diretórios

```
project/
├── src/                      # Frontend React
│   ├── components/           # Componentes reutilizáveis
│   ├── pages/                # Páginas/Rotas
│   ├── services/             # Serviços (API, cache)
│   ├── contexts/             # Context API
│   ├── types/                # TypeScript types
│   ├── utils/                # Utilitários
│   └── config/               # Configurações
│
├── server/                   # Backend
│   └── backoffice/           # Servidor principal
│       ├── index.ts          # Entry point
│       ├── database/         # Conexões DB
│       │   ├── mongodb.ts    # Mongoose
│       │   └── prisma.ts     # Prisma
│       └── routes/           # Rotas API
│           ├── health.ts     # Health checks
│           ├── analytics.ts  # Analytics
│           └── documents.ts  # Documentos
│
├── prisma/                   # Prisma ORM
│   └── schema.prisma         # Schema SQL Server
│
├── scripts/                  # Scripts auxiliares
│   └── [organizados em subdiretórios]
│
├── docs/                     # Documentação
│   ├── STACK.md              # Este arquivo
│   ├── ARCHITECTURE.md       # Arquitetura
│   └── API.md                # Documentação API
│
├── public/                   # Assets estáticos
└── tests/                    # Testes
```

### Portas

| Serviço | Porta | Descrição |
|---------|-------|-----------|
| Frontend (Vite) | 3000 | Dev server React |
| Backoffice | 3000 | API Node.js |
| MongoDB | 27017 | Banco de documentos |
| SQL Server | 1433 | Banco de configurações |

### Fluxo de Dados

```
┌─────────────┐
│   React     │
│  (Frontend) │
│  Porta 3000 │
└──────┬──────┘
       │ HTTP/REST
       ↓
┌─────────────┐
│  Backoffice │
│  (Node.js)  │
│  Porta 3000 │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
       ↓             ↓
┌──────────┐  ┌────────────┐
│ MongoDB  │  │ SQL Server │
│ Mongoose │  │   Prisma   │
│ :27017   │  │   :1433    │
└──────────┘  └────────────┘
```

## 🔌 APIs e Integrações

### API REST Revio (Externa)
- **Base URL**: `/api`
- **Endpoints**:
  - `/WebView/Consultar` - Buscar documentos
  - `/WebView/ContadorConsulta` - Contar documentos
- **Autenticação**: Bearer Token (JWT)

### Backoffice API (Interna)
- **Base URL**: `http://localhost:3000/api`
- **Endpoints**:
  - `GET /health` - Status geral
  - `GET /health/mongodb` - Status MongoDB
  - `GET /health/prisma` - Status SQL Server
  - `POST /analytics/aggregate` - Agregações
  - `GET /documents` - Buscar documentos
  - `GET /documents/count` - Contar documentos

### Google Gemini API
- **Uso**: Busca Natural e RAH (Revio Agent Helper)

## 🎯 Features Implementadas

### Cache & Performance
- **StreamingCache** - Cache em memória (90min TTL)
- **LocalStorage** - Persistência de cache
- **Paginação Incremental** - Carrega em chunks
- **UI Progressiva** - Atualiza conforme dados chegam

### Analytics
- **3 Telas**:
  1. Analytics MongoDB (conexão direta)
  2. Analytics API (API REST)
  3. Analytics API Agregado (otimizado)

### Gráficos
- Faturamento Diário (Área)
- Evolução Mensal (Linha)
- Top Emitentes (Barra)
- Distribuição por Tipo (Pizza)
- Status das Notas (Barra)

## 🛠️ Dev Tools

### Linting & Formatting
- **ESLint 8.57.0** - Linter JavaScript/TypeScript
- **@typescript-eslint** - Parser e plugin TypeScript

### Build & Bundling
- **TypeScript Compiler** - Transpilação
- **Vite** - Bundling, HMR, code splitting

### Database Tools
- **Prisma CLI** - Migrations e gerenciamento
- **MongoDB Compass** - GUI para MongoDB

## 📦 Scripts NPM

```json
{
  "dev": "vite",                    // Frontend dev server
  "build": "tsc && vite build",     // Build produção
  "backoffice": "tsx server/backoffice/index.ts",  // Backoffice server
  "prisma:generate": "prisma generate",  // Gerar Prisma Client
  "prisma:migrate": "prisma migrate dev",  // Rodar migrations
  "prisma:studio": "prisma studio"  // GUI Prisma
}
```

## 🔐 Segurança

### Autenticação & Autorização
- **JWT Bearer Token** - API externa
- **CORS** - Configurado no servidor
- **Environment Variables** - Credenciais no .env

### Database Security
- **MongoDB**: SCRAM-SHA-256 authentication
- **SQL Server**: Encrypted connections
- **Prisma**: Prepared statements (SQL injection protection)
- **Mongoose**: Schema validation

### Best Practices
- ✅ Credenciais em .env (não commitadas)
- ✅ Conexões criptografadas
- ✅ Validação de entrada
- ✅ Rate limiting (planejado)
- ✅ Logs de auditoria

## 📊 Performance

### Otimizações Frontend
- **Code Splitting** - Vite automático
- **Lazy Loading** - Componentes sob demanda
- **Memoization** - React.memo nos gráficos
- **Cache Persistente** - 90 minutos TTL

### Otimizações Backend
- **Connection Pooling** - Mongoose e Prisma
- **Indexes** - MongoDB otimizado
- **Aggregation Pipeline** - Queries eficientes
- **Streaming** - Dados incrementais

### Métricas Esperadas
- **MongoDB Direto**: 2-5s (agregações)
- **API REST**: 5-30s (dependendo do período)
- **Cache Hit**: <100ms
- **SQL Server**: <50ms (configurações)

## 🚀 Deployment

### Frontend
- **Build**: `npm run build`
- **Output**: `dist/`
- **Deploy**: Nginx, Vercel, Netlify

### Backend
- **Build**: `tsc`
- **Output**: `dist/server/`
- **Deploy**: PM2, Docker, Kubernetes

### Databases
- **MongoDB**: Replica Set recomendado
- **SQL Server**: Always On (Linux)

## 📝 Convenções

### Organização de Scripts
- ❌ **NÃO** colocar scripts `.js` ou `.cjs` na raiz
- ❌ **NÃO** colocar scripts na raiz de `src/`
- ✅ **SIM** organizar em `scripts/` com subdiretórios
- ✅ **SIM** usar TypeScript quando possível

### Nomenclatura
- **Componentes**: PascalCase (`UserProfile.tsx`)
- **Arquivos**: camelCase (`userService.ts`)
- **Constantes**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Interfaces**: PascalCase com `I` prefix (`IUser`)

### Commits
- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **docs**: Documentação
- **refactor**: Refatoração
- **perf**: Performance
- **test**: Testes

## 🔄 Roadmap

### Próximas Implementações
- [ ] Autenticação JWT própria
- [ ] Rate limiting
- [ ] WebSockets para real-time
- [ ] Redis para cache distribuído
- [ ] Testes automatizados (Jest, Vitest)
- [ ] CI/CD pipeline
- [ ] Docker compose
- [ ] Kubernetes manifests

---

**Versão**: 1.0.0  
**Última Atualização**: 02/12/2024  
**Mantido por**: Equipe Revio
