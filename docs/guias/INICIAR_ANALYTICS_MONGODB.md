# Como Ativar Analytics MongoDB

## O Problema
A tela de Analytics (`/analytics`) está pronta mas não funciona porque depende de um servidor Node.js que conecta diretamente ao MongoDB para fazer agregações otimizadas.

## A Solução

### Passo 1: Iniciar o Servidor de Agregação

Abra um **novo terminal** (separado do terminal onde roda `npm run dev`) e execute:

```bash
npm run aggregation
```

Você verá algo como:
```
✅ Conectado ao MongoDB
📊 Database: C67624577000145
⚠️  Modo: READ-ONLY (apenas agregações)
🚀 Servidor de agregação rodando na porta 3002
   Health: http://localhost:3002/health
   Endpoint: POST http://localhost:3002/api/aggregate/analytics
```

### Passo 2: Acessar a Tela de Analytics

Com o servidor rodando, acesse no navegador:

```
http://localhost:5173/analytics
```

## Como Funciona

1. **Frontend (React)** → Roda na porta 5173 (Vite)
2. **Servidor de Agregação (Node.js)** → Roda na porta 3002
3. **MongoDB** → 10.0.0.8:27017

O fluxo é:
```
React App → Servidor Node.js (porta 3002) → MongoDB (10.0.0.8)
```

## Por Que Precisa de um Servidor Separado?

Navegadores não podem conectar diretamente ao MongoDB por segurança. O servidor Node.js:
- Conecta ao MongoDB
- Executa agregações otimizadas (muito mais rápido)
- Retorna apenas os dados agregados para o frontend
- **READ-ONLY**: Nunca faz DELETE, UPDATE ou INSERT

## Verificar se Está Funcionando

1. Servidor rodando: `http://localhost:3002/health`
2. Deve retornar:
```json
{
  "status": "ok",
  "mongodb": "connected",
  "database": "C67624577000145",
  "mode": "READ-ONLY"
}
```

## Outras Telas de Analytics

Você também tem outras opções que **NÃO** precisam do servidor de agregação:

- `/analytics-api` - Usa a API REST (mais lento, mas não precisa do servidor)
- `/analytics-api-agregado` - Usa a API REST com agregação local
- `/analytics-teste-120dias` - Teste de performance com 120 dias

## Manter os Dois Rodando

Para desenvolvimento, você precisa de **2 terminais**:

**Terminal 1** (Frontend):
```bash
npm run dev
```

**Terminal 2** (Servidor de Agregação):
```bash
npm run aggregation
```

## Configuração

A conexão MongoDB está em `.env`:
```
VITE_MONGODB_CONNECTION_STRING=mongodb://revio:zaqwsx2001@10.0.0.8:27017/?authMechanism=SCRAM-SHA-256&authSource=admin&directConnection=true
```

O servidor lê essa configuração diretamente do arquivo `scripts/aggregation-server.cjs`.
