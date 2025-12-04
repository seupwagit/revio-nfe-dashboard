# 🧪 Teste: Filtro "tipo doc = recebida"

## 📋 Informações

**Data:** 01 de Dezembro de 2024  
**Componentes:** BuscaNaturalSimples, GridPaginada, GridPaginadaLocal  
**Objetivo:** Validar filtro por coluna "Tipo Doc"  

---

## ✅ Implementação Completa

### 1. Detecção do Filtro (BuscaNaturalSimples.tsx)

```typescript
// Detecta "tipo doc = recebida"
const tipoDocMatch = textoLower.match(/tipo\s+doc(?:umento)?\s*=?\s*([a-záàâãéèêíïóôõöúçñ]+)/i)

if (tipoDocMatch) {
  filtros.tipoDoc = tipoDocMatch[1].trim()
  explicacao += `Tipo Doc: "${filtros.tipoDoc}". `
}
```

### 2. Aplicação do Filtro (GridPaginada.tsx)

```typescript
if (filtros.tipoDoc) {
  console.log('🎯 Filtrando por tipoDoc:', filtros.tipoDoc)
  console.log('📋 Valores únicos de tipo nos dados:', [...new Set(data.map(item => item.tipo))])
  
  const tipoFiltro = filtros.tipoDoc.toLowerCase().trim()
  resultado = resultado.filter(item => {
    const tipoItem = item.tipo?.toLowerCase().trim()
    const match = tipoItem === tipoFiltro || tipoItem?.includes(tipoFiltro)
    
    if (match) {
      console.log('✅ Match tipoDoc:', item.numero, item.tipo)
    }
    
    return match
  })
  
  console.log(`📊 Resultado após filtro tipoDoc: ${resultado.length} registros`)
}
```

### 3. Aplicação do Filtro (GridPaginadaLocal.tsx)

```typescript
if (filtrosLLM.tipoDoc) {
  const tipoItem = item.tipo?.toLowerCase().trim()
  const tipoFiltro = filtrosLLM.tipoDoc.toLowerCase().trim()
  if (tipoItem !== tipoFiltro && !tipoItem?.includes(tipoFiltro)) return false
}
```

---

## 🧪 Casos de Teste

### Teste 1: Filtro Básico

**Entrada:**
```
"tipo doc = recebida"
```

**Esperado:**
- ✅ Filtro detectado: `{ tipoDoc: "recebida" }`
- ✅ Explicação: "Tipo Doc: 'recebida'."
- ✅ Grid filtrada mostrando apenas registros com `tipo = "recebida"`
- ✅ Console mostra: "🎯 Filtrando por tipoDoc: recebida"
- ✅ Console mostra valores únicos de tipo
- ✅ Console mostra matches encontrados

**Como testar:**
1. Abrir grid NF-e
2. Clicar na busca natural (ícone ⭐)
3. Digitar: `tipo doc = recebida`
4. Pressionar Enter
5. Abrir console (F12)
6. Verificar logs

**Resultado esperado no console:**
```
🔍 Filtros recebidos: { tipoDoc: "recebida" }
🎯 Filtrando por tipoDoc: recebida
📋 Valores únicos de tipo nos dados: ["recebida", "emitida", "nfe", ...]
✅ Match tipoDoc: 123456 recebida
✅ Match tipoDoc: 789012 recebida
📊 Resultado após filtro tipoDoc: 15 registros
```

---

### Teste 2: Sem "="

**Entrada:**
```
"tipo doc recebida"
```

**Esperado:**
- ✅ Mesmo resultado do Teste 1
- ✅ Filtro: `{ tipoDoc: "recebida" }`

---

### Teste 3: Maiúsculas

**Entrada:**
```
"TIPO DOC = RECEBIDA"
```

**Esperado:**
- ✅ Filtro: `{ tipoDoc: "recebida" }` (convertido para minúsculas)
- ✅ Funciona normalmente

---

### Teste 4: Tipo Documento

**Entrada:**
```
"tipo documento = emitida"
```

**Esperado:**
- ✅ Filtro: `{ tipoDoc: "emitida" }`
- ✅ Grid mostra apenas registros com `tipo = "emitida"`

