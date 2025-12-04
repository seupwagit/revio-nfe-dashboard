# Monitoramento Automático de Erros

## 🎯 Problema Identificado

Ao carregar o grid de dados, erros de conexão eram retornados no console:

- **ERR_CONNECTION_REFUSED**: O servidor backend (porta 3001) não estava rodando
- A aplicação frontend tentava conectar em `http://localhost:3001/api/documents`
- Sem o backend, os dados não eram carregados

## ✅ Solução Implementada

### 1. Identificação do Problema

Usando o Chrome DevTools MCP, identifiquei:

- Erros de rede no console
- Tentativas de conexão falhando
- Servidor backend não estava iniciado

### 2. Correção Imediata

- Iniciado o servidor Vite (frontend) na porta 3000
- Iniciado o servidor Backoffice (backend) na porta 3001
- Dados carregados com sucesso: **5.199 registros** em ~1.6s

### 3. Monitoramento Automático

Criado script que:

- Inicia ambos os servidores automaticamente
- Monitora erros e reinicia processos se necessário
- Exibe logs coloridos para fácil identificação
- Graceful shutdown com Ctrl+C

## 🚀 Como Usar

### Opção 1: Script Automático (Recomendado)

```bash
npm run monitor
```

Ou no Windows:

```bash
iniciar-monitoramento.bat
```

### Opção 2: Servidores Separados

Terminal 1 (Frontend):

```bash
npm run dev
```

Terminal 2 (Backend):

```bash
npm run backend
```

## 📊 URLs Disponíveis

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health
- **Analytics**: http://localhost:3001/api/analytics
- **Documents**: http://localhost:3001/api/documents

## 🔍 Monitoramento com Chrome DevTools MCP

Para monitorar erros manualmente:

1. Abra a aplicação no navegador
2. Use o Chrome DevTools MCP para:
   - Listar mensagens do console
   - Verificar requisições de rede
   - Identificar erros em tempo real

## 📝 Logs do Sistema

O monitor automático exibe:

- ✅ Sucessos em verde
- ⚠️ Avisos em amarelo
- ❌ Erros em vermelho
- 🔄 Reinicializações em magenta
- 📊 Informações em azul/ciano

## 🛠️ Arquivos Criados

1. `scripts/auto-monitor.mjs` - Script de monitoramento
2. `iniciar-monitoramento.bat` - Atalho para Windows
3. `MONITORAMENTO_AUTOMATICO.md` - Esta documentação

## 💡 Benefícios

- ✅ Não precisa mais informar erros manualmente
- ✅ Servidores iniciam automaticamente
- ✅ Reinicialização automática em caso de falha
- ✅ Logs claros e coloridos
- ✅ Fácil de usar (um único comando)

## 🔧 Troubleshooting

### Porta já em uso

Se a porta 3000 ou 3001 já estiver em uso:

```bash
# Windows
netstat -ano | findstr :3000
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Erro de conexão MongoDB

Verifique o arquivo `.env`:

- `VITE_MONGODB_CONNECTION_STRING` está correto?
- MongoDB está acessível em `10.0.0.8:27017`?

### Backend não inicia

Verifique se o TypeScript está compilando:

```bash
npm run checktype
```

## 📈 Resultados

Após a correção:

- ✅ 5.199 documentos carregados
- ✅ Tempo de resposta: ~1.6s
- ✅ Valor total: R$ 22.964.757,68
- ✅ Sem erros de conexão
- ✅ Dashboard funcionando perfeitamente
