# 🚀 Deploy Completo - Índice de Documentação

## 📚 Documentação Disponível

### 🎯 Guias Rápidos
1. **[DEPLOY_README.md](DEPLOY_README.md)** - Início rápido (1-3 minutos)
2. **[DEPLOY_VISUAL_GUIDE.md](DEPLOY_VISUAL_GUIDE.md)** - Guia visual passo a passo

### 📖 Guias Completos
3. **[DEPLOY_COOLIFY.md](DEPLOY_COOLIFY.md)** - Documentação completa Coolify

### 🔧 Arquivos de Configuração
4. **Dockerfile.fullstack** - Build Frontend + Backend
5. **docker-compose.yml** - Orquestração local
6. **start-fullstack.sh** - Script de inicialização
7. **.env.production.example** - Variáveis de produção
8. **nginx.conf** - Proxy reverso (opcional)

### 🛠️ Scripts Úteis
9. **scripts/validate-deploy.mjs** - Validação pré-deploy
10. **scripts/auto-monitor.mjs** - Monitoramento local

---

## 🎯 Fluxo de Deploy Recomendado

```
1. Desenvolvimento Local
   ├─ npm run dev (frontend)
   ├─ npm run backend (backend)
   └─ Testar funcionalidades

2. Validação
   ├─ npm run validate:deploy
   ├─ npm run build
   └─ npm run docker:test

3. Commit & Push
   ├─ git add .
   ├─ git commit -m "Deploy"
   └─ git push origin main

4. Deploy no Coolify
   ├─ Configurar variáveis
   ├─ Selecionar Dockerfile.fullstack
   └─ Deploy!

5. Verificação
   ├─ Testar frontend
   ├─ Testar backend
   └─ Monitorar logs
```

---

## 📋 Checklist Completo

### Pré-Deploy
- [ ] Código testado localmente
- [ ] `npm run validate:deploy` passou
- [ ] Build funciona (`npm run build`)
- [ ] Docker build funciona (`npm run docker:build`)
- [ ] Variáveis de ambiente preparadas
- [ ] MongoDB acessível
- [ ] Documentação atualizada

### Configuração Coolify
- [ ] Repositório Git conectado
- [ ] Branch configurado (main)
- [ ] Dockerfile selecionado (Dockerfile.fullstack)
- [ ] Portas configuradas (3000, 3000)
- [ ] Variáveis de ambiente adicionadas
- [ ] Domínio configurado
- [ ] SSL habilitado
- [ ] Health check configurado

### Pós-Deploy
- [ ] Frontend carrega (/)
- [ ] Backend responde (/api/health)
- [ ] Dashboard mostra dados
- [ ] Filtros funcionam
- [ ] Grid carrega documentos
- [ ] SSL ativo (HTTPS)
- [ ] Logs sem erros críticos
- [ ] Monitoramento ativo

---

## 🔑 Variáveis de Ambiente Essenciais

```bash
# Essenciais (OBRIGATÓRIAS)
NODE_ENV=production
PORT=3000
BACKOFFICE_PORT=3000
VITE_MONGODB_CONNECTION_STRING=mongodb://...
VITE_API_BASE_URL=https://apinfe.revio.digital
VITE_DB_HOST=10.0.0.8
VITE_DB_DATABASE=C67624577000145

# Importantes (RECOMENDADAS)
VITE_API_BEARER_TOKEN=...
VITE_DB_COLLECTION=tbl_nfe_100
VITE_DEFAULT_PAGE_SIZE=10000

# Opcionais
VITE_S3_ENDPOINT=...
VITE_S3_ACCESS_KEY=...
VITE_DB_SERVER=...
```

---

## 🚀 Comandos Rápidos

### Desenvolvimento
```bash
# Iniciar fullstack local
npm run monitor

# Apenas frontend
npm run dev

# Apenas backend
npm run backend
```

### Validação
```bash
# Validar configuração
npm run validate:deploy

# Build local
npm run build

# Verificar tipos
npm run checktype
```

### Docker
```bash
# Build imagem
npm run docker:build

# Rodar container
npm run docker:run

# Docker Compose
npm run docker:compose

# Parar containers
npm run docker:compose:down

# Teste completo
npm run docker:test
```

