# FiscalDocumentsService - Documentação

## Visão Geral

O `FiscalDocumentsService` é um serviço backend que gerencia operações com documentos fiscais (NF-e, CF-e, CT-e) usando **roteamento automático de base de dados** baseado no contexto do usuário autenticado.

## Características Principais

### 1. Roteamento Automático
- Usa `databaseRouter.getCurrentMongoConnection()` para obter automaticamente a conexão MongoDB da base do usuário autenticado
- Não requer especificação manual da base de dados
- Implementa fallback automático para base global quando necessário

### 2. Validação de Acesso
- Valida acesso à base MongoDB antes de executar operações
- Testa conectividade usando `ping()` do MongoDB
- Registra erros de acesso para auditoria

### 3. Logging de Uso
- Registra todas as operações realizadas
- Inclui informações sobre qual base de dados foi usada
- Integra com APILogger para auditoria completa

### 4. Métodos de Diagnóstico
- `getCurrentDatabase()`: Retorna o nome da base de dados atual
- `validateMongoAccess()`: Valida se tem acesso à base MongoDB
- `logDatabaseUsage()`: Registra uso da base para auditoria

## Métodos Públicos

### fetchDocuments(options: FetchOptions): Promise<DocumentsResponse>
Busca documentos fiscais com paginação e filtros.

**Parâmetros:**
- `collection`: Nome da coleção (tbl_nfe_100, tbl_cfe_100, tbl_cte_100)
- `dtIni`: Data inicial (formato: YYYY-MM-DD)
- `dtFin`: Data final (formato: YYYY-MM-DD)
- `cnpjEmit`: CNPJ do emitente
- `cnpjDest`: CNPJ do destinatário
- `status`: Status do documento
- `page`: Número da página (padrão: 1)
- `size`: Tamanho da página (padrão: 100)

**Retorna:**
```typescript
{
  success: boolean
  data: DocumentoFiscal[]
  pagination: {
    page: number
    size: number
    total: number
    totalPages: number
  }
  executionTime: number
}
```

### fetchCount(options: Omit<FetchOptions, 'page' | 'size'>): Promise<CountResponse>
Conta documentos fiscais com filtros.

**Retorna:**
```typescript
{
  success: boolean
  count: number
}
```

### fetchStats(options: Omit<FetchOptions, 'page' | 'size'>): Promise<StatsResponse>
Busca estatísticas agregadas de documentos fiscais.

**Retorna:**
```typescript
{
  success: boolean
  stats: {
    totalDocuments: number
    totalValue: number
    avgValue: number
    minValue: number
    maxValue: number
  }
}
```

## Integração com Rotas

O serviço é usado pelas rotas em `src/backend/routes/documents.ts`:

```typescript
// GET /api/documents
const response = await fiscalDocumentsService.fetchDocuments({
  collection: 'tbl_nfe_100',
  dtIni: '2024-01-01',
  dtFin: '2024-12-31',
  page: 1,
  size: 100
})

// GET /api/documents/count
const response = await fiscalDocumentsService.fetchCount({
  collection: 'tbl_nfe_100',
  dtIni: '2024-01-01',
  dtFin: '2024-12-31'
})

// GET /api/documents/stats
const response = await fiscalDocumentsService.fetchStats({
  collection: 'tbl_nfe_100',
  dtIni: '2024-01-01',
  dtFin: '2024-12-31'
})
```

## Requisitos Atendidos

Este serviço atende aos seguintes requisitos da especificação:

- **5.1**: Documentos fiscais são consultados na base MongoDB do cliente autenticado
- **5.2**: Contagem de documentos é feita na base do cliente autenticado
- **5.3**: Estatísticas vêm da base do cliente autenticado
- **5.4**: Filtros operam apenas nos dados do cliente autenticado
- **5.5**: Paginação considera apenas os dados do cliente autenticado
- **8.2**: Usa `getMongoConnection()` sem parâmetros para obter a conexão correta

## Exemplo de Uso

```typescript
import { fiscalDocumentsService } from './services/FiscalDocumentsService'

// O serviço automaticamente usa a base do usuário autenticado
// configurada pelo UserContextMiddleware

// Buscar documentos
const documents = await fiscalDocumentsService.fetchDocuments({
  collection: 'tbl_nfe_100',
  dtIni: '2024-01-01',
  dtFin: '2024-12-31',
  page: 1,
  size: 100
})

// Contar documentos
const count = await fiscalDocumentsService.fetchCount({
  collection: 'tbl_nfe_100',
  dtIni: '2024-01-01',
  dtFin: '2024-12-31'
})

// Obter estatísticas
const stats = await fiscalDocumentsService.fetchStats({
  collection: 'tbl_nfe_100',
  dtIni: '2024-01-01',
  dtFin: '2024-12-31'
})
```

## Tratamento de Erros

O serviço implementa tratamento robusto de erros:

1. **Validação de Datas**: Valida datas antes de executar consultas
2. **Validação de Acesso**: Testa conectividade MongoDB antes de operações
3. **Logging de Erros**: Registra todos os erros para auditoria
4. **Propagação de Erros**: Propaga erros para as rotas tratarem adequadamente

## Mapeamento de Campos

O serviço mapeia automaticamente os campos do MongoDB para o formato esperado pelo frontend:

- Campos de documento (número, série, modelo, chave de acesso, etc.)
- Totais (base de cálculo, ICMS, IPI, PIS, COFINS, etc.)
- Emitente (CNPJ, razão social, endereço, etc.)
- Destinatário (CNPJ/CPF, nome, endereço, etc.)
- Informações adicionais

## Singleton

O serviço é exportado como singleton:

```typescript
export const fiscalDocumentsService = new FiscalDocumentsService()
```

Isso garante que há apenas uma instância do serviço em toda a aplicação.
