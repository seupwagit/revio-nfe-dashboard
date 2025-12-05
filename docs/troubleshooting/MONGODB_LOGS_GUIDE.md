# 📊 Guia de Logs do MongoDB - Coolify

## 🎯 Objetivo

Este documento descreve todos os logs implementados no backoffice para facilitar o diagnóstico de problemas de conectividade e consultas do MongoDB através do visualizador de logs do Coolify.

---

## 📋 Tipos de Logs Implementados

### 1. 🔌 Logs de Conexão Inicial

#### ✅ Conexão Bem-sucedida

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
     - tbl_nfe_300
     ...
```

#### ❌ Erro de Rede (ECONNREFUSED)

```
📊 Conectando ao MongoDB (Mongoose)...
   Timestamp: 2025-12-05T10:30:00.000Z
   URI: mongodb://***:***@10.0.0.8:27017
   Database: C67624577000145
   Host: 10.0.0.8
🔌 Tentando estabelecer conexão...
❌ ERRO CRÍTICO: Falha ao conectar MongoDB
   Timestamp: 2025-12-05T10:30:05.000Z
📋 Detalhes do erro de conexão:
   name: MongoNetworkError
   code: ECONNREFUSED
   message: connect ECONNREFUSED 10.0.0.8:27017

🔌 ERRO DE REDE:
   ❌ MongoDB não está acessível
   📍 Host configurado: 10.0.0.8
   🔍 Verificações necessárias:
      1. MongoDB está rodando?
      2. Host/IP está correto?
      3. Porta 27017 está aberta?
      4. Firewall permite conexão?
      5. Rede entre containers funciona?

🔧 VARIÁVEIS DE AMBIENTE:
   VITE_DB_HOST: 10.0.0.8
   VITE_DB_DATABASE: C67624577000145
   VITE_MONGODB_CONNECTION_STRING: ✅ DEFINIDO

💡 PRÓXIMOS PASSOS:
   1. Verifique se MongoDB está rodando
   2. Teste conectividade: ping 10.0.0.8
   3. Verifique variáveis de ambiente no Coolify
   4. Consulte logs do MongoDB
```

#### ❌ Erro de Autenticação

```
❌ ERRO CRÍTICO: Falha ao conectar MongoDB
📋 Detalhes do erro de conexão:
   name: MongoServerError
   code: 18
   codeName: AuthenticationFailed

🔐 ERRO DE AUTENTICAÇÃO:
   ❌ Credenciais inválidas
   👤 Usuário/senha incorretos
   🔍 Verificações necessárias:
      1. Usuário existe no MongoDB?
      2. Senha está correta?
      3. authSource está correto?
      4. Usuário tem permissão no database?
```

#### ❌ Erro de DNS (ENOTFOUND)

```
🌐 ERRO DE DNS:
   ❌ Host não foi encontrado
   📍 Host: mongodb-server
   🔍 Verificações:
      1. Host/IP está correto?
      2. DNS resolve o hostname?
      3. Usar IP em vez de hostname?
```

#### ❌ Timeout de Conexão

```
⏱️ TIMEOUT DE CONEXÃO:
   ❌ Tempo limite excedido
   🔍 Verificações:
      1. MongoDB está respondendo?
      2. Rede está lenta?
      3. Firewall bloqueando?
```

---

### 2. 🔄 Logs de Monitoramento de Conexão

Estes logs aparecem durante a execução quando há mudanças no estado da conexão:

#### Conexão Estabelecida

```
🔗 Mongoose conectado ao MongoDB
   📊 Estado da conexão: CONECTADO
   🕐 Timestamp: 2025-12-05T10:30:00.000Z
```

#### Erro Durante Execução

```
❌ ERRO na conexão Mongoose: connection lost
📋 Detalhes do erro de conexão:
   name: MongoNetworkError
   code: undefined
   timestamp: 2025-12-05T10:35:00.000Z

🔌 Erro de rede detectado:
   - Conexão com MongoDB foi perdida
   - Mongoose tentará reconectar automaticamente
   - Verifique estabilidade da rede
```

#### Desconexão

```
🔌 Mongoose desconectado do MongoDB
   📊 Estado da conexão: DESCONECTADO
   🕐 Timestamp: 2025-12-05T10:35:00.000Z
   🔄 Mongoose tentará reconectar automaticamente
