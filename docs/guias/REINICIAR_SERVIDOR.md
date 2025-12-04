# 🔄 Como Reiniciar o Servidor (Porta 3000)

## ⚠️ Atenção

A porta foi alterada de **3002** para **3000**. Você precisa **reiniciar** o servidor!

## 🛑 Passo 1: Parar o Servidor Antigo

Se o servidor já estava rodando, você precisa pará-lo primeiro.

### No Terminal do Servidor
Pressione:
```
CTRL + C
```

Você verá algo como:
```
⏹️  Encerrando servidor...
✅ Conexão MongoDB fechada
```

## ▶️ Passo 2: Iniciar o Novo Servidor

No mesmo terminal (ou em um novo), execute:
```bash
npm run aggregation
```

Agora você deve ver:
```
🔧 Configuração:
   MongoDB URI: mongodb://***:***@10.0.0.8:27017/...
   Database: C67624577000145
✅ Conectado ao MongoDB
📊 Database: C67624577000145
⚠️  Modo: READ-ONLY (apenas agregações)
🚀 Servidor de agregação rodando na porta 3000  ← PORTA CORRETA!
   Health: http://localhost:3000/health
   Endpoint: POST http://localhost:3000/api/aggregate/analytics
```

## ✅ Passo 3: Verificar

### Opção A: Usar o Script de Teste
Clique duas vezes em:
```
testar-analytics.bat
```

### Opção B: Verificar Manualmente
Abra no navegador:
```
http://localhost:3000/health
```

Deve mostrar:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "database": "C67624577000145",
  "mode": "READ-ONLY"
}
```

## 🎯 Passo 4: Acessar Analytics

Agora acesse:
```
http://localhost:5173/analytics
```

Os gráficos devem carregar normalmente! 🎉

## 🔍 Verificação Rápida

Execute estes comandos para verificar:

### 1. Verificar se a porta 3000 está em uso
```bash
netstat -ano | findstr :3000
```

Deve mostrar algo como:
```
TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345
```

### 2. Testar o Health Check
```bash
curl http://localhost:3000/health
```

Deve retornar JSON com `"status": "ok"`

## ❌ Problemas Comuns

### "Porta 3000 já está em uso"

**Causa**: Outro processo está usando a porta 3000

**Solução**:
1. Encontre o processo:
   ```bash
   netstat -ano | findstr :3000
   ```
2. Anote o PID (último número)
3. Mate o processo:
   ```bash
   taskkill /PID [número] /F
   ```
4. Tente novamente: `npm run aggregation`

### "Cannot connect to MongoDB"

**Causa**: Credenciais ou IP incorretos

**Solução**:
1. Verifique o `.env`:
   ```
   VITE_MONGODB_CONNECTION_STRING=mongodb://revio:zaqwsx2001@10.0.0.8:27017/...
   ```
2. Teste a conexão:
   ```bash
   mongosh "mongodb://revio:zaqwsx2001@10.0.0.8:27017"
   ```

### "Servidor não inicia"

**Causa**: Dependências faltando

**Solução**:
```bash
npm install
npm run aggregation
```

## 📊 Resumo Visual

```
┌─────────────────────────────────────────────────────────────┐
│  ANTES (Porta 3002 - ERRADA)                                │
├─────────────────────────────────────────────────────────────┤
│  ❌ http://localhost:3002/health                            │
│  ❌ http://localhost:3002/api/aggregate/analytics           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  DEPOIS (Porta 3000 - CORRETA)                              │
├─────────────────────────────────────────────────────────────┤
│  ✅ http://localhost:3000/health                            │
│  ✅ http://localhost:3000/api/aggregate/analytics           │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Checklist Final

- [ ] Parei o servidor antigo (CTRL+C)
- [ ] Executei `npm run aggregation`
- [ ] Vi "porta 3000" no log
- [ ] Testei `http://localhost:3000/health`
- [ ] Acessei `http://localhost:5173/analytics`
- [ ] Gráficos carregaram! 🎉

## 💡 Dica

Para evitar ter que reiniciar manualmente, use o atalho:
```
iniciar-completo.bat
```

Ele já inicia tudo na porta correta!

---

**Porta Correta**: 3000 ✅
**Porta Antiga**: ~~3002~~ ❌