---

### Teste 5: Combinado com Valor

**Entrada:**
```
"tipo doc = recebida valor maior que 5000"
```

**Esperado:**
- ✅ Filtros: `{ tipoDoc: "recebida", valorMin: 5000 }`
- ✅ Explicação: "Tipo Doc: 'recebida'. Valor > R$ 5.000."
- ✅ Grid mostra registros com tipo="recebida" E valor>5000

**Console esperado:**
```
🔍 Filtros recebidos: { tipoDoc: "recebida", valorMin: 5000 }
🎯 Filtrando por tipoDoc: recebida
📊 Resultado após filtro tipoDoc: 15 registros
📊 Resultado após filtro valor: 8 registros
```

---

### Teste 6: Combinado com Data

**Entrada:**
```
"tipo doc = emitida data maior que 27/11/2025"
```

**Esperado:**
- ✅ Filtros: `{ tipoDoc: "emitida", dataInicio: "2025-11-27" }`
- ✅ Grid mostra registros com tipo="emitida" E data>=27/11/2025

---

### Teste 7: Tipo NF-e

**Entrada:**
```
"tipo doc = nfe"
```

**Esperado:**
- ✅ Filtro: `{ tipoDoc: "nfe" }`
- ✅ Grid mostra apenas NF-e

---

### Teste 8: Tipo CT-e

**Entrada:**
```
"tipo doc = cte"
```

**Esperado:**
- ✅ Filtro: `{ tipoDoc: "cte" }`
- ✅ Grid mostra apenas CT-e

---

### Teste 9: Sem Resultados

**Entrada:**
```
"tipo doc = inexistente"
```

**Esperado:**
- ✅ Filtro: `{ tipoDoc: "inexistente" }`
- ✅ Grid vazia
- ✅ Mensagem: "Nenhum registro encontrado"
- ✅ Console: "📊 Resultado após filtro tipoDoc: 0 registros"

---

### Teste 10: Limpar Filtro

**Ação:**
1. Aplicar filtro "tipo doc = recebida"
2. Clicar no X para limpar

**Esperado:**
- ✅ Filtro removido
- ✅ Grid volta a mostrar todos os registros
- ✅ Console: "🧹 Limpando filtros LLM"

---

## 🔍 Verificações no Console

### Logs Esperados

Ao aplicar `"tipo doc = recebida"`:

```
🔍 Aplicando filtros LLM: { tipoDoc: "recebida" }
🔍 Filtros recebidos: { tipoDoc: "recebida" }
📊 Amostra de dados (primeiro item): { numero: "123", tipo: "recebida", ... }
🎯 Filtrando por tipoDoc: recebida
📋 Valores únicos de tipo nos dados: ["recebida", "emitida", "nfe", "cte"]
✅ Match tipoDoc: 123456 recebida
✅ Match tipoDoc: 789012 recebida
✅ Match tipoDoc: 345678 recebida
📊 Resultado após filtro tipoDoc: 15 registros
```

### Valores Únicos

O console deve mostrar quais valores existem no campo `tipo`:

```
📋 Valores únicos de tipo nos dados: ["recebida", "emitida", "nfe", "cte", "cfe"]
```

Isso ajuda a identificar:
- ✅ Quais valores são válidos
- ✅ Se o campo existe nos dados
- ✅ Se há dados para filtrar

---

## ❌ Problemas Comuns

### Problema 1: Nenhum Resultado

**Sintoma:** Filtro aplicado mas grid vazia

**Causas possíveis:**
1. Campo `tipo` não existe nos dados
2. Valor do filtro não corresponde aos dados
3. Dados não carregados

**Verificar:**
```javascript
// No console
console.log('Primeiro item:', data[0])
console.log('Campo tipo:', data[0]?.tipo)
console.log('Valores únicos:', [...new Set(data.map(item => item.tipo))])
```

**Solução:**
- Verificar se campo `tipo` existe
- Verificar valores reais no campo
- Ajustar filtro conforme valores reais

---

### Problema 2: Filtro Não Aplicado