```

#### Reconexão

```
🔄 Mongoose reconectado ao MongoDB
   📊 Estado da conexão: RECONECTADO
   🕐 Timestamp: 2025-12-05T10:35:30.000Z
```

---

### 3. 📥 Logs de Requisições HTTP

Todas as requisições são logadas automaticamente:

#### Requisição Bem-sucedida

```
📥 2025-12-05T10:30:15.123Z GET /api/documents
   📋 Query: {"collection":"tbl_nfe_100","page":"1","size":"500"}
📄 Buscando documentos: { collection: 'tbl_nfe_100', periodo: '2024-01-01 a 2024-12-31', page: '1', size: '500' }
✅ 500 documentos retornados em 1247ms
📤 ✅ GET /api/documents - 200 (1247ms)
```

#### Requisição com Erro

```
📥 2025-12-05T10:30:20.456Z GET /api/analytics
   📋 Query: {"collection":"tbl_nfe_100"}
   📦 Body: {"dtIni":"2024-01-01","dtFin":"2024-12-31"}
📊 Agregação Analytics: { collection: 'tbl_nfe_100', periodo: '2024-01-01 a 2024-12-31' }
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
📤 ❌ GET /api/analytics - 500 (5000ms)
   🔍 Erro: operation exceeded time limit
   📋 Tipo: MongoServerError
   🔢 Código: 16389
```

---

### 4. 🔍 Logs de Erros de Consulta

#### Erro de Conectividade em Consulta

```
❌ Erro ao buscar documentos: connection timed out
📋 Detalhes do erro: {
  name: 'MongoNetworkError',
  code: 'ECONNREFUSED',
  codeName: undefined,
  stack: '...'
}
🔌 Erro de Conectividade MongoDB:
   - MongoDB pode estar offline
   - Verifique se o host está acessível
   - Verifique firewall e regras de rede
   - Host configurado: 10.0.0.8
```

#### Erro de Permissão

```
❌ Erro ao buscar documentos: not authorized on C67624577000145 to execute command
📋 Detalhes do erro: {
  name: 'MongoServerError',
  code: 13,
  codeName: 'Unauthorized'
}
🚫 Erro de Permissão MongoDB:
   - Usuário não tem permissão na collection
   - Verifique roles do usuário no MongoDB
```

#### Conexão Fechada Durante Operação

```
❌ Erro ao buscar documentos: Topology is closed
📋 Detalhes do erro: {
  name: 'MongoTopologyClosedError',
  code: undefined
}
💔 Conexão MongoDB foi fechada:
   - Conexão perdida durante a operação
   - MongoDB pode ter reiniciado
   - Verifique logs do MongoDB
```

#### Timeout em Agregação

```
❌ Erro na agregação: operation exceeded time limit
📊 Detalhes do erro analytics: {
  name: 'MongoServerError',
  code: 16389,
  collection: 'tbl_nfe_100',
  pipeline: 'aggregation'
}
⏱️ Timeout na agregação MongoDB:
   - Query muito complexa ou dados grandes
   - Considere adicionar índices
   - Considere limitar período de dados
   - Período solicitado: 2024-01-01 até 2024-12-31
```

#### Erro em Operação de Agrupamento

```
📊 Erro na operação de agrupamento:
   - Verifique se os campos existem
   - Verifique tipos de dados
   - Collection: tbl_nfe_100
```

---

### 5. 🏥 Logs de Health Check

#### Health Check OK

```
✅ Health check: MongoDB OK

GET /api/health → 200
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

#### Health Check com Erro

```
⚠️ Health check: MongoDB não conectado (state: 0)
   Estados possíveis: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting

GET /api/health → 503
{
  "status": "error",
  "timestamp": "2025-12-05T10:30:00.000Z",
  "mongodb": {
    "state": "disconnected",
    "stateCode": 0,
    "host": "10.0.0.8",
    "database": "C67624577000145"
  }
}
```

#### Health Check MongoDB Detalhado

```
🔍 Health check MongoDB detalhado
   Estado: 1 (conectado)
✅ MongoDB health check OK
   Ping: 15ms
   Collections: 14

GET /api/health/mongodb → 200
{
  "status": "ok",
  "database": "C67624577000145",
  "host": "10.0.0.8",
  "ping": "15ms",
  "collections": 14,
  "collectionNames": [
    "tbl_nfe_100",
    "tbl_nfe_200",
    ...
  ]
}
```

