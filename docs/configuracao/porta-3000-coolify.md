# 🔌 Porta 3000 - Padrão do Coolify

Configuração da porta 3000 para compatibilidade com Coolify.

## 📋 Mudança de Porta

### Antes
```
Porta: 5173 (padrão do Vite)
URL: http://localhost:5173
```

### Depois
```
Porta: 3000 (padrão do Coolify)
URL: http://localhost:3000
```

## 🔧 Arquivos Atualizados

### 1. vite.config.ts
```typescript
server: {
  port: 3000, // Porta padrão do Coolify
  host: true,
  strictPort: false,
}
```

### 2. .vscode/launch.json
```json
{
  "url": "http://localhost:3000"
}
```

### 3. Documentação
- Todas as referências em `docs/**/*.md`
- URLs atualizadas de 5173 para 3000

## 🚀 Como Usar

### Desenvolvimento Local

```bash
npm run dev
```

**Acesso:**
- Local: `http://localhost:3000`
- Rede: `http://192.168.x.x:3000`

### Coolify Deploy

**Configuração automática:**
- Coolify detecta porta 3000
- Não precisa configurar PORT env var
- Deploy funciona out-of-the-box

## 🎯 Benefícios

### 1. Compatibilidade com Coolify
- ✅ Porta padrão reconhecida
- ✅ Deploy mais simples
- ✅ Menos configuração

### 2. Padrão da Indústria
- ✅ Porta comum para apps Node.js
- ✅ Fácil de lembrar
- ✅ Documentação consistente

### 3. Flexibilidade
- ✅ Pode mudar via env var
- ✅ strictPort: false (tenta outras portas)
- ✅ Funciona local e produção

## 🔍 Verificar Porta

### Via Console
```bash
# Ao iniciar npm run dev, deve mostrar:
➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

### Via Código
```javascript
console.log('Porta:', import.meta.env.VITE_PORT || 3000)
```

### Via netstat
```bash
# Windows
netstat -ano | findstr :3000

# Linux/Mac
lsof -i :3000
```

## ⚙️ Configuração Avançada

### Variável de Ambiente

```env
# .env
VITE_PORT=3000
```

```typescript
// vite.config.ts
server: {
  port: process.env.VITE_PORT || 3000
}
```

### Coolify Environment

```yaml
# Coolify detecta automaticamente
# Mas você pode forçar:
PORT=3000
```

### Docker

```dockerfile
# Dockerfile
EXPOSE 3000

# docker-compose.yml
ports:
  - "3000:3000"
```

## 🐛 Troubleshooting

### Porta 3000 Já em Uso

**Erro:**
```
Port 3000 is in use, trying another one...
```

**Solução 1: Matar processo**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

**Solução 2: Usar outra porta**
```bash
# Temporário
npm run dev -- --port 3001

# Permanente (.env)
VITE_PORT=3001
```

**Solução 3: strictPort false**
```typescript
// vite.config.ts (já configurado)
server: {
  strictPort: false // Tenta outras portas automaticamente
}
```

### Firewall Bloqueando

**Windows:**
```bash
netsh advfirewall firewall add rule name="Vite Dev Server" dir=in action=allow protocol=TCP localport=3000
```

**Linux:**
```bash
sudo ufw allow 3000
```

### Coolify Não Detecta

**Verificar:**
1. Porta 3000 está configurada no vite.config.ts
2. Aplicação está escutando em 0.0.0.0 (host: true)
3. Dockerfile expõe porta 3000

## 📊 Comparação de Portas

| Porta | Uso | Vantagens | Desvantagens |
|-------|-----|-----------|--------------|
| 3000 | Node.js padrão | ✅ Padrão indústria | ⚠️ Pode estar em uso |
| 5173 | Vite padrão | ✅ Raramente usado | ❌ Não padrão Coolify |
| 8080 | Alternativa | ✅ Comum | ⚠️ Pode estar em uso |
| 4000 | Alternativa | ✅ Raramente usado | ❌ Não padrão |

## 💡 Recomendações

### Desenvolvimento
- ✅ Use porta 3000
- ✅ Configure host: true
- ✅ Use strictPort: false

### Produção (Coolify)
- ✅ Porta 3000 (automático)
- ✅ Coolify gerencia proxy
- ✅ HTTPS automático

### Docker
- ✅ EXPOSE 3000
- ✅ Bind 0.0.0.0:3000
- ✅ Health check na porta 3000

## 🔗 Recursos

- [Vite Server Options](https://vitejs.dev/config/server-options.html)
- [Coolify Documentation](https://coolify.io/docs)
- [Node.js Port Conventions](https://nodejs.org/en/docs/)

---

**Última atualização:** 01/12/2024
**Porta atual:** 3000 (Coolify padrão)