**Sintoma:** Digitou "tipo doc = recebida" mas nada aconteceu

**Causas possíveis:**
1. Regex não capturou
2. Filtro não foi passado para grid
3. Grid não aplicou o filtro

**Verificar:**
```javascript
// No BuscaNaturalSimples
console.log('Filtros gerados:', filtros)

// No GridPaginada
console.log('Filtros recebidos:', filtros)
console.log('tipoDoc:', filtros.tipoDoc)
```

**Solução:**
- Verificar se `filtros.tipoDoc` existe
- Verificar se grid recebeu o filtro
- Verificar logs no console

---

### Problema 3: Case Sensitive

**Sintoma:** "RECEBIDA" não funciona mas "recebida" funciona

**Causa:** Comparação case sensitive

**Solução:** Já implementado! Ambos são convertidos para lowercase:
```typescript
const tipoItem = item.tipo?.toLowerCase().trim()
const tipoFiltro = filtros.tipoDoc.toLowerCase().trim()
```

---

## 📊 Checklist de Validação

### Funcionalidade Básica
- [ ] "tipo doc = recebida" filtra corretamente
- [ ] "tipo doc recebida" (sem =) funciona
- [ ] "TIPO DOC = RECEBIDA" (maiúsculas) funciona
- [ ] "tipo documento = recebida" funciona
- [ ] Limpar filtro restaura todos os registros

### Combinações
- [ ] "tipo doc = recebida valor maior que 5000" funciona
- [ ] "tipo doc = emitida data maior que 27/11/2025" funciona
- [ ] "tipo doc = nfe autorizada" funciona

### Logs
- [ ] Console mostra "🎯 Filtrando por tipoDoc"
- [ ] Console mostra valores únicos de tipo
- [ ] Console mostra matches encontrados
- [ ] Console mostra resultado final

### Edge Cases
- [ ] Valor inexistente retorna grid vazia
- [ ] Sem dados retorna mensagem apropriada
- [ ] Múltiplos filtros funcionam juntos

---

## 🎯 Critérios de Sucesso

### ✅ Teste Passou Se:

1. **Filtro detectado corretamente**
   - `filtros.tipoDoc` contém o valor esperado
   - Explicação mostra "Tipo Doc: 'valor'"

2. **Grid filtrada corretamente**
   - Apenas registros com tipo correspondente
   - Contagem de registros correta

3. **Logs no console**
   - Mostra valores únicos de tipo
   - Mostra matches encontrados
   - Mostra resultado final

4. **Combinações funcionam**
   - Filtro tipoDoc + outros filtros
   - Todos aplicados corretamente

5. **Limpar funciona**
   - Remove filtro
   - Restaura todos os registros

---

## 📝 Relatório de Teste

### Template

```
Data: ___/___/______
Testador: _______________
Navegador: _______________

Teste 1: tipo doc = recebida
[ ] Passou  [ ] Falhou
Observações: _______________________

Teste 2: tipo doc recebida (sem =)
[ ] Passou  [ ] Falhou
Observações: _______________________

Teste 3: TIPO DOC = RECEBIDA (maiúsculas)
[ ] Passou  [ ] Falhou
Observações: _______________________

Teste 4: tipo doc = recebida valor maior que 5000
[ ] Passou  [ ] Falhou
Observações: _______________________

Teste 5: Limpar filtro
[ ] Passou  [ ] Falhou
Observações: _______________________

Resultado Geral:
[ ] Todos os testes passaram
[ ] Alguns testes falharam
[ ] Necessário correção

Comentários:
_________________________________
_________________________________
```

---

## 🚀 Próximos Passos

### Se Testes Passarem
1. ✅ Marcar como concluído
2. ✅ Documentar no changelog
3. ✅ Comunicar ao cliente
4. ✅ Monitorar uso

### Se Testes Falharem
1. ❌ Identificar causa
2. ❌ Corrigir problema
3. ❌ Re-testar
4. ❌ Documentar correção

---

**Última atualização:** 01 de Dezembro de 2024  
**Versão:** 1.0.0  
**Status:** Pronto para teste  
