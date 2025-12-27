# 🔧 Debug do Login no Coolify

## 🎯 Problema
O login não funciona no ambiente Coolify, mas funciona localmente.

## 🔍 Possíveis Causas Identificadas

### 1. **CORS (Cross-Origin Resource Sharing)**
**Problema**: O backend está configurado com origens CORS fixas que não incluem o domínio do Coolify.

**Solução Aplicada**:
- Adicionadas variáveis de ambiente `FRONTEND_URL` e `CORS_ORIGIN`
- CORS agora aceita origens dinâmicas baseadas no ambiente

**Como Configurar no Coolify**:
```bash
# Adicionar estas variáveis de ambiente no Coolify:
FRONTEND_URL=https://seu-dominio-coolify.com
# OU
CORS_ORIGIN=https://seu-dominio-coolify.com
```

### 2. **Conexão com Banco de Dados**
**Problema**: SQL Server pode não estar acessível do ambiente Coolify.

**Verificação**: Use o endpoint de debug:
```bash
curl https://seu-dominio-coolify.com/api/debug/database
```

### 3. **Variáveis de Ambiente**
**Problema**: Variáveis de ambiente podem não estar configuradas corretamente.

**Verificação**: Use o endpoint de debug:
```bash
curl https://seu-dominio-coolify.com/api/debug/env
```

## 🛠️ Endpoints de Debug Adicionados

### 1. `/api/debug/env`
Mostra variáveis de ambiente críticas:
```json
{
  "VITE_DB_HOST": "10.0.0.8",
  "VITE_DB_DATABASE": "spedrevio",
  "VITE_MONGODB_CONNECTION_STRING": "DEFINIDO",
  "BACKOFFICE_PORT": "4001",
  "NODE_ENV": "production"
}
```

### 2. `/api/debug/database`
Testa conexões com bancos de dados:
```json
{
  "timestamp": "2024-12-27T...",
  "environment": {
    "DATABASE_URL": "DEFINIDO",
    "VITE_DB_SERVER": "10.0.0.4"
  },
  "connections": {
    "prisma": { "status": "CONECTADO", "error": null },
    "mongodb": { "status": "CONECTADO", "error": null }
  }
}
```

### 3. `/api/debug/auth`
Testa processo de autenticação passo a passo:
```bash
curl -X POST https://seu-dominio-coolify.com/api/debug/auth \
  -H "Content-Type: application/json" \
  -d '{"username":"seu_usuario","password":"sua_senha"}'
```

Resposta:
```json
{
  "timestamp": "2024-12-27T...",
  "input": {
    "username": "admin",
    "passwordProvided": true
  },
  "steps": [
    { "step": "prisma_connection", "status": "sucesso" },
    { "step": "user_lookup", "status": "encontrado", "data": {...} },
    { "step": "password_validation", "status": "sucesso", "data": {...} }
  ]
}
```

## 🔧 Logs Melhorados

### Backend (src/backend/routes/auth.ts)
Agora inclui logs detalhados:
```
[AUTH] 🔐 Tentativa de login iniciada
[AUTH]    IP: 192.168.1.100
[AUTH]    Headers: {...}
[AUTH] 🔍 Iniciando autenticação para usuário: admin
[AUTH] 📊 Resultado da autenticação: {...}
[AUTH] ✅ Autenticação bem-sucedida, gerando token
[AUTH] 🎫 Token gerado com sucesso
[AUTH] 📤 Enviando resposta de sucesso
```

### AuthService (src/backend/services/AuthService.ts)
Logs detalhados do processo de autenticação:
```
[AuthService] 🔐 Iniciando autenticação completa
[AuthService] 1️⃣ Validando credenciais...
[AuthService] 📊 Resultado validação credenciais: {...}
[AuthService] 2️⃣ Verificando status da base de dados...
[AuthService] 3️⃣ Verificando permissões...
[AuthService] 🎉 Autenticação completa bem-sucedida
```

### DatabaseRouter (src/backend/services/DatabaseRouter.ts)
Logs de conexão com banco:
```
[DatabaseRouter] 🔍 Obtendo conexão SQL global...
[DatabaseRouter] ✅ Conexão SQL global obtida com sucesso
```

### Prisma (src/backend/database/prisma.ts)
Logs de conexão Prisma:
```
[Prisma] 🔗 Iniciando conexão com SQL Server...
[Prisma]    DATABASE_URL definida: true
[Prisma] 🏗️ Criando nova instância do PrismaClient...
[Prisma] 🔌 Testando conexão...
[Prisma] ✅ SQL Server conectado via Prisma
[Prisma] ✅ Query de teste executada com sucesso
```

## 📋 Checklist de Diagnóstico

### 1. Verificar CORS
- [ ] Acessar `/api/debug/env` e verificar se `FRONTEND_URL` ou `CORS_ORIGIN` estão definidas
- [ ] Verificar se o domínio do Coolify está nas origens permitidas
- [ ] Verificar logs do backend para erros de CORS

### 2. Verificar Conexões de Banco
- [ ] Acessar `/api/debug/database`
- [ ] Verificar se `prisma.status` é "CONECTADO"
- [ ] Verificar se `mongodb.status` é "CONECTADO"
- [ ] Se erro, verificar variáveis `DATABASE_URL` e `VITE_MONGODB_CONNECTION_STRING`

### 3. Testar Autenticação
- [ ] Usar `/api/debug/auth` com credenciais válidas
- [ ] Verificar se todos os steps retornam "sucesso"
- [ ] Se falha em `user_lookup`, verificar se usuário existe na base
- [ ] Se falha em `password_validation`, verificar algoritmo de hash

### 4. Verificar Logs do Coolify
- [ ] Acessar logs da aplicação no Coolify
- [ ] Procurar por logs com prefixo `[AUTH]`, `[AuthService]`, `[DatabaseRouter]`, `[Prisma]`
- [ ] Identificar onde o processo está falhando

## 🚀 Próximos Passos

1. **Deploy das Correções**:
   ```bash
   git add .
   git commit -m "fix: adicionar debug e correções CORS para Coolify"
   git push origin main
   ```

2. **Configurar Variáveis no Coolify**:
   - Adicionar `FRONTEND_URL` ou `CORS_ORIGIN` com o domínio correto
   - Verificar se todas as variáveis de banco estão configuradas

3. **Testar Endpoints de Debug**:
   - `/api/debug/env`
   - `/api/debug/database`
   - `/api/debug/auth`

4. **Monitorar Logs**:
   - Acompanhar logs em tempo real no Coolify
   - Identificar exatamente onde o login está falhando

## 🔗 Arquivos Modificados

- `src/backend/index.ts` - CORS dinâmico + endpoints de debug
- `src/backend/routes/auth.ts` - Logs detalhados de autenticação
- `src/backend/services/AuthService.ts` - Logs detalhados do processo
- `src/backend/services/DatabaseRouter.ts` - Logs de conexão
- `src/backend/database/prisma.ts` - Logs de conexão Prisma

---

**Status**: ✅ Correções aplicadas, pronto para deploy e teste no Coolify