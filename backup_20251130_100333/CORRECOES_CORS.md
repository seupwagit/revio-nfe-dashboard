# 🔧 Correções Aplicadas - Problema de CORS

## ❌ Problema Identificado

### 1. Erro de CORS
```
Access to XMLHttpRequest has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
Redirect is not allowed for a preflight request.
```

**Causa**: A API `http://apinfe.revio.digital` está fazendo um redirect e o navegador bloqueia requisições CORS com redirect.

### 2. Erro na Grid
```
[Table] Column with id 'emitente.razaoSocial' does not exist.
```

**Causa**: A coluna com ponto no ID não estava sendo encontrada corretamente.

## ✅ Soluções Aplicadas

### 1. Proxy do Vite (Solução para CORS)

**Arquivo**: `vite.config.ts`

Adicionado proxy que redireciona as requisições através do servidor de desenvolvimento:

```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://apinfe.revio.digital',
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/api/, '/api'),
    }
  }
}
```

**Como funciona**:
- Requisições para `/api/*` são redirecionadas para `http://apinfe.revio.digital/api/*`
- O proxy adiciona os headers CORS corretos
- Evita o problema de redirect no preflight

### 2. Atualização do .env

**Antes**:
```env
VITE_API_BASE_URL=http://apinfe.revio.digital/api
```

**Depois**:
```env
VITE_API_BASE_URL=/api
```

Agora as requisições vão para `/api` (proxy local) ao invés de diretamente para o servidor externo.

### 3. Correção do Filtro da Grid

**Antes**:
```typescript
table.getColumn('emitente.razaoSocial')?.getFilterValue()
```

**Depois**:
```typescript
columnFilters.find(f => f.id === 'emitente.razaoSocial')?.value
```

Agora usa o estado de filtros diretamente ao invés de tentar acessar a coluna.

## 🚀 Como Testar

1. **Recarregue a página** no navegador (Ctrl+F5)
2. **Vá para "Grid Completa"**
3. **Clique em "Consultar"**
4. **Verifique o console** - não deve mais ter erros de CORS

## 📊 Fluxo de Requisição

### Antes (Com CORS)
```
Browser → http://apinfe.revio.digital/api → CORS Error ❌
```

### Depois (Com Proxy)
```
Browser → http://localhost:5173/api → Vite Proxy → http://apinfe.revio.digital/api → Success ✅
```

## ⚠️ Importante

### Para Desenvolvimento
- O proxy funciona apenas em desenvolvimento (`npm run dev`)
- Perfeito para testar localmente

### Para Produção
Você tem 2 opções:

#### Opção 1: Configurar CORS no Backend (Recomendado)
O backend precisa adicionar os headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

#### Opção 2: Usar um Proxy Reverso
Configure nginx ou similar para fazer proxy das requisições.

## 🔍 Verificação

Após as correções, você deve ver no console:

✅ **Sem erros de CORS**
✅ **Requisições bem-sucedidas**
✅ **Dados carregando corretamente**
✅ **Grid funcionando sem erros**

## 📝 Logs Esperados

```
🚀 Requisição: {method: 'get', url: '/WebView/Consultar', ...}
✅ Resposta recebida: {status: 200, data: {...}}
📊 Total de registros: X
✅ Total de notas mapeadas: Y
```

## 🐛 Se Ainda Houver Problemas

1. **Limpe o cache do navegador** (Ctrl+Shift+Delete)
2. **Recarregue com Ctrl+F5**
3. **Verifique se o servidor está rodando** (`npm run dev`)
4. **Verifique o console** para novos erros

## 💡 Dica

Se a API retornar dados mas não aparecer na grid, verifique:
- A estrutura dos dados retornados
- O mapeamento em `src/services/api.ts`
- Os logs no console mostrando a estrutura

---

**Status**: ✅ Correções aplicadas e servidor reiniciado

**Próximo passo**: Recarregue a página e teste a consulta!
