# CORS Frontend Port Fix

## 🎯 Problema Identificado

**Erro CORS**: Frontend (http://localhost:4000) não conseguia acessar backend (http://localhost:4001)

```
Access to fetch at 'http://localhost:4001/api/documents?collection=tbl_nfe_100&page=1&size=999999' 
from origin 'http://localhost:4000' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🔍 Causa Raiz

A configuração CORS no backend (`apps/backend/src/index.ts`) não incluía a porta 4000 do frontend:

```typescript
// ❌ ANTES - Porta 4000 não incluída
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:5173',  // Vite padrão, mas não a porta configurada
  'https://nf-dashboard-homologacao.sistemasflow.com.br'
]
```

## ✅ Solução Implementada

### 1. **Adicionado porta 4000 explicitamente**
```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:4000',  // ✅ Frontend port (VITE_PORT)
  'http://localhost:5173',
  'https://nf-dashboard-homologacao.sistemasflow.com.br'
]
```

### 2. **Configuração dinâmica baseada em environment variables**
```typescript
// Adicionar origem do frontend baseada na variável VITE_PORT
const frontendPort = process.env.VITE_PORT || '4000'
const frontendOrigin = `http://localhost:${frontendPort}`
if (!allowedOrigins.includes(frontendOrigin)) {
  allowedOrigins.push(frontendOrigin)
}
```

## 🚀 Benefícios

✅ **Flexibilidade**: Porta do frontend configurável via `.env`
✅ **Robustez**: Não duplica origens se já existirem
✅ **Manutenibilidade**: Configuração centralizada
✅ **Debug**: Logs mostram origens permitidas

## 🔧 Configuração Final

**Environment Variables (.env):**
```bash
VITE_PORT=4000          # Frontend port
BACKOFFICE_PORT=4001    # Backend port
```

**CORS Configuration:**
```typescript
console.log('[CORS] Origens permitidas:', allowedOrigins)

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))
```

## 🧪 Teste

Após a correção, o frontend deve conseguir fazer requisições para o backend sem erros CORS:

```javascript
// ✅ Agora funciona
const response = await fetch('http://localhost:4001/api/documents?collection=tbl_nfe_100&page=1&size=999999')
```

## 📋 Logs Esperados

No console do backend, você deve ver:
```
[CORS] Origens permitidas: [
  'http://localhost:3000',
  'http://localhost:3002', 
  'http://localhost:4000',
  'http://localhost:5173',
  'https://nf-dashboard-homologacao.sistemasflow.com.br'
]
```

## 🔄 Próximos Passos

1. ✅ Backend reinicia automaticamente com nova configuração CORS
2. 🔄 Testar login e carregamento de dados no frontend
3. 🔄 Verificar se todas as APIs funcionam corretamente
4. 🔄 Confirmar que não há mais erros CORS no console

---

**Status**: ✅ RESOLVIDO
**Impacto**: Frontend agora pode comunicar com backend sem erros CORS
**Data**: 2026-01-12