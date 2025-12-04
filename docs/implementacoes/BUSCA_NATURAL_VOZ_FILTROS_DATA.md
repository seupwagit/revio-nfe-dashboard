# Busca Natural com Voz e Filtros de Data Aprimorados

**Data:** 04 de Dezembro de 2025  
**Versão:** 2.0  
**Status:** ✅ Implementado e Testado

---

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Funcionalidades Implementadas](#funcionalidades-implementadas)
3. [Busca Natural (LLM)](#busca-natural-llm)
4. [Reconhecimento de Voz](#reconhecimento-de-voz)
5. [Filtros Nativos da Grid](#filtros-nativos-da-grid)
6. [Detalhes Técnicos](#detalhes-técnicos)
7. [Exemplos de Uso](#exemplos-de-uso)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Esta implementação adiciona três melhorias principais ao sistema de busca e filtros:

1. **Busca Natural com Datas em Formato Brasileiro** - Aceita datas no formato dd/mm/aaaa
2. **Reconhecimento de Voz** - Permite busca por comando de voz
3. **Filtros Nativos Aprimorados** - Filtros de cabeçalho da grid com suporte a datas e operadores

---

## ✨ Funcionalidades Implementadas

### 1. Busca Natural (LLM) - Datas em Formato Brasileiro

#### Antes:
- ❌ Não reconhecia "data 01/12/2025"
- ❌ Não reconhecia "01/12/2025" sozinho
- ❌ Só funcionava com "data emissão maior que..."

#### Depois:
- ✅ Reconhece "01/12/2025" (busca exata)
- ✅ Reconhece "data 01/12/2025" (busca exata)
- ✅ Reconhece "data emissao 01/12/2025" (busca exata)
- ✅ Reconhece "data emissão 01/12/2025" (com acento)
- ✅ Reconhece "maior que 01/12/2025" (datas posteriores)
- ✅ Reconhece "menor que 01/12/2025" (datas anteriores)
- ✅ Reconhece "entre 01/12/2025 e 31/12/2025" (intervalo)

#### Correções Aplicadas:

**Problema 1:** Regex não capturava "data" sem "emissão"
```typescript
// ANTES
/(?:data\s+emiss[aã]o\s+)?(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i

// DEPOIS
/(?:(?:data\s+)?(?:emiss[aã]o\s+)?)?(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i
```

**Problema 2:** Texto da data não era removido, causando busca de empresa
```typescript
// Solução: Remover completamente o texto da data
textoLower = textoLower.replace(/(?:data\s+)?(?:emiss[aã]o\s+)?\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/gi, '').trim()
```

**Problema 3:** Comparação de datas com timezone causava problemas
```typescript
// Solução: Comparar apenas strings de data (YYYY-MM-DD)
const dataEmissaoStr = item.dataEmissao.split('T')[0]
const passou = dataEmissaoStr >= dataInicioStr && dataEmissaoStr <= dataFimStr
```

---

### 2. Reconhecimento de Voz 🎤

#### Funcionalidade:
- Botão de microfone no campo de busca natural
- Reconhecimento de voz em português brasileiro
- Processamento automático após reconhecer a fala
- Feedback visual durante gravação

#### Como Usar:
1. Clique no ícone do **microfone roxo** 🎤
2. O ícone fica **vermelho pulsando** enquanto grava
3. Fale sua busca em português
4. O texto aparece automaticamente e a busca é executada

#### Exemplos de Comandos de Voz:
- "data um de dezembro de dois mil e vinte e cinco"
- "notas acima de dez mil"
- "série oitocentos e oitenta"
- "entradas de São Paulo"
- "notas canceladas"

#### Navegadores Suportados:
- ✅ Chrome
- ✅ Edge
- ✅ Safari
- ❌ Firefox (não suporta Web Speech API)

#### Tratamento de Erros:
- **Sem fala detectada:** Alerta para tentar novamente
- **Permissão negada:** Instrui a habilitar microfone
- **Erro genérico:** Mostra mensagem de erro específica

#### Código Implementado:
```typescript
const handleVoiceInput = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = new SpeechRecognition()
  
  recognition.lang = 'pt-BR'
  recognition.continuous = false
  recognition.interimResults = false
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
    setQuery(transcript)
    processarBusca(transcript)
  }
  
  recognition.start()
}
```

---

### 3. Filtros Nativos da Grid TanStack

#### Funcionalidade:
- Filtros de cabeçalho com suporte a operadores
- Tooltips informativos
- Placeholders específicos por tipo de campo

#### Para Datas (coluna Data Emissão):

**Formatos Aceitos:**
- `01/12/2024` - Data exata
- `>01/12/2024` - Datas posteriores
- `<31/12/2024` - Datas anteriores

**Placeholder:** `dd/mm/aaaa`

**Tooltip:**
```
Data:
• 01/12/2024 (exata)
• >01/12/2024 (depois)
• <31/12/2024 (antes)
```

#### Para Valores (coluna Valor Total):

**Formatos Aceitos:**
- `1000` - Valor exato
- `>1000` - Valores maiores
- `<5000` - Valores menores

**Tooltip:**
```
Valor:
• 1000 (exato)
• >1000 (maior)
• <5000 (menor)
```

#### Para Texto (outras colunas):

**Formato:** Busca parcial (contém o texto)

**Tooltip:**
```
Texto:
Busca parcial
(contém o texto)
```

#### Funções de Filtro Customizadas:

**Filtro de Data:**
```typescript
const dateFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
  const cellValue = row.getValue(columnId) as string
  const cellDate = new Date(cellValue)
  
  const match = filterValue.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/)
  if (match) {
    const filterDate = new Date(`${match[3]}-${match[2]}-${match[1]}`)
    
    if (filterValue.startsWith('>')) return cellDate > filterDate
    if (filterValue.startsWith('<')) return cellDate < filterDate
    
    // Comparação exata (mesmo dia)
    return cellDate.toISOString().split('T')[0] === filterDate.toISOString().split('T')[0]
  }
  
  return false
}
```

**Filtro de Valor:**
```typescript
const numberFilterFn: FilterFn<any> = (row, columnId, filterValue) => {
  const cellValue = row.getValue(columnId)
  const numValue = typeof cellValue === 'number' ? cellValue : parseFloat(cellValue)
  
  if (filterValue.startsWith('>')) {
    return numValue > parseFloat(filterValue.substring(1))
  }
  if (filterValue.startsWith('<')) {
    return numValue < parseFloat(filterValue.substring(1))
  }
  
  return numValue === parseFloat(filterValue)
}
```

---

## 🔧 Detalhes Técnicos

### Arquivos Modificados:

1. **src/components/BuscaNatural.tsx**
   - Adicionado reconhecimento de voz
   - Corrigido regex de datas
   - Melhorado remoção de texto após detectar data
   - Adicionado logs de debug

2. **src/components/GridPaginada.tsx**
   - Adicionadas funções de filtro customizadas
   - Melhorada comparação de datas (string vs Date)
   - Adicionados tooltips informativos
   - Adicionados placeholders específicos

3. **src/pages/GridNFeSimples.tsx**
   - Aplicado `filterFn: 'dateFilter'` na coluna dataEmissao
   - Aplicado `filterFn: 'numberFilter'` na coluna valorTotal

4. **src/pages/GridCFeSimples.tsx**
   - Aplicado `filterFn: 'dateFilter'` na coluna dataEmissao

5. **src/pages/GridCTeSimples.tsx**
   - Aplicado `filterFn: 'dateFilter'` na coluna dataEmissao

6. **src/pages/DocumentosFiscais.tsx**
   - Adicionado botão "Último ano" (365 dias)
   - Alterado período padrão de "último mês" para "último ano"

7. **src/components/PeriodPresets.tsx**
   - Botão "Último ano" já existia (não foi modificado)

### Dependências:

- **Web Speech API** (nativa do navegador)
- **TanStack Table v8** (já existente)
- **Lucide React** (ícones Mic e MicOff)

---

## 📚 Exemplos de Uso

### Busca Natural (LLM):

#### Datas:
```
"01/12/2025"                          → Data exata
"data 01/12/2025"                     → Data exata
"data emissao 01/12/2025"             → Data exata
"maior que 01/12/2025"                → Datas posteriores
"menor que 31/12/2025"                → Datas anteriores
"entre 01/12/2025 e 31/12/2025"       → Intervalo
```

#### Combinações:
```
"data 01/12/2025 entradas"            → Data + Operação
"01/12/2025 acima de 5000"            → Data + Valor
"data 01/12/2025 sp"                  → Data + Estado
"01/12/2025 serie 880"                → Data + Série
```

#### Outros Filtros (sem acento):
```
"serie 880"                           → Série
"operacao entrada"                    → Operação
"manifestacao confirmada"             → Manifestação
```

### Reconhecimento de Voz:

#### Comandos Simples:
```
🎤 "data um de dezembro"
🎤 "notas acima de mil reais"
🎤 "série oitocentos e oitenta"
🎤 "entradas de São Paulo"
```

#### Comandos Complexos:
```
🎤 "data primeiro de dezembro entradas acima de cinco mil"
🎤 "notas canceladas de São Paulo"
🎤 "série oitocentos e oitenta autorizadas"
```

### Filtros Nativos da Grid:

#### Coluna Data Emissão:
```
01/12/2024        → Notas de 01/12/2024
>01/12/2024       → Notas após 01/12/2024
<31/12/2024       → Notas antes de 31/12/2024
```

#### Coluna Valor Total:
```
1000              → Notas de R$ 1.000,00
>1000             → Notas acima de R$ 1.000,00
<5000             → Notas abaixo de R$ 5.000,00
```

#### Coluna Razão Social:
```
INFOCO            → Contém "INFOCO"
CIANO             → Contém "CIANO"
```

---

## 🐛 Troubleshooting

### Problema: Busca por data não retorna resultados

**Causa:** Formato de data incorreto ou timezone

**Solução:**
1. Use formato brasileiro: `dd/mm/aaaa`
2. Verifique no console (F12) os logs:
   - 🔍 "Data detectada"
   - 🧹 "Texto após remover data"
   - 📅 "Filtrando por data"
   - ✅ "Match" (deve aparecer)

**Exemplo de log correto:**
```
🔍 BUSCA NATURAL - Data detectada: {dia: '01', mes: '12', ano: '2025', dataInicio: '2025-12-01', dataFim: '2025-12-01'}
🧹 Texto após remover data: ""
📅 Filtrando por data: {dataInicio: '2025-12-01', dataFim: '2025-12-01'}
✅ Match #1: {numero: '123', dataEmissao: '2025-12-01', ...}
```

### Problema: Reconhecimento de voz não funciona

**Causa:** Navegador não suporta ou permissão negada

**Solução:**
1. Use Chrome, Edge ou Safari
2. Habilite permissão de microfone:
   - Chrome: Configurações → Privacidade → Microfone
   - Edge: Configurações → Cookies e permissões → Microfone
3. Verifique se o ícone do microfone aparece (só aparece se suportado)

### Problema: Filtro de cabeçalho não funciona com "/"

**Causa:** Problema resolvido! Agora aceita "/" nas datas

**Solução:** Use o formato `dd/mm/aaaa` normalmente

### Problema: Busca por data também busca empresa

**Causa:** Texto da data não estava sendo removido

**Solução:** Problema resolvido! O texto é removido completamente após detectar a data

---

## 📊 Logs de Debug

### Console do Navegador (F12):

#### Busca Natural:
```
🔍 BUSCA NATURAL - Data detectada: {...}
🧹 Texto após remover data: ""
🔍 BuscaNatural - Filtros processados: {...}
📝 BuscaNatural - Explicação: "Data Emissão = 01/12/2025."
✅ BuscaNatural - Chamando onSearch com: {...}
```

#### Grid Paginada:
```
============================================================
🔍 BUSCA NATURAL INICIADA
============================================================
📋 Filtros recebidos: {...}
📊 Total de registros disponíveis: 5199
📅 Filtrando por data: {dataInicio: '2025-12-01', dataFim: '2025-12-01'}
✅ Match #1: {numero: '123', dataEmissao: '2025-12-01'}
✅ Match #2: {numero: '456', dataEmissao: '2025-12-01'}
📊 Resultado após filtro data: 2 registros (2 matches)
============================================================
✅ BUSCA NATURAL CONCLUÍDA
============================================================
```

#### Reconhecimento de Voz:
```
🎤 Reconhecimento de voz iniciado
🎤 Texto reconhecido: "data um de dezembro"
🎤 Reconhecimento de voz finalizado
```

---

## 🎯 Benefícios

### Para o Usuário:
- ✅ Busca mais intuitiva com datas em formato brasileiro
- ✅ Busca por voz para maior agilidade
- ✅ Filtros nativos mais poderosos com operadores
- ✅ Tooltips que ensinam como usar os filtros
- ✅ Feedback visual durante gravação de voz

### Para o Sistema:
- ✅ Código mais robusto e testado
- ✅ Logs de debug para troubleshooting
- ✅ Comparação de datas mais confiável
- ✅ Melhor experiência do usuário

---

## 📝 Notas Finais

- Todos os filtros foram testados e estão funcionando
- A busca natural agora é muito mais flexível
- O reconhecimento de voz adiciona uma camada de acessibilidade
- Os filtros nativos da grid estão mais intuitivos com tooltips

**Desenvolvido em:** 04 de Dezembro de 2025  
**Testado em:** Chrome 120, Edge 120  
**Status:** ✅ Produção
