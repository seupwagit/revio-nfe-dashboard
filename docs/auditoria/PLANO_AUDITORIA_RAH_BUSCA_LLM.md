# 🔍 PLANO DE AUDITORIA - RAH E BUSCA LLM

## 📋 OBJETIVO

Auditar e validar TODOS os exemplos documentados no RAH e na Busca Natural para garantir que:
1. ✅ Todos os exemplos funcionam realmente
2. ✅ Documentação está atualizada com a nova arquitetura MongoDB
3. ✅ Não há "vergonha" - apenas exemplos testados e validados

---

## 🎯 ESCOPO DA AUDITORIA

### 1. RAH (Revio Agent Helper) - `src/services/rahAgent.ts`

**Status Atual:**
- ✅ Já atualizado com nova arquitetura MongoDB
- ✅ Conceitos de cache revisados
- ✅ Performance atualizada (10-20x mais rápido)
- ⚠️ Exemplos de busca natural precisam ser validados

**Exemplos Documentados no RAH:**
```
Operações:
- "entradas" ou "saídas"
- "operação entrada"

Valores:
- "acima de 5000" ou "acima de cinco mil"
- "abaixo de 1000" ou "abaixo de mil"
- "entre 1000 e 5000"

Empresas:
- "ciano", "petrobras", "vale"
- "emitente petrobras" ou "destinatário vale"

Status:
- "canceladas", "autorizadas", "processando"
- "protocolada sim" ou "protocolada não"

Impostos:
- "icms maior que 500"
- "ipi acima de 100"

Localização:
- "sp", "rio de janeiro", "município campinas"

Combinações:
- "entrada acima de 5000 sp"
- "saída ciano canceladas"
```

### 2. Busca Natural - `src/components/BuscaNaturalSimples.tsx`

**Status Atual:**
- ✅ Implementação completa com LLM (Google Gemini)
- ✅ Fallback para processamento local
- ✅ 35+ exemplos documentados no componente

**Exemplos Documentados (35 exemplos):**
1. "abaixo de mil" → Valor < R$ 1.000
2. "acima de dez mil" → Valor > R$ 10.000
3. "entrada" → Notas de entrada
4. "saída" → Notas de saída
5. "canceladas" → Status cancelada
6. "autorizadas" → Status autorizada
7. "processando" → Status processando/pendente
8. "denegadas" → Status denegada
9. "rejeitadas" → Status rejeitada
10. "areia" → Busca "areia" em razão social
11. "petrobras" → Busca "petrobras" em empresa
12. "sp" → Estado de São Paulo
13. "icms maior que 500" → ICMS > R$ 500
14. "entrada sp acima de 5000" → Entrada + SP + Valor > R$ 5.000
15. "saída canceladas" → Saídas canceladas
16. "protocolada sim" → Notas protocoladas
17. "entre 1000 e 5000" → Valor entre R$ 1.000 e R$ 5.000
18. "menos de cinco mil" → Valor < R$ 5.000
19. "mais de cem mil" → Valor > R$ 100.000
20. "ipi acima de 100" → IPI > R$ 100
21. "frete maior que 200" → Frete > R$ 200
22. "cnpj 12345678" → CNPJ contém 12345678
23. "nota 12345" → Número da nota 12345
24. "série 1" → Série 1
25. "modelo 55" → Modelo 55 (NF-e)
26. "são paulo" → Município de São Paulo
27. "rio de janeiro" → Município do Rio
28. "data emissão maior que 27/11/2025" → Data >= 27/11/2025
29. "após 01/12/2025" → Data >= 01/12/2025
30. "antes de 30/11/2025" → Data <= 30/11/2025
31. "entre 01/11/2025 e 30/11/2025" → Período específico
32. "emitente vale" → Emitente contém "vale"
33. "destinatário petrobras" → Destinatário contém "petrobras"
34. "entrada areia sp" → Entrada + "areia" + SP
35. "saída acima de mil canceladas" → Saída + > R$ 1.000 + Cancelada

---

## 🧪 PLANO DE TESTES

### Fase 1: Validar Exemplos Básicos (10 casos)

**Prioridade ALTA - Testar primeiro:**

1. ✅ "ciano" → Busca empresa CIANO
2. ✅ "infoco" → Busca empresa INFOCO
3. ⏳ "acima de 5000" → Valor > R$ 5.000
4. ⏳ "entre 1000 e 5000" → Faixa de valores
5. ⏳ "entrada" → Notas de entrada
6. ⏳ "saída" → Notas de saída
7. ⏳ "autorizadas" → Status autorizada
8. ⏳ "canceladas" → Status cancelada
9. ⏳ "entrada acima de 5000" → Combinação
10. ⏳ "sp" → Estado SP

