# 🔧 Troubleshooting - Resolução de Problemas

## ❌ Problema: Página não carrega

### Sintomas
- Navegador mostra "Não foi possível conectar"
- Erro "ERR_CONNECTION_REFUSED"

### Solução
```bash
# Verificar se o Vite está rodando
# Deve mostrar: "Local: http://localhost:5173"

# Se não estiver rodando:
npm run dev
```

---

## ❌ Problema: Erro 401 Unauthorized

### Sintomas
- Console mostra: "Status: 401"
- Mensagem: "Unauthorized"
- Grid não carrega dados

### Causa
Token expirado (válido até 20/12/2024)

### Solução
1. Gerar novo token (ver `COMO_GERAR_NOVO_TOKEN.md`)
2. Atualizar no arquivo `.env`:
   ```env
   VITE_API_BEARER_TOKEN=seu_novo_token_aqui
   ```
3. Reiniciar servidores:
   ```bash
   # Ctrl+C nos dois terminais
   node proxy-server.cjs  # Terminal 1
   npm run dev            # Terminal 2
   ```

---

## ❌ Problema: Erro 404 Not Found

### Sintomas
- Console mostra: "Status: 404"
- URL da requisição incorreta

### Solução
Verificar configuração no `.env`:
```env
VITE_API_BASE_URL=http://localhost:3001/api
VITE_DB_HOST=10.0.0.8
VITE_DB_DATABASE=C67624577000145
```

---

## ❌ Problema: Proxy não está rodando

### Sintomas
- Erro: "ECONNREFUSED localhost:3001"
- Console mostra erro de conexão

### Solução
```bash
# Terminal 1 - Iniciar proxy
node proxy-server.cjs

# Deve mostrar:
# 🚀 Proxy server rodando na porta 3001
# 🎯 Redirecionando para: https://apinfe.revio.digital/api
```

---

## ❌ Problema: Grid não mostra dados

### Sintomas
- Grid aparece vazia
- Contador mostra "0 registro(s)"
- Sem erros no console

### Possíveis Causas e Soluções

#### 1. Período sem dados
```javascript
// Ajustar filtros de data
Data Início: 01/11/2024
Data Fim: 27/11/2024
```

#### 2. Collection vazia
```javascript
// Testar outra collection
Clicar em outro botão (NF-e, CF-e ou CT-e)
```

#### 3. Estrutura de resposta diferente
```javascript
// Verificar console:
🔄 Estrutura da resposta: {...}

// Se a estrutura for diferente, ajustar em src/services/api.ts
// Função: mapApiResponseToNotasFiscais()
```

---

## ❌ Problema: Erro CORS

### Sintomas
- Console mostra: "CORS policy"
- "Access-Control-Allow-Origin"

### Solução
Usar o proxy Node.js (já configurado):
```bash
# Verificar se proxy está rodando
node proxy-server.cjs

# Verificar .env
VITE_API_BASE_URL=http://localhost:3001/api  # ✅ Correto
# NÃO usar:
# VITE_API_BASE_URL=https://apinfe.revio.digital/api  # ❌ Errado
```

---

## ❌ Problema: Erro TypeScript

### Sintomas
- Linha vermelha no código
- Erro de tipo

### Solução
```bash
# Verificar erros
npm run build

# Se houver erros, verificar tipos em:
src/types/index.ts
```

---

## ❌ Problema: Exportação Excel não funciona

### Sintomas
- Botão não responde
- Erro no console

### Solução
```bash
# Verificar se biblioteca está instalada
npm list xlsx

# Se não estiver:
npm install xlsx
```

---

## ❌ Problema: Filtros não aplicam

### Sintomas
- Clicar em "Aplicar Filtros" não faz nada
- Grid não recarrega

### Solução
1. Verificar se as datas estão no formato correto (YYYY-MM-DD)
2. Verificar console para erros
3. Limpar filtros e tentar novamente

---

## ❌ Problema: Paginação não funciona

### Sintomas
- Botões "Anterior/Próxima" desabilitados
- Sempre mostra mesma página

### Solução
Verificar se há dados suficientes:
```javascript
// Se tiver menos de 20 registros, não haverá paginação
// Aumentar período de busca ou remover filtros
```

---

## ❌ Problema: Lentidão ao carregar

### Sintomas
- Grid demora muito para carregar
- Loading infinito

### Solução
1. Reduzir período de busca:
   ```javascript
   // Em vez de 1 ano, usar 1 mês
   Data Início: 01/11/2024
   Data Fim: 30/11/2024
   ```

2. Reduzir tamanho da página no `.env`:
   ```env
   VITE_DEFAULT_PAGE_SIZE=100  # Em vez de 500
   ```

---

## ❌ Problema: Token muito longo no console

### Sintomas
- Console mostra token completo
- Dificulta leitura dos logs

### Solução
Já está truncado no código:
```javascript
// src/services/api.ts
console.log('Authorization:', 
  config.headers.Authorization.substring(0, 70) + '...'
)
```

---

## 🔍 Comandos de Diagnóstico

### Verificar se servidores estão rodando
```bash
# Windows
netstat -ano | findstr :3001  # Proxy
netstat -ano | findstr :5173  # Vite

# Deve mostrar LISTENING
```

### Verificar logs do proxy
```bash
# No terminal onde o proxy está rodando
# Deve mostrar:
🔄 PROXY - Requisição interceptada: ...
📥 PROXY - Resposta recebida: Status 200
```

### Verificar logs do Vite
```bash
# No terminal onde o Vite está rodando
# Deve mostrar:
VITE v5.4.2  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### Testar API diretamente
```bash
# PowerShell
$headers = @{
    "Authorization" = "Bearer SEU_TOKEN_AQUI"
    "Content-Type" = "application/json"
}
Invoke-RestMethod -Uri "http://localhost:3001/api/WebView/Consultar?host=10.0.0.8&database=C67624577000145&collection=tbl_nfe_100&dtIni=2024-11-01&dtFin=2024-11-27&pg=1&size=10" -Headers $headers
```

---

## 📋 Checklist de Diagnóstico

Quando algo não funcionar, verificar na ordem:

1. [ ] Proxy está rodando? (`node proxy-server.cjs`)
2. [ ] Vite está rodando? (`npm run dev`)
3. [ ] Token está válido? (verificar data de expiração)
4. [ ] `.env` está configurado corretamente?
5. [ ] Console do navegador mostra erros?
6. [ ] Network tab mostra Status 200?
7. [ ] Estrutura da resposta está correta?
8. [ ] Há dados no período filtrado?

---

## 🆘 Último Recurso

Se nada funcionar:

### 1. Limpar tudo e recomeçar
```bash
# Parar servidores (Ctrl+C)

# Limpar cache
npm cache clean --force

# Reinstalar dependências
rmdir /s /q node_modules
del package-lock.json
npm install

# Reiniciar servidores
node proxy-server.cjs  # Terminal 1
npm run dev            # Terminal 2
```

### 2. Verificar arquivo de teste
```bash
# Testar API diretamente
node test-api-direct.cjs
```

### 3. Usar página de debug
```
http://localhost:5173/test-delphi
```
Esta página mostra:
- Configuração atual
- Teste de requisição
- Resposta completa da API
- Estrutura dos dados

---

## 📞 Informações de Suporte

### Logs Importantes
- **Proxy**: Terminal onde rodou `node proxy-server.cjs`
- **Vite**: Terminal onde rodou `npm run dev`
- **Browser**: F12 → Console
- **Network**: F12 → Network

### Arquivos de Configuração
- `.env` - Variáveis de ambiente
- `proxy-server.cjs` - Configuração do proxy
- `vite.config.ts` - Configuração do Vite
- `src/services/api.ts` - Integração com API

### Documentação
- `TESTE_MANUAL.md` - Checklist de testes
- `O_QUE_VOCE_DEVE_VER.md` - Comportamento esperado
- `STATUS_FINAL.md` - Status do sistema
- `COMO_GERAR_NOVO_TOKEN.md` - Renovar token

---

**Dica**: Sempre verificar o console do navegador (F12) primeiro! 90% dos problemas aparecem lá.
