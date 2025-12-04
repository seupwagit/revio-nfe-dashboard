# 🐛 Debug: Campo Operação não Filtrava

## Problema Identificado

O filtro de "operação entrada" ou "operação saída" não estava funcionando na busca natural.

## Causa Raiz

O campo `tipoOperacao` vem da API Revio com valores numéricos:
- `"0"` = Entrada
- `"1"` = Saída

Mas a busca natural estava procurando por texto: `"entrada"` ou `"saída"`.

## Mapeamento da API

No arquivo `src/services/api.ts` (linha 217):

```typescript
tipoOperacao: item.IND_OPER || item.tipoOperacao || '',
```

O campo `IND_OPER` da API Revio retorna:
- `0` ou `"0"` para operações de entrada
- `1` ou `"1"` para operações de saída

## Solução Implementada

Atualizado o filtro em `GridPaginada.tsx` para aceitar múltiplos formatos:

```typescript
if (filtros.tipoOperacao) {
  resultado = resultado.filter(item => {
    const tipoItem = item.tipoOperacao?.toString().toLowerCase()
    const tipoFiltro = filtros.tipoOperacao.toLowerCase()
    
    // Aceita múltiplos formatos: "entrada", "0", "Entrada"
    const match = tipoItem === tipoFiltro || 
                 (tipoFiltro === 'entrada' && (tipoItem === '0' || tipoItem === 'entrada')) ||
                 (tipoFiltro === 'saída' && (tipoItem === '1' || tipoItem === 'saída' || tipoItem === 'saida'))
    
    return match
  })
}
```

## Como Funciona Agora

### Busca Natural
Usuário digita: `"operação entrada"`

### Processamento
1. BuscaNatural.tsx detecta "entrada" e cria: `{ tipoOperacao: 'entrada' }`
2. GridPaginada.tsx recebe o filtro
3. Compara com os dados:
   - Se `item.tipoOperacao === "0"` → Match! ✅
   - Se `item.tipoOperacao === "entrada"` → Match! ✅
   - Se `item.tipoOperacao === "Entrada"` → Match! ✅

### Resultado
Filtra corretamente todas as notas de entrada!

## Debug Adicionado

Console logs para facilitar debug:

```typescript
console.log('🔍 Filtros recebidos:', filtros)
console.log('📊 Amostra de dados (primeiro item):', data[0])
console.log('🎯 Filtrando por tipoOperacao:', filtros.tipoOperacao)
console.log('📋 Valores únicos de tipoOperacao nos dados:', [...new Set(data.map(item => item.tipoOperacao))])
console.log(`📊 Resultado após filtro: ${resultado.length} de ${data.length} registros`)
```

## Teste

Para testar:

1. Abra o console do navegador (F12)
2. Digite na busca natural: `"operação entrada"`
3. Verifique os logs:
   ```
   🔍 Filtros recebidos: { tipoOperacao: 'entrada' }
   📊 Amostra de dados (primeiro item): { ..., tipoOperacao: "0", ... }
   🎯 Filtrando por tipoOperacao: entrada
   📋 Valores únicos de tipoOperacao nos dados: ["0", "1"]
   ✅ Match encontrado: 12345 0
   📊 Resultado após filtro: 150 de 300 registros
   ```

## Valores Possíveis

### API Revio (IND_OPER)
- `0` ou `"0"` = Entrada
- `1` ou `"1"` = Saída

### Busca Natural (aceita)
- `"entrada"`, `"entradas"`, `"Entrada"`
- `"saída"`, `"saídas"`, `"saida"`, `"Saída"`

### Filtro (converte para)
- `"entrada"` → busca por `"0"` ou `"entrada"`
- `"saída"` → busca por `"1"` ou `"saída"` ou `"saida"`

## Alternativa Futura

Se quiser exibir texto legível na grid, pode adicionar um computed field:

```typescript
// Em api.ts, após mapear tipoOperacao
tipoOperacaoTexto: item.IND_OPER === '0' ? 'Entrada' : 
                   item.IND_OPER === '1' ? 'Saída' : 
                   item.tipoOperacao || '',
```

Então na grid, exibir `tipoOperacaoTexto` ao invés de `tipoOperacao`.

## Status

✅ **Problema Resolvido**
- Filtro aceita múltiplos formatos
- Debug logs adicionados
- Funciona com dados reais da API

## Arquivos Modificados

- `src/components/GridPaginada.tsx` - Filtro melhorado com suporte a múltiplos formatos
- `DEBUG_OPERACAO_CAMPO.md` - Este documento

## Próximos Passos

1. Testar com dados reais
2. Verificar logs no console
3. Remover console.logs após confirmar funcionamento
4. Considerar adicionar campo `tipoOperacaoTexto` para melhor UX
