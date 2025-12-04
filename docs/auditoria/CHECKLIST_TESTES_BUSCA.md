# ✅ CHECKLIST - Testes de Busca Natural

## 📋 COMO USAR ESTE CHECKLIST

1. Abra a aplicação no navegador
2. Vá para Grid de Notas Fiscais
3. Para cada exemplo abaixo:
   - Digite na busca natural
   - Pressione Enter ou clique em "Buscar"
   - Verifique se funciona
   - Marque o status: ✅ (funciona), ⚠️ (parcial), ❌ (não funciona)

---

## 🎯 FASE 1: EXEMPLOS BÁSICOS (10 testes)

### Teste 1: Busca por Empresa
- [ ] **"ciano"** → Deve encontrar CIANO ALIMENTOS
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"infoco"** → Deve encontrar INFOCO DISTRIBUIDORA
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

### Teste 2: Valores
- [ ] **"acima de 5000"** → Valor > R$ 5.000
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"entre 1000 e 5000"** → R$ 1.000 < Valor < R$ 5.000
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

### Teste 3: Operações
- [ ] **"entrada"** → Notas de entrada (tipoOperacao = 0)
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"saída"** → Notas de saída (tipoOperacao = 1)
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

### Teste 4: Status
- [ ] **"autorizadas"** → Status = autorizada
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"canceladas"** → Status = cancelada
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

### Teste 5: Combinações
- [ ] **"entrada acima de 5000"** → Entrada + Valor > R$ 5.000
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

### Teste 6: Localização
- [ ] **"sp"** → Estado = SP
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

---

## 🎯 FASE 2: EXEMPLOS AVANÇADOS (10 testes)

### Teste 7: Números por Extenso
- [ ] **"abaixo de mil"** → Valor < R$ 1.000
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"acima de dez mil"** → Valor > R$ 10.000
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

### Teste 8: Impostos
- [ ] **"icms maior que 500"** → ICMS > R$ 500
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"ipi acima de 100"** → IPI > R$ 100
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

### Teste 9: Protocolada
- [ ] **"protocolada sim"** → Protocolada = Sim
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

### Teste 10: Status Avançados
- [ ] **"processando"** → Status = processando
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"denegadas"** → Status = denegada
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

### Teste 11: Identificação
- [ ] **"série 1"** → Série = 1
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"modelo 55"** → Modelo = 55
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

### Teste 12: Combinação Tripla
- [ ] **"entrada sp acima de 5000"** → Entrada + SP + Valor > R$ 5.000
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

---

## 🎯 FASE 3: EXEMPLOS COMPLEXOS (10 testes)

### Teste 13: Datas
- [ ] **"data emissão maior que 27/11/2025"** → Data >= 27/11/2025
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"após 01/12/2025"** → Data >= 01/12/2025
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"antes de 30/11/2025"** → Data <= 30/11/2025
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"entre 01/11/2025 e 30/11/2025"** → Período específico
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

### Teste 14: Emitente/Destinatário Específico
- [ ] **"emitente vale"** → Emitente contém "vale"
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"destinatário petrobras"** → Destinatário contém "petrobras"
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

### Teste 15: Combinações Complexas
- [ ] **"entrada areia sp"** → Entrada + "areia" + SP
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"saída acima de mil canceladas"** → Saída + > R$ 1.000 + Cancelada
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

### Teste 16: Outros Valores
- [ ] **"frete maior que 200"** → Frete > R$ 200
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"cnpj 12345678"** → CNPJ contém 12345678
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

---

## 🎯 FASE 4: EXEMPLOS EXTREMOS (5 testes)

### Teste 17: Números Grandes por Extenso
- [ ] **"mais de cem mil"** → Valor > R$ 100.000
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"menos de cinco mil"** → Valor < R$ 5.000
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

### Teste 18: Municípios
- [ ] **"são paulo"** → Município = São Paulo
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

- [ ] **"rio de janeiro"** → Município = Rio de Janeiro
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

### Teste 19: Número da Nota
- [ ] **"nota 12345"** → Número = 12345
  - Status: ⬜ Não testado | ✅ Funciona | ⚠️ Parcial | ❌ Não funciona
  - Observações: _______________________________________________

---

## 📊 RESUMO DOS TESTES

### Estatísticas
- **Total de testes:** 35
- **Testados:** _____ / 35
- **Funcionam:** _____ (✅)
- **Parciais:** _____ (⚠️)
- **Não funcionam:** _____ (❌)

### Taxa de Sucesso
- **Fase 1 (Básicos):** _____ / 10 (____%)
- **Fase 2 (Avançados):** _____ / 10 (____%)
- **Fase 3 (Complexos):** _____ / 10 (____%)
- **Fase 4 (Extremos):** _____ / 5 (____%)

### Conclusão
- [ ] Taxa de sucesso > 80% → Documentação aprovada
- [ ] Taxa de sucesso 50-80% → Revisar exemplos problemáticos
- [ ] Taxa de sucesso < 50% → Revisar implementação

---

## 🎯 PRÓXIMOS PASSOS

Após completar os testes:

1. **Calcular estatísticas** (preencher seção acima)
2. **Criar arquivo de resultados** (`RESULTADOS_TESTES_BUSCA.md`)
3. **Informar Kiro AI** com os resultados
4. **Aguardar atualização** da documentação

---

## 📝 TEMPLATE DE RESULTADO

Copie e cole no arquivo `RESULTADOS_TESTES_BUSCA.md`:

```markdown
# Resultados dos Testes - Busca Natural

## Data: [DATA]
## Testador: [SEU NOME]

### Fase 1: Básicos
1. "ciano" → [✅/⚠️/❌] - [Observações]
2. "infoco" → [✅/⚠️/❌] - [Observações]
...

### Fase 2: Avançados
...

### Fase 3: Complexos
...

### Fase 4: Extremos
...

### Resumo
- Total testados: X/35
- Funcionam: X (X%)
- Parciais: X (X%)
- Não funcionam: X (X%)

### Recomendações
- [Suas recomendações]
```

---

**Status:** 🟡 AGUARDANDO TESTES  
**Prioridade:** 🔴 ALTA  
**Tempo Estimado:** 2-3 horas  
**Data:** 02/12/2025
