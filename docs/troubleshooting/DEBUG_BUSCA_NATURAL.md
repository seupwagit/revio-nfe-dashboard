# 🔍 Debug: Busca Natural Não Retorna Resultados

## 📋 Problema

**Sintoma:** Busca natural não retorna resultados mesmo com dados existentes na grid  
**Data:** 01 de Dezembro de 2024  

---

## 🧪 Como Debugar

### 1. Abrir Console do Navegador

Pressione **F12** e vá para a aba **Console**

### 2. Fazer uma Busca

Digite qualquer consulta e pressione Enter. Exemplo:
```
"tipo doc = recebida"
```

### 3. Verificar Logs

Você deve ver logs detalhados:

```
============================================================
🔍 BUSCA NATURAL INICIADA
============================================================
📋 Filtros recebidos: {
  "tipoDoc": "recebida"
}
📊 Total de registros disponíveis: 204
📊 Amostra de dados (primeiro item): {
  "id": "...",
  "numero": "123",
  "tipo": "recebida",
  ...
}
📊 Amostra de dados (segundo item): {...}
```

---

## 🔍 Checklist de Verificação

### ✅ Passo 1: Dados Estão Carregados?

**Verificar:**
```
📊 Total de registros disponíveis: ???
```

**Se for 0:**
- ❌ Dados não foram carregados
- ❌ Problema no NFContext ou API
- ✅ **Solução:** Recarregar página (F5)

**Se for > 0:**
- ✅ Dados carregados
- ➡️ Ir para Passo 2

---

### ✅ Passo 2: Filtro Foi Recebido?

**Verificar:**
```
📋 Filtros recebidos: {
  "tipoDoc": "recebida"  ← Deve ter o filtro aqui
}
```

**Se estiver vazio `{}`:**
- ❌ Filtro não foi criado
- ❌ Problema no BuscaNaturalSimples
- ✅ **Solução:** Ver logs do processamento

**Se tiver filtro:**
- ✅ Filtro criado
- ➡️ Ir para Passo 3

---

### ✅ Passo 3: Campo Existe nos Dados?

**Verificar amostra de dados:**
```
📊 Amostra de dados (primeiro item): {
  "tipo": "recebida",  ← Campo deve existir aqui
  ...
}
```

**Se campo não existir:**
- ❌ Campo não existe nos dados
- ❌ Nome do campo está errado
- ✅ **Solução:** Verificar mapeamento em `gridColumns.ts`

**Se campo existir:**
- ✅ Campo correto
- ➡️ Ir para Passo 4

---

### ✅ Passo 4: Filtro Foi Aplicado?

**Verificar:**
```
🎯 Filtrando por tipoDoc: recebida
📋 Valores únicos de tipo nos dados: ["recebida", "emitida", "nfe"]
```

**Se não aparecer:**
- ❌ Filtro não foi aplicado
- ❌ Condição `if (filtros.tipoDoc)` não entrou
- ✅ **Solução:** Verificar GridPaginada.tsx

**Se aparecer:**
- ✅ Filtro aplicado
- ➡️ Ir para Passo 5

---

### ✅ Passo 5: Houve Matches?

**Verificar:**
```
✅ Match tipoDoc: 123 recebida
✅ Match tipoDoc: 456 recebida
✅ Match tipoDoc: 789 recebida
```

**Se não houver matches:**
- ❌ Nenhum registro corresponde
- ❌ Valor do filtro não bate com dados
- ✅ **Solução:** Verificar valores reais nos dados

**Se houver matches:**
- ✅ Matches encontrados
- ➡️ Ir para Passo 6

---

### ✅ Passo 6: Resultado Final

**Verificar:**
```
============================================================
✅ BUSCA NATURAL CONCLUÍDA
📊 Registros ANTES dos filtros: 204
📊 Registros DEPOIS dos filtros: 15  ← Deve ser > 0
📊 Filtros aplicados: tipoDoc
============================================================
```

**Se DEPOIS = 0:**
- ❌ Todos os registros foram filtrados
- ❌ Filtro muito restritivo ou valor errado
- ✅ **Solução:** Verificar lógica do filtro

**Se DEPOIS > 0:**
- ✅ Filtro funcionou!
- ✅ Grid deve mostrar resultados

---

## 🐛 Problemas Comuns

### Problema 1: Dados Não Carregados

**Sintoma:**
```
📊 Total de registros disponíveis: 0
```

**Causa:** NFContext não carregou dados

**Solução:**
1. Recarregar página (F5)
2. Verificar se há erro na API
3. Verificar console para erros

---

### Problema 2: Filtro Vazio

**Sintoma:**
```
📋 Filtros recebidos: {}
```

**Causa:** BuscaNaturalSimples não criou filtro

**Solução:**
1. Verificar se consulta está correta
2. Ver logs do `processarQuery`
3. Verificar mapeamento em `gridColumns.ts`

---

### Problema 3: Campo Não Existe

**Sintoma:**
```
📊 Amostra de dados: {
  "numero": "123",
  // "tipo" não existe!
}
```

**Causa:** Nome do campo está errado

**Solução:**
1. Verificar `gridColumns.ts`
2. Corrigir mapeamento `field`
3. Verificar estrutura real dos dados

---

### Problema 4: Valor Não Bate

**Sintoma:**
```
🎯 Filtrando por tipoDoc: recebida
📋 Valores únicos: ["RECEBIDA", "EMITIDA"]  ← Maiúsculas!
```

**Causa:** Case sensitivity

**Solução:**
1. Converter para lowercase na comparação
2. Verificar lógica do filtro
3. Adicionar `.toLowerCase()` se necessário

---

### Problema 5: Filtro Não Aplicado

**Sintoma:**
```
📋 Filtros recebidos: { "tipoDoc": "recebida" }
// Mas não aparece "🎯 Filtrando por tipoDoc"
```

**Causa:** Condição `if (filtros.tipoDoc)` não entrou

**Solução:**
1. Verificar GridPaginada.tsx
2. Adicionar suporte para o filtro
3. Verificar nome do filtro (tipoDoc vs tipo)

---

## 📝 Template de Relatório

Ao reportar problema, incluir:

```
### Informações do Sistema
- Navegador: Chrome/Firefox/Edge
- Versão: ???
- Data: ???

### Consulta Testada
"tipo doc = recebida"

### Logs do Console
[Copiar logs completos aqui]

### Comportamento Esperado
Grid deveria mostrar 15 registros

### Comportamento Atual
Grid mostra 0 registros

### Dados de Amostra
[Copiar primeiro item dos dados]
```

---

## 🔧 Correções Rápidas

### Correção 1: Recarregar Dados

```javascript
// No console do navegador
window.location.reload()
```

### Correção 2: Limpar Cache

```javascript
// No console do navegador
localStorage.clear()
window.location.reload()
```

### Correção 3: Verificar Dados

```javascript
// No console do navegador
console.log('Dados:', window.__REACT_DEVTOOLS_GLOBAL_HOOK__)
```

---

## 🎯 Próximos Passos

### Se Problema Persistir

1. **Copiar logs completos** do console
2. **Fazer screenshot** da grid
3. **Anotar consulta** exata usada
4. **Reportar** com template acima

### Se Problema Resolvido

1. **Documentar** solução
2. **Atualizar** este guia
3. **Compartilhar** com equipe

---

**Última atualização:** 01 de Dezembro de 2024  
**Versão:** 1.0.0  
**Status:** Guia de Debug  
