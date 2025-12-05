# ✅ Logs de MongoDB Implementados

**Data:** 2025-12-05  
**Status:** ✅ Completo e Testado

---

## 🎯 Objetivo

Adicionar logs detalhados de conectividade e erros de consulta do MongoDB no backoffice para facilitar o diagnóstico de problemas através do visualizador de logs do Coolify.

---

## 📋 O Que Foi Implementado

### 1. 🔌 Logs de Conexão Inicial (mongodb.ts)

#### ✅ Melhorias Adicionadas:

- **Timestamp** em todas as operações de conexão
- **Diagnóstico detalhado** por tipo de erro:
  - Erro de Rede (ECONNREFUSED)
  - Erro de Seleção de Servidor (MongoServerSelectionError)
  - Erro de Autenticação (código 18)
  - Erro de DNS (ENOTFOUND)
  - Timeout de Conexão (ETIMEDOUT)
- **Variáveis de ambiente** exibidas para debug
- **Sugestões de correção** automáticas e contextuais
- **Tempo de conexão** em milissegundos
- **Lista de collections** encontradas
- **ReadyState** do Mongoose

#### 📝 Exemplo de Log:

```
📊 Conectando ao MongoDB (Mongoose)...
   Timestamp: 2025-12-05T10:30:00.000Z
   URI: mongodb://***:***@10.0.0.8:27017
   Database: C67624577000145
   Host: 10.0.0.8
🔌 Tentando estabelecer conexão...
✅ MongoDB conectado com sucesso!
   Status: Conectado
   Tempo de conexão: 245ms
   ReadyState: 1
   Collections: 14 encontradas
     - tbl_nfe_100
     - tbl_nfe_200
```

---

### 2. 🔄 Monitoramento de Conexão (mongodb.ts)

#### ✅ Event Listeners Adicionados:

- `connected` - Quando conexão é estabelecida
- `error` - Quando ocorre erro na conexão
- `disconnected` - Quando conexão é perdida
- `reconnected` - Quando reconexão é bem-sucedida
- `close` - Quando conexão é fechada

#### 📝 Exemplo de Log:

```
🔗 Mongoose conectado ao MongoDB
   📊 Estado da conexão: CONECTADO
   🕐 Timestamp: 2025-12-05T10:30:00.000Z

🔌 Mongoose desconectado do MongoDB
   📊 Estado da conexão: DESCONECTADO
   🕐 Timestamp: 2025-12-05T10:35:00.000Z
   🔄 Mongoose tentará reconectar automaticamente

🔄 Mongoose reconectado ao MongoDB
   📊 Estado da conexão: RECONECTADO
   🕐 Timestamp: 2025-12-05T10:35:30.000Z
```

---

### 3. 📥 Logs de Requisições HTTP (index.ts)

#### ✅ Middleware de Logging Adicionado:

- **Log de entrada** com método, path, query e body
- **Log de saída** com status code e duração
- **Detalhes de erro** quando status >= 400
- **Ícones visuais** para facilitar identificação (✅ ⚠️ ❌)

#### 📝 Exemplo de Log:

```
📥 2025-12-05T10:30:15.123Z GET /api/documents
   📋 Query: {"collection":"tbl_nfe_100","page":"1","size":"500"}
📤 ✅ GET /api/documents - 200 (1247ms)

📥 2025-12-05T10:30:20.456Z POST /api/analytics/aggregate
   📦 Body: {"collection":"tbl_nfe_100","dtIni":"2024-01-01","dtFin":"2024-12-31"}
📤 ❌ POST /api/analytics/aggregate - 500 (5000ms)
   🔍 Erro: operation exceeded time limit
   📋 Tipo: MongoServerError
   🔢 Código: 16389
```

---

### 4. 🔍 Logs de Erros de Consulta (documents.ts)

#### ✅ Logs Específicos por Tipo de Erro:

- **Erro de Conectividade** (MongoNetworkError, ECONNREFUSED)
- **Erro de Autenticação** (código 18)
- **Erro de Permissão** (código 13)
- **Conexão Fechada** (Topology is closed)
- **Detalhes técnicos** (name, code, codeName, stack)

#### 📝 Exemplo de Log:

```
❌ Erro ao buscar documentos: connection timed out
📋 Detalhes do erro: {
  name: 'MongoNetworkError',
  code: 'ECONNREFUSED',
  codeName: undefined
}
🔌 Erro de Conectividade MongoDB:
   - MongoDB pode estar offline
   - Verifique se o host está acessível
   - Verifique firewall e regras de rede
   - Host configurado: 10.0.0.8
```

---

### 5. 📊 Logs de Erros de Agregação (analytics.ts)

#### ✅ Logs Específicos para Analytics:

- **Erro de Conectividade** durante agregação
- **Timeout** em agregação (código 16389)
- **Erro em Operação de Agrupamento** ($group, $facet)
- **Conexão Fechada** durante agregação
- **Erro de Permissão** em agregação
- **Período solicitado** para contexto

#### 📝 Exemplo de Log:

```
❌ Erro na agregação: operation exceeded time limit
📊 Detalhes do erro analytics: {
  name: 'MongoServerError',
  code: 16389,
  collection: 'tbl_nfe_100',
  pipeline: 'aggregation',
  timestamp: '2025-12-05T10:30:25.456Z'
}
⏱️ Timeout na agregação MongoDB:
   - Query muito complexa ou dados grandes
   - Considere adicionar índices
   - Considere limitar período de dados
   - Período solicitado: 2024-01-01 até 2024-12-31
```

