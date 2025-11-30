# 📊 Analytics & Insights - Guia Completo

## 🎯 Visão Geral

A página de Analytics oferece uma visão completa e visual dos seus documentos fiscais através de gráficos interativos e métricas relevantes para tomada de decisão empresarial.

## 🚀 Acesso

**URL:** http://localhost:5173/analytics  
**Menu:** Sidebar → Analytics

## 📈 Gráficos Disponíveis

### 1. Cards de Estatísticas (KPIs)

Quatro cards principais no topo da página:

#### 📄 Total de Documentos
- **Métrica:** Quantidade total de documentos no período
- **Cor:** Azul
- **Uso:** Acompanhar volume de operações

#### 💰 Faturamento Total
- **Métrica:** Soma de todos os valores
- **Formato:** R$ 0.000.000
- **Cor:** Verde
- **Uso:** Visão geral do faturamento

#### 📊 Ticket Médio
- **Métrica:** Valor médio por documento
- **Cálculo:** Faturamento Total ÷ Total de Documentos
- **Cor:** Roxo
- **Uso:** Entender valor médio das operações

#### 🎯 Maior Nota
- **Métrica:** Valor da maior nota fiscal
- **Cor:** Laranja
- **Uso:** Identificar operações de alto valor

### 2. Faturamento Diário (Gráfico de Área)

**Tipo:** Area Chart  
**Dados:** Últimos 30 dias  
**Eixo X:** Data  
**Eixo Y:** Valor em R$

**Insights:**
- Tendência de faturamento
- Picos e vales de vendas
- Sazonalidade
- Dias sem movimento

**Como usar:**
- Passe o mouse sobre o gráfico para ver valores exatos
- Identifique padrões de vendas
- Compare períodos

### 3. Evolução Mensal (Gráfico de Linhas)

**Tipo:** Line Chart (Duplo Eixo)  
**Linha Azul:** Valor total (R$) - Eixo esquerdo  
**Linha Roxa:** Quantidade de documentos - Eixo direito

**Insights:**
- Crescimento mês a mês
- Correlação entre volume e valor
- Tendências de longo prazo
- Sazonalidade mensal

**Como usar:**
- Compare as duas linhas
- Identifique meses de alta/baixa
- Planeje estratégias baseadas em histórico

### 4. Top 10 Emitentes (Gráfico de Barras Horizontal)

**Tipo:** Horizontal Bar Chart  
**Dados:** 10 maiores emitentes por valor  
**Ordenação:** Decrescente (maior no topo)

**Insights:**
- Principais fornecedores/clientes
- Concentração de operações
- Dependência de parceiros
- Oportunidades de negociação

**Como usar:**
- Identifique parceiros estratégicos
- Avalie concentração de risco
- Planeje negociações
- Diversifique fornecedores

### 5. Distribuição por Tipo de Operação (Pizza)

**Tipo:** Pie Chart  
**Categorias:**
- Entrada (compras)
- Saída (vendas)
- Outros

**Cores:**
- Azul: Entrada
- Verde: Saída
- Roxo: Outros

**Insights:**
- Proporção entrada vs saída
- Tipo predominante de operação
- Balanceamento de fluxo

**Como usar:**
- Entenda o perfil da empresa
- Avalie equilíbrio de operações
- Identifique oportunidades

### 6. Status das Notas (Gráfico de Barras)

**Tipo:** Bar Chart  
**Categorias:**
- Protocolada
- Não Protocolada

**Insights:**
- Conformidade fiscal
- Notas pendentes
- Eficiência operacional

**Como usar:**
- Monitore conformidade
- Identifique pendências
- Tome ações corretivas

## 🎛️ Filtros Disponíveis

### Período

**Opções Rápidas:**
- **Últimos 7 dias** - Visão semanal
- **Últimos 30 dias** - Visão mensal (padrão)
- **Últimos 90 dias** - Visão trimestral
- **Último ano** - Visão anual
- **Personalizado** - Escolha datas específicas

**Como usar:**
1. Selecione o período desejado
2. Os gráficos atualizam automaticamente
3. Para período personalizado, escolha data início e fim

### Tipo de Documento

