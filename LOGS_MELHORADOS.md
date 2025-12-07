# ✅ Logs Melhorados para Coolify

## O que foi feito?

Adicionei **prefixos** em todos os logs para facilitar a busca no Coolify.

## Prefixos Adicionados

| Prefixo | Onde | Exemplo |
|---------|------|---------|
| `[MONGODB]` | Conexão MongoDB | `[MONGODB] ✅ MongoDB conectado` |
| `[API]` | Requisições HTTP | `[API] 📥 GET /api/documents` |
| `[DOCUMENTS]` | Rota documentos | `[DOCUMENTS] 📄 Buscando documentos` |
| `[ANALYTICS]` | Rota analytics | `[ANALYTICS] 📊 Agregação` |

## Como Usar no Coolify

### 1. Abrir Logs
1. Coolify → Seu Serviço → Logs

### 2. Buscar (Ctrl+F)

```
# Ver logs de MongoDB
[MONGODB]

# Ver logs de API
[API]

# Ver erros
❌

# Ver sucessos
✅
```

## Exemplos de Logs

### Startup
```
[MONGODB] 📊 Conectando ao MongoDB (Mongoose)...
[MONGODB] ✅ MongoDB conectado com sucesso!
[MONGODB]    Collections: 14 encontradas
```

### Requisição
```
[API] 📥 GET /api/documents
[API]    📋 Query: {"collection":"tbl_nfe_100"}
[DOCUMENTS] 📄 Buscando documentos
[DOCUMENTS] ✅ 100 documentos retornados em 1234ms
[API] 📤 ✅ GET /api/documents - 200 (1234ms)
```

### Erro
```
[MONGODB] ❌ ERRO CRÍTICO: Falha ao conectar MongoDB
[API] ❌ 🔍 Erro: MongoDB não conectado
```

## Arquivos Modificados

- ✅ `src/server/index.ts` - Logs de API com `[API]`
- ✅ `src/server/database/mongodb.ts` - Logs com `[MONGODB]`
- ✅ `src/server/routes/documents.ts` - Logs com `[DOCUMENTS]`

## Próximos Passos

1. ✅ Fazer rebuild: `npm run build:prod`
2. ✅ Deploy no Coolify
3. ✅ Abrir logs no Coolify
4. ✅ Buscar por `[MONGODB]` para ver conexão
5. ✅ Buscar por `[API]` para ver requisições
6. ✅ Buscar por `❌` para ver erros

## Documentação

Ver: `LOGS_NO_COOLIFY.md` para guia completo de como usar os logs.

## Benefícios

✅ **Fácil de buscar** - Use Ctrl+F com prefixos
✅ **Organizado** - Cada componente tem seu prefixo
✅ **Visual** - Emojis facilitam identificação
✅ **Detalhado** - Timestamps e informações completas

## Comandos de Busca Rápida

```
[MONGODB]     # Ver MongoDB
[API]         # Ver requisições
[DOCUMENTS]   # Ver documentos
❌            # Ver erros
✅            # Ver sucessos
📊            # Ver estatísticas
🔌            # Ver conexões
```

## Exemplo Completo

```
[MONGODB] 📊 Conectando ao MongoDB (Mongoose)...
[MONGODB]    Timestamp: 2024-12-06T12:00:00.000Z
[MONGODB]    URI: mongodb://***:***@host:27017/db
[MONGODB]    Database: seu-database
[MONGODB]    Host: seu-host
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
[DOCUMENTS] 📄 Buscando documentos: {collection: "tbl_nfe_100"}
[DOCUMENTS] ✅ 100 documentos retornados em 1234ms
[API] 📤 ✅ GET /api/documents - 200 (1234ms)
```

## Troubleshooting

### Não vejo logs no Coolify

1. Verificar se container está rodando
2. Verificar se logs estão habilitados
3. Tentar recarregar página de logs

### Logs muito rápidos

Use a busca (Ctrl+F) para filtrar por prefixo.

### Quero ver apenas erros

Buscar por: `❌`

### Quero ver apenas MongoDB

Buscar por: `[MONGODB]`

## Resumo

🎉 **Logs agora são fáceis de encontrar no Coolify!**

Use os prefixos `[MONGODB]`, `[API]`, `[DOCUMENTS]` para buscar logs específicos.

Ver guia completo em: `LOGS_NO_COOLIFY.md`
