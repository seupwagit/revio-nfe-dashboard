# 🧪 Teste 120 Dias - Sem Cache

## Objetivo

Testar a performance de extração de dados de **120 dias** acumulando tudo em **memória** SEM usar o cache do `streamingCache.ts`.

## Por que este teste?

Você mencionou que 90 dias está muito lento. Este teste vai:
1. Testar 120 dias (ainda mais que 90)
2. Acumular dados em memória conforme chegam
3. NÃO usar cache do streamingCache
4. Medir performance pura da API + acumulação

## Como Acessar

```
http://localhost:5173/analytics-teste-120dias
```

## O que o Teste Faz

### 1. Configuração
- **Período fixo**: 120 dias
- **PageSize**: 10.000 registros por página
- **Collection**: tbl_nfe_100 (pode trocar)
- **Cache**: DESABILITADO (não usa streamingCache)

### 2. Processo
```
1. Calcula data de 120 dias atrás
2. Inicia loop de paginação
3. Para cada página:
   - Busca 10.000 registros da API
   - Acumula em array em memória
   - Atualiza UI com progresso
   - Mostra dados parciais
   - Delay de 100ms entre páginas
4. Continua até não ter mais páginas
5. Processa analytics dos dados acumulados
```

### 3. Métricas Exibidas
- ⏱️ Tempo total (segundos)
- 📄 Total de páginas buscadas
- 📊 Total de registros acumulados
- ⚡ Velocidade (registros/segundo)

## Diferenças vs Analytics API Normal

| Aspecto | Analytics API | Teste 120 Dias |
|---------|---------------|----------------|
| Período | Configurável | Fixo 120 dias |
| Cache | streamingCache | SEM CACHE |
| Acumulação | Via streamingCache | Array em memória |
| Progresso | Via callback | Estado React |
| Objetivo | Produção | Teste/Benchmark |

## Diferenças vs Analytics Agregado

| Aspecto | Analytics Agregado | Teste 120 Dias |
|---------|-------------------|----------------|
| Processamento | Durante paginação | Após acumulação |
| Cache | Persistente (60min) | SEM CACHE |
| Chunks | Divide períodos | Período único |
| Objetivo | Otimização | Teste puro |

## Como Usar

### 1. Acesse a Página
```
http://localhost:5173/analytics-teste-120dias
```

### 2. Clique em "Iniciar Teste 120 Dias"

### 3. Observe o Progresso
```
📊 Progresso:
• Página atual: 5
• Registros acumulados: 50.000
• Tempo decorrido: 12.3s
• Velocidade: 4.065 reg/s
```

### 4. Aguarde Conclusão
O teste continua até buscar todas as páginas.

### 5. Veja os Resultados
```
📊 Métricas do Teste
Tempo Total: 45.2s
Páginas: 15
Registros: 150.000
Velocidade: 3.318 reg/s
```

## O que Esperar

### Cenário Otimista (API rápida)
```
120 dias ≈ 150.000 registros
PageSize: 10.000
Páginas: 15
Tempo: ~30-45s
Velocidade: ~3.000-5.000 reg/s
```

### Cenário Realista (API normal)
```
120 dias ≈ 150.000 registros
PageSize: 10.000
Páginas: 15
Tempo: ~60-90s
Velocidade: ~1.500-2.500 reg/s
```

### Cenário Pessimista (API lenta)
```
120 dias ≈ 150.000 registros
PageSize: 10.000
Páginas: 15
Tempo: ~120-180s (2-3 minutos)
Velocidade: ~800-1.250 reg/s
```

## Análise dos Resultados

### Se for RÁPIDO (< 60s)
✅ A API está boa, o problema pode ser:
- Cache do streamingCache
- Processamento dos dados
- Renderização da UI

### Se for LENTO (> 120s)
❌ A API é o gargalo:
- Considere períodos menores
- Use Analytics Agregado (com cache)
- Divida em chunks menores

### Se for MÉDIO (60-120s)
⚠️ Aceitável mas pode melhorar:
- Use cache persistente
- Otimize processamento
- Considere pré-agregação

## Comparação com Outras Abordagens

### 1. Analytics API (com streamingCache)
```
Vantagens:
+ Cache de 30 minutos
+ Retoma de onde parou
+ Funciona em todas as telas

Desvantagens:
- Overhead do cache
- Pode ter bugs no cache
```

### 2. Analytics Agregado (otimizado)
```
Vantagens:
+ Cache persistente (60min)
+ Divide em chunks
+ Streaming de resultados

Desvantagens:
- Mais complexo
- Só para analytics
```

### 3. Teste 120 Dias (este)
```
Vantagens:
+ Simples e direto
+ Sem overhead de cache
+ Mede performance pura

Desvantagens:
- Sem cache (sempre busca tudo)
- Só para teste
- Não otimizado
```

## Próximos Passos

### Se o teste for RÁPIDO
1. Investigar por que o Analytics API está lento
2. Verificar se é o cache do streamingCache
3. Considerar remover ou otimizar o cache

### Se o teste for LENTO
1. Confirmar que a API é o gargalo
2. Usar Analytics Agregado em produção
3. Limitar períodos a 60 dias máximo
4. Considerar pré-agregação no backend

### Se o teste for MÉDIO
1. Implementar cache persistente melhor
2. Otimizar processamento de dados
3. Usar chunks para períodos longos

## Código Importante

### Acumulação em Memória
```typescript
let todosRegistros: any[] = []
let paginaAtual = 1
let temMaisPaginas = true

while (temMaisPaginas) {
  const response = await api.get('/WebView/Consultar', { params })
  const registrosPagina = mapApiResponse(response.data)
  
  // Acumular em memória
  todosRegistros = [...todosRegistros, ...registrosPagina]
  
  // Atualizar UI
  setNotas([...todosRegistros])
  
  // Verificar se tem mais
  temMaisPaginas = registrosPagina.length >= pageSize
  paginaAtual++
}
```

### Sem Cache
```typescript
// NÃO usa streamingCache.ts
// NÃO usa localStorage
// NÃO usa IndexedDB
// Apenas array em memória
```

## Observações Importantes

1. **Este é um teste**: Não use em produção
2. **Sem cache**: Sempre busca tudo da API
3. **Memória**: Pode usar muita RAM com muitos registros
4. **Apenas NFe**: Teste focado em tbl_nfe_100
5. **120 dias fixo**: Não é configurável (propositalmente)

## Conclusão

Este teste vai mostrar se o problema de performance está:
- ✅ Na API (se o teste for lento)
- ✅ No cache (se o teste for rápido mas o Analytics API for lento)
- ✅ No processamento (se ambos forem lentos)

---

**Arquivo**: `src/pages/AnalyticsAPITeste120Dias.tsx`
**Rota**: `/analytics-teste-120dias`
**Status**: ✅ Pronto para teste
