# Troubleshooting - Grid Não Recebe Dados

## Problema
A grid não está exibindo dados mesmo quando a API retorna registros.

## Diagnóstico

### 1. Verificar Console do Navegador
Abra o DevTools (F12) e verifique:

```javascript
// Logs esperados:
📊 Carregando dados da collection: tbl_nfe_100
📋 Filtros: {...}
🔍 Buscando documentos via API REST...
✅ Recebidos X registros da collection tbl_nfe_100 em Xs
```

### 2. Verificar Estado do Contexto
Adicionei componente `<DebugGrid />` que mostra:
- Collection atual
- Status de loading
- Erros (se houver)
- Total de registros da API
- Quantidade de notas no estado
- Primeira nota (para verificar estrutura)

### 3. Possíveis Causas

#### A. API não está retornando dados
**Sintomas:**
- `notas.length === 0`
- `totalRegistros === 0`
- Sem erros no console

**Solução:**
```bash
# Verificar se backend está rodando
curl http://localhost:3000/api/health

# Testar endpoint de documentos
curl "http://localhost:3000/api/documents?collection=tbl_nfe_100&dtIni=2024-01-01&dtFin=2024-12-31"
```

#### B. Resposta da API sem campo `data`
**Sintomas:**
- Erro: "Resposta inválida da API: dados não encontrados"

**Solução:**
Verificar se backend está retornando:
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "size": 100,
    "total": 1000,
    "totalPages": 10
  }
}
```

#### C. Resposta da API sem campo `pagination`
**Sintomas:**
- Erro: "Resposta inválida da API: paginação não encontrada"

**Solução:**
Backend deve sempre retornar `pagination`, mesmo em caso de erro.

#### D. MongoDB não conectado
**Sintomas:**
- Erro: "MongoDB não conectado"
- Backend retorna erro 500

**Solução:**
```bash
# Verificar variáveis de ambiente
curl http://localhost:3000/api/debug/env

# Verificar logs do backend
# Procurar por:
❌ ERRO CRÍTICO: Falha ao conectar MongoDB
```

#### E. Filtros muito restritivos
**Sintomas:**
- `totalRegistros > 0` mas `notas.length === 0`
- Período de datas muito curto

**Solução:**
- Ampliar período de datas
- Remover filtros de CNPJ
- Verificar se collection tem dados no período

#### F. Dados não estão sendo setados no estado
**Sintomas:**
- API retorna dados (ver Network tab)
- `notas.length === 0` no componente

**Solução:**
Verificar `NFContext.tsx` linha ~120:
```typescript
setNotas(dados)  // Deve ser chamado
```

### 4. Checklist de Verificação

- [ ] Backend está rodando na porta 3000
- [ ] Health check retorna `status: "ok"`
- [ ] MongoDB está conectado
- [ ] Variáveis de ambiente configuradas
- [ ] Collection existe no MongoDB
- [ ] Collection tem dados no período filtrado
- [ ] API retorna `success: true`
- [ ] API retorna array em `data`
- [ ] API retorna objeto em `pagination`
- [ ] `setNotas()` é chamado no contexto
- [ ] Componente está usando `useNF()` corretamente
- [ ] `notas` é passado para `<GridPaginada data={notas} />`

### 5. Comandos de Debug

#### Verificar Backend
```bash
# Health check
curl http://localhost:3000/api/health

# Debug env
curl http://localhost:3000/api/debug/env

# Testar API de documentos
curl "http://localhost:3000/api/documents?collection=tbl_nfe_100&dtIni=2024-01-01&dtFin=2024-12-31&page=1&size=10"

# Contar documentos
curl "http://localhost:3000/api/documents/count?collection=tbl_nfe_100&dtIni=2024-01-01&dtFin=2024-12-31"
```

#### Verificar MongoDB Diretamente
```bash
# Conectar ao MongoDB
mongosh "mongodb://user:pass@host:27017/database"

# Contar documentos
db.tbl_nfe_100.countDocuments()

# Ver primeiro documento
db.tbl_nfe_100.findOne()

# Contar por período
db.tbl_nfe_100.countDocuments({
  DT_DOC: {
    $gte: new Date("2024-01-01"),
    $lte: new Date("2024-12-31")
  }
})
```

### 6. Logs Detalhados

Adicione logs no `NFContext.tsx`:

```typescript
console.log('📊 Resposta da API:', response)
console.log('📊 Dados recebidos:', response.data)
console.log('📊 Quantidade:', response.data.length)
console.log('📊 Pagination:', response.pagination)
```

### 7. Componente de Debug

Adicionei `<DebugGrid />` em `GridNFeSimples.tsx` que mostra:
- Estado atual do contexto
- Quantidade de registros
- Primeira nota (estrutura)
- Erros (se houver)

**Para remover depois:**
```tsx
// Remover esta linha quando resolver:
<DebugGrid />
```

### 8. Próximos Passos

1. Abrir aplicação no navegador
2. Abrir DevTools (F12)
3. Ir para aba Console
4. Verificar logs
5. Verificar componente `<DebugGrid />`
6. Identificar qual dos casos acima se aplica
7. Aplicar solução correspondente

### 9. Solução Rápida

Se tudo mais falhar, tente:

```bash
# 1. Parar tudo
# Ctrl+C no terminal

# 2. Limpar cache
npm run debug:cache:clear

# 3. Rebuild
npm run build:prod

# 4. Reiniciar
npm run fullstack

# 5. Abrir navegador
open http://localhost:3000
```

### 10. Contato

Se o problema persistir, envie:
- Screenshot do `<DebugGrid />`
- Logs do console do navegador
- Logs do backend
- Resposta de `curl http://localhost:3000/api/debug/env`
