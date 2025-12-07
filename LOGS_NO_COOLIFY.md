# 📋 Como Ver Logs no Coolify

## Prefixos de Logs

Todos os logs agora têm prefixos para facilitar a busca:

| Prefixo | Descrição | Exemplo |
|---------|-----------|---------|
| `[MONGODB]` | Conexão e operações MongoDB | `[MONGODB] ✅ MongoDB conectado` |
| `[API]` | Requisições HTTP | `[API] 📥 GET /api/documents` |
| `[DOCUMENTS]` | Rota de documentos | `[DOCUMENTS] 📄 Buscando documentos` |
| `[ANALYTICS]` | Rota de analytics | `[ANALYTICS] 📊 Agregação` |

## Como Buscar Logs no Coolify

### 1. Acessar Logs do Container

1. Abra o Coolify
2. Vá para seu serviço
3. Clique em "Logs"
4. Use a busca (Ctrl+F)

### 2. Buscar por Prefixo

```
# Ver logs de MongoDB
Buscar: [MONGODB]

# Ver logs de API
Buscar: [API]

# Ver erros
Buscar: ❌

# Ver sucessos
Buscar: ✅
```

### 3. Logs Importantes

#### Conexão MongoDB
```
[MONGODB] 📊 Conectando ao MongoDB (Mongoose)...
[MONGODB] ✅ MongoDB conectado com sucesso!
[MONGODB]    Collections: 14 encontradas
```

#### Requisições API
```
[API] 📥 2024-12-06T... GET /api/documents
[API]    📋 Query: {"collection":"tbl_nfe_100","page":"1","size":"100"}
[API] 📤 ✅ GET /api/documents - 200 (1234ms)
```

#### Busca de Documentos
```
[DOCUMENTS] 📄 Buscando documentos: {...}
[DOCUMENTS] ✅ 100 documentos retornados em 1234ms
```

#### Erros
```
[MONGODB] ❌ ERRO CRÍTICO: Falha ao conectar MongoDB
[API] ❌ 🔍 Erro: MongoDB não conectado
[DOCUMENTS] ❌ Erro ao buscar documentos: ...
```

## Comandos de Busca no Coolify

### Ver Logs em Tempo Real
No Coolify, os logs são atualizados automaticamente.

### Filtrar por Tipo

```bash
# MongoDB
[MONGODB]

# API
[API]

# Erros
❌

# Sucessos
✅

# Warnings
⚠️
```

## Logs Esperados no Startup

Quando o container inicia, você deve ver:

```
[MONGODB] 📊 Conectando ao MongoDB (Mongoose)...
[MONGODB]    Timestamp: 2024-12-06T...
[MONGODB]    URI: mongodb://***:***@host:27017/...
[MONGODB]    Database: seu-database
[MONGODB]    Host: seu-host
[MONGODB] 🔌 Tentando estabelecer conexão...
[MONGODB] ✅ MongoDB conectado com sucesso!
[MONGODB]    Status: Conectado
[MONGODB]    Tempo de conexão: XXms
[MONGODB]    ReadyState: 1
[MONGODB]    Collections: 14 encontradas
[MONGODB]      - tbl_nfe_100
[MONGODB]      - tbl_cfe_100
[MONGODB]      - tbl_cte_100
[MONGODB]      - ...

✅ Backoffice Server rodando!
   URL: http://localhost:3000
   Health: http://localhost:3000/api/health
```

## Logs Esperados em Requisição

Quando alguém acessa a aplicação:

```
[API] 📥 2024-12-06T... GET /api/health
[API] 📤 ✅ GET /api/health - 200 (5ms)

[API] 📥 2024-12-06T... GET /api/documents
[API]    📋 Query: {"collection":"tbl_nfe_100","dtIni":"2024-01-01","dtFim":"2024-12-31","page":"1","size":"100"}
[DOCUMENTS] 📄 Buscando documentos: {...}
[DOCUMENTS] ✅ 100 documentos retornados em 1234ms
[API] 📤 ✅ GET /api/documents - 200 (1234ms)
```

## Diagnóstico de Problemas

### MongoDB Não Conecta

Buscar por:
```
[MONGODB] ❌
```

Logs esperados:
```
[MONGODB] ❌ ERRO CRÍTICO: Falha ao conectar MongoDB
[MONGODB] 📋 Detalhes do erro de conexão: {...}
[MONGODB] 🔌 ERRO DE REDE:
[MONGODB]    ❌ MongoDB não está acessível
```

### API Retorna 500

Buscar por:
```
[API] ❌
```

