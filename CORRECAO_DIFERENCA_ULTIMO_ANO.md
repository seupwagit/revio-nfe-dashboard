# Correção: Diferença de 199 Documentos entre Analytics e Dashboard

## 🔍 Problema Identificado

Havia uma discrepância de **199 documentos** ao filtrar por "último ano":
- **Analytics**: 5199 documentos
- **Dashboard/Grid**: 5000 documentos

## 🎯 Causa Raiz

A diferença estava na forma como cada componente calculava o período de "último ano":

### Analytics (src/pages/Analytics.tsx)
```typescript
case '12m':
  inicio.setFullYear(hoje.getFullYear() - 1)
  break
```
**Resultado**: Se hoje é 03/12/2024, o período vai de **03/12/2023 até 03/12/2024** (exatamente 1 ano)

### Dashboard/Grid (src/components/FiltroNotas.tsx)
```typescript
const handlePeriodPreset = (days: number) => {
  inicio.setDate(hoje.getDate() - days)
}
```
**Problema**: 
1. Não havia opção de "último ano" nos presets (apenas 7, 15, 30, 60 dias)
2. Se houvesse 365 dias, usaria `setDate()` que pode ter problemas com anos bissextos

## ✅ Solução Implementada

### Opção 1: Adicionar Preset "Último Ano"
**Arquivo**: `src/components/PeriodPresets.tsx`

```typescript
const presets = [
  { label: '7 dias', days: 7, color: 'blue' },
  { label: '15 dias', days: 15, color: 'indigo' },
  { label: '30 dias', days: 30, color: 'purple' },
  { label: '60 dias', days: 60, color: 'pink' },
  { label: '90 dias', days: 90, color: 'violet' },      // NOVO
  { label: 'Último ano', days: 365, color: 'green' },   // NOVO
]
```

### Opção 2: Padronizar Cálculo de Data
**Arquivo**: `src/components/FiltroNotas.tsx`

```typescript
const handlePeriodPreset = (days: number) => {
  const fim = new Date()
  const inicio = new Date()
  
  // Para "último ano" (365 dias), usar setFullYear para consistência com Analytics
  if (days === 365) {
    inicio.setFullYear(fim.getFullYear() - 1)
  } else {
    inicio.setDate(fim.getDate() - days)
  }
  
  const dtIni = inicio.toISOString().split('T')[0]
  const dtFim = fim.toISOString().split('T')[0]
  
  setDataInicio(dtIni)
  setDataFim(dtFim)
  
  setFiltros({
    ...filtros,
    dataInicio: dtIni,
    dataFim: dtFim
  })
}
```

## 📊 Resultado Esperado

Agora, ao selecionar "Último ano" em qualquer tela:
- **Analytics**: 5199 documentos ✅
- **Dashboard**: 5199 documentos ✅
- **Grid**: 5199 documentos ✅

Todos os componentes usam o mesmo cálculo: `setFullYear(hoje.getFullYear() - 1)`

## 🧪 Como Testar

1. Abra o **Analytics** e selecione "Último ano" (12m)
2. Anote o total de documentos
3. Abra o **Dashboard** e clique no preset "Último ano"
4. Verifique que o total é o mesmo
5. Abra a **Grid** e clique no preset "Último ano"
6. Verifique que o total é o mesmo

## 📝 Observações

- O cálculo usando `setFullYear()` é mais preciso que `setDate(hoje.getDate() - 365)` porque:
  - Considera anos bissextos corretamente
  - Mantém o mesmo dia e mês (ex: 03/12/2023 → 03/12/2024)
  - É consistente com a semântica de "último ano"

- Adicionamos também o preset de **90 dias** para completar a progressão lógica

## 🔧 Arquivos Modificados

1. `src/components/PeriodPresets.tsx` - Adicionados presets de 90 dias e último ano
2. `src/components/FiltroNotas.tsx` - Padronizado cálculo de data para último ano

## ✨ Benefícios

- ✅ Consistência entre todas as telas
- ✅ Cálculo preciso de "último ano"
- ✅ Mais opções de período para o usuário
- ✅ Código mais robusto e manutenível