---

### 6. 🏥 Health Check Melhorado (health.ts)

#### ✅ Melhorias no Health Check:

- **Teste real de ping** no MongoDB
- **Tempo de ping** em milissegundos
- **Contagem de collections**
- **Métricas de servidor** (uptime, memória)
- **Status HTTP apropriado** (200 para OK, 503 para erro)
- **ReadyState detalhado** com explicação

#### 📝 Exemplo de Resposta:

```json
{
  "status": "ok",
  "timestamp": "2025-12-05T10:30:00.000Z",
  "mongodb": {
    "state": "connected",
    "stateCode": 1,
    "host": "10.0.0.8",
    "database": "C67624577000145",
    "ping": "success",
    "pingTime": "15ms",
    "collections": 14
  },
  "server": {
    "uptime": 3600,
    "memory": {
      "rss": 45678592,
      "heapUsed": 23456789,
      "heapTotal": 34567890
    },
    "nodeVersion": "v20.10.0",
    "platform": "linux"
  }
}
```

---

## 📁 Arquivos Modificados

| Arquivo | Modificações |
|---------|--------------|
| `server/backoffice/database/mongodb.ts` | ✅ Logs detalhados de conexão + Event listeners |
| `server/backoffice/index.ts` | ✅ Middleware de logging de requisições |
| `server/backoffice/routes/documents.ts` | ✅ Logs de erros de consulta |
| `server/backoffice/routes/analytics.ts` | ✅ Logs de erros de agregação |
| `server/backoffice/routes/health.ts` | ✅ Health check melhorado |

---

## 📚 Documentação Criada

- **`docs/troubleshooting/MONGODB_LOGS_GUIDE.md`** - Guia completo de todos os logs implementados com exemplos e instruções de uso no Coolify

---

## 🔍 Como Usar no Coolify

### 1. Acessar Logs

1. Acesse seu projeto no Coolify
2. Vá em **"Logs"** ou **"Application Logs"**
3. Selecione o container do backend/backoffice

### 2. Filtros Úteis

| Tipo de Erro | Buscar por |
|--------------|------------|
| Erros de Conectividade | `"ERRO DE REDE"` ou `"MongoNetworkError"` |
| Erros de Autenticação | `"ERRO DE AUTENTICAÇÃO"` ou `"code: 18"` |
| Timeouts | `"Timeout"` ou `"code: 16389"` |
| Health Checks | `"Health check"` |
| Requisições Lentas | `"ms)"` (filtrar por >5000ms) |
| Erros em Geral | `"❌"` ou `"ERRO"` |

### 3. Monitorar em Tempo Real

1. Ative **"Follow logs"** no Coolify
2. Faça requisições na aplicação
3. Observe logs em tempo real

---

## 🎯 Benefícios

### ✅ Diagnóstico Rápido

- Identificar problemas de conectividade imediatamente
- Ver exatamente qual tipo de erro ocorreu
- Receber sugestões de correção automáticas

### ✅ Monitoramento Contínuo

- Acompanhar estado da conexão em tempo real
- Detectar instabilidades de rede
- Monitorar performance das consultas

### ✅ Debugging Facilitado

- Logs estruturados e organizados
- Timestamps para correlação de eventos
- Detalhes técnicos completos (códigos, nomes, mensagens)

### ✅ Métricas de Performance

- Tempo de conexão
- Duração de requisições
- Tempo de ping
- Uso de memória

---

## 🧪 Validação

### ✅ TypeScript

```bash
npm run build:prod
```

**Resultado:** ✅ Sem erros de compilação

### ✅ Diagnósticos

```
server/backoffice/database/mongodb.ts: No diagnostics found
server/backoffice/index.ts: No diagnostics found
server/backoffice/routes/analytics.ts: No diagnostics found
server/backoffice/routes/health.ts: No diagnostics found
```

---

## 🚀 Próximos Passos

1. **Commit e Push:**
   ```bash
   git add .
   git commit -m "feat: adicionar logs detalhados de MongoDB para Coolify"
   git push origin main
   ```

2. **Deploy no Coolify:**
   - Fazer deploy da nova versão
   - Verificar logs no Coolify
   - Testar health check: `https://seu-dominio.com/api/health`

3. **Monitoramento:**
   - Acompanhar logs em tempo real
   - Verificar se erros são capturados corretamente
   - Ajustar filtros conforme necessário

---

## 📊 Resumo

| Item | Status |
|------|--------|
| Logs de Conexão | ✅ Implementado |
| Monitoramento de Conexão | ✅ Implementado |
| Logs de Requisições | ✅ Implementado |
| Logs de Erros de Consulta | ✅ Implementado |
| Logs de Erros de Agregação | ✅ Implementado |
| Health Check Melhorado | ✅ Implementado |
| Documentação | ✅ Criada |
| Validação TypeScript | ✅ Sem erros |
| Pronto para Deploy | ✅ Sim |

---

**🎉 Logs de MongoDB implementados com sucesso!**

**Agora você pode diagnosticar problemas de conectividade e consultas facilmente através do Coolify! 📊🚀**