### Fase 2: Validar Exemplos Avançados (10 casos)

11. ⏳ "abaixo de mil" → Números por extenso
12. ⏳ "acima de dez mil" → Números por extenso
13. ⏳ "icms maior que 500" → Impostos
14. ⏳ "ipi acima de 100" → Impostos
15. ⏳ "protocolada sim" → Protocolada
16. ⏳ "processando" → Status processando
17. ⏳ "denegadas" → Status denegada
18. ⏳ "série 1" → Série
19. ⏳ "modelo 55" → Modelo
20. ⏳ "entrada sp acima de 5000" → Combinação tripla

### Fase 3: Validar Exemplos Complexos (10 casos)

21. ⏳ "data emissão maior que 27/11/2025" → Datas
22. ⏳ "após 01/12/2025" → Datas
23. ⏳ "antes de 30/11/2025" → Datas
24. ⏳ "entre 01/11/2025 e 30/11/2025" → Período
25. ⏳ "emitente vale" → Emitente específico
26. ⏳ "destinatário petrobras" → Destinatário específico
27. ⏳ "entrada areia sp" → Combinação tripla
28. ⏳ "saída acima de mil canceladas" → Combinação tripla
29. ⏳ "frete maior que 200" → Frete
30. ⏳ "cnpj 12345678" → CNPJ

### Fase 4: Validar Casos Extremos (5 casos)

31. ⏳ "mais de cem mil" → Números grandes por extenso
32. ⏳ "menos de cinco mil" → Números por extenso
33. ⏳ "são paulo" → Município
34. ⏳ "rio de janeiro" → Município
35. ⏳ "nota 12345" → Número da nota

---

## 📊 CRITÉRIOS DE VALIDAÇÃO

Para cada exemplo, verificar:

1. **Funcionalidade:**
   - ✅ Retorna resultados corretos
   - ✅ Não retorna erro
   - ✅ Filtro é aplicado corretamente

2. **Performance:**
   - ✅ Responde em < 3s (com LLM)
   - ✅ Responde em < 0.1s (fallback local)

3. **Feedback:**
   - ✅ Mostra explicação clara dos filtros
   - ✅ Indica se está usando IA ou fallback

4. **Dados:**
   - ✅ Resultados fazem sentido
   - ✅ Quantidade de registros é razoável

---

## 🔧 AÇÕES CORRETIVAS

### Se exemplo NÃO funcionar:

1. **Remover da documentação** imediatamente
2. **Adicionar à lista de "Não Suportado"**
3. **Criar issue** para implementação futura (se relevante)

### Se exemplo funcionar PARCIALMENTE:

1. **Ajustar documentação** com limitações
2. **Adicionar nota explicativa**
3. **Melhorar implementação** (se possível)

### Se exemplo funcionar PERFEITAMENTE:

1. ✅ Manter na documentação
2. ✅ Adicionar ao README como destaque
3. ✅ Usar em demos e apresentações

---

## 📝 RESULTADO ESPERADO

### Documentação Final:

**RAH (`src/services/rahAgent.ts`):**
- ✅ Apenas exemplos 100% validados
- ✅ Performance atualizada (MongoDB direto)
- ✅ Conceitos de cache revisados
- ✅ Sem referências a API REST para consultas

**Busca Natural (`src/components/BuscaNaturalSimples.tsx`):**
- ✅ Lista de exemplos validados (reduzida se necessário)
- ✅ Categorias claras (Básico, Avançado, Complexo)
- ✅ Indicação de suporte LLM vs Local

**README e Docs:**
- ✅ Apenas exemplos testados
- ✅ Screenshots de exemplos funcionando
- ✅ Vídeo demo (opcional)

---

## 🎯 PRÓXIMOS PASSOS

1. **AGORA:** Executar Fase 1 (10 casos básicos)
2. **Depois:** Executar Fase 2 (10 casos avançados)
3. **Depois:** Executar Fase 3 (10 casos complexos)
4. **Depois:** Executar Fase 4 (5 casos extremos)
5. **Final:** Atualizar toda documentação com resultados

---

## ✅ CHECKLIST DE ENTREGA

- [ ] Todos os 35 exemplos testados
- [ ] Documentação atualizada (RAH)
- [ ] Documentação atualizada (Busca Natural)
- [ ] README atualizado
- [ ] Exemplos não funcionais removidos
- [ ] Lista de "Não Suportado" criada (se necessário)
- [ ] Performance validada (< 3s com LLM)
- [ ] Fallback validado (< 0.1s local)

---

**Data de Criação:** 02/12/2025  
**Status:** 🟡 EM ANDAMENTO  
**Responsável:** Kiro AI  
**Prioridade:** 🔴 ALTA (Evitar "passar vergonha")