Logs esperados:
```
[API] 📥 GET /api/documents
[API] 📤 ❌ GET /api/documents - 500 (10ms)
[API] ❌ 🔍 Erro: MongoDB não conectado
```

### Documentos Não Retornam

Buscar por:
```
[DOCUMENTS]
```

Logs esperados:
```
[DOCUMENTS] 📄 Buscando documentos: {...}
[DOCUMENTS] ✅ 0 documentos retornados em 100ms
```

Se retornar 0 documentos:
- Verificar filtros de data
- Verificar se collection tem dados
- Verificar se MongoDB está conectado

## Exportar Logs do Coolify

### Opção 1: Copiar do Browser
1. Abrir logs no Coolify
2. Selecionar tudo (Ctrl+A)
3. Copiar (Ctrl+C)
4. Colar em arquivo de texto

### Opção 2: API do Coolify
```bash
# Se Coolify tiver API
curl https://coolify.com/api/logs/<service-id>
```

### Opção 3: Docker Logs
```bash
# Se tiver acesso SSH ao servidor
docker logs <container-id> > logs.txt
```

## Análise de Performance

### Tempo de Resposta

Buscar por:
```
[API] 📤
```

Exemplo:
```
[API] 📤 ✅ GET /api/documents - 200 (1234ms)
                                        ^^^^
                                        Tempo em ms
```

Se tempo > 5000ms:
- Query muito pesada
- MongoDB lento
- Muitos dados retornados

### Tempo de Conexão MongoDB

Buscar por:
```
[MONGODB]    Tempo de conexão:
```

Exemplo:
```
[MONGODB]    Tempo de conexão: 75ms
```

Se tempo > 1000ms:
- Rede lenta
- MongoDB distante
- Firewall bloqueando

## Troubleshooting por Logs

### Cenário 1: Container Não Inicia

Buscar por:
```
❌
```

Possíveis causas:
- Variáveis de ambiente faltando
- MongoDB não acessível
- Porta em uso

### Cenário 2: API Retorna 500

Buscar por:
```
[API] ❌
[DOCUMENTS] ❌
```

Possíveis causas:
- MongoDB desconectado
- Collection não existe
- Erro na query

### Cenário 3: Sem Dados

Buscar por:
```
[DOCUMENTS] ✅ 0 documentos
```

Possíveis causas:
- Filtros muito restritivos
- Collection vazia
- Período sem dados

## Comandos Úteis

### Ver Últimas 100 Linhas
No Coolify, use o scroll ou busque por timestamp recente.

### Ver Erros Apenas
Buscar: `❌`

### Ver Sucessos Apenas
Buscar: `✅`

### Ver MongoDB Apenas
Buscar: `[MONGODB]`

### Ver API Apenas
Buscar: `[API]`

## Exemplo de Log Completo

```
[MONGODB] 📊 Conectando ao MongoDB (Mongoose)...
[MONGODB]    Timestamp: 2024-12-06T12:00:00.000Z
[MONGODB]    URI: mongodb://***:***@10.0.0.8:27017/...
[MONGODB]    Database: C67624577000145
[MONGODB]    Host: 10.0.0.8
[MONGODB] 🔌 Tentando estabelecer conexão...
[MONGODB] ✅ MongoDB conectado com sucesso!
[MONGODB]    Status: Conectado
[MONGODB]    Tempo de conexão: 75ms
[MONGODB]    ReadyState: 1
[MONGODB]    Collections: 14 encontradas
[MONGODB]      - tbl_nfe_100
[MONGODB]      - tbl_cfe_100
[MONGODB]      - tbl_cte_100

✅ Backoffice Server rodando!
   URL: http://localhost:3000

[API] 📥 2024-12-06T12:00:05.000Z GET /api/health
[API] 📤 ✅ GET /api/health - 200 (5ms)

[API] 📥 2024-12-06T12:00:10.000Z GET /api/documents
[API]    📋 Query: {"collection":"tbl_nfe_100","page":"1","size":"100"}
[DOCUMENTS] 📄 Buscando documentos: {collection: "tbl_nfe_100", ...}
[DOCUMENTS] ✅ 100 documentos retornados em 1234ms
[API] 📤 ✅ GET /api/documents - 200 (1234ms)
```

## Resumo

✅ **Logs com prefixos** para facilitar busca
✅ **Emojis** para identificar rapidamente
✅ **Timestamps** em todas as operações
✅ **Detalhes** de erros e sucessos

**Busque por**:
- `[MONGODB]` - Logs de MongoDB
- `[API]` - Logs de requisições
- `[DOCUMENTS]` - Logs de documentos
- `❌` - Erros
- `✅` - Sucessos
