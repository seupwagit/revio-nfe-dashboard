# 🚀 Guia de Deploy - Coolify

## Configuração da Aplicação

### Porta
A aplicação está configurada para rodar na **porta 3000** (padrão do Coolify).

### Variáveis de Ambiente Obrigatórias

Configure as seguintes variáveis no Coolify:

```bash
# MongoDB
VITE_MONGODB_CONNECTION_STRING=mongodb://usuario:senha@host:27017/?authMechanism=SCRAM-SHA-256&authSource=admin&directConnection=true
VITE_DB_DATABASE=nome_database
VITE_DB_COLLECTION=tbl_nfe_100

# Configurações
VITE_MAX_DATE_RANGE_DAYS=365
VITE_DEFAULT_DATE_RANGE_DAYS=30
VITE_CACHE_DURATION_MINUTES=90
VITE_DEFAULT_PAGE_SIZE=5000

# Google Gemini (Busca Natural)
VITE_API_GOOGLE_GEMINI=sua_chave_api

# Porta
PORT=3000
VITE_PORT=3000
```

## Deploy no Coolify

### Opção 1: Docker (Recomendado)

1. **Conecte seu repositório Git** no Coolify
2. **Configure as variáveis de ambiente** acima
3. **Build Command**: `npm run build`
4. **Start Command**: `npm run start`
5. **Port**: `3000`

O Dockerfile já está configurado e otimizado.

### Opção 2: Node.js Direto

1. **Build Command**: 
   ```bash
   npm ci && npm run build
   ```

2. **Start Command**:
   ```bash
   npm run start
   ```

3. **Port**: `3000`

## Verificação Pós-Deploy

Após o deploy, verifique:

1. ✅ Aplicação acessível na porta 3000
2. ✅ Conexão MongoDB funcionando
3. ✅ Console do navegador sem erros
4. ✅ Dashboard carregando dados

## Troubleshooting

### Erro de Conexão MongoDB

Verifique:
- String de conexão está correta
- MongoDB está acessível da rede do Coolify
- Credenciais estão corretas
- Firewall permite conexão

### Aplicação não inicia

Verifique:
- Todas variáveis de ambiente estão configuradas
- Build foi executado com sucesso
- Porta 3000 está disponível

### Dados não carregam

Verifique:
- Console do navegador (F12)
- Variáveis VITE_DB_DATABASE e VITE_DB_COLLECTION
- Permissões de leitura no MongoDB

## Monitoramento

Use o MCP chrome-devtools para monitorar:
```javascript
// No console do navegador
window.debugMongoCache() // Ver status do cache
```

## Performance

- Cache: 90 minutos
- Paginação: 5000 registros por página
- Timeout queries: 45 segundos
- Conexão: Pool de 2-10 conexões

## Segurança

⚠️ **IMPORTANTE**: 
- Sistema opera em modo **READ-ONLY**
- Nunca executa DELETE, UPDATE ou INSERT
- Apenas consultas de leitura são permitidas
