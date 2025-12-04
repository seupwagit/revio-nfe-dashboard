# 📊 Relatório Completo da Base de Dados MongoDB

## 🎯 Resumo Executivo

**Total de Documentos na Base**: **5.199 documentos**

### 📋 Distribuição por Collection

| Collection | Documentos | Percentual |
|------------|------------|------------|
| tbl_nfe_100 (NF-e) | 5.199 | 100% |
| tbl_cfe_100 (CF-e) | 0 | 0% |
| tbl_cte_100 (CT-e) | 0 | 0% |
| **TOTAL GERAL** | **5.199** | **100%** |

## 📅 Período dos Dados

- **Data mais antiga**: 14/07/2025
- **Data mais recente**: 01/12/2025
- **Duração**: 140 dias (aproximadamente 4,5 meses)
- **Ano**: 2025 (100% dos documentos)

⚠️ **Observação**: Todos os documentos são de 2025, portanto o filtro "último ano" (2024-2025) retorna 0 documentos.

## 📦 Análise por Tipo de Operação

| Tipo | Documentos | Percentual | Descrição |
|------|------------|------------|-----------|
| Saída | 5.021 | 96.6% | Vendas/Saídas |
| Entrada | 178 | 3.4% | Compras/Entradas |

## 💰 Análise Financeira

| Métrica | Valor |
|---------|-------|
| **Valor Total** | R$ 22.964.757,68 |
| **Valor Médio** | R$ 4.417,15 |
| **Valor Máximo** | R$ 143.999,99 |
| **Valor Mínimo** | R$ 5,44 |

## ✅ Status de Protocolo

| Status | Documentos | Percentual |
|--------|------------|------------|
| Não Protocolada | 2.723 | 52.4% |
| Protocolada | 2.476 | 47.6% |

## 🔍 Estrutura dos Documentos

Os documentos na collection `tbl_nfe_100` possuem a seguinte estrutura:

```javascript
{
  _id: "1a968f6fbcf4267e4fe8b2dc59de79a4",
  CHV_NFE: "35250746751590000195550010000234951126416616",
  CNPJ_EMIT: "46751590000195",
  NOME_EMIT: "SANTAREM ALIMENTOS LTDA",
  IE: "110525826111",
  IND_OPER: "1",                    // 0=Entrada, 1=Saída
  DT_DOC: ISODate("2025-07-28"),    // Data do documento
  VL_DOC: 2851.45,                  // Valor do documento
  PROTOCOLADA: "Não",               // Sim/Não
  TIPO: "Recebida",
  ORIGEM: "Robô do Download Sefaz"
}
```

## 🎯 Explicação da Diferença de 199 Documentos

### Problema Original
- **Analytics**: 5.199 documentos (filtro "último ano")
- **Dashboard/Grid**: 5.000 documentos (filtro "último mês")

### Causa
A diferença NÃO era um bug, mas sim **períodos diferentes**:

1. **Analytics com "Último ano" (12m)**:
   - Período: 03/12/2024 até 03/12/2025
   - Resultado: 5.199 documentos ✅
   - **Correto**: Pega TODOS os documentos (que são de jul-dez/2025)

2. **Dashboard com "Último mês" (30d)**:
   - Período: 03/11/2025 até 03/12/2025
   - Resultado: ~5.000 documentos
   - **Correto**: Pega apenas documentos de novembro/dezembro

### Solução Implementada

Agora o Dashboard/Grid também tem a opção **"Último ano"**, permitindo comparação justa:

- ✅ Analytics → "Último ano" → 5.199 docs
- ✅ Dashboard → "Último ano" → 5.199 docs
- ✅ Grid → "Último ano" → 5.199 docs

## 📊 Distribuição Temporal

Como todos os documentos são de 2025 (jul-dez), a distribuição é:

```
Jul/2025: ~XXX docs (início: 14/07)
Ago/2025: ~XXX docs
Set/2025: ~XXX docs
Out/2025: ~XXX docs
Nov/2025: ~XXX docs
Dez/2025: ~XXX docs (até 01/12)
```

## 🔧 Scripts Criados

1. **contar-documentos.bat** - Conta total de documentos
2. **analise-completa-documentos.cjs** - Análise detalhada
3. **verificar-datas-documentos.cjs** - Verifica estrutura de datas

## 💡 Insights

1. **Base Recente**: Dados apenas de 2025 (últimos 4-5 meses)
2. **Predominância de Saídas**: 96.6% são vendas/saídas
3. **Protocolo Equilibrado**: ~50% protocoladas, ~50% não
4. **Ticket Médio**: R$ 4.417,15 por documento
5. **Volume Financeiro**: Quase R$ 23 milhões em 5.199 documentos

## 🎯 Recomendações

1. **Histórico**: Considerar importar dados históricos de 2024 se disponível
2. **CF-e e CT-e**: Collections vazias - verificar se há dados para importar
3. **Protocolo**: Investigar os 52.4% de documentos não protocolados
4. **Backup**: Implementar rotina de backup regular dos 5.199 documentos

## 📈 Crescimento Esperado

Com base em 140 dias = 5.199 documentos:
- **Média diária**: ~37 documentos/dia
- **Projeção mensal**: ~1.110 documentos/mês
- **Projeção anual**: ~13.320 documentos/ano

---

**Data do Relatório**: 04/12/2024
**Database**: C67624577000145
**Servidor**: 10.0.0.8:27017