---

## 🔍 Como Usar os Logs no Coolify

### 1. Acessar Logs

1. Acesse seu projeto no Coolify
2. Vá em **"Logs"** ou **"Application Logs"**
3. Selecione o container do backend/backoffice
4. Use a busca para filtrar logs específicos

### 2. Filtros Úteis

#### Erros de Conectividade

```
Buscar por: "ERRO DE REDE" ou "MongoNetworkError" ou "ECONNREFUSED"
```

#### Erros de Autenticação

```
Buscar por: "ERRO DE AUTENTICAÇÃO" ou "AuthenticationFailed" ou "code: 18"
```

#### Timeouts

```
Buscar por: "Timeout" ou "exceeded time limit" ou "code: 16389"
```

#### Health Checks

```
Buscar por: "Health check" ou "/api/health"
```

#### Requisições Lentas

```
Buscar por: "ms)" e filtrar por valores altos (ex: >5000ms)
```

#### Erros em Geral

```
Buscar por: "❌" ou "ERRO"
```

### 3. Monitorar em Tempo Real

1. Ative **"Follow logs"** ou **"Live logs"** no Coolify
2. Faça requisições na aplicação
3. Observe logs em tempo real
4. Identifique padrões de erro

---

## 🚨 Alertas e Diagnósticos

### Sinais de Problema

#### 1. Conexões/Desconexões Frequentes

```
🔌 Mongoose desconectado do MongoDB
🔄 Mongoose reconectado ao MongoDB
```

**Causa:** Instabilidade de rede ou MongoDB  
**Ação:** Verificar logs do MongoDB e estabilidade da rede

#### 2. Timeouts Recorrentes

```
⏱️ Timeout na agregação MongoDB
```

**Causa:** Performance ruim, dados grandes ou falta de índices  
**Ação:** Adicionar índices, limitar período de consulta

#### 3. Erros de Autenticação

```
🔐 ERRO DE AUTENTICAÇÃO
```

**Causa:** Credenciais incorretas ou expiradas  
**Ação:** Verificar variáveis de ambiente no Coolify

#### 4. Health Check Falhando

```
❌ Health check: MongoDB ping falhou
```

**Causa:** MongoDB inacessível  
**Ação:** Verificar se MongoDB está rodando e acessível

---

## 📊 Métricas nos Logs

- **Duração de Requisições:** `(1247ms)` - Tempo de execução
- **Status HTTP:** `200`, `500`, `503` - Código de resposta
- **Uptime do Servidor:** `3600` segundos - Tempo online
- **Uso de Memória:** `rss`, `heapUsed` - Consumo de RAM
- **Número de Collections:** `14 encontradas` - Collections disponíveis
- **Estado da Conexão:** `0-3` - ReadyState do Mongoose
  - `0` = disconnected
  - `1` = connected
  - `2` = connecting
  - `3` = disconnecting
- **Ping Time:** `15ms` - Latência do MongoDB

---

## 🎯 Diagnóstico Rápido

### Problema: Aplicação não carrega dados

1. **Verificar Health Check:**
   ```bash
   curl https://seu-dominio.com/api/health
   ```

2. **Verificar Logs no Coolify:**
   - Procurar por "❌ Erro ao buscar documentos"
   - Verificar tipo de erro (rede, auth, permissão)

3. **Verificar Conectividade:**
   - Procurar por "MongoDB conectado com sucesso"
   - Verificar se há desconexões frequentes

### Problema: Performance ruim

1. **Verificar Timeouts:**
   - Procurar por "Timeout na agregação"
   - Verificar duração das requisições (ms)

2. **Verificar Memória:**
   - Health check mostra uso de memória
   - Logs mostram uptime do servidor

### Problema: Erros intermitentes

1. **Verificar Reconexões:**
   - Procurar por "desconectado" e "reconectado"
   - Indica instabilidade de rede

2. **Verificar Logs de Erro:**
   - Procurar por "MongoNetworkError"
   - Verificar timestamps para identificar padrão

---

## 💡 Dicas

1. **Use timestamps** para correlacionar eventos
2. **Monitore health checks** periodicamente
3. **Configure alertas** no Coolify para erros críticos
4. **Salve logs** importantes para análise posterior
5. **Compare logs** do backend com logs do MongoDB

---

**Os logs estão prontos para uso no Coolify! 📊🚀**
