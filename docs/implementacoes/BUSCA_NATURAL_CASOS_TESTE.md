# 🔍 Busca Natural - Casos de Teste e Exemplos

## ✅ Melhorias Implementadas

### 🎯 Problema Resolvido:
- Busca por razão social não funcionava bem
- Exemplo: "areia" não encontrava empresas com "areia" no nome
- Faltavam mais exemplos e casos de uso

### ✅ Solução Implementada:
1. **Busca inteligente por razão social** - Detecta automaticamente palavras simples
2. **Mais exemplos** - 40+ exemplos clicáveis
3. **Ajuda melhorada** - Seção especial para razão social
4. **Scroll na ajuda** - Lista completa de exemplos com scroll

---

## 📋 TODOS OS CASOS DE TESTE

### 1. 🏢 Busca por Razão Social (NOVO!)

#### Busca Simples (Automática):
```
Digite: areia
Resultado: Busca "areia" em emitente E destinatário
Encontra: "Areia Branca Ltda", "Comercial de Areia", "Areia Fina SA"
```

```
Digite: petrobras
Resultado: Busca "petrobras" em emitente E destinatário
Encontra: "Petrobras Distribuidora", "Petrobras SA", etc
```

```
Digite: vale
Resultado: Busca "vale" em emitente E destinatário
Encontra: "Vale SA", "Vale do Rio Doce", etc
```

#### Busca Explícita:
```
Digite: emitente contém areia
Resultado: Busca apenas no emitente
```

```
Digite: destinatário contém vale
Resultado: Busca apenas no destinatário
```

```
Digite: razão social petrobras
Resultado: Busca em emitente/destinatário
```

### 2. 📊 Operações

```
Digite: entrada
Resultado: Filtra notas de entrada (IND_OPER = 0)
```

```
Digite: saída
Resultado: Filtra notas de saída (IND_OPER = 1)
```

```
Digite: operação entrada
Resultado: Notas de entrada
```

```
Digite: entradas
Resultado: Todas as notas de entrada
```

### 3. 💰 Valores

```
Digite: acima de 10000
Resultado: Valor total > R$ 10.000
```

```
Digite: maior que 5000
Resultado: Valor total > R$ 5.000
```

```
Digite: menor que 1000
Resultado: Valor total < R$ 1.000
```

```
Digite: abaixo de 500
Resultado: Valor total < R$ 500
```

```
Digite: entre 1000 e 5000
Resultado: Valor entre R$ 1.000 e R$ 5.000
```

```
Digite: valor > 10000
Resultado: Valor total > R$ 10.000
```

### 4. 💵 Impostos Específicos

```
Digite: icms maior que 500
Resultado: ICMS > R$ 500
```

```
Digite: ipi acima de 100
Resultado: IPI > R$ 100
```

```
Digite: pis maior que 50
Resultado: PIS > R$ 50
```

```
Digite: cofins acima de 100
Resultado: COFINS > R$ 100
```

```
Digite: frete maior que 200
Resultado: Frete > R$ 200
```

```
Digite: seguro acima de 50
Resultado: Seguro > R$ 50
```

```
Digite: desconto maior que 100
Resultado: Desconto > R$ 100
```

### 5. ✅ Status

```
Digite: canceladas
Resultado: Status = cancelada
```

```
Digite: autorizadas
Resultado: Status = autorizada
```

```
Digite: pendente
Resultado: Status = processando
```

```
Digite: protocolada sim
Resultado: Protocolada = Sim
```

```
Digite: protocolada não
Resultado: Protocolada = Não
```

### 6. 📝 Natureza e Manifestação

```
Digite: natureza venda
Resultado: Natureza da operação contém "venda"
```

```
Digite: natureza compra
Resultado: Natureza da operação contém "compra"
```

```
Digite: manifestação confirmada
Resultado: Status de manifestação = confirmada
```

```
Digite: manifestação ciência
Resultado: Status de manifestação = ciência
```

### 7. 🔢 Identificação

```
Digite: cnpj 12345678
Resultado: CNPJ contém "12345678"
```

```
Digite: nota 12345
Resultado: Número da nota = 12345
```

```
Digite: série 1
Resultado: Série = 1
```

```
Digite: modelo 55
Resultado: Modelo = 55 (NF-e)
```

```
Digite: modelo 65
Resultado: Modelo = 65 (NFC-e)
```

### 8. 📍 Localização

```
Digite: sp
Resultado: Estado = SP
```

```
Digite: são paulo
Resultado: Município = São Paulo
```

```
Digite: rio de janeiro
Resultado: Município = Rio de Janeiro
```

```
Digite: município campinas
Resultado: Município = Campinas
```

```
Digite: mg
Resultado: Estado = MG
```

### 9. 📅 Datas

```
Digite: últimos 7 dias
Resultado: Período dos últimos 7 dias
```

```
Digite: últimos 30 dias
Resultado: Período dos últimos 30 dias
```

```
Digite: janeiro 2024
Resultado: Todo o mês de janeiro/2024
```

```
Digite: fevereiro 2025
Resultado: Todo o mês de fevereiro/2025
```

```
Digite: dez 2024
Resultado: Dezembro/2024
```

### 10. 🎯 Combinações (Múltiplos Filtros)

```
Digite: entrada acima de 5000
Resultado: Entradas com valor > R$ 5.000
```

```
Digite: saída petrobras
Resultado: Saídas da Petrobras
```

```
Digite: sp acima de 10000
Resultado: SP com valor > R$ 10.000
```

```
Digite: entrada canceladas sp
Resultado: Entradas canceladas de SP
```

