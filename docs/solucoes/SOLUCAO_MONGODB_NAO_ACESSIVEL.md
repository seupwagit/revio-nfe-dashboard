# ⚠️ MongoDB Não Acessível - Solução Alternativa

## 🔍 Problema Identificado

O servidor MongoDB em `10.0.0.8:27017` não está aceitando conexões externas.

### Erro Encontrado
```
❌ Erro ao conectar MongoDB: connect ECONNREFUSED 10.0.0.8:27017
```

### Diagnóstico
- ✅ Servidor responde ao ping (10.0.0.8)
- ❌ Porta 27017 não aceita conexões
- ❌ Possíveis causas:
  - Firewall bloqueando a porta
  - MongoDB configurado para aceitar apenas conexões locais
  - Necessita VPN para acessar
  - Credenciais incorretas

## 🎯 Solução Alternativa (Funciona Agora!)

Use a tela **Analytics API Agregado** que já está funcionando:

### URL
```
http://localhost:5173/analytics-api-agregado
```

### Características
- ✅ **Funciona sem servidor MongoDB separado**
- ✅ Usa a API REST que já está funcionando
- ✅ Agrega dados localmente no navegador
- ⚡ Performance boa (10-20 segundos para 90 dias)
- 📊 Mesmos gráficos e KPIs
- 🔍 Mesmos filtros

## 📊 Comparação de Telas

| Tela | Precisa Servidor? | MongoDB Direto? | Velocidade | Status |
|------|-------------------|-----------------|------------|--------|
| **Analytics MongoDB** | ✅ SIM | ✅ SIM | ⚡⚡⚡ Muito Rápido | ❌ Não funciona |
| **Analytics API Agregado** | ❌ NÃO | ❌ NÃO | ⚡⚡ Rápido | ✅ **FUNCIONA** |
| Analytics API | ❌ NÃO | ❌ NÃO | 🐌 Lento | ✅ Funciona |

## 🚀 Como Usar (Solução Que Funciona)

### Passo 1: Acessar a Tela
```
http://localhost:5173/analytics-api-agregado
```

### Passo 2: Selecionar Filtros
- Período: 30 dias, 60 dias, 90 dias, etc.
- Tipo de documento: NF-e, CF-e, CT-e
- Datas personalizadas

### Passo 3: Ver os Gráficos
- Faturamento diário
- Evolução mensal
- Top 10 emitentes
- Distribuição por tipo
- Status das notas

## 🔧 Para Resolver o Problema do MongoDB

Se você quiser usar a tela Analytics MongoDB (mais rápida), precisa:

### Opção 1: Configurar Firewall
Liberar a porta 27017 no servidor MongoDB:
```bash
# No servidor MongoDB (10.0.0.8)
sudo ufw allow 27017
```

### Opção 2: Configurar MongoDB para Aceitar Conexões Externas
Editar `/etc/mongod.conf`:
```yaml
net:
  bindIp: 0.0.0.0  # Aceitar de qualquer IP
  port: 27017
```

Reiniciar MongoDB:
```bash
sudo systemctl restart mongod
```

### Opção 3: Usar VPN
Se o MongoDB está em uma rede privada, conecte-se à VPN primeiro.

### Opção 4: Usar MongoDB Local
Se você tem MongoDB instalado localmente:
```env
VITE_MONGODB_CONNECTION_STRING=mongodb://localhost:27017
```

## 📝 Resumo

### ❌ Não Funciona Agora
- Analytics MongoDB (`/analytics`)
- Motivo: MongoDB em 10.0.0.8:27017 não aceita conexões

### ✅ Funciona Agora
- **Analytics API Agregado** (`/analytics-api-agregado`) ⭐ **RECOMENDADO**
- Analytics API (`/analytics-api`)

## 🎯 Recomendação

**Use a tela Analytics API Agregado** enquanto o problema do MongoDB não é resolvido:

```
http://localhost:5173/analytics-api-agregado
```

Ela oferece:
- ✅ Mesma funcionalidade
- ✅ Mesmos gráficos
- ✅ Performance boa
- ✅ Não precisa de servidor separado
- ✅ **Funciona agora!**

## 📞 Próximos Passos

1. **Agora**: Use `/analytics-api-agregado`
2. **Depois**: Resolva o acesso ao MongoDB
3. **Futuro**: Migre para `/analytics` (mais rápido)

---

**Status**: MongoDB não acessível
**Solução**: Use Analytics API Agregado
**URL**: http://localhost:5173/analytics-api-agregado ✅
