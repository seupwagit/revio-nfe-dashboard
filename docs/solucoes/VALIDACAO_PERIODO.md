# Validação de Período Máximo

## Implementação

Para evitar timeouts e melhorar a performance, foi implementada uma validação que limita consultas a um período máximo de **1 ano (365 dias)**.

## Arquivos Modificados

### 1. src/utils/dateValidation.ts (novo)

Utilitário de validação de datas:

```typescript
export function validateDateRange(
  dataInicio: string,
  dataFim: string,
  maxDays: number = 365
): DateValidationResult
```

**Validações:**
- ✅ Datas obrigatórias
- ✅ Datas válidas
- ✅ Data inicial < Data final
- ✅ Período máximo (365 dias)

### 2. Componentes Atualizados

- ✅ `src/pages/DocumentosFiscais.tsx`
- ✅ `src/pages/Analytics.tsx`
- ✅ `src/pages/AnalyticsAPI.tsx`

**Mudanças:**
- Importa `validateDateRange`
- Adiciona estado `erroData`
- Valida antes de aplicar filtros
- Mostra mensagem de erro visual

## Comportamento

### Período Válido (≤ 365 dias)
```
Data Início: 2025-01-01
Data Fim: 2025-12-31
✅ Período válido (365 dias)
```

### Período Inválido (> 365 dias)
```
Data Início: 2024-01-01
Data Fim: 2025-12-31
❌ Período máximo permitido é de 365 dias (1 ano)
```

## Mensagem de Erro

Quando o usuário tenta aplicar um filtro com período > 1 ano:

```
⚠️ Período máximo permitido é de 365 dias (1 ano)
```

A mensagem aparece em um banner vermelho acima dos botões de filtro.

## Benefícios

1. **Performance**: Evita consultas muito grandes
2. **Timeout**: Reduz risco de timeout (504)
3. **UX**: Feedback claro para o usuário
4. **API**: Menos carga na API externa

## Customização

Para alterar o período máximo, edite o valor padrão em `dateValidation.ts`:

```typescript
// Alterar de 365 para outro valor
export function validateDateRange(
  dataInicio: string,
  dataFim: string,
  maxDays: number = 180  // 6 meses
)
```

Ou passe o valor ao chamar:

```typescript
const validation = validateDateRange(dataInicio, dataFim, 180) // 6 meses
```

## Testes

Para testar a validação:

1. Abrir qualquer página com filtros de data
2. Selecionar data início: 01/01/2024
3. Selecionar data fim: 31/12/2025 (2 anos)
4. Clicar em "Aplicar Filtros"
5. Deve aparecer mensagem de erro

## Casos de Uso

### Dashboard Principal
- Período padrão: 30 dias
- Máximo permitido: 365 dias
- Recomendado: 90 dias para melhor performance

### Analytics
- Período padrão: 30 dias
- Máximo permitido: 365 dias
- Períodos pré-definidos: 7d, 30d, 90d, 12m

### Documentos Fiscais
- Período padrão: 30 dias
- Máximo permitido: 365 dias
- Filtros adicionais: CNPJ Emitente/Destinatário
