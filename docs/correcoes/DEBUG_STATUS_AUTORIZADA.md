# 🐛 DEBUG: Status "autorizada" não retorna nada

## 🔍 LOGS ADICIONADOS

Adicionei logs detalhados para identificar o problema. Quando você buscar "status autorizada", verá no console:

### 1. Filtros Recebidos
```
🔍 BuscaNatural - Filtros processados: {status: "autorizada"}
📝 BuscaNatural - Explicação: "Status: Autorizada."
✅ BuscaNatural - Chamando onSearch com: {status: "autorizada"}
```

### 2. GridPaginada Recebe
```
🔍 Filtros recebidos: {status: "autorizada"}
📊 Amostra de dados (primeiro item): {...}
```

### 3. Filtro de Status
```
🎯 Filtrando por status: autorizada
📊 Total de registros ANTES do filtro: 48
📋 Valores únicos de status nos dados: ["Autorizada", "Cancelada", ...]
📋 Primeiros 5 status: [
  {numero: "12345", status: "Autorizada"},
  {numero: "12346", status: "Cancelada"},
  ...
]
```

### 4. Comparações
```
🔍 Comparando: "autorizada" com "autorizada"
✅ Match #1: 12345 "Autorizada"
🔍 Comparando: "cancelada" com "autorizada"
(sem match)
...
```

### 5. Resultado
```
📊 Resultado após filtro status: 30 de 48 registros
📊 Total de matches encontrados: 30
```

## 🎯 POSSÍVEIS CAUSAS

### 1. Valor no Banco é Diferente
**Problema:** Status no banco pode ser:
- "Autorizada" (com maiúscula) ✅ Deve funcionar
- "AUTORIZADA" (tudo maiúsculo) ✅ Deve funcionar
- "autorizada" (minúsculo) ✅ Deve funcionar
- "Autorizado" (masculino) ✅ Deve funcionar
- " Autorizada " (com espaços) ✅ Deve funcionar (trim)
- "Autorizada - Uso Autorizado" ❓ Deve funcionar (includes)

**Verificar nos logs:**
```
📋 Valores únicos de status nos dados: [...]
```

### 2. Campo Vazio ou Null
**Problema:** Alguns registros podem ter `status: null` ou `status: undefined`

**Verificar nos logs:**
```
🔍 Comparando: "undefined" com "autorizada"
🔍 Comparando: "null" com "autorizada"
```

### 3. Filtros Anteriores Eliminaram Tudo
**Problema:** Se você aplicou outros filtros antes (data, valor, etc), pode não sobrar nada para filtrar por status

**Verificar nos logs:**
```
📊 Total de registros ANTES do filtro: 0  ← PROBLEMA!
```

### 4. Dados Não Carregados
**Problema:** Grid pode estar vazia

**Verificar:**
```
📊 Amostra de dados (primeiro item): undefined  ← PROBLEMA!
```

## 🔧 COMO DEBUGAR

### Passo 1: Abrir Console
1. Pressione F12
2. Vá para aba "Console"
3. Limpe o console (ícone 🚫)

### Passo 2: Fazer Busca
1. Digite: "status autorizada"
2. Clique "Buscar"
3. Veja os logs aparecerem

### Passo 3: Analisar Logs

#### Se aparecer:
```
📋 Valores únicos de status: ["Autorizada", "Cancelada"]
```
✅ **Dados existem!** Continue...

#### Se aparecer:
```
📋 Valores únicos de status: []
```
❌ **Problema:** Dados não carregados ou campo status não existe

#### Se aparecer:
```
🔍 Comparando: "autorizada" com "autorizada"
✅ Match #1: 12345 "Autorizada"
✅ Match #2: 12346 "Autorizada"
...
📊 Total de matches encontrados: 30
```
✅ **Filtro funcionando!** Deve mostrar 30 registros

#### Se aparecer:
```
🔍 Comparando: "autorizada" com "autorizada"
(sem matches)
📊 Total de matches encontrados: 0
```
❌ **Problema:** Comparação não está funcionando

## 📊 CHECKLIST

Copie e cole os logs do console aqui:

```
[ ] 🔍 BuscaNatural - Filtros processados: ?
[ ] 📋 Valores únicos de status nos dados: ?
[ ] 📊 Total de registros ANTES do filtro: ?
[ ] 🔍 Comparando: ? (primeiras 3 comparações)
[ ] 📊 Total de matches encontrados: ?
[ ] 📊 Resultado após filtro status: ?
```

## 🎯 SOLUÇÕES

### Se "Valores únicos" está vazio:
```typescript
// Problema: Dados não carregados
// Solução: Recarregar página ou verificar API
```

### Se "Valores únicos" mostra valores diferentes:
```typescript
// Exemplo: ["Autorizado", "Cancelado"] (masculino)
// Solução: Buscar "autorizado" em vez de "autorizada"
```

### Se comparações não fazem match:
```typescript
// Problema: Lógica de comparação
// Verificar se .toLowerCase() e .trim() estão funcionando
```

### Se "Total ANTES do filtro" é 0:
```typescript
// Problema: Filtros anteriores eliminaram tudo
// Solução: Limpar filtros e tentar só status
```

## 🚀 TESTE AGORA

1. Abra console (F12)
2. Limpe console
3. Digite "status autorizada"
4. Clique "Buscar"
5. **COPIE E COLE TODOS OS LOGS AQUI**

Com os logs, posso identificar exatamente o problema! 🔍
