# 📊 Indicadores Fiscais - Dashboard SpedRevio

## 🎯 Visão Geral

O Dashboard foi redesenhado com indicadores fiscais e gerenciais contextualizados para cada tipo de documento fiscal, permitindo tomadas de decisão estratégicas baseadas em dados reais.

## 📋 Indicadores por Tipo de Documento

### 🧾 NF-e (Notas Fiscais Eletrônicas)

#### 1. Fluxo Operacional
**Objetivo:** Monitorar o equilíbrio entre compras e vendas

- **Entradas** - Valor total de compras (IND_OPER = 0)
- **Saídas** - Valor total de vendas (IND_OPER = 1)
- **Saldo Operacional** - Diferença entre saídas e entradas

**Decisões que você pode tomar:**
- ✅ Saldo positivo: Empresa está vendendo mais do que comprando (bom para fluxo de caixa)
- ⚠️ Saldo negativo: Estoque aumentando, pode indicar necessidade de promoções

#### 2. Carga Tributária
**Objetivo:** Entender o impacto dos impostos no faturamento

- **ICMS** - Imposto sobre Circulação de Mercadorias
- **IPI** - Imposto sobre Produtos Industrializados
- **PIS/COFINS** - Contribuições sociais
- **% sobre Faturamento** - Percentual total de impostos

**Decisões que você pode tomar:**
- 📊 Carga > 15%: Avaliar mudança de regime tributário (Simples, Lucro Real, Lucro Presumido)
- 💡 Comparar com concorrentes do setor
- 🎯 Planejar precificação considerando impostos

#### 3. Custos Operacionais
**Objetivo:** Controlar custos adicionais das operações

- **Frete** - Custo total de transporte
- **Seguro** - Valor de seguros contratados
- **Descontos** - Total de descontos concedidos

**Decisões que você pode tomar:**
- 🚚 Frete alto: Negociar com transportadoras ou buscar alternativas
- 💰 Descontos altos: Revisar política comercial
- 📦 Otimizar logística para reduzir custos

---

### 🚚 CT-e (Conhecimentos de Transporte)

#### 1. Volume de Transporte
**Objetivo:** Monitorar eficiência logística

- **Viagens Realizadas** - Quantidade de fretes
- **Peso Total** - Carga transportada em kg
- **Volume Total** - Espaço utilizado
- **Peso Médio/Viagem** - Eficiência de carga

**Decisões que você pode tomar:**
- 📊 Peso médio baixo: Otimizar consolidação de cargas
- 🚛 Muitas viagens com pouco peso: Revisar rotas e frequências
- 💡 Planejar capacidade de frota

#### 2. Receita de Frete
**Objetivo:** Analisar rentabilidade do transporte

- **Faturamento Total** - Receita bruta de fretes
- **Ticket Médio** - Valor médio por frete
- **Maior Frete** - Maior valor cobrado
- **Receita/Viagem** - Rentabilidade por operação

**Decisões que você pode tomar:**
- 💰 Ticket médio baixo: Revisar tabela de preços
- 📈 Identificar rotas mais rentáveis
- 🎯 Focar em fretes de maior valor agregado

#### 3. Eficiência Operacional
**Objetivo:** Garantir qualidade do serviço

- **Taxa de Autorização** - % de CT-e autorizados
- **Taxa de Cancelamento** - % de CT-e cancelados
- **Pendentes** - Documentos aguardando processamento

**Decisões que você pode tomar:**
- ✅ Taxa > 95%: Operação saudável
- ⚠️ Taxa < 95%: Revisar processos de emissão
- 🔄 Cancelamentos altos: Investigar causas (erros, desistências)

---

### 🧾 CF-e (Cupons Fiscais Eletrônicos)

#### 1. Performance de Vendas
**Objetivo:** Monitorar desempenho do varejo

- **Cupons Emitidos** - Quantidade de vendas
- **Faturamento** - Receita total
- **Ticket Médio** - Valor médio por venda

**Decisões que você pode tomar:**
- 💰 Ticket médio baixo: Implementar estratégias de upsell/cross-sell
- 📊 Comparar com metas estabelecidas
- 🎯 Identificar horários/dias de maior movimento

