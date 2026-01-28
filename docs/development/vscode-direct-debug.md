# VS Code Debug Direto - Sem Scripts

Este guia mostra como usar o debug do VS Code de forma direta, sem dependência de scripts externos ou tasks complexas.

## ✅ Configuração Completa

- **WSL/Docker Tasks**: ❌ Removidos completamente
- **Windows Native**: ✅ Configurado e funcionando
- **Debug Direto**: ✅ Sem dependência de scripts
- **Portas Dinâmicas**: ✅ Backend ${env:BACKOFFICE_PORT} (4001), Frontend ${env:VITE_PORT} (4000)
- **MongoDB Proxy**: ✅ Mesma porta do backend (4001)

## 🔄 Status Atual da Implementação

### ✅ Problemas Resolvidos

**Backend Port Issue - RESOLVIDO**
- ❌ **Problema**: Backend estava rodando na porta 3000 em vez de 4001
- ✅ **Solução**: Corrigido `cwd` no launch.json para usar workspace root
- ✅ **Resultado**: Backend confirmado rodando em http://localhost:4001

**HTTP Service URL Construction - RESOLVIDO**
- ❌ **Problema**: URLs não eram construídas corretamente no frontend
- ✅ **Solução**: Adicionado construção de URL completa no httpService
- ✅ **Resultado**: BaseURL fallback corrigido de 3001 para 4001

**Environment Variables Loading - RESOLVIDO**
- ❌ **Problema**: Variáveis de ambiente não eram carregadas no debug
- ✅ **Solução**: Adicionado `envFile` e hardcoded values no launch.json
- ✅ **Resultado**: Environment variables carregadas corretamente

**CORS Frontend Port Issue - RESOLVIDO**
- ❌ **Problema**: Frontend (port 4000) bloqueado por CORS policy
- ✅ **Solução**: Adicionado `http://localhost:4000` aos allowed origins no backend
- ✅ **Resultado**: Frontend pode acessar backend APIs sem erros CORS

**Login Response Structure - RESOLVIDO**
- ✅ **Backend**: Retorna `{success: true, data: {token, user}}`
- ✅ **Frontend**: Atualizado para usar `response.data.user` e `response.data.token`
- ✅ **Status**: Login funcionando corretamente

### 📋 Status Final

1. ✅ Backend rodando na porta 4001
2. ✅ Frontend rodando na porta 4000
3. ✅ CORS configurado corretamente
4. ✅ Login funcionando
5. ✅ Comunicação frontend-backend estabelecida
6. ✅ Debug fullstack operacional

## 🎯 Sistema Totalmente Funcional

✅ **Debug Environment**: Configurado e funcionando
✅ **Authentication**: Login/logout operacional
✅ **API Communication**: Frontend-backend comunicando
✅ **CORS**: Configurado para desenvolvimento
✅ **Environment Variables**: Carregadas corretamente
✅ **Windows Native**: Funcionando sem dependências WSL

## 🎯 Configurações Disponíveis

### 1. **🖥️ Debug Backend (Direct)**

- **Tipo**: Launch direto do Node.js
- **Porta**: ${env:BACKOFFICE_PORT} (configurada via .env)
- **Runtime**: tsx/esm para TypeScript
- **Console**: Terminal integrado
- **Sem dependências**: Não precisa de scripts ou tasks

### 2. **🌐 Debug Frontend (Direct)**

- **Tipo**: Chrome debug
- **URL**: http://localhost:4000 (valor direto - Chrome não resolve variáveis)
- **Source Maps**: Habilitado
- **Sem dependências**: Não precisa de tasks para iniciar frontend

### 3. **🧪 Debug Tests (Direct)**

- **Tipo**: Vitest direto
- **Modo**: Run com reporter verbose
- **Ambiente**: NODE_ENV=test
- **Console**: Terminal integrado

### 4. **🔍 Attach to Backend (Running Process)**

- **Tipo**: Attach para processo em execução
- **Porta**: 9229 (debug port padrão)
- **Uso**: Para quando o backend já está rodando com --inspect

## 🚀 Como Usar

### Opção 1: Debug Backend Apenas

1. **Para Backend**:
   - Pressione `F5` ou vá em Run & Debug
   - Selecione "🖥️ Debug Backend"
   - O backend será iniciado automaticamente na porta 4001

### Opção 2: Debug Full Stack (Recomendado)

