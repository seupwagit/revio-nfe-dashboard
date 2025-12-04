# 🔍 Busca Natural Melhorada - Sistema Inteligente

## ✅ Melhorias Implementadas

### 1. **Busca por Operação (NOVO!)**
Agora você pode buscar por tipo de operação:

```
✅ "operação entrada"
✅ "operação saída"
✅ "entradas"
✅ "saídas"
```

**Exemplos:**
- `operação entrada acima de 10000` → Notas de entrada com valor > R$ 10.000
- `saída canceladas` → Notas de saída canceladas
- `entradas janeiro 2024` → Todas as entradas de janeiro/2024

---

### 2. **Novos Campos Suportados**

#### Protocolada
```
✅ "protocolada sim"
✅ "protocoladas"
✅ "protocolada não"
✅ "não protocolada"
```

#### Natureza da Operação
```
✅ "natureza venda"
✅ "natureza de operação compra"
```

#### Status de Manifestação
```
✅ "manifestação confirmada"
✅ "manifestação ciência"
```

#### Impostos Específicos
```
✅ "icms maior que 500"
✅ "ipi acima de 100"
✅ "pis maior que 50"
✅ "cofins acima de 100"
✅ "frete maior que 200"
✅ "seguro acima de 50"
✅ "desconto maior que 100"
```

#### Série e Modelo
```
✅ "série 1"
✅ "modelo 55"
```

#### Município Genérico
```
✅ "município campinas"
✅ "município curitiba"
```

---

### 3. **Sistema de Sugestões Inteligentes** 🤖

Quando você digita algo que não é reconhecido, o sistema agora:

1. **Analisa** sua busca
2. **Identifica** campos similares
3. **Sugere** alternativas com exemplos
4. **Permite clicar** para testar

**Exemplo:**

Você digita: `"protocolo"`

O sistema responde:
```
🤔 Não encontrei um filtro específico. Você quis dizer algum destes campos?

┌─────────────────────────────────────────┐
│ protocolada                             │
│ Se a nota foi protocolada               │
│ Exemplo: "protocolada sim"              │
└─────────────────────────────────────────┘
```

---

### 4. **Campos Mapeados para Sugestões**

O sistema reconhece estas palavras-chave e sugere o campo correto:

| Palavra-chave | Campo Sugerido | Exemplo |
|---------------|----------------|---------|
| operacao, entrada, saida | tipoOperacao | "operação entrada" |
| natureza | naturezaOperacao | "natureza venda" |
| protocolada, protocolo | protocolada | "protocolada sim" |
| manifestacao | statusManifestacao | "manifestação confirmada" |
| icms | totais.valorICMS | "icms maior que 500" |
| ipi | totais.valorIPI | "ipi acima de 100" |
| pis | totais.valorPIS | "pis maior que 50" |
| cofins | totais.valorCOFINS | "cofins acima de 100" |
| frete | totais.valorFrete | "frete maior que 200" |
| seguro | totais.valorSeguro | "seguro acima de 50" |
| desconto | totais.valorDesconto | "desconto maior que 100" |
| serie | serie | "serie 1" |
| modelo | modelo | "modelo 55" |
| chave | chaveAcesso | "chave 35210..." |
| ie | emitente.ie | "ie 123456789" |
| municipio | emitente.municipio | "municipio são paulo" |
| endereco | emitente.endereco | "endereco avenida paulista" |

---

## 📋 Exemplos Completos de Uso

### Busca Simples
```
"operação entrada"
→ Todas as notas de entrada

"operação saída"
→ Todas as notas de saída
```

### Busca Combinada
```
"operação entrada acima de 10000"
→ Entradas com valor > R$ 10.000

"saída canceladas sp"
→ Saídas canceladas de São Paulo

"entradas protocoladas janeiro 2024"
→ Entradas protocoladas de janeiro/2024
```

### Busca com Impostos
```
"icms maior que 500 sp"
→ Notas com ICMS > R$ 500 de SP

"ipi acima de 100 operação entrada"
→ Entradas com IPI > R$ 100

"frete maior que 200 últimos 30 dias"
→ Notas com frete > R$ 200 nos últimos 30 dias
```