### Debug
```bash
# Backend com debug
npm run backend:debug

# Monitoramento automático
npm run monitor

# Liberar portas (Windows)
npm run kill-ports
```

---

## 📊 Arquitetura de Deploy

```
┌─────────────────────────────────────────────────┐
│                  Coolify                        │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │         Docker Container                  │ │
│  │                                           │ │
│  │  ┌──────────────┐  ┌──────────────────┐ │ │
│  │  │   Frontend   │  │     Backend      │ │ │
│  │  │   (Serve)    │  │   (Node.js)      │ │ │
│  │  │   Port 3000  │  │   Port 3000      │ │ │
│  │  └──────────────┘  └──────────────────┘ │ │
│  │                                           │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ┌───────────────────────────────────────────┐ │
│  │         Nginx Proxy                       │ │
│  │  ├─ / → Frontend (3000)                  │ │
│  │  ├─ /api → Backend (3000)                │ │
│  │  └─ SSL/TLS (Let's Encrypt)              │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
└─────────────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   External Services   │
        ├───────────────────────┤
        │  MongoDB (10.0.0.8)   │
        │  SQL Server (10.0.0.4)│
        │  S3/Wasabi            │
        └───────────────────────┘
```

---

## 🔍 Troubleshooting Rápido

### Build Falha
```bash
# Verificar localmente
npm run build

# Ver logs do Docker
docker logs container_name

# Limpar cache
docker system prune -a
```

### Container não inicia
```bash
# Verificar variáveis
docker exec container_name env | grep VITE

# Ver logs
docker logs -f container_name

# Restart
docker restart container_name
```

### Backend não conecta
```bash
# Testar MongoDB
docker exec container_name ping 10.0.0.8

# Ver logs do backend
docker exec container_name tail -f /tmp/backend.log

# Testar endpoint
curl http://localhost:3000/api/health
```

### Frontend não carrega
```bash
# Verificar build
docker exec container_name ls -la /app/dist

# Ver logs do frontend
docker exec container_name tail -f /tmp/frontend.log

# Testar porta
curl http://localhost:3000
```

---

## 📈 Otimizações

### Performance
- ✅ Multi-stage build (reduz tamanho da imagem)
- ✅ Cache de dependências npm
- ✅ Compressão gzip automática
- ✅ Source maps em produção

### Segurança
- ✅ Variáveis sensíveis como secrets
- ✅ SSL/TLS obrigatório
- ✅ Headers de segurança
- ✅ Rate limiting (via Nginx)

### Monitoramento
- ✅ Health check automático
- ✅ Logs estruturados
- ✅ Métricas de CPU/Memory
- ✅ Alertas de erro

---

## 🆘 Suporte

### Problemas Comuns
1. **Variáveis não configuradas** → Verifique `.env` e Coolify
2. **MongoDB inacessível** → Verifique rede/firewall
3. **Build falha** → Verifique logs e dependências
4. **SSL não funciona** → Aguarde Let's Encrypt (pode levar 5min)

### Recursos
- [Coolify Docs](https://coolify.io/docs)
- [Docker Docs](https://docs.docker.com)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides)

### Contato
- Issues: GitHub Issues
- Docs: Este repositório
- Logs: Coolify Dashboard

---

## ✅ Status do Deploy

### Desenvolvimento
- ✅ Frontend funcionando
- ✅ Backend funcionando
- ✅ MongoDB conectado
- ✅ Testes passando

### Staging
- ✅ Build Docker funciona
- ✅ Docker Compose funciona
- ✅ Validação passa
- ✅ Health check OK

### Produção
- ⏳ Aguardando deploy
- ⏳ SSL pendente
- ⏳ Monitoramento pendente
- ⏳ Backup pendente

---

## 🎓 Próximos Passos

1. **Agora**: Leia [DEPLOY_README.md](DEPLOY_README.md)
2. **Depois**: Configure Coolify seguindo [DEPLOY_COOLIFY.md](DEPLOY_COOLIFY.md)
3. **Por fim**: Use [DEPLOY_VISUAL_GUIDE.md](DEPLOY_VISUAL_GUIDE.md) como referência

---

**Boa sorte com o deploy! 🚀**

**Dúvidas?** Consulte a documentação ou abra uma issue.