#### 2. Análise Temporal
**Objetivo:** Entender padrões de venda

- **Vendas Hoje** - Performance do dia atual
- **Últimos 7 dias** - Tendência semanal
- **Últimos 30 dias** - Visão mensal
- **Média Diária** - Baseline de vendas

**Decisões que você pode tomar:**
- 📈 Identificar dias de pico para escalar equipe
- 📉 Dias fracos: Criar promoções específicas
- 🎯 Planejar estoque baseado em padrões

#### 3. Impostos Varejo
**Objetivo:** Controlar carga tributária do varejo

- **ICMS** - Principal imposto do varejo
- **PIS/COFINS** - Contribuições federais
- **Carga Tributária** - % total sobre vendas

**Decisões que você pode tomar:**
- 💡 Avaliar enquadramento no Simples Nacional
- 📊 Comparar com margem de lucro
- 🎯 Ajustar precificação considerando impostos

---

## 📊 Indicadores Gerais (Todos os Tipos)

### Análise de Valores

- **Ticket Médio** - Valor médio por documento
- **Maior Documento** - Maior valor registrado
- **Menor Documento** - Menor valor registrado
- **Amplitude** - Diferença entre maior e menor

**Uso:** Entender distribuição de valores e identificar outliers

### Status e Qualidade

- **Taxa de Autorização** - % de documentos autorizados
- **Taxa de Cancelamento** - % de documentos cancelados
- **Documentos Pendentes** - Aguardando processamento

**Uso:** Monitorar qualidade operacional e compliance fiscal

### Evolução Temporal

- **Hoje** - Documentos emitidos hoje
- **Últimos 7 dias** - Tendência semanal
- **Últimos 30 dias** - Visão mensal

**Uso:** Identificar tendências e sazonalidades

---

## 🎯 Insights e Recomendações Automáticas

O sistema analisa os dados e fornece alertas contextualizados:

### Alertas de Carga Tributária
- ⚠️ **Carga > 15%**: "Considere revisão de regime tributário"
- 💡 Sugestão de consultar contador para otimização fiscal

### Alertas de Performance
- ⚠️ **Taxa < 95%**: "Revisar processos de emissão"
- 🔄 Indica problemas operacionais que precisam atenção

### Alertas de Saldo (NF-e)
- ⚠️ **Saldo Negativo**: "Entradas superiores às saídas"
- 📦 Pode indicar acúmulo de estoque

### Alertas de Cancelamento
- ⚠️ **Taxa > 5%**: "Acima do ideal"
- 🔍 Investigar causas raiz dos cancelamentos

### Alertas de Pendências
- 📋 **Pendentes > 0**: "Documentos aguardando processamento"
- ⏰ Ação necessária para regularização

---

## 💡 Como Usar os Indicadores

### 1. Análise Diária
- Verificar vendas/emissões do dia
- Comparar com média histórica
- Identificar anomalias

### 2. Análise Semanal
- Revisar tendências dos últimos 7 dias
- Ajustar estratégias se necessário
- Planejar próxima semana

### 3. Análise Mensal
- Avaliar performance geral
- Calcular impostos a recolher
- Planejar próximo mês

### 4. Tomada de Decisão
- Usar saldo operacional para decisões de compra
- Ajustar preços baseado em carga tributária
- Otimizar logística com dados de CT-e
- Melhorar vendas com análise de ticket médio

---

## 📈 Benchmarks Recomendados

### NF-e
- Taxa de Autorização: > 98%
- Taxa de Cancelamento: < 2%
- Carga Tributária: 10-15% (varia por setor)

### CT-e
- Taxa de Autorização: > 95%
- Taxa de Cancelamento: < 5%
- Peso Médio/Viagem: > 70% da capacidade

### CF-e
- Taxa de Autorização: > 99%
- Taxa de Cancelamento: < 1%
- Ticket Médio: Varia por segmento

---

## 🔄 Atualização dos Dados

- **Tempo Real**: Dados atualizados a cada consulta
- **Período**: Baseado nos filtros aplicados
- **Precisão**: 100% dos dados da API Revio

---

**Última Atualização:** 28/11/2025  
**Versão:** 2.0.0  
**Status:** ✅ Indicadores Contextualizados Ativos
