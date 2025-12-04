# 🧪 Testes do SpedRevio

Esta pasta contém scripts de teste para validar funcionalidades da API Revio.

## 📋 Tipos de Teste

### Testes de Performance
- `test-90-dias-chunks.cjs` - Teste de chunks para períodos longos
- `test-pagesize-benchmark.cjs` - Benchmark de tamanhos de página
- `test-comparacao-periodos.cjs` - Comparação de performance entre períodos

### Testes de API
- `test-api-simple.cjs` - Teste básico da API
- `test-api-direct.cjs` - Teste direto sem cache
- `test-api-pagesize.cjs` - Teste de tamanhos de página

### Testes de Collections
- `test-all-collections-extended.cjs` - Teste de todas as collections
- `test-cfe-cte.cjs` - Teste específico CF-e e CT-e
- `test-streaming-3-colecoes.cjs` - Teste de streaming

### Testes de Funcionalidades
- `test-rah.cjs` - Teste do RAH (Assistente IA)
- `test-mapping.cjs` - Teste de mapeamento de dados
- `test-consistencia-periodos.cjs` - Teste de consistência

## 🚀 Como Executar

```bash
# Executar um teste específico
node tests/test-api-simple.cjs

# Executar teste de performance
node tests/test-90-dias-chunks.cjs
```

## ⚙️ Configuração

Certifique-se de ter o arquivo `.env` configurado com:
- `VITE_API_BASE_URL`
- `VITE_API_TOKEN`
- `VITE_API_GOOGLE_GEMINI` (para test-rah.cjs)
