# 🧪 COMO TESTAR A BUSCA NATURAL - Passo a Passo

## 🎯 OBJETIVO

Validar se TODOS os 35 exemplos de busca natural funcionam corretamente para evitar "passar vergonha" ensinando algo que não funciona.

---

## 📋 PRÉ-REQUISITOS

1. ✅ Aplicação rodando localmente
2. ✅ Dados de teste no MongoDB
3. ✅ Google Gemini API configurada (`.env`)
4. ✅ Navegador aberto

---

## 🚀 PASSO A PASSO

### PASSO 1: Iniciar a Aplicação

```bash
# No terminal, execute:
npm run dev
```

**Aguarde até ver:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### PASSO 2: Abrir no Navegador

1. Abra o navegador
2. Acesse: `http://localhost:5173/`
3. Aguarde carregar a aplicação

### PASSO 3: Navegar para Grid de Notas

1. No menu lateral, clique em **"Documentos Fiscais"** ou **"Grid de Notas"**
2. Aguarde carregar a grid
3. Localize o campo de **busca natural** (deve ter ícone 🤖 ou 🔍)

### PASSO 4: Testar Primeiro Exemplo

**Exemplo:** "ciano"

1. **Digite** "ciano" no campo de busca
2. **Pressione** Enter ou clique no botão "Buscar"
3. **Aguarde** processamento (1-3 segundos)
4. **Observe:**
   - ✅ Apareceu mensagem "Filtros aplicados: ..."?
   - ✅ Grid filtrou os resultados?
   - ✅ Resultados fazem sentido?

5. **Anote o resultado:**
   - ✅ **Funciona:** Se filtrou corretamente
   - ⚠️ **Parcial:** Se filtrou mas com problemas
   - ❌ **Não funciona:** Se deu erro ou não filtrou

### PASSO 5: Limpar Filtro

1. Clique no **X** ao lado da busca
2. Ou clique em **"Limpar"**
3. Verifique se voltou a mostrar todos os registros

### PASSO 6: Repetir para Todos os Exemplos

Repita os passos 4 e 5 para cada um dos 35 exemplos listados no `CHECKLIST_TESTES_BUSCA.md`

---

## 📊 O QUE OBSERVAR EM CADA TESTE

### 1. Feedback Visual

**Deve aparecer:**
```
Filtros aplicados: [Explicação dos filtros]
```

**Exemplos:**
- "ciano" → "Buscando 'ciano' em razão social."
- "acima de 5000" → "Valor > R$ 5.000."
- "entrada sp" → "Operação: Entrada. UF: SP."

### 2. Resultados da Grid

**Verifique:**
- ✅ Grid mostra apenas registros filtrados
- ✅ Quantidade de registros faz sentido
- ✅ Dados correspondem ao filtro aplicado

**Exemplo:**
- Busca: "canceladas"
- Resultado esperado: Apenas notas com status "Cancelada"

### 3. Performance

**Tempo de resposta:**
- ✅ Com LLM (🤖): 1-3 segundos
- ✅ Fallback local: < 0.1 segundos

**Se demorar muito (> 5s):**
- ⚠️ Pode ser problema de rede
- ⚠️ Pode ser problema com API Gemini
- ⚠️ Anote como "Lento" nas observações

### 4. Erros

**Se aparecer erro:**
- ❌ Anote a mensagem de erro completa
- ❌ Tire screenshot (se possível)
- ❌ Verifique console do navegador (F12)

---

## 🧪 EXEMPLOS DE TESTES

### Teste 1: Busca Simples por Empresa

**Entrada:** "ciano"

**Resultado Esperado:**
```
Filtros aplicados: Buscando 'ciano' em razão social.
```

**Grid deve mostrar:**
- Notas da empresa CIANO ALIMENTOS SUSTENTAVEIS LTDA
- Tanto como emitente quanto destinatário

**Status:**
- ✅ Funciona se encontrou registros da CIANO
- ⚠️ Parcial se encontrou mas com problemas
- ❌ Não funciona se não filtrou ou deu erro

---

### Teste 2: Busca por Valor

**Entrada:** "acima de 5000"

**Resultado Esperado:**
```
Filtros aplicados: Valor > R$ 5.000.
```

**Grid deve mostrar:**
- Apenas notas com valorTotal > R$ 5.000,00

**Verificação:**
1. Olhe a coluna "Valor Total"
2. Todos os valores devem ser > R$ 5.000
3. Se houver valor < R$ 5.000 → ❌ Não funciona

**Status:**
- ✅ Funciona se todos os valores > R$ 5.000
- ⚠️ Parcial se maioria > R$ 5.000 mas alguns não
- ❌ Não funciona se não filtrou corretamente

---

### Teste 3: Busca por Operação

**Entrada:** "entrada"

**Resultado Esperado:**
```
Filtros aplicados: Operação: Entrada.
```