**Opções:**
- **NF-e** - Notas Fiscais Eletrônicas
- **CF-e** - Cupons Fiscais Eletrônicos
- **CT-e** - Conhecimentos de Transporte

**Como usar:**
1. Selecione o tipo de documento
2. Análise será filtrada para esse tipo
3. Compare diferentes tipos alternando

## 💡 Casos de Uso

### Para o Empresário

**Análise Diária:**
1. Acesse Analytics pela manhã
2. Verifique faturamento do dia anterior
3. Compare com média histórica
4. Identifique anomalias

**Análise Mensal:**
1. No início do mês, selecione "Últimos 30 dias"
2. Revise evolução mensal
3. Compare com mês anterior
4. Planeje ações para o mês atual

**Análise Estratégica:**
1. Selecione "Último ano"
2. Identifique tendências de longo prazo
3. Avalie sazonalidade
4. Planeje investimentos

### Para o Gestor Financeiro

**Controle de Fluxo:**
1. Monitore entrada vs saída
2. Verifique ticket médio
3. Identifique concentração de clientes
4. Avalie risco de inadimplência

**Conformidade:**
1. Verifique status das notas
2. Identifique pendências
3. Tome ações corretivas
4. Mantenha conformidade fiscal

### Para o Gestor Comercial

**Performance de Vendas:**
1. Analise faturamento diário
2. Identifique picos de vendas
3. Compare com metas
4. Ajuste estratégias

**Relacionamento com Clientes:**
1. Veja top 10 emitentes
2. Identifique principais clientes
3. Planeje ações de relacionamento
4. Negocie condições especiais

## 🔄 Atualização de Dados

### Automática
- Dados atualizam ao mudar filtros
- Gráficos recalculam automaticamente
- Sem necessidade de refresh manual

### Manual
- Clique no botão "Atualizar" (ícone de refresh)
- Útil após importar novos dados
- Garante informações mais recentes

## 📱 Responsividade

### Desktop (1920x1080)
- 2 colunas de gráficos
- Todos os gráficos visíveis
- Melhor experiência

### Tablet (768x1024)
- 1 coluna de gráficos
- Scroll vertical
- Gráficos adaptados

### Mobile (375x667)
- 1 coluna
- Gráficos compactos
- Touch-friendly

## 🎨 Personalização

### Cores
Baseadas na identidade Revio:
- Azul Primário: #0066CC
- Azul Secundário: #0052A3
- Verde: #00A3E0
- Roxo: #7C3AED
- Rosa: #EC4899

### Tooltips
- Hover sobre gráficos
- Valores formatados em R$
- Informações detalhadas

## 🚀 Próximas Funcionalidades

### Em Desenvolvimento
- [ ] Exportar gráficos como imagem
- [ ] Comparação entre períodos
- [ ] Metas e objetivos
- [ ] Alertas automáticos
- [ ] Relatórios em PDF

### Planejado
- [ ] Previsões com IA
- [ ] Análise de tendências
- [ ] Benchmarking
- [ ] Dashboards personalizados

## 🔧 Troubleshooting

### Gráficos não aparecem
**Causa:** Sem dados no período  
**Solução:** Ajuste o período ou verifique se há dados

### Valores zerados
**Causa:** Filtro muito restritivo  
**Solução:** Amplie o período ou mude o tipo de documento

### Lentidão
**Causa:** Muitos dados  
**Solução:** Reduza o período ou use filtros mais específicos

## 📊 Biblioteca Utilizada

**Recharts 2.x**
- Biblioteca React para gráficos
- Baseada em D3.js
- Altamente customizável
- Responsiva por padrão
- Bem mantida e estável

**Documentação:** https://recharts.org

## 🎓 Dicas de Uso

1. **Compare períodos** - Use filtros para comparar diferentes períodos
2. **Identifique padrões** - Procure por sazonalidade e tendências
3. **Tome decisões** - Use os insights para ações estratégicas
4. **Monitore KPIs** - Acompanhe os cards de estatísticas regularmente
5. **Explore os dados** - Passe o mouse sobre os gráficos para detalhes

---

**Última Atualização:** 28/11/2025  
**Versão:** 1.0.0  
**Status:** ✅ Disponível
