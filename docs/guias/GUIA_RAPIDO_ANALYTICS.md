# 🚀 Guia Rápido: Ativar Analytics MongoDB

## ✅ Passo a Passo Simples

### 1️⃣ Abrir Dois Terminais

Você precisa de **2 terminais** rodando ao mesmo tempo:

#### Terminal 1 - Frontend (já deve estar rodando)
```bash
npm run dev
```
✅ Deve mostrar: `Local: http://localhost:5173/`

#### Terminal 2 - Servidor MongoDB (NOVO)
```bash
npm run aggregation
```
✅ Deve mostrar:
```
✅ Conectado ao MongoDB
📊 Database: C67624577000145
🚀 Servidor de agregação rodando na porta 3002
```

### 2️⃣ Acessar a Tela

Abra no navegador:
```
http://localhost:5173/analytics
```

## 🎯 Atalho Rápido (Windows)

Clique duas vezes no arquivo:
```
iniciar-completo.bat
```

Isso vai abrir automaticamente os 2 terminais necessários!

## 📊 Telas Disponíveis

| Tela | URL | Precisa Servidor? | Velocidade |
|------|-----|-------------------|------------|
| **Analytics MongoDB** | `/analytics` | ✅ SIM | ⚡⚡⚡ Muito Rápido |
| Analytics API | `/analytics-api` | ❌ NÃO | 🐌 Lento |
| Analytics Agregado | `/analytics-api-agregado` | ❌ NÃO | ⚡ Médio |

## ❓ Problemas Comuns

### "Servidor de Agregação Não Disponível"

**Causa:** O servidor MongoDB não está rodando

**Solução:**
```bash
npm run aggregation
```

### "ECONNREFUSED" ou "ERR_NETWORK"

**Causa:** Porta 3002 já está em uso

**Solução:**
1. Feche outros processos na porta 3002
2. Ou reinicie o computador

### Servidor inicia mas não conecta ao MongoDB

**Causa:** Credenciais ou IP do MongoDB incorretos

**Solução:** Verifique o arquivo `.env`:
```
VITE_MONGODB_CONNECTION_STRING=mongodb://revio:zaqwsx2001@10.0.0.8:27017/...
```

## 🔍 Como Verificar se Está Funcionando

### 1. Verificar Servidor
Abra no navegador:
```
http://localhost:3000/health
```

Deve retornar:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "database": "C67624577000145",
  "mode": "READ-ONLY"
}
```

### 2. Verificar Frontend
Abra no navegador:
```
http://localhost:5173/analytics
```

Deve mostrar:
- ✅ Gráficos carregando
- ✅ Filtros funcionando
- ✅ Dados aparecendo

## 💡 Dicas

1. **Deixe os 2 terminais abertos** enquanto trabalha
2. **Não feche o terminal do servidor** MongoDB
3. Se mudar o `.env`, **reinicie o servidor** MongoDB
4. O servidor é **READ-ONLY** (só lê dados, nunca modifica)

## 🎨 O Que Você Vai Ver

A tela de Analytics MongoDB mostra:

- 📊 **KPIs**: Total de notas, faturamento, ticket médio
- 📈 **Gráficos**:
  - Faturamento diário
  - Evolução mensal
  - Top 10 emitentes
  - Distribuição por tipo
  - Status das notas
- 🔍 **Filtros**:
  - Período (7d, 30d, 60d, 90d, 12m, personalizado)
  - Tipo de documento (NF-e, CF-e, CT-e)
  - Datas customizadas

## 🚀 Performance

Com o servidor MongoDB:
- ⚡ **Muito rápido**: Agregações diretas no banco
- 📊 **Eficiente**: Processa milhões de registros em segundos
- 💾 **Leve**: Não sobrecarrega o navegador

Sem o servidor (usando API REST):
- 🐌 **Lento**: Precisa buscar todos os registros
- 📊 **Pesado**: Pode travar o navegador
- 💾 **Limitado**: Máximo 60 dias de dados

## 📝 Resumo

```bash
# Terminal 1
npm run dev

# Terminal 2  
npm run aggregation

# Navegador
http://localhost:5173/analytics
```

Pronto! 🎉
