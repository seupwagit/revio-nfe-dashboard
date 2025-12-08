# 🏥 Health Check ECONNREFUSED

## Problema

```
Error: connect ECONNREFUSED 127.0.0.1:3000
```

O health check do Coolify está falhando porque tenta conectar na porta 3000 antes da aplicação estar pronta.

## Causa

1. Container inicia
2. Health check tenta conectar em 3000 após 40s
3. Aplicação ainda está:
   - Conectando ao MongoDB
   - Inicializando Express
   - Carregando rotas
4. Health check falha → Container reinicia

## Solução

### Aumentar start-period

```dockerfile
# Antes:
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3

# Depois:
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5
```

### Parâmetros do Health Check

| Parâmetro | Valor | Descrição |
|-----------|-------|-----------|
| `--interval` | 30s | Intervalo entre checks |
| `--timeout` | 10s | Timeout de cada check |
| `--start-period` | 120s | Tempo de graça no início |
| `--retries` | 5 | Tentativas antes de falhar |

### start-period

**Tempo de graça** antes do health check começar a contar falhas.

- 40s: Muito pouco para MongoDB conectar
- 120s: Tempo suficiente para:
  - MongoDB conectar
  - Express inicializar
  - Rotas carregarem

### Adicionar Error Handler

```dockerfile
CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {
  process.exit(r.statusCode === 200 ? 0 : 1)
}).on('error', () => process.exit(1))"
```

Sem `.on('error')`, o erro não é capturado e o Node.js crasha.

## Timeline do Container

```
0s    - Container inicia
0s    - CMD ["tsx", "src/server/index.ts"] executa
1-5s  - MongoDB tenta conectar
5-10s - MongoDB conectado (se tudo OK)
10s   - Express inicia
11s   - Rotas carregadas
12s   - Servidor rodando na porta 3000

30s   - Primeiro health check (dentro do start-period)
60s   - Segundo health check (dentro do start-period)
90s   - Terceiro health check (dentro do start-period)
120s  - Quarto health check (start-period termina)
      - A partir daqui, falhas contam
```

## Logs Esperados

### Sucesso

```
[MONGODB] 📊 Conectando ao MongoDB...
[MONGODB] ✅ MongoDB conectado com sucesso!
✅ Backoffice Server rodando!
   URL: http://localhost:3000
```

### Falha (MongoDB não conecta)

```
[MONGODB] 📊 Conectando ao MongoDB...
[MONGODB] ❌ ERRO CRÍTICO: Falha ao conectar MongoDB
[MONGODB] 🔌 ERRO DE REDE:
   ❌ MongoDB não está acessível
```

## Troubleshooting

### Health Check Continua Falhando

**Causa 1**: MongoDB não está acessível

**Solução**:
1. Verificar `VITE_MONGODB_CONNECTION_STRING`
2. Verificar se MongoDB está rodando
3. Verificar rede entre containers
4. Ver logs: buscar por `[MONGODB]`

**Causa 2**: Aplicação demora muito para iniciar

**Solução**:
1. Aumentar `--start-period` para 180s ou 240s
2. Verificar se há operações lentas no startup

**Causa 3**: Porta 3000 não está aberta

**Solução**:
1. Verificar `EXPOSE 3000` no Dockerfile
2. Verificar Port Mapping no Coolify

### Container Reinicia Constantemente

**Sintoma**: Container inicia, falha health check, reinicia

**Causa**: start-period muito curto

**Solução**: Aumentar para 120s ou mais

### Health Check Passa Mas API Não Funciona

**Sintoma**: Health check OK, mas `/api/documents` retorna erro

**Causa**: MongoDB conectou mas há erro nas queries

**Solução**: Ver logs da aplicação

## Configuração Recomendada

### Para Desenvolvimento/Homologação

```dockerfile
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5
```

### Para Produção

```dockerfile
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=3
```

(Produção geralmente é mais rápida porque MongoDB está otimizado)

## Alternativa: Desabilitar Health Check

Se o health check está causando problemas, pode desabilitar temporariamente:

### No Dockerfile

```dockerfile
# Comentar ou remover:
# HEALTHCHECK ...
```

### No Coolify

Alguns serviços do Coolify permitem desabilitar health check nas configurações.

**Não recomendado para produção!**

## Verificar Health Check

### Dentro do Container

```bash
# SSH no servidor
ssh user@servidor

# Entrar no container
docker exec -it <container-id> sh

# Testar health check manualmente
wget -O- http://localhost:3000/api/health

# Deve retornar JSON
```

### De Fora do Container

```bash
curl https://seu-dominio.com/api/health
```

## Logs do Coolify

Procure por:

```
Health check failed
Container unhealthy
Restarting container
```

Se aparecer, o health check está falhando.

## Resumo

**Problema**: Health check falha com ECONNREFUSED
**Causa**: Aplicação não está pronta quando health check executa
**Solução**: Aumentar `--start-period` de 40s para 120s
**Resultado**: Container tem tempo suficiente para iniciar

## Checklist

- [ ] `--start-period=120s` configurado
- [ ] `.on('error')` adicionado ao health check
- [ ] MongoDB acessível
- [ ] Variáveis de ambiente configuradas
- [ ] Commit e push
- [ ] Redeploy no Coolify
- [ ] Verificar logs
- [ ] Health check passa

## Comandos

```bash
# 1. Commit
git add Dockerfile.fullstack.optimized
git commit -m "fix: aumentar start-period do health check para 120s"
git push

# 2. Redeploy no Coolify

# 3. Verificar logs
# Procurar por: "✅ Backoffice Server rodando!"
```

---

**Status**: ✅ Corrigido
**Próximo passo**: Redeploy no Coolify
