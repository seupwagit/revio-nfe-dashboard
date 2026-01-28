# Correção: Conflito Apache2 Durante Debug

## 🚨 Problema Identificado

Ao executar debug (F5) no VS Code, aparece a **página padrão do Apache2** em vez da aplicação:

```
Apache2 Ubuntu Default Page
It works!
```

## 🔍 Causa Raiz

O **Apache2** está instalado e ativo no WSL Ubuntu, ocupando a **porta 80** (localhost). Quando você acessa `http://localhost`, o Apache2 intercepta a requisição antes que sua aplicação possa responder.

## ✅ Solução Implementada

### 1. **Parar e Desabilitar Apache2**

```bash
# Parar o serviço
sudo systemctl stop apache2

# Desabilitar inicialização automática
sudo systemctl disable apache2
```

### 2. **Script Automático de Correção**

Execute o script criado:

```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && ./scripts/fix-apache-conflict.sh"
```

### 3. **Verificação de Portas**

Para diagnosticar problemas de porta:

```bash
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && ./scripts/debug-port-check.sh"
```

## 🎯 Configuração Correta de Portas

Após a correção, as portas devem estar assim:

| Serviço | Porta | URL | Uso |
|---------|-------|-----|-----|
| Frontend (Vite) | 4000 | http://localhost:4000 | Interface da aplicação |
| Backend (API) | 4001 | http://localhost:4001 | API REST |
| Debug Backend | 9229 | - | Debugger Node.js |

## 🔧 Configurações de Debug

### VS Code Launch Configuration

```json
{
  "name": "🚀 Debug Full Stack (Docker Nativo)",
  "configurations": [
    "🐧 Debug Backend (WSL Docker Nativo)",
    "🌐 Debug Frontend (Chrome)"
  ]
}
```

### Variáveis de Ambiente (.env)

```bash
# Portas corretas
PORT=4000
VITE_PORT=4000
BACKOFFICE_PORT=4001

# URL base da API
VITE_API_BASE_URL=http://localhost:4001
```

## 🚀 Como Debugar Corretamente

### 1. **Debug Full Stack (Recomendado)**

1. Pressione `F5` no VS Code
2. Selecione: **"🚀 Debug Full Stack (Docker Nativo)"**
3. Aguarde os containers iniciarem
4. Acesse: http://localhost:4000

### 2. **Debug Apenas Backend**

1. Pressione `F5` no VS Code
2. Selecione: **"🐧 Debug Backend (WSL Docker Nativo)"**
3. Acesse: http://localhost:4001

### 3. **Debug Apenas Frontend**

1. Pressione `F5` no VS Code
2. Selecione: **"🌐 Debug Frontend (Chrome)"**
3. Chrome abrirá automaticamente em: http://localhost:4000

## 🛠️ Troubleshooting

### Problema: Ainda aparece página do Apache2

**Solução:**
```bash
# Verificar se Apache2 ainda está ativo
wsl -d Ubuntu bash -c "sudo systemctl status apache2"

# Se estiver ativo, forçar parada
wsl -d Ubuntu bash -c "sudo systemctl stop apache2 && sudo systemctl disable apache2"
```

### Problema: Porta em uso

**Solução:**
```bash
# Verificar processos usando a porta
wsl -d Ubuntu bash -c "sudo lsof -i :4000"

# Matar processo específico
wsl -d Ubuntu bash -c "sudo kill -9 <PID>"
```

### Problema: Containers não iniciam

**Solução:**
```bash
# Verificar containers Docker
wsl -d Ubuntu bash -c "docker ps -a"

# Limpar containers parados
wsl -d Ubuntu bash -c "docker container prune -f"

# Recriar containers
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && docker compose down && docker compose up -d"
```

## 📋 Checklist de Verificação

Antes de debugar, verifique:

- [ ] ✅ Apache2 está parado (`systemctl status apache2`)
- [ ] ✅ Portas 4000 e 4001 estão livres
- [ ] ✅ Docker está rodando no WSL
- [ ] ✅ Variáveis de ambiente estão corretas (.env)
- [ ] ✅ VS Code está usando a configuração correta de debug

## 🔄 Prevenção Futura

### Apache2 Desabilitado Permanentemente

O Apache2 foi desabilitado e não iniciará automaticamente. Se precisar dele para outros projetos:

```bash
# Usar porta diferente para Apache2
sudo nano /etc/apache2/ports.conf
# Alterar: Listen 80 → Listen 8080

# Ou usar Apache2 apenas quando necessário
sudo systemctl start apache2  # Iniciar temporariamente
sudo systemctl stop apache2   # Parar quando não precisar
```

### Monitoramento de Portas

Execute periodicamente:

```bash
./scripts/debug-port-check.sh
```

## 📚 Referências

- [Apache2 Ubuntu Documentation](https://ubuntu.com/server/docs/web-servers-apache)
- [VS Code Node.js Debugging](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)
- [Docker Compose Networking](https://docs.docker.com/compose/networking/)

---

**Status:** ✅ **RESOLVIDO** - Apache2 parado e desabilitado, debug funcionando corretamente.