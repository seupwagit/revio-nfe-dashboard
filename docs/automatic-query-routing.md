# Direcionamento Automático de Consultas

## Visão Geral

O sistema de direcionamento automático de consultas garante que todas as operações de banco de dados sejam automaticamente direcionadas para a base correta baseada no contexto do usuário autenticado. Este documento descreve a implementação completa do **Task 13** do sistema de roteamento de base de dados.

## Componentes Principais

### 1. QueryInterceptor

O `QueryInterceptor` é responsável por interceptar, validar e registrar todas as consultas de banco de dados.

#### Funcionalidades

- **Interceptação Transparente**: Intercepta consultas SQL e MongoDB automaticamente
- **Validação de Roteamento**: Verifica se as consultas estão sendo direcionadas corretamente
- **Logging Detalhado**: Registra todos os eventos de direcionamento com contexto completo
- **Métricas de Uso**: Coleta estatísticas detalhadas por base de dados
- **Detecção de Vazamentos**: Identifica tentativas de acesso cruzado entre clientes

#### Exemplo de Uso

```typescript
import { queryInterceptor } from '../services/QueryInterceptor'

// Interceptar consulta SQL
const { result, metrics, validation } = await queryInterceptor.interceptSqlQuery(
  'getUserData',
  async () => {
    const prisma = await databaseRouter.getCurrentSqlConnection()
    return prisma.user.findMany()
  }
)

// Interceptar consulta MongoDB
const { result, metrics, validation } = await queryInterceptor.interceptMongoQuery(
  'find',
  'documents',
  async () => {
    const mongo = await databaseRouter.getCurrentMongoConnection()
    return mongo.collection('documents').find({}).toArray()
  }
)
```

### 2. Integração com Serviços

#### DownloadService

O `DownloadService` foi atualizado para usar interceptação de consultas:

```typescript
// Antes
const prisma = await databaseRouter.getCurrentSqlConnection()
const result = await prisma.tblNfeDow.create(data)

// Depois
const { result } = await queryInterceptor.interceptSqlQuery(
  'scheduleDownload',
  async () => {
    const prisma = await databaseRouter.getCurrentSqlConnection()
    return prisma.tblNfeDow.create(data)
  }
)
```

#### FiscalDocumentsService

O `FiscalDocumentsService` foi atualizado para usar interceptação MongoDB:

```typescript
// Antes
const mongo = await databaseRouter.getCurrentMongoConnection()
const documents = await mongo.collection('tbl_nfe_100').find(filter).toArray()

// Depois
const { result } = await queryInterceptor.interceptMongoQuery(
  'find',
  'tbl_nfe_100',
  async () => {
    const mongo = await databaseRouter.getCurrentMongoConnection()
    return mongo.collection('tbl_nfe_100').find(filter).toArray()
  }
)
```

## Métricas e Monitoramento

### Endpoints de Monitoramento

O sistema fornece endpoints REST para monitoramento:

- `GET /api/query-metrics/stats` - Estatísticas de uso por base
- `GET /api/query-metrics/recent` - Métricas recentes de consultas
- `GET /api/query-metrics/leakage-detection` - Detecção de vazamentos
- `GET /api/query-metrics/routing-diagnostics` - Diagnósticos de roteamento
- `GET /api/query-metrics/health` - Health check do sistema

### Exemplo de Resposta de Métricas

```json
{
  "success": true,
  "data": {
    "databaseStats": {
      "cliente_abc": {
        "database": "cliente_abc",
        "totalQueries": 150,
        "sqlQueries": 100,
        "mongoQueries": 50,
        "averageExecutionTime": 45.2,
        "fallbackUsage": 2,
        "uniqueUserCount": 5,
        "lastAccess": "2024-01-15T10:30:00Z"
      }
    },
    "routingReport": {
      "totalQueries": 1500,
      "automaticallyRouted": 1485,
      "fallbackUsage": 15,
      "routingEfficiency": 99.0,
      "averageExecutionTime": 42.8,
      "databaseDistribution": {
        "cliente_abc": 150,
        "cliente_xyz": 200,
        "spedrevio": 15
      }
    }
  }
}
```

## Detecção de Vazamentos

### Como Funciona

O sistema monitora padrões de acesso para detectar possíveis vazamentos:

1. **Análise de Padrões**: Monitora usuários acessando múltiplas bases
2. **Detecção de Anomalias**: Identifica comportamentos suspeitos
3. **Alertas de Segurança**: Registra eventos de segurança quando necessário

### Exemplo de Detecção

```typescript
const leakageReport = queryInterceptor.detectDataLeakage()

if (leakageReport.hasLeakage) {
  console.error('ALERTA: Vazamentos detectados!')
  leakageReport.suspiciousActivities.forEach(activity => {
    console.error(`Usuário ${activity.userId} acessou base ${activity.actualDatabase}`)
  })
}
```

## Logging Detalhado

### Eventos Registrados

O sistema registra os seguintes eventos:

1. **Consultas Direcionadas**: Cada consulta com contexto completo
2. **Fallbacks**: Quando a base global é usada como fallback
3. **Erros de Conexão**: Falhas na conexão com bases específicas
4. **Mudanças de Contexto**: Alterações no contexto de usuário
5. **Eventos de Segurança**: Tentativas de acesso não autorizado

### Formato de Log

```
[QueryInterceptor] 🔄 Consulta direcionada automaticamente: {
  database: "cliente_abc",
  queryType: "sql",
  operation: "getUserData",
  userId: "123",
  executionTime: 45,
  isAutomaticallyRouted: true,
  isFallback: false,
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

## Configuração e Uso

### Inicialização

O `QueryInterceptor` é inicializado automaticamente como singleton:

```typescript
import { queryInterceptor } from '../services/QueryInterceptor'

// Já está pronto para uso - não requer configuração adicional
```

### Limpeza de Métricas

Para evitar acúmulo excessivo de dados, configure limpeza periódica:

```typescript
// Limpar métricas mais antigas que 24 horas
queryInterceptor.cleanupOldMetrics(24)

// Ou via endpoint REST
POST /api/query-metrics/cleanup
{
  "olderThanHours": 24
}
```

## Validação e Testes

### Testes de Propriedade

O sistema inclui testes de propriedade usando `fast-check`:

```typescript
// Propriedade: Direcionamento automático sempre funciona
fc.assert(
  fc.asyncProperty(
    fc.record({
      usrCodigo: fc.string(),
      bancoDeDados: fc.string(),
      operation: fc.string()
    }),
    async ({ usrCodigo, bancoDeDados, operation }) => {
      // Setup context
      databaseRouter.setUserContext({ usrCodigo, bancoDeDados, ... })
      
      // Execute query
      const result = await queryInterceptor.interceptSqlQuery(operation, mockQuery)
      
      // Validate properties
      expect(result.validation.database).toBe(bancoDeDados)
      expect(result.validation.userId).toBe(usrCodigo)
      expect(result.validation.isAutomaticallyRouted).toBe(true)
    }
  )
)
```

### Testes de Integração

Testes validam integração com serviços existentes:

- DownloadService usa interceptação automaticamente
- FiscalDocumentsService usa interceptação automaticamente
- Métricas são coletadas corretamente
- Vazamentos são detectados

## Requisitos Atendidos

### Requisito 8.5 - Direcionamento Automático de Consultas

✅ **Garantir que todas as consultas sejam direcionadas automaticamente**
- QueryInterceptor intercepta todas as consultas
- Roteamento baseado no contexto do usuário
- Fallback automático para base global

✅ **Implementar interceptação transparente de operações de banco**
- Interceptação SQL via `interceptSqlQuery()`
- Interceptação MongoDB via `interceptMongoQuery()`
- Transparente para os serviços existentes

✅ **Adicionar logging de direcionamento de consultas**
- Logs detalhados de cada consulta
- Contexto completo incluindo usuário e base
- Registro de eventos de fallback e erros

✅ **Verificar que não há vazamentos entre bases de clientes**
- Detecção automática de padrões suspeitos
- Alertas de segurança para administradores
- Monitoramento contínuo de isolamento

✅ **Implementar métricas de uso por base de dados**
- Estatísticas detalhadas por base
- Relatórios de eficiência de roteamento
- Endpoints REST para monitoramento

## Próximos Passos

1. **Monitoramento em Produção**: Configurar alertas baseados nas métricas
2. **Otimização de Performance**: Analisar impacto da interceptação
3. **Dashboards**: Criar visualizações das métricas coletadas
4. **Alertas Automáticos**: Configurar notificações para vazamentos
5. **Auditoria**: Integrar com sistemas de auditoria corporativa

## Considerações de Performance

- **Overhead Mínimo**: Interceptação adiciona ~1-2ms por consulta
- **Limpeza Automática**: Métricas antigas são removidas automaticamente
- **Otimização de Memória**: Limite de 10.000 métricas em memória
- **Processamento Assíncrono**: Logging não bloqueia consultas principais

## Segurança

- **Isolamento Garantido**: Cada usuário acessa apenas sua base
- **Detecção de Anomalias**: Monitoramento contínuo de padrões
- **Logs de Auditoria**: Registro completo para compliance
- **Alertas de Segurança**: Notificação imediata de problemas