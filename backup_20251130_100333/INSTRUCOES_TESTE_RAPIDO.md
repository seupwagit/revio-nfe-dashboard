# ⚡ Instruções Rápidas - Teste 120 Dias

## 🎯 Objetivo
Testar se 120 dias é lento por causa da **API** ou do **cache**.

## 🚀 Como Fazer

### 1. Acesse a URL
```
http://localhost:5173/analytics-teste-120dias
```

### 2. Clique no Botão
```
"Iniciar Teste 120 Dias"
```

### 3. Aguarde e Observe
Você verá em tempo real:
- Página atual
- Registros acumulados
- Tempo decorrido
- Velocidade (reg/s)

### 4. Anote os Resultados
Quando terminar, anote:
- ⏱️ **Tempo total**: _____ segundos
- 📄 **Páginas**: _____ páginas
- 📊 **Registros**: _____ registros
- ⚡ **Velocidade**: _____ reg/s

## 📊 Interpretação

### Resultado RÁPIDO (< 60s)
```
✅ A API está boa!
❌ O problema é o cache do streamingCache
💡 Solução: Otimizar ou remover o cache
```

### Resultado LENTO (> 120s)
```
❌ A API é o gargalo!
✅ O cache não é o problema
💡 Solução: Usar Analytics Agregado ou limitar a 60 dias
```

### Resultado MÉDIO (60-120s)
```
⚠️ Aceitável mas pode melhorar
💡 Solução: Implementar cache persistente + chunks
```

## 🔍 Comparação

Depois do teste, compare com:

1. **Analytics API** (com cache)
   - Acesse: `/analytics-api`
   - Selecione 90 dias
   - Anote o tempo

2. **Analytics Agregado** (otimizado)
   - Acesse: `/analytics-api-agregado`
   - Selecione 90 dias
   - Anote o tempo

## 📝 Exemplo de Análise

```
Teste 120 dias:     45s  ← RÁPIDO
Analytics API 90d:  180s ← LENTO
Analytics Agregado: 30s  ← RÁPIDO

Conclusão: O cache do streamingCache está causando lentidão!
Ação: Remover ou otimizar o cache
```

## ⚠️ Importante

- Este teste **NÃO usa cache**
- Sempre busca tudo da API
- É apenas para **diagnóstico**
- **NÃO use em produção**

## 🎯 Próximo Passo

Após o teste, me informe os resultados:
- Tempo total
- Velocidade
- Comparação com Analytics API

Assim posso sugerir a melhor solução! 🚀
