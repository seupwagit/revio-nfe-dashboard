# 📚 Manual Completo do Usuário - SpedRevio

## 🎯 Índice

1. [Introdução](#introdução)
2. [Dashboard](#dashboard)
3. [Analytics](#analytics)
4. [Grids de Documentos](#grids-de-documentos)
5. [Busca Natural com IA](#busca-natural-com-ia)
6. [Exportação para Excel](#exportação-para-excel)
7. [Cache e Performance](#cache-e-performance)
8. [RAH - Assistente IA](#rah---assistente-ia)
9. [Dicas e Truques](#dicas-e-truques)
10. [Troubleshooting](#troubleshooting)

---

## 📖 Introdução

### O que é o SpedRevio?

SpedRevio é um dashboard moderno para análise de documentos fiscais eletrônicos (NF-e, CT-e, CF-e). Ele consome dados da API Revio e oferece:

- 📊 **Dashboards interativos** com gráficos e estatísticas
- 📈 **Analytics avançado** com múltiplas visualizações
- 🔍 **Grids poderosas** com filtros e ordenação
- 🤖 **Busca natural com IA** (perguntas em linguagem natural)
- 📥 **Exportação ilimitada** para Excel
- ⚡ **Cache inteligente** para performance

### Primeiros Passos

1. Acesse o sistema pelo navegador
2. Você verá o Dashboard principal
3. Use o menu lateral para navegar
4. Experimente os filtros de período

---

## 📊 Dashboard

### Visão Geral

O Dashboard é a tela inicial que mostra:

**Cards de Estatísticas:**
- 📄 Total de Documentos
- 💰 Faturamento Total
- 📈 Ticket Médio
- 🏆 Maior Nota

**Gráficos:**
- Faturamento Diário (área)
- Evolução Mensal (linha)
- Top 10 Emitentes (barras)
- Distribuição por Tipo (pizza)
- Status das Notas (barras)

### Como Usar

1. **Selecionar Período:**
   - Clique nos botões rápidos: 7d, 30d, 60d, 90d
   - Ou use "Personalizado" para datas específicas

2. **Escolher Tipo de Documento:**
   - NF-e (Nota Fiscal Eletrônica)
   - CF-e (Cupom Fiscal Eletrônico)
   - CT-e (Conhecimento de Transporte Eletrônico)

3. **Interagir com Gráficos:**
   - Passe o mouse para ver detalhes
   - Clique nas legendas para filtrar
   - Use zoom quando disponível

---

## 📈 Analytics

### Tipos de Analytics

#### 1. Analytics MongoDB
- Agregação local dos dados
- Mais rápido para períodos curtos
- Ideal para análises detalhadas

#### 2. Analytics API
- Agregação via API REST
- Funciona com qualquer período
- Mais confiável para grandes volumes

#### 3. Analytics Agregado (Recomendado)
- **Versão otimizada** com paginação
- Cache persistente de 60 minutos
- Streaming de resultados parciais
- Melhor para períodos longos (90+ dias)

### Funcionalidades

**Filtros Disponíveis:**
- Período (7d, 30d, 60d, 90d, 12m, personalizado)
- Tipo de documento (NF-e, CF-e, CT-e)
- Tamanho da página (1k, 5k, 10k, 20k)

**Gráficos:**
- Faturamento Diário
- Evolução Mensal (valor + quantidade)
- Top 10 Emitentes
- Distribuição por Tipo de Operação
- Status das Notas

**Indicadores:**
- ⏱️ Tempo de processamento
- 📊 Total de registros
- 💾 Cache (quando ativo)
- ⚡ Modo otimizado

### Dicas de Uso

✅ **Use Analytics Agregado** para períodos longos  
✅ **Aguarde o carregamento completo** antes de exportar  
✅ **Aproveite o cache** - segunda consulta é instantânea  
✅ **Use pageSize maior** (20k) para melhor performance  

---

## 🔍 Grids de Documentos

### Tipos de Grid

1. **Grid NF-e** - Notas Fiscais Eletrônicas
2. **Grid CT-e** - Conhecimentos de Transporte
3. **Grid CF-e** - Cupons Fiscais Eletrônicos

### Funcionalidades

#### Visualização
- **32+ colunas** com todos os dados
- **Paginação** (100, 500, 1000, 2000, 5000 registros/página)
- **Ordenação** por qualquer coluna (clique no cabeçalho)
- **Congelamento de colunas** (ícone de cadeado)

#### Filtros

**1. Busca Rápida (Global)**
- Campo no topo da grid
- Busca em todos os campos
- Atualização em tempo real

**2. Filtros de Cabeçalho**
- Clique no botão "Filtros"
- Campos aparecem abaixo dos cabeçalhos
- Filtre por coluna específica

**3. Busca Natural com IA** (⭐ Destaque)
- Use linguagem natural
- Exemplos:
  - "notas de entrada maiores que 5000"
  - "notas autorizadas de setembro"
  - "notas com ICMS maior que 1000"

### Colunas Disponíveis

**Identificação:**
- ID, Chave de Acesso, Número, Série, Modelo

**Datas e Status:**
- Data Emissão, Status, Protocolada

**Operação:**
- Tipo Operação (Entrada/Saída)
- Natureza Operação

**Valores:**
- Valor Total, Base Cálculo

**Impostos:**
- ICMS, IPI, PIS, COFINS

**Outros Valores:**
- Frete, Seguro, Desconto, Outros

**Emitente:**
- CNPJ, Razão Social, Nome Fantasia
- IE, Endereço, Município, UF

**Destinatário:**
- CNPJ/CPF, Razão Social, Nome
- IE, Endereço, Município, UF

**Informações Adicionais:**
- Origem, Status Manifestação
- Informações Adicionais

### Como Usar

1. **Carregar Dados:**
   - Selecione o período no menu superior
   - Aguarde o carregamento
   - Veja o indicador de progresso

2. **Navegar:**
   - Use os botões de paginação
   - Ou digite o número da página
   - Ajuste registros por página

3. **Ordenar:**
   - Clique no cabeçalho da coluna
   - 🔼 Ordem crescente
   - 🔽 Ordem decrescente

4. **Filtrar:**
   - Use busca rápida para filtro global
   - Ou ative filtros de cabeçalho
   - Ou use busca natural com IA

5. **Congelar Colunas:**
   - Clique no ícone de cadeado
   - Coluna fica fixa ao rolar
   - Útil para número/chave

---

## 🤖 Busca Natural com IA

### O que é?

Sistema de busca que entende **linguagem natural** usando IA (Google Gemini).

### Como Funciona

1. Digite sua pergunta em português
2. A IA interpreta e cria filtros
3. Resultados aparecem instantaneamente

### Exemplos de Consultas

**Por Valor:**
```
notas maiores que 10000
notas entre 5000 e 15000
notas com valor acima de 20 mil
```

**Por Data:**
```
notas de setembro
notas dos últimos 30 dias
notas entre 01/09 e 30/09
```

**Por Status:**
```
notas autorizadas
notas canceladas
notas processando
```

**Por Tipo:**
```
notas de entrada
notas de saída
```

**Por Impostos:**
```
notas com ICMS maior que 1000
notas com IPI acima de 500
notas com PIS e COFINS
```

**Por Emitente/Destinatário:**
```
notas do emitente X
notas para destinatário Y
notas de São Paulo
notas do CNPJ 12345678000190
```

**Combinadas:**
```
notas de entrada maiores que 5000 de setembro
notas autorizadas com ICMS acima de 1000
notas de saída para SP maiores que 10000
```

### Dicas

✅ **Seja específico** mas natural  
✅ **Use números** sem formatação (5000 em vez de R$ 5.000,00)  
✅ **Combine filtros** para buscas complexas  
✅ **Experimente variações** se não encontrar  

---

## 📥 Exportação para Excel

### Como Exportar

1. Carregue os dados na grid
2. Clique no botão **"Exportar Excel"**
3. Para volumes > 10k, confirme a exportação
4. Aguarde o processamento
5. Arquivo será salvo automaticamente

### O que é Exportado

**Todos os campos disponíveis:**
- ✅ Identificação completa
- ✅ Todos os valores e impostos
- ✅ Dados de emitente e destinatário
- ✅ Informações de transporte
- ✅ Dados de pagamento
- ✅ Informações adicionais

**Formato do arquivo:**
```
notas-fiscais-nfe_20251201_143022.xlsx
```

### Performance

| Registros | Tempo Estimado |
|-----------|----------------|
| 200 | < 1s |
| 500 | 1-2s |
| 1.000 | 2-3s |
| 5.000 | 5-10s |
| 10.000 | 10-20s |

### Dicas

✅ **Aguarde carregamento completo** antes de exportar  
✅ **Use filtros** para reduzir volume quando possível  
✅ **Não feche a aba** durante exportação  
✅ **Veja progresso** no console (F12)  

---

## ⚡ Cache e Performance

### O que é Cache?

Cache é uma memória temporária que guarda dados já carregados. Na próxima vez que você buscar o mesmo período, os dados aparecem **instantaneamente**!

### Indicadores de Cache

**Badge "💾 Cache":**
- Aparece ao lado da contagem de registros
- Significa que dados vieram do cache
- Carregamento 300x mais rápido!

**Componente CacheStats:**
- Ícone 💾 no canto inferior direito
- Mostra estatísticas em tempo real
- Permite gerenciar o cache

### Como Funciona

**Primeira Busca (sem cache):**
```
📅 60 dias → 3-5 segundos
📅 90 dias → 5-8 segundos
```

**Segunda Busca (com cache):**
```
📅 60 dias → 0.05 segundos ⚡
📅 90 dias → 0.05 segundos ⚡
```

### Gerenciar Cache

**Ver Estatísticas:**
1. Clique no ícone 💾 (canto inferior direito)
2. Veja consultas em cache
3. Veja total de registros

**Limpar Cache:**
1. Abra o painel de cache
2. Clique em "Limpar"
3. Confirme a ação

**Quando Limpar:**
- ✅ Quando precisar de dados atualizados
- ✅ Quando o cache estiver muito grande
- ✅ Quando houver problemas de carregamento

### Sistema de Chunks

Para períodos > 60 dias, o sistema divide automaticamente em **chunks de 15 dias**:

```
📅 90 dias
📦 Dividido em 6 chunks
🔄 Chunk 1/6... ✅
🔄 Chunk 2/6... ✅
...
✅ Total: 342 registros
```

**Benefícios:**
- ✅ Evita timeout da API
- ✅ Cada chunk é cacheado
- ✅ Recuperação automática de falhas
- ✅ Funciona com qualquer período

---

## 🤖 RAH - Assistente IA

### O que é o RAH?

**RAH (Revio Agent Helper)** é seu assistente pessoal com IA que conhece **toda a documentação** do sistema!

### Como Usar

1. **Abrir RAH:**
   - Clique no ícone 💬 (canto inferior esquerdo)
   - Janela de chat aparece

2. **Fazer Perguntas:**
   - Digite sua dúvida
   - Pressione Enter ou clique em Enviar
   - RAH responde em segundos

3. **Conversar:**
   - RAH mantém contexto da conversa
   - Faça perguntas de acompanhamento
   - Peça esclarecimentos

4. **Limpar Conversa:**
   - Clique no ícone 🗑️
   - Confirme a ação
   - Comece nova conversa

### Exemplos de Perguntas

**Sobre Funcionalidades:**
```
Como usar a busca natural?
Como exportar dados para Excel?
Quais gráficos estão disponíveis?
Como filtrar notas por período?
```

**Sobre Performance:**
```
O que é o cache e como funciona?
Por que demora para carregar 90 dias?
Como melhorar a performance?
```

**Sobre Problemas:**
```
Grid não carrega, o que fazer?
Exportação está demorando muito
Dados parecem desatualizados
```

**Sobre Desenvolvimento:**
```
Como adicionar uma nova coluna?
Como customizar os gráficos?
Onde fica a configuração da API?
```

### Dicas

✅ **Seja específico** nas perguntas  
✅ **Use contexto** da conversa anterior  
✅ **Peça exemplos** quando necessário  
✅ **Experimente variações** se não entender  

---

## 💡 Dicas e Truques

### Performance

1. **Use períodos menores** quando possível
2. **Aproveite o cache** (não limpe sem necessidade)
3. **Use filtros** para reduzir volume
4. **Aguarde carregamento completo** antes de exportar

### Navegação

1. **Atalhos de teclado:**
   - Enter: Enviar busca natural
   - F5: Recarregar página
   - F12: Abrir console (para debug)

2. **Filtros:**
   - Combine busca rápida + filtros de cabeçalho
   - Use busca natural para consultas complexas
   - Limpe filtros antes de nova busca

3. **Grids:**
   - Congele colunas importantes (número, chave)
   - Ajuste registros por página conforme necessidade
   - Use ordenação para análises rápidas

### Exportação

1. **Planeje antes:**
   - Aplique filtros necessários
   - Verifique total de registros
   - Confirme período correto

2. **Durante exportação:**
   - Não feche a aba
   - Aguarde mensagem de sucesso
   - Veja progresso no console

3. **Após exportação:**
   - Verifique arquivo salvo
   - Confira total de registros
   - Valide dados importantes

---

## 🆘 Troubleshooting

### Problemas Comuns

#### "Grid não carrega"

**Possíveis causas:**
- Conexão com internet
- Período muito longo
- Cache corrompido

**Soluções:**
1. Verifique sua conexão
2. Tente período menor
3. Limpe o cache
4. Recarregue a página (F5)

#### "Exportação demora muito"

**Possíveis causas:**
- Volume muito grande (>5k registros)
- Navegador lento
- Pouca memória

**Soluções:**
1. Normal para grandes volumes
2. Aguarde o processo completar
3. Feche outras abas
4. Veja progresso no console

#### "Dados parecem desatualizados"

**Possíveis causas:**
- Cache ativo
- Dados não sincronizados

**Soluções:**
1. Limpe o cache
2. Recarregue os dados
3. Verifique data/hora da última atualização

#### "Navegador travou"

**Possíveis causas:**
- Volume muito grande
- Pouca memória
- Muitas abas abertas

**Soluções:**
1. Feche outras abas
2. Tente período menor
3. Use filtros para reduzir volume
4. Reinicie o navegador

#### "Busca natural não funciona"

**Possíveis causas:**
- API key não configurada
- Consulta muito complexa
- Erro de interpretação

**Soluções:**
1. Verifique configuração da API
2. Simplifique a consulta
3. Tente variações da pergunta
4. Use filtros tradicionais

### Logs e Debug

**Abrir Console:**
- Pressione F12
- Vá para aba "Console"
- Veja logs detalhados

**O que procurar:**
- ❌ Erros em vermelho
- ⚠️ Avisos em amarelo
- ✅ Sucessos em verde
- 📊 Informações de progresso

### Contato e Suporte

**Documentação:**
- Consulte este manual
- Veja arquivos em `docs/`
- Use o RAH para dúvidas

**Desenvolvimento:**
- Verifique `README.md`
- Consulte `TROUBLESHOOTING.md`
- Veja logs no console

---

## 🎉 Conclusão

Parabéns! Você agora conhece todas as funcionalidades do SpedRevio:

- ✅ Dashboard com gráficos interativos
- ✅ Analytics avançado com cache
- ✅ Grids poderosas com 32+ colunas
- ✅ Busca natural com IA
- ✅ Exportação ilimitada para Excel
- ✅ Cache inteligente para performance
- ✅ RAH - Assistente IA sempre disponível

**Aproveite o sistema e bom trabalho!** 🚀

---

*Manual atualizado em: Dezembro 2024*  
*Versão: 1.0.0*
