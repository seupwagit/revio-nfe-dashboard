# 🔍 Debug: Dashboard Vazio - Guia de Diagnóstico

## 🎯 Problema

O dashboard continua mostrando valores zerados mesmo após as correções de mapeamento de parâmetros.

## 🧪 Como Diagnosticar

### 1. Abrir DevTools do Navegador

1. **Pressione F12** para abrir DevTools
2. **Vá para a aba Console**
3. **Recarregue a página** (F5 ou Ctrl+R)
4. **Faça login** se necessário
5. **Navegue para o dashboard**

### 2. Verificar Logs de Debug

Procure por estas mensagens no console:

#### ✅ Logs Esperados (Sucesso):
```
📊 Carregando dados da collection: tbl_nfe_100
📋 Filtros: {}
🔍 Buscando documentos via API REST...
🚀 DEBUG: Iniciando fetchDocuments...
🔍 DEBUG: Fazendo requisição para: /api/documents?collection=tbl_nfe_100&page=1&size=999999
🌐 DEBUG: Fazendo requisição HTTP: {...}
🔑 DEBUG: Token de autenticação: eyJhbGciOiJSUzI1NiIs...
📡 DEBUG: Resposta recebida: {status: 200, ok: true}
📊 DEBUG: Response do httpService: {success: true, data: [...], pagination: {...}}
📊 DEBUG: Response completa do fiscalDocumentsService: [array com documentos]
📊 DEBUG: Tipo da response: object
📊 DEBUG: É array?: true
📊 DEBUG: Dados recebidos da API: {quantidade: 5200, ...}
🚀 DEBUG: Iniciando fetchCount...
🔢 DEBUG: Fazendo requisição de count para: /api/documents/count?collection=tbl_nfe_100
📊 DEBUG: Response do count: {success: true, count: 5200}
📊 DEBUG: Count extraído da resposta: 5200
📊 DEBUG: Total count recebido: 5200
✅ DEBUG: Estado final: {notasLength: 5200, totalRegistros: 5200, stats: {...}}
```

#### ❌ Logs de Erro (Problemas):

**Problema de Autenticação:**
```
⚠️ DEBUG: Nenhum token de autenticação encontrado!
```

**Problema de Conexão:**
```
❌ DEBUG: Erro na requisição HTTP: TypeError: Failed to fetch
```

**Problema de Resposta:**
```
❌ DEBUG: Erro na resposta: Unauthorized
```

**Dados Vazios:**
```
📊 DEBUG: Dados recebidos da API: {quantidade: 0, ...}
```

### 3. Verificar Autenticação

Se não há token, execute no console:

```javascript
// Verificar se há token
console.log('Token:', localStorage.getItem('revio_auth_token'))

// Verificar dados do usuário
console.log('User:', localStorage.getItem('revio_user_data'))
```

### 4. Teste Manual da API

Execute no console do navegador:

```javascript
// Teste manual da API de documentos
fetch('http://localhost:3001/api/documents?collection=tbl_nfe_100&page=1&size=5', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('revio_auth_token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('📊 Teste manual - Documentos:', data)
  console.log('📊 Quantidade:', data.data?.length)
})
.catch(err => console.error('❌ Erro no teste:', err))

// Teste manual da API de count
fetch('http://localhost:3001/api/documents/count?collection=tbl_nfe_100', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('revio_auth_token')}`,
    'Content-Type': 'application/json'
  }
})
.then(r => r.json())
.then(data => {
  console.log('📊 Teste manual - Count:', data)
})
.catch(err => console.error('❌ Erro no teste:', err))
```

## 🔧 Possíveis Soluções

### Se não há token de autenticação:
1. **Fazer logout e login novamente**
2. **Verificar se o login está funcionando**

### Se há erro de conexão:
1. **Verificar se o backend está rodando** na porta 3001
2. **Verificar se o MongoDB está conectado**

### Se a API retorna dados mas o frontend não processa:
1. **Verificar se há erros JavaScript** no console
2. **Verificar se o componente está renderizando** os dados

### Se os dados chegam mas não aparecem na tela:
1. **Verificar se o componente Dashboard** está usando o contexto corretamente
2. **Verificar se há erros de renderização** no React

## 📋 Checklist de Verificação

- [ ] Backend rodando na porta 3001?
- [ ] MongoDB conectado?
- [ ] Token de autenticação presente?
- [ ] API retorna dados quando testada manualmente?
- [ ] Logs mostram dados sendo recebidos?
- [ ] Estado do React está sendo atualizado?
- [ ] Componente Dashboard está renderizando?

## 🆘 Se Nada Funcionar

1. **Copie todos os logs do console** e envie para análise
2. **Teste as URLs manuais** e envie os resultados
3. **Verifique se há erros na aba Network** do DevTools
4. **Verifique se há erros na aba Elements** (problemas de renderização)

## 💡 Dicas Importantes

- **Sempre limpe o console** antes de testar (Ctrl+L)
- **Recarregue a página** após fazer login
- **Verifique se está na collection correta** (tbl_nfe_100)
- **Aguarde o carregamento completo** antes de analisar