1. Selecione "🚀 Debug Full Stack"
2. O frontend dev server será iniciado automaticamente
3. O backend será iniciado em modo debug
4. Acesse `http://localhost:4000` no navegador
5. Use `Ctrl+Shift+F5` para parar todos os processos

### Opção 3: Debug Frontend com Chrome

1. Selecione "🌐 Debug Frontend Only"
2. O frontend dev server será iniciado
3. O Chrome será aberto automaticamente com debug habilitado
4. Breakpoints funcionarão no código React

### Opção 4: Manual (Para Controle Total)

1. **Terminal 1**: `pnpm --filter @fiscal/frontend dev`
2. **Terminal 2**: Inicie o debug do backend
3. **Navegador**: Acesse `http://localhost:4000`

### Opção 3: Attach a Processo Existente

1. Inicie o backend manualmente com debug:

   ```bash
   cd apps/backend
   node --import tsx/esm --inspect=9229 src/index.ts
   ```

2. Selecione "🔍 Attach to Backend (Running Process)"
3. O debugger se conectará ao processo em execução

## 🔧 Configuração das Portas

As portas são configuradas dinamicamente via variáveis de ambiente do arquivo `.env`:

**Backend (Node.js debug):**
```json
{
  "env": {
    "BACKOFFICE_PORT": "${env:BACKOFFICE_PORT}",  // Backend (4001)
    "PORT": "${env:BACKOFFICE_PORT}"
  }
}
```

**Frontend (Chrome debug):**
```json
{
  "url": "http://localhost:4000"  // Frontend (valor direto - Chrome não resolve ${env:})
}
```

**Variáveis do .env utilizadas:**
- `BACKOFFICE_PORT=4001` - Porta do backend
- `VITE_PORT=4000` - Porta do frontend

**Nota**: O Chrome debug usa valor direto (4000) porque o VS Code não consegue resolver `${env:VITE_PORT}` na propriedade `url` do Chrome debugger.

## 🎯 Breakpoints

### Backend (TypeScript)

- Coloque breakpoints diretamente nos arquivos `.ts`
- Source maps estão habilitados
- Funciona em qualquer arquivo do `apps/backend/src/`

### Frontend (React)

- Coloque breakpoints nos arquivos `.tsx` ou `.ts`
- Funciona no Chrome DevTools integrado
- Source maps do Vite estão habilitados

## 🛠️ Troubleshooting

### Backend não inicia na porta correta
1. Verifique se o arquivo `.env` está na raiz do projeto
2. Confirme que `BACKOFFICE_PORT=4001` está definido no `.env`
3. O debug agora usa `envFile` para carregar variáveis automaticamente

### Frontend não está rodando
1. **Solução Automática**: Use "🚀 Debug Full Stack" que inicia tudo automaticamente
2. **Solução Manual**: Execute `pnpm --filter @fiscal/frontend dev` em um terminal
3. **Verificação**: Acesse `http://localhost:4000` no navegador

### Página não encontrada (ERR_CONNECTION_REFUSED)
1. Use "🚀 Debug Full Stack" em vez de configurações individuais
2. Aguarde o frontend dev server inicializar completamente
3. Verifique se não há conflitos de porta (4000 e 4001)

### Chrome não abre automaticamente
1. Use "🌐 Debug Frontend Only" para debug específico do frontend
2. Ou acesse manualmente `http://localhost:4000` após iniciar "🚀 Debug Full Stack"
3. Verifique se o Chrome está instalado e acessível

## 📝 Vantagens do Debug Direto

✅ **Sem Scripts**: Não depende de scripts externos ou tasks
✅ **Mais Rápido**: Inicia diretamente sem overhead
✅ **Mais Simples**: Configuração direta no launch.json
✅ **Mais Confiável**: Menos pontos de falha
✅ **Windows Native**: Funciona nativamente no Windows
✅ **Fácil Manutenção**: Menos arquivos para manter

## 🔄 Migração de Scripts para Debug Direto

Se você estava usando scripts de debug antes:

### Antes (com scripts):
```json
{
  "preLaunchTask": "Start Backend Script",
  "postDebugTask": "Stop Backend Script"
}
```

### Depois (direto):
```json
{
  "request": "launch",
  "program": "${workspaceFolder}/apps/backend/src/index.ts"
}
```

### Benefícios:
- ❌ Remove dependência de scripts PowerShell/Bash
- ❌ Remove dependência de tasks do VS Code
- ❌ Remove complexidade de configuração
- ✅ Funciona imediatamente após clone do repo
- ✅ Mais fácil para novos desenvolvedores