```
Digite: operação saída icms maior que 500 janeiro 2024
Resultado: Saídas com ICMS > R$ 500 em janeiro/2024
```

```
Digite: areia entrada acima de 1000
Resultado: Entradas da "areia" com valor > R$ 1.000
```

```
Digite: vale sp autorizadas
Resultado: Notas autorizadas da Vale em SP
```

### 11. 🔍 Busca Genérica

```
Digite: qualquer texto sem palavras-chave
Resultado: Busca em TODOS os campos
Exemplo: "transporte" busca em todos os campos
```

---

## 🎨 Interface Melhorada

### Modal de Ajuda:
- ✅ 40+ exemplos clicáveis
- ✅ Scroll para ver todos
- ✅ Seção especial para razão social
- ✅ Categorias organizadas:
  - Operação & Status
  - Valores
  - Partes & Local
  - Datas
  - Combinações

### Feedback Visual:
- ✅ Mostra o que foi entendido
- ✅ Sugestões automáticas
- ✅ Indicador de campos similares

---

## 🧪 Como Testar

### Teste 1: Busca por Razão Social
```
1. Abra Grid NF-e
2. Digite apenas: areia
3. ✅ Deve buscar em emitente E destinatário
4. ✅ Deve encontrar empresas com "areia" no nome
```

### Teste 2: Combinação de Filtros
```
1. Digite: entrada areia acima de 5000
2. ✅ Deve filtrar:
   - Operação = entrada
   - Razão social contém "areia"
   - Valor > R$ 5.000
```

### Teste 3: Ajuda Completa
```
1. Clique no ícone de ajuda (?)
2. ✅ Deve mostrar 40+ exemplos
3. ✅ Deve ter scroll
4. ✅ Deve ter seção amarela sobre razão social
5. Clique em qualquer exemplo
6. ✅ Deve aplicar o filtro automaticamente
```

### Teste 4: Sugestões Automáticas
```
1. Digite: icm (sem o 's')
2. ✅ Deve sugerir campo "icms"
3. ✅ Deve mostrar exemplo de uso
```

---

## 📊 Estatísticas

### Campos Suportados: 20+
- tipoOperacao
- naturezaOperacao
- protocolada
- statusManifestacao
- valorTotal (min/max)
- valorICMS, valorIPI, valorPIS, valorCOFINS
- valorFrete, valorSeguro, valorDesconto
- status
- serie, modelo
- cnpj, numero
- emitente, destinatario
- uf, municipio
- dataInicio, dataFim

### Exemplos Disponíveis: 40+
- Operações: 4
- Valores: 3
- Impostos: 6
- Status: 4
- Empresas: 6
- Localização: 4
- Identificação: 5
- Datas: 4
- Combinações: 4

### Padrões Reconhecidos: 30+
- Palavras-chave: entrada, saída, cancelada, etc
- Operadores: acima de, maior que, entre, etc
- Datas: últimos X dias, mês/ano, etc
- Localização: UF, município, etc
- Busca simples: palavras sem contexto

---

## 💡 Dicas para Usuários

### ✅ Funciona Bem:
```
✓ "areia" - Busca simples por nome
✓ "entrada acima de 5000" - Combinação
✓ "sp janeiro 2024" - Local + data
✓ "petrobras canceladas" - Nome + status
✓ "icms maior que 500" - Imposto específico
```

### ❌ Não Funciona (Ainda):
```
✗ "notas da semana passada" - Período relativo complexo
✗ "top 10 maiores valores" - Ordenação
✗ "média de valores" - Cálculos
✗ "agrupar por emitente" - Agregações
```

### 🎯 Melhor Prática:
```
1. Comece simples: "areia"
2. Adicione filtros: "areia entrada"
3. Refine valores: "areia entrada acima de 5000"
4. Adicione local/data: "areia entrada acima de 5000 sp"
```

---

## 🚀 Próximas Melhorias (Futuro)

### Sugestões:
1. **Autocomplete** - Sugerir enquanto digita
2. **Histórico** - Salvar buscas recentes
3. **Favoritos** - Salvar filtros frequentes
4. **Sinônimos** - "fornecedor" = "emitente"
5. **Negação** - "não canceladas"
6. **Ordenação** - "maiores valores primeiro"
7. **Agregação** - "total por emitente"

---

## ✅ Checklist de Validação

- [x] Busca por razão social simples
- [x] Busca por razão social explícita
- [x] Operações (entrada/saída)
- [x] Valores (acima/abaixo/entre)
- [x] Impostos específicos
- [x] Status e protocolada
- [x] Natureza e manifestação
- [x] Identificação (CNPJ, nota, série)
- [x] Localização (UF, município)
- [x] Datas (últimos dias, mês/ano)
- [x] Combinações múltiplas
- [x] Busca genérica
- [x] Sugestões automáticas
- [x] 40+ exemplos clicáveis
- [x] Ajuda melhorada
- [x] Seção especial razão social
- [x] Scroll na lista de exemplos
- [x] TypeScript sem erros
- [x] Documentação completa
- [ ] Testado com dados reais (aguardando usuário)

---

## 🎉 Conclusão

Busca Natural agora é muito mais inteligente e fácil de usar!

**Principais melhorias:**
- 🏢 Busca por razão social simplificada
- 📚 40+ exemplos clicáveis
- 📖 Ajuda completa e organizada
- 🎯 Reconhecimento melhorado
- ✨ Interface mais amigável

**TESTE AGORA E VEJA A DIFERENÇA!** 🚀

---

**Implementado em:** 30/11/2025 12:00  
**Arquivo:** `src/components/BuscaNatural.tsx`  
**Linhas modificadas:** ~50
