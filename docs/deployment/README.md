# Guias de Deploy

## Opções de Deploy

### 🚀 Fullstack (Recomendado)
Frontend e backend juntos, uma porta só.

**Quando usar:**
- Deploy simples no Coolify
- Não precisa escalar separadamente
- Quer evitar problemas de CORS

**Guias:**
- [Quickstart Fullstack](./QUICKSTART_FULLSTACK.md) - Guia rápido
- [Deploy Fullstack Completo](./FULLSTACK_DEPLOY.md) - Documentação detalhada

**Dockerfile:**
- `Dockerfile.fullstack.optimized` - Versão otimizada (recomendado)
- `Dockerfile.fullstack` - Versão com script separado

---

### 🔀 Separado
Frontend e backend em containers diferentes.

**Quando usar:**
- Precisa escalar frontend e backend separadamente
- Quer isolamento total entre serviços
- Tem requisitos específicos de infraestrutura

**Guias:**
- [Deploy Separado](./SEPARATE_DEPLOY.md) - Em desenvolvimento

**Dockerfiles:**
- `Dockerfile` - Frontend apenas
- Backend usa `tsx` diretamente

---

## Comparação Rápida

| Característica | Fullstack | Separado |
|----------------|-----------|----------|
| **Portas** | 1 (3000) | 2 (3000 + 3000) |
| **CORS** | ✅ Não precisa | ❌ Precisa configurar |
| **Complexidade** | ✅ Baixa | ⚠️ Média |
| **Recursos** | ✅ Menos | ❌ Mais |
| **Escalabilidade** | ⚠️ Juntos | ✅ Independente |
| **Deploy** | ✅ Mais rápido | ⚠️ Mais lento |
| **Manutenção** | ✅ Mais fácil | ⚠️ Mais complexa |

---

## Arquivos de Deploy

### Dockerfiles
```
Dockerfile.fullstack.optimized  ← Use este (recomendado)
Dockerfile.fullstack            ← Versão alternativa
Dockerfile                      ← Frontend apenas
```

### Scripts
```
start-fullstack-simple.sh       ← Script simplificado
start-fullstack.sh              ← Script com logs detalhados
```

### Configurações
```
.env.production.example         ← Template de variáveis
nginx.conf                      ← Nginx (se necessário)
docker-compose.yml              ← Docker Compose local
```

---

## Início Rápido

### Para Coolify (Fullstack)

1. **Criar serviço Docker no Coolify**

2. **Configurar Dockerfile:**
   ```
   Dockerfile.fullstack.optimized
   ```

3. **Adicionar Build Arguments:**
   ```bash
   VITE_API_BASE_URL=https://seu-dominio.com
   VITE_MONGODB_CONNECTION_STRING=mongodb://...
   VITE_DB_HOST=mongodb-host
   VITE_DB_DATABASE=nfe
   VITE_MONGODB_PROXY_PORT=
   # ... outras variáveis
   ```

4. **Adicionar Environment Variables:**
   ```bash
   VITE_MONGODB_CONNECTION_STRING=mongodb://...
   NODE_ENV=production
   SERVE_FRONTEND=true
   ```

5. **Configurar porta:**
   ```
   Container: 3000
   Public: 80
   ```

6. **Deploy!**

### Para desenvolvimento local

```bash
# Build
npm run build:prod

# Rodar fullstack
SERVE_FRONTEND=true npm run server

# Acessar
open http://localhost:3000
```

---

## Troubleshooting

### Problemas Comuns

1. **Página em branco**
   - Verificar se `SERVE_FRONTEND=true`
   - Verificar se `dist/` foi copiado

2. **API não responde**
   - Testar: `curl http://localhost:3000/api/health`
   - Verificar logs do container

3. **MongoDB não conecta**
   - Verificar: `curl http://localhost:3000/api/debug/env`
   - Verificar connection string
   - Verificar se MongoDB está acessível

### Endpoints de Debug

```bash
# Health check
GET /api/health

# Variáveis de ambiente
GET /api/debug/env

# MongoDB health
GET /api/health/mongodb
```

---

## Estrutura de Diretórios

```
.
├── Dockerfile.fullstack.optimized    # Dockerfile recomendado
├── src/
│   ├── server/                       # Backend (Node.js + Express)
│   │   ├── index.ts                  # Servidor principal
│   │   ├── routes/                   # Rotas da API
│   │   └── database/                 # Conexões DB
│   └── ...                           # Frontend (React)
├── dist/                             # Build do frontend (gerado)
└── docs/
    └── deployment/                   # Esta documentação
        ├── README.md                 # Este arquivo
        ├── QUICKSTART_FULLSTACK.md  # Guia rápido
        └── FULLSTACK_DEPLOY.md      # Guia completo
```

---

## Próximos Passos

1. ✅ Escolher tipo de deploy (Fullstack recomendado)
2. ✅ Seguir guia apropriado
3. ✅ Configurar variáveis de ambiente
4. ✅ Fazer deploy
5. ✅ Verificar health checks
6. ✅ Configurar domínio e SSL
7. ✅ Configurar backup
8. ✅ Configurar monitoramento

---

## Suporte

- [Troubleshooting TypeScript](../troubleshooting/TYPESCRIPT_BUILD_FIXES_DEC2024.md)
- [Validação de API](../troubleshooting/API_RESPONSE_VALIDATION_FIX.md)
- [Configuração Coolify](./COOLIFY_DEPLOY.md)

---

## Changelog

- **2024-12-06**: Criado deploy fullstack otimizado
- **2024-12-06**: Corrigidos erros TypeScript no build
- **2024-12-06**: Adicionada validação de resposta da API