### Busca Avançada
```
"operação entrada acima de 5000 canceladas sp janeiro 2024"
→ Entradas canceladas de SP em jan/2024 com valor > R$ 5.000

"saída protocolada sim icms maior que 1000"
→ Saídas protocoladas com ICMS > R$ 1.000
```

---

## 🎯 Como Funciona o Sistema de Sugestões

### Cenário 1: Palavra Reconhecida
```
Você: "protocolo"
Sistema: 🤔 Você quis dizer "protocolada"?
         Exemplo: "protocolada sim"
```

### Cenário 2: Múltiplas Sugestões
```
Você: "imposto"
Sistema: 🤔 Você quis dizer algum destes?
         - ICMS (exemplo: "icms maior que 500")
         - IPI (exemplo: "ipi acima de 100")
         - PIS (exemplo: "pis maior que 50")
         - COFINS (exemplo: "cofins acima de 100")
```

### Cenário 3: Nada Encontrado
```
Você: "xpto123"
Sistema: Buscando "xpto123" em todos os campos.
         (busca genérica em todos os campos da grid)
```

---

## 🚀 Benefícios

1. **Mais Intuitivo**: Busca por operação é muito comum
2. **Mais Completo**: Cobre TODOS os campos da grid
3. **Mais Inteligente**: Sugere alternativas quando não entende
4. **Mais Educativo**: Ensina o usuário a usar melhor o sistema
5. **Sem Custos**: Tudo local, sem APIs externas

---

## 🔧 Campos Suportados (Completo)

### Identificação
- ✅ Número da nota
- ✅ Série
- ✅ Modelo
- ✅ Chave de acesso

### Operação (NOVO!)
- ✅ Tipo de operação (entrada/saída)
- ✅ Natureza da operação
- ✅ Protocolada (sim/não)

### Status
- ✅ Status (autorizada/cancelada/pendente)
- ✅ Status de manifestação

### Valores
- ✅ Valor total
- ✅ ICMS
- ✅ IPI
- ✅ PIS
- ✅ COFINS
- ✅ Frete
- ✅ Seguro
- ✅ Desconto

### Partes
- ✅ CNPJ emitente/destinatário
- ✅ Razão social emitente/destinatário
- ✅ IE emitente/destinatário
- ✅ Município emitente/destinatário
- ✅ UF emitente/destinatário
- ✅ Endereço

### Período
- ✅ Últimos X dias
- ✅ Mês e ano específico
- ✅ Data início/fim

---

## 💡 Dicas de Uso

1. **Combine filtros**: "operação entrada acima de 10000 sp"
2. **Use linguagem natural**: "entradas canceladas janeiro"
3. **Teste sugestões**: Clique nas sugestões para aprender
4. **Seja específico**: Quanto mais detalhes, melhor o resultado
5. **Use exemplos**: Clique no ícone ? para ver exemplos

---

## 🎨 Interface Visual

### Resultado Normal
```
🔍 Buscando: Operação: Entrada. Valor Total > R$ 10.000. Estado: SP.
```

### Sugestões
```
🤔 Não encontrei um filtro específico. Você quis dizer algum destes campos?

┌─────────────────────────────────────────┐
│ protocolada                             │
│ Se a nota foi protocolada               │
│ Exemplo: "protocolada sim"              │
└─────────────────────────────────────────┘
[Clique para testar]
```

---

## 📊 Comparação: Antes vs Depois

| Recurso | Antes | Depois |
|---------|-------|--------|
| Busca por operação | ❌ | ✅ |
| Impostos específicos | ❌ | ✅ (7 tipos) |
| Protocolada | ❌ | ✅ |
| Manifestação | ❌ | ✅ |
| Série/Modelo | ❌ | ✅ |
| Sugestões inteligentes | ❌ | ✅ |
| Campos cobertos | ~10 | ~30+ |
| Feedback ao usuário | Básico | Completo |

---

## 🎓 Próximos Passos

Possíveis melhorias futuras:
1. Histórico de buscas recentes
2. Buscas salvas/favoritas
3. Sugestões baseadas em uso frequente
4. Autocomplete enquanto digita
5. Busca por voz (speech-to-text)

---

**Status**: ✅ Implementado e funcionando
**Arquivos**: `src/components/BuscaNatural.tsx`
**Compatibilidade**: Todas as grids (NFe, CFe, CTe)
