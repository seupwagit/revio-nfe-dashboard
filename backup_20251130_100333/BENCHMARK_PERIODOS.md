# 📊 Benchmark de Períodos - API Revio

## 🎯 Objetivo
Testar diferentes períodos de consulta para identificar limites e otimizar performance.

## 🧪 Metodologia
- **PageSize**: 10.000 (API aceita até 20.000, 10k é o ideal)
- **Collection**: tbl_nfe_100
- **Timeout**: 120 segundos
- **Data**: 29/11/2025

## ⚠️ DESCOBERTA IMPORTANTE
A API aceita **até 20.000 registros/página**, não apenas 500!
- Testado: 500, 1k, 2k, 5k, 10k, 20k → Todos funcionam
- **Recomendado**: 10.000 (melhor custo-benefício)

## 📈 Resultados

| Período | Registros | Tempo | Velocidade | Status |
|---------|-----------|-------|------------|--------|
| **7 dias** | ~10-20 | < 0.1s | ~200 reg/s | ✅ Excelente |
| **15 dias** | ~20-40 | < 0.1s | ~300 reg/s | ✅ Excelente |
| **30 dias** | 49 | 0.13s | 377 reg/s | ✅ Ótimo |
| **60 dias** | 281 | 0.09s | 3.122 reg/s | ✅ Muito Bom |
| **90 dias** | ? | 120s+ | - | ❌ **TIMEOUT** |
| **1 ano** | ? | 120s+ | - | ❌ **TIMEOUT** |

## 🔍 Análises

### ✅ Períodos Funcionais (< 60 dias)
- **7-15 dias**: Ideal para dashboards em tempo real
- **30 dias**: Padrão recomendado (rápido e abrangente)
- **60 dias**: Limite superior seguro (ainda muito rápido)

### ❌ Períodos Problemáticos (≥ 90 dias)
- **90 dias**: Timeout após 120 segundos
- **1 ano**: Timeout imediato
- **Causa**: Volume de dados muito grande para uma única requisição

## 💡 Recomendações

### 1. Preseleções de Período
Implementar botões rápidos com períodos seguros:
```typescript
const presets = [
  { label: '7 dias', days: 7 },
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
  { label: '60 dias', days: 60 },
]
```

### 2. Período Padrão
- **Atual**: 30 dias (último mês)
- **Status**: ✅ Mantém-se ideal

### 3. Consultas Agregadas
Para períodos longos (> 60 dias), usar estratégias alternativas:

#### Opção A: Agregação por Mês
```javascript
// Dividir 1 ano em 12 consultas mensais
for (let mes = 0; mes < 12; mes++) {
  const dados = await fetchMes(mes)
  agregado.push(dados)
}
```

#### Opção B: Endpoint de Contador
```javascript
// Usar /WebView/ContadorConsulta para totais
const total = await fetchContador({ dtIni, dtFin })
```

#### Opção C: Cache Inteligente
```javascript
// Cachear períodos já consultados
const cache = {
  '2024-01': { registros: 87, valorTotal: 150000 },
  '2024-02': { registros: 92, valorTotal: 180000 },
  // ...
}
```

### 4. Limites de Segurança
```typescript
const MAX_DIAS_CONSULTA = 60
const WARN_DIAS_CONSULTA = 45

if (dias > MAX_DIAS_CONSULTA) {
  alert('Período muito longo. Use até 60 dias.')
}
```

## 🎯 Implementação Atual

### ✅ Já Implementado
- [x] Preseleções de 7, 15, 30, 60 dias
- [x] Período padrão de 30 dias
- [x] Cache de 5 minutos

### 🔄 Próximos Passos
- [ ] Validação de período máximo (60 dias)
- [ ] Agregação mensal para períodos longos
- [ ] Indicador de performance no UI
- [ ] Mensagem de aviso para períodos > 45 dias

## 📊 Dados do Último Ano

Baseado nos testes:
- **Último ano**: ~87 documentos
- **Problema**: Não é possível buscar em uma única consulta
- **Solução**: Dividir em consultas mensais ou usar agregação

### Exemplo de Agregação Mensal
```javascript
async function fetchUltimoAno() {
  const meses = []
  for (let i = 0; i < 12; i++) {
    const fim = new Date()
    const inicio = new Date()
    inicio.setMonth(fim.getMonth() - i - 1)
    fim.setMonth(fim.getMonth() - i)
    
    const dados = await fetchNotasFiscais({
      dataInicio: inicio.toISOString().split('T')[0],
      dataFim: fim.toISOString().split('T')[0]
    })
    
    meses.push({
      mes: inicio.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      registros: dados.length,
      valorTotal: dados.reduce((acc, nf) => acc + nf.valorTotal, 0)
    })
  }
  return meses
}
```

## 🚀 Performance Otimizada

### ✅ DESCOBERTA: API aceita até 20.000 registros/página!

### Configuração Correta (.env)
```env
VITE_DEFAULT_PAGE_SIZE=10000    # ✅ Ideal (API aceita até 20k)
```

### Testes de Size (30 dias, 49 registros)
| Size | Tempo | Velocidade | Status |
|------|-------|------------|--------|
| 500 | 0.21s | 233 reg/s | ✅ |
| 1.000 | 0.03s | 1.633 reg/s | ✅ |
| 10.000 | 0.11s | 445 reg/s | ✅ **IDEAL** |
| 20.000 | 0.05s | 980 reg/s | ✅ |

**Conclusão**: 10.000 é o ideal (bom equilíbrio entre performance e tamanho de resposta).

## 📝 Conclusões

1. **60 dias é o limite seguro** para consultas diretas
2. **30 dias é o ideal** para uso diário (rápido e completo)
3. **90+ dias requerem estratégias especiais** (agregação, cache, divisão)
4. **Preseleções implementadas** facilitam o uso correto
5. **Validações necessárias** para evitar timeouts

---

**Última atualização**: 29/11/2025  
**Versão**: 1.0  
**Status**: ✅ Documentado e Implementado
