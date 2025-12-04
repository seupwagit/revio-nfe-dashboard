# 🔌 MongoDB - Conexão Direta

## ❌ Problema Atual

O MongoDB em `10.0.0.8:27017` **não está acessível** para conexões externas.

```
❌ Erro: connect ECONNREFUSED 10.0.0.8:27017
```

## 🎯 O Que Foi Implementado

Criei um **MongoDB Proxy** que conecta diretamente ao MongoDB e expõe endpoints REST para o frontend:

### Arquivos Criados
1. **server/mongodb-proxy.cjs** - Servidor proxy MongoDB
2. **package.json** - Script `npm run mongodb-proxy`
3. **.env** - Variável `VITE_MONGODB_PROXY_PORT=3001`

### Telas Atualizadas
- ✅ **Analytics MongoDB** - Configurada para usar o proxy (porta 3001)
- ⏸️ **Analytics API** - Desativada no menu (comentada)
- ⏸️ **Analytics API Agregado** - Desativada no menu (comentada)

## 🔧 Como Resolver o Problema

### Opção 1: Liberar Firewall no Servidor MongoDB

No servidor `10.0.0.8`, execute:

```bash
# Liberar porta 27017
sudo ufw allow 27017

# Ou para IP específico
sudo ufw allow from SEU_IP to any port 27017
```

### Opção 2: Configurar MongoDB para Aceitar Conexões Externas

Edite `/etc/mongod.conf`:

```yaml
net:
  bindIp: 0.0.0.0  # Aceitar de qualquer IP
  port: 27017
```

Reinicie o MongoDB:

```bash
sudo systemctl restart mongod
```

### Opção 3: Usar VPN

Se o MongoDB está em rede privada, conecte-se à VPN primeiro.

### Opção 4: Usar MongoDB Local

Se você tem MongoDB instalado localmente:

```env
# .env
VITE_MONGODB_CONNECTION_STRING=mongodb://localhost:27017
VITE_DB_DATABASE=seu_database
```

### Opção 5: Usar MongoDB Atlas (Cloud)

Crie um cluster gratuito em [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) e use a connection string:

```env
VITE_MONGODB_CONNECTION_STRING=mongodb+srv://user:pass@cluster.mongodb.net/
```

## 🚀 Quando o MongoDB Estiver Acessível

### 1. Iniciar o MongoDB Proxy

```bash
npm run mongodb-proxy
```

Você verá:
```
✅ Conectado ao MongoDB
📊 Database: C67624577000145
🚀 MongoDB Proxy rodando na porta 3001
   Health: http://localhost:3001/health
```

### 2. Verificar Conexão

```bash
curl http://localhost:3001/health
```

Deve retornar:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "database": "C67624577000145",
  "mode": "DIRECT_CONNECTION"
}
```

### 3. Acessar Analytics MongoDB

```
http://localhost:3000/analytics
```

## 📊 Endpoints Disponíveis

O MongoDB Proxy expõe:

### 1. Analytics (Agregações)
```
POST http://localhost:3001/api/aggregate/analytics
Body: {
  "collection": "tbl_nfe_100",
  "dtIni": "2024-01-01",
  "dtFin": "2024-12-31"
}
```

### 2. Documentos (Grid)
```
GET http://localhost:3001/api/documents?collection=tbl_nfe_100&dtIni=2024-01-01&dtFin=2024-12-31&page=1&size=100
```

### 3. Contador (Dashboard)
```
GET http://localhost:3001/api/count?collection=tbl_nfe_100&dtIni=2024-01-01&dtFin=2024-12-31
```

## 🎯 Próximos Passos

### Quando MongoDB Funcionar

1. ✅ **Analytics MongoDB** - Já configurado
2. 🔄 **Grid Notas Fiscais** - Atualizar para usar proxy
3. 🔄 **Dashboard** - Atualizar para usar proxy

### Telas Desativadas (Podem ser Removidas Depois)

- Analytics API (`/analytics-api`)
- Analytics API Agregado (`/analytics-api-agregado`)

## 🔍 Diagnóstico

### Verificar se MongoDB está acessível

```bash
# Ping
ping 10.0.0.8

# Telnet (porta 27017)
telnet 10.0.0.8 27017

# Mongosh
mongosh "mongodb://revio:zaqwsx2001@10.0.0.8:27017"
```

### Logs do MongoDB

```bash
# No servidor MongoDB
sudo tail -f /var/log/mongodb/mongod.log
```

## 📝 Resumo

| Item | Status |
|------|--------|
| MongoDB Proxy | ✅ Criado |
| Analytics MongoDB | ✅ Configurado |
| Telas API | ⏸️ Desativadas |
| MongoDB Acessível | ❌ **PRECISA RESOLVER** |

## 💡 Solução Temporária

Enquanto o MongoDB não estiver acessível, você pode:

1. Descomentar as telas API no Layout.tsx
2. Usar `/analytics-api-agregado` temporariamente
3. Resolver o acesso ao MongoDB
4. Voltar para `/analytics` (MongoDB direto)

---

**Próximo Passo**: Resolver acesso ao MongoDB em 10.0.0.8:27017