**Grid deve mostrar:**
- Apenas notas de entrada (tipoOperacao = "0")

**Verificação:**
1. Olhe a coluna "Operação" ou "Tipo Operação"
2. Todos devem ser "Entrada" ou "0"
3. Se houver "Saída" ou "1" → ❌ Não funciona

**Status:**
- ✅ Funciona se todas são entrada
- ⚠️ Parcial se maioria entrada mas algumas saídas
- ❌ Não funciona se não filtrou

---

### Teste 4: Busca por Status

**Entrada:** "canceladas"

**Resultado Esperado:**
```
Filtros aplicados: Status: Cancelada.
```

**Grid deve mostrar:**
- Apenas notas com status "Cancelada"

**Verificação:**
1. Olhe a coluna "Status"
2. Todos devem ser "Cancelada"
3. Se houver "Autorizada" ou outro → ❌ Não funciona

**Status:**
- ✅ Funciona se todas canceladas
- ⚠️ Parcial se maioria canceladas mas algumas não
- ❌ Não funciona se não filtrou

---

### Teste 5: Busca Combinada

**Entrada:** "entrada acima de 5000"

**Resultado Esperado:**
```
Filtros aplicados: Operação: Entrada. Valor > R$ 5.000.
```

**Grid deve mostrar:**
- Apenas notas de ENTRADA
- E com valor > R$ 5.000

**Verificação:**
1. Todas devem ser "Entrada" (tipoOperacao = "0")
2. Todas devem ter valor > R$ 5.000
3. Se falhar qualquer condição → ❌ Não funciona

**Status:**
- ✅ Funciona se ambas condições atendidas
- ⚠️ Parcial se uma condição funciona mas outra não
- ❌ Não funciona se nenhuma condição funciona

---

## 📝 COMO DOCUMENTAR RESULTADOS

### Formato Simples

Para cada teste, anote:

```
Teste X: "[exemplo]"
Status: [✅/⚠️/❌]
Observações: [O que aconteceu]
```

**Exemplo:**

```
Teste 1: "ciano"
Status: ✅
Observações: Filtrou corretamente, encontrou 15 registros da CIANO

Teste 2: "acima de 5000"
Status: ✅
Observações: Todos os valores > R$ 5.000, funcionou perfeitamente

Teste 3: "entrada"
Status: ⚠️
Observações: Filtrou mas incluiu algumas saídas também

Teste 4: "canceladas"
Status: ❌
Observações: Não filtrou, mostrou todos os status
```

---

## 🔧 TROUBLESHOOTING

### Problema 1: "Busca não faz nada"

**Possíveis causas:**
- Campo de busca não está conectado
- JavaScript com erro
- Componente não carregou

**Solução:**
1. Abra console do navegador (F12)
2. Procure por erros em vermelho
3. Recarregue a página (F5)
4. Tente novamente

---

### Problema 2: "Sempre dá erro de API"

**Possíveis causas:**
- Google Gemini API key inválida
- Sem internet
- Quota da API esgotada

**Solução:**
1. Verifique `.env` → `VITE_API_GOOGLE_GEMINI`
2. Teste conexão com internet
3. Verifique se fallback local funciona

---

### Problema 3: "Filtro não é aplicado"

**Possíveis causas:**
- Lógica de filtro com bug
- Dados não correspondem ao esperado
- Mapeamento de campos incorreto

**Solução:**
1. Abra console (F12)
2. Procure por logs: "🔍 Aplicando filtros LLM"
3. Verifique se filtros estão corretos
4. Anote como ❌ e informe Kiro AI

---

### Problema 4: "Muito lento (> 5s)"

**Possíveis causas:**
- Muitos dados para filtrar
- API Gemini lenta
- Rede lenta

**Solução:**
1. Aguarde até 10 segundos
2. Se funcionar, anote como ⚠️ "Lento"
3. Se não funcionar, anote como ❌

---

## ✅ CHECKLIST FINAL

Antes de informar resultados:

- [ ] Testei TODOS os 35 exemplos
- [ ] Anotei status de cada um (✅/⚠️/❌)
- [ ] Documentei observações importantes
- [ ] Calculei estatísticas (X/35 funcionam)
- [ ] Criei arquivo `RESULTADOS_TESTES_BUSCA.md`
- [ ] Pronto para informar Kiro AI

---

## 🎯 PRÓXIMO PASSO

Após completar todos os testes:

1. **Crie arquivo:** `RESULTADOS_TESTES_BUSCA.md`
2. **Copie template** do `CHECKLIST_TESTES_BUSCA.md`
3. **Preencha** com seus resultados
4. **Informe Kiro AI:** "Completei os testes, veja RESULTADOS_TESTES_BUSCA.md"

---

**Boa sorte com os testes!** 🚀

Se tiver dúvidas durante os testes, anote e pergunte depois.

---

**Data:** 02/12/2025  
**Versão:** 1.0  
**Status:** 📋 Pronto para uso
