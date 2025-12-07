# 🚫 Erro: Request Blocked by DevTools

## Problema

```
Request was blocked by DevTools: "http://localhost:3000/api/documents?..."
```

## Causas Possíveis

### 1. Request Blocking Ativo no DevTools

O DevTools tem uma feature de bloquear requisições para debug.

**Solução:**

1. Abra DevTools (F12)
2. Vá para aba **Network**
3. Procure por ícone de **bloqueio** ou **filtro**
4. Clique com botão direito em qualquer requisição
5. Verifique se há opção **"Unblock request URL"** ou **"Remove from blocked URLs"**
6. Ou vá em **Settings** (⚙️) → **Network** → **Request blocking**
7. Desabilite ou remova regras de bloqueio

### 2. Extensões do Navegador

Extensões como AdBlock, uBlock, Privacy Badger podem bloquear.

**Solução:**

1. Desabilite extensões temporariamente
2. Ou adicione `localhost` às exceções
3. Ou use modo anônimo (Ctrl+Shift+N)

### 3. Configuração de Rede no DevTools

**Solução:**

1. DevTools → Network tab
2. Verificar se **"Disable cache"** está marcado (pode deixar)
3. Verificar se **"Offline"** NÃO está marcado
4. Verificar **throttling** está em "No throttling"

### 4. CORS ou CSP

Embora a mensagem seja diferente, pode ser relacionado.

**Solução:**

Verificar console para outros erros relacionados a CORS.

## Solução Rápida

### Opção 1: Limpar DevTools

```
1. Feche DevTools (F12)
2. Feche o navegador completamente
3. Abra novamente
4. Abra DevTools (F12)
5. Recarregue página (Ctrl+R)
```

### Opção 2: Modo Anônimo

```
1. Abra janela anônima (Ctrl+Shift+N)
2. Acesse http://localhost:3000
3. Teste se funciona
```

Se funcionar no modo anônimo, o problema é uma extensão.

### Opção 3: Outro Navegador

```
1. Teste em outro navegador (Edge, Firefox, etc)
2. Se funcionar, o problema é configuração do Chrome
```

### Opção 4: Resetar DevTools

```
1. DevTools → Settings (⚙️)
2. Preferences → Restore defaults and reload
```

## Verificar Request Blocking

### Chrome DevTools

1. Abra DevTools (F12)
2. Vá para **Network** tab
3. Clique no ícone de **filtro** (🔽)
4. Procure por **"Request blocking"**
5. Se houver regras, remova ou desabilite

### Ou via Settings

1. DevTools → Settings (⚙️)
2. **Network** → **Request blocking**
3. Desabilite **"Enable request blocking"**
4. Ou remova todas as regras

## Testar API Diretamente

Para verificar se o problema é só no navegador:

```bash
# Testar com curl
curl "http://localhost:3000/api/documents?collection=tbl_nfe_100&page=1&size=10&dtIni=2024-01-01&dtFim=2024-12-31"

# Deve retornar JSON com dados
```

Se curl funcionar, o problema é definitivamente no navegador.

## Verificar Extensões

### Extensões Comuns que Bloqueiam

- AdBlock / AdBlock Plus
- uBlock Origin
- Privacy Badger
- Ghostery
- NoScript
- HTTPS Everywhere (configurado errado)

### Como Testar

1. Desabilite TODAS as extensões
2. Recarregue página
3. Se funcionar, habilite uma por uma para identificar qual bloqueia

### Adicionar Exceção

Se for AdBlock/uBlock:
1. Clique no ícone da extensão
2. Adicione `localhost` ou `127.0.0.1` às exceções
3. Ou desabilite para o site

## Verificar Console

Além do erro de blocking, verifique se há outros erros:

```javascript
// Abra Console (F12 → Console)
// Procure por:

// CORS
Access to fetch at '...' has been blocked by CORS policy

// CSP
Refused to connect to '...' because it violates the Content Security Policy

// Mixed Content
Mixed Content: The page at '...' was loaded over HTTPS, but requested an insecure resource
```

## Solução Definitiva

### 1. Limpar Tudo

```bash
# Fechar navegador
# Limpar cache do navegador
# Desabilitar extensões
# Abrir novamente
```

### 2. Usar Fetch Direto no Console

```javascript
// Abra Console (F12)
// Cole e execute:

fetch('http://localhost:3000/api/documents?collection=tbl_nfe_100&page=1&size=10&dtIni=2024-01-01&dtFim=2024-12-31')
  .then(r => r.json())
  .then(data => console.log('✅ Dados:', data))
  .catch(err => console.error('❌ Erro:', err))
```

Se funcionar no console mas não na aplicação, o problema pode ser no código.

### 3. Verificar Código

O problema pode estar no interceptor do axios que adicionamos.

Vou verificar o código do mongoApi.ts...

## Possível Problema no Código

O interceptor que adicionamos pode estar causando o bloqueio.

**Solução temporária:**

Comentar o interceptor:

```typescript
// src/services/mongoApi.ts

// Comentar estas linhas temporariamente:
/*
this.client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Erro HTTP na API MongoDB:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    })
    
    if (error.response?.data) {
      throw new Error(error.response.data.error || error.response.data.message || error.message)
    }
    
    throw error
  }
)
*/
```

Depois fazer rebuild:
```bash
npm run build:prod
npm run fullstack:restart
```

## Checklist de Diagnóstico

- [ ] DevTools Request Blocking desabilitado
- [ ] Extensões desabilitadas ou exceção adicionada
- [ ] Modo anônimo testado
- [ ] Outro navegador testado
- [ ] curl funciona
- [ ] Console não mostra outros erros
- [ ] Fetch direto no console funciona
- [ ] Interceptor comentado (se necessário)

## Logs do Servidor

Verificar se o servidor está recebendo a requisição:

```bash
# Nos logs do servidor, procure por:
[API] 📥 GET /api/documents

# Se aparecer, o servidor recebeu
# Se não aparecer, o bloqueio é no navegador
```

## Resumo

**Problema**: DevTools bloqueando requisição
**Causa mais comum**: Request Blocking ativo ou extensão
**Solução rápida**: Modo anônimo ou desabilitar extensões
**Solução definitiva**: Limpar configurações do DevTools

## Próximos Passos

1. ✅ Testar em modo anônimo
2. ✅ Se funcionar, desabilitar extensões
3. ✅ Verificar Request Blocking no DevTools
4. ✅ Testar com curl
5. ✅ Se curl funcionar, problema é no navegador
6. ✅ Resetar DevTools se necessário

## Ajuda

Se nada funcionar, envie:
- Screenshot do erro completo
- Screenshot da aba Network
- Screenshot das extensões instaladas
- Resultado do curl
