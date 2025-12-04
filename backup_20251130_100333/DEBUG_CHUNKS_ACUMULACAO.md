# 🐛 Debug: Acumulação de Chunks

## Problema Relatado

A opção "Último Ano" (12 meses) está retornando menos dados que 60 dias em termos de quantidade de registros processados e acumulados no cache.

## Investigação

### Possíveis Causas

1. **Chunks não estão sendo criados corretamente**
   - Período de 12 meses deveria gerar ~12 chunks de 30 dias
   - Verificar se `createChunks()` está dividindo corretamente

2. **Merge não está acumulando corretamente**
   - Função `mergeAnalytics()` pode estar perdendo dados
   - Verificar se está somando todos os chunks

3. **Cache de chunks individuais**
   - Chunks podem estar retornando dados antigos/incorretos
   - Verificar se cache está com período errado

4. **API retornando menos dados**
   - Período muito longo pode estar causando timeout
   - API pode ter limite de dados por período

## Logs Adicionados

### 1. Início da Busca
```
🚀 Iniciando busca de X chunks em paralelo
  Chunk 1: 2024-01-01 até 2024-01-30
  Chunk 2: 2024-01-31 até 2024-02-29
  ...
```

### 2. Durante Busca de Cada Chunk
```
📦 Buscando chunk 1/12: 2024-01-01 até 2024-01-30
✅ Chunk 1 completo: 5.000 registros, R$ 150.000
📊 Progresso: 1/12 chunks, 5.000 registros acumulados
```

### 3. Antes do Merge
```
🔀 Mesclando 12 chunks válidos de 12 totais
  Chunk 1: 5.000 registros, R$ 150.000
  Chunk 2: 4.500 registros, R$ 135.000
  ...
📊 Total antes do merge: 60.000 registros
```

### 4. Após o Merge
```
✅ Resultado final após merge: 60.000 registros, R$ 1.800.000
📈 Faturamento diário: 30 dias
🏢 Top emitentes: 10 empresas
📊 Evolução mensal: 12 meses
```

## Como Usar os Logs

### 1. Abra o Console do Navegador
- Pressione F12
- Vá para a aba "Console"

### 2. Selecione "Último Ano" (12m)
- Observe os logs aparecerem

### 3. Verifique:

#### A. Chunks estão sendo criados?
```
✅ BOM: 🚀 Iniciando busca de 12 chunks em paralelo
❌ RUIM: 🚀 Iniciando busca de 1 chunks em paralelo
```

#### B. Cada chunk está retornando dados?
```
✅ BOM: ✅ Chunk 1 completo: 5.000 registros
❌ RUIM: ✅ Chunk 1 completo: 0 registros
❌ RUIM: ⚠️ Chunk 1 retornou null
```

#### C. Registros estão acumulando?
```
✅ BOM: 
  📊 Progresso: 1/12 chunks, 5.000 registros
  📊 Progresso: 2/12 chunks, 9.500 registros
  📊 Progresso: 3/12 chunks, 14.000 registros

❌ RUIM:
  📊 Progresso: 1/12 chunks, 5.000 registros
  📊 Progresso: 2/12 chunks, 4.500 registros  ← Não acumulou!
  📊 Progresso: 3/12 chunks, 4.200 registros  ← Diminuiu!
```

#### D. Merge está correto?
```
✅ BOM:
  📊 Total antes do merge: 60.000 registros
  ✅ Resultado final após merge: 60.000 registros

❌ RUIM:
  📊 Total antes do merge: 60.000 registros
  ✅ Resultado final após merge: 5.000 registros  ← Perdeu dados!
```

## Cenários de Teste

### Teste 1: 60 dias (2 chunks)
```
Esperado:
  - 2 chunks de 30 dias
  - Chunk 1: ~X registros
  - Chunk 2: ~Y registros
  - Total: X + Y registros
```

### Teste 2: 12 meses (12 chunks)
```
Esperado:
  - 12 chunks de 30 dias
  - Cada chunk: ~Z registros
  - Total: 12 * Z registros (deve ser > 60 dias!)
```

### Teste 3: Comparação
```
Se 60 dias = 10.000 registros
Então 12 meses ≈ 60.000 registros (6x mais)

Se 12 meses < 60 dias → PROBLEMA!
```

## Possíveis Problemas e Soluções

### Problema 1: Chunks não criados
**Sintoma:** Apenas 1 chunk para 12 meses
**Causa:** Função `createChunks()` com bug
**Solução:** Verificar lógica de divisão

### Problema 2: Cache retornando dados errados
**Sintoma:** Chunks retornam sempre os mesmos dados
**Causa:** Chave de cache incorreta
**Solução:** Limpar cache e testar novamente

### Problema 3: API com timeout
**Sintoma:** Chunks retornam null ou 0 registros
**Causa:** Período muito longo causa timeout
**Solução:** Reduzir tamanho dos chunks (15 dias?)

### Problema 4: Merge perdendo dados
**Sintoma:** Total antes do merge ≠ Total depois
**Causa:** Bug na função `mergeAnalytics()`
**Solução:** Revisar lógica de acumulação

## Ações Imediatas

1. **Teste com logs**
   - Selecione "Último Ano"
   - Copie TODOS os logs do console
   - Envie para análise

2. **Compare com 60 dias**
   - Selecione "60 dias"
   - Anote: X registros
   - Selecione "Último Ano"
   - Anote: Y registros
   - Y deve ser > X (muito maior!)

3. **Limpe o cache**
   - Abra DevTools (F12)
   - Application → Local Storage
   - Limpe tudo com prefixo "analytics_cache_"
   - Teste novamente

## Informações Necessárias

Para diagnosticar, preciso saber:

1. **Quantos chunks foram criados?**
   - Veja no log: "Iniciando busca de X chunks"

2. **Quantos registros cada chunk retornou?**
   - Veja nos logs: "Chunk X completo: Y registros"

3. **Total antes do merge?**
   - Veja no log: "Total antes do merge: X registros"

4. **Total depois do merge?**
   - Veja no log: "Resultado final após merge: X registros"

5. **Comparação:**
   - 60 dias: ___ registros
   - 12 meses: ___ registros

## Status

🔍 **Investigando com logs detalhados**
- Logs adicionados em todas as etapas
- Aguardando teste com "Último Ano"
- Pronto para diagnosticar com base nos logs
