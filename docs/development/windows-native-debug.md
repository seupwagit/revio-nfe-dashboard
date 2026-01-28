# Debug Windows Nativo - Guia Completo

## 🪟 Visão Geral

O debug Windows nativo permite executar a aplicação diretamente no Windows, sem depender do WSL ou Docker. Isso oferece:

- ✅ **Startup mais rápido** - Sem overhead de containers
- ✅ **Debugging direto** - Node.js nativo no Windows
- ✅ **Desenvolvimento ágil** - Hot reload instantâneo
- ✅ **Menos recursos** - Não usa Docker/WSL

## 🚀 Setup Inicial

### 1. **Executar Setup Automático**

```batch
# Opção 1: Script Batch
scripts\setup-windows-debug.bat

# Opção 2: PowerShell direto
powershell -ExecutionPolicy Bypass -File scripts\Setup-Windows-Debug.ps1
```

### 2. **Verificar Pré-requisitos**

**Node.js 20+:**
```bash
node --version  # Deve ser v20.x.x ou superior
```

**pnpm:**
```bash
pnpm --version  # Será instalado automaticamente se não existir
```

**Dependências:**
```bash
pnpm install  # Executado automaticamente pelo setup
```

## 🎯 Como Debugar

### **Opção 1: Debug Full Stack (Recomendado)**

1. **Pressione `F5` no VS Code**
2. **Selecione:** `🪟 Debug Full Stack (Windows Nativo)`
3. **Aguarde:** Backend e Frontend iniciarem
4. **Acesse:** http://localhost:4000

### **Opção 2: Debug Individual**

**Backend apenas:**
1. Pressione `F5`
2. Selecione: `🪟 Debug Backend (Windows Native)`
3. Acesse: http://localhost:4001

**Frontend apenas:**
1. Pressione `F5`
2. Selecione: `🪟 Debug Frontend (Windows Native)`
3. Acesse: http://localhost:4000

## 📋 Configurações de Debug

### **Backend Configuration**

```json
{
  "name": "🪟 Debug Backend (Windows Native)",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/apps/backend/src/index.ts",
  "runtimeArgs": ["--loader", "tsx/esm", "--inspect=9229"],
  "env": {
    "NODE_ENV": "development",
    "PORT": "${env:BACKOFFICE_PORT}"
  }
}
```

**Nota:** A porta é lida da variável `BACKOFFICE_PORT` no arquivo `.env`.

### **Frontend Configuration**

```json
{
  "name": "🪟 Debug Frontend (Windows Native)",
  "type": "chrome",
  "request": "launch",
  "url": "http://localhost:${env:VITE_PORT}",
  "preLaunchTask": "🪟 Start Frontend (Windows Native)"
}
```

**Nota:** A URL é construída usando a variável `VITE_PORT` do arquivo `.env`.

### **Full Stack Compound**

```json
{
  "name": "🪟 Debug Full Stack (Windows Nativo)",
  "configurations": [
    "🪟 Debug Backend (Windows Native)",
    "🪟 Debug Frontend (Windows Native)"
  ],
  "stopAll": true
}
```

## 🔧 Portas e URLs

As portas são configuradas através de variáveis de ambiente no arquivo `.env`:

| Serviço | Variável | Porta Padrão | URL | Descrição |
|---------|----------|--------------|-----|-----------|
| Frontend | `VITE_PORT` | 4000 | <http://localhost:4000> | Interface React |
| Backend | `BACKOFFICE_PORT` | 4001 | <http://localhost:4001> | API REST |
| Debug | - | 9229 | - | Node.js Debugger |

**Configuração no .env:**

```bash
# Portas configuráveis
VITE_PORT=4000          # Porta do frontend
BACKOFFICE_PORT=4001    # Porta do backend
```

## 🛠️ Troubleshooting

### **Problema: Porta em uso**

**Solução automática:**
```powershell
# Executar task do VS Code
Ctrl+Shift+P → "Tasks: Run Task" → "🪟 Stop All Windows Processes"
```

**Solução manual:**
```powershell
# Verificar processos na porta
Get-NetTCPConnection -LocalPort 4000
Get-NetTCPConnection -LocalPort 4001

# Finalizar processo específico
Stop-Process -Id <PID> -Force
```

### **Problema: Node.js não encontrado**

**Solução:**
1. Instalar Node.js 20+ do site oficial
2. Reiniciar VS Code
3. Executar setup novamente

### **Problema: pnpm não encontrado**

**Solução:**
```bash
# Instalar pnpm globalmente
npm install -g pnpm

# Ou usar corepack (Node.js 16+)
corepack enable
corepack prepare pnpm@latest --activate
```

### **Problema: Dependências não instaladas**

**Solução:**
```bash
# Limpar e reinstalar
pnpm clean
pnpm install
```

### **Problema: Hot reload não funciona**

**Verificar:**
1. Arquivo `.env` existe e está correto
2. Vite está rodando na porta 4000
3. Backend está rodando na porta 4001

## 🔄 Scripts Disponíveis

### **Tasks do VS Code**

| Task | Descrição |
|------|-----------|
| `🪟 Start Backend (Windows Native)` | Inicia backend com pnpm |
| `🪟 Start Frontend (Windows Native)` | Inicia frontend com Vite |
| `🪟 Stop All Windows Processes` | Para todos os processos |

### **Scripts PowerShell**

| Script | Descrição |
|--------|-----------|
| `Setup-Windows-Debug.ps1` | Setup completo do ambiente |
| `setup-windows-debug.bat` | Wrapper batch para o PowerShell |

## 📊 Comparação: Windows vs WSL/Docker

| Aspecto | Windows Nativo | WSL/Docker |
|---------|----------------|------------|
| **Startup** | ⚡ Rápido (5-10s) | 🐌 Lento (30-60s) |
| **Hot Reload** | ⚡ Instantâneo | 🐌 Com delay |
| **Recursos** | 💚 Baixo uso | 🔴 Alto uso |
| **Debugging** | ✅ Direto | ⚠️ Via attach |
| **Produção** | ❌ Diferente | ✅ Idêntico |

## 🎯 Quando Usar Cada Modo

### **Windows Nativo - Use para:**
- ✅ Desenvolvimento rápido
- ✅ Debugging intensivo
- ✅ Testes de funcionalidade
- ✅ Desenvolvimento de features

### **WSL/Docker - Use para:**
- ✅ Testes de integração
- ✅ Validação de produção
- ✅ Debugging de containers
- ✅ Deploy testing

## 📚 Comandos Úteis

### **Verificar Status**

```powershell
# Verificar processos Node.js
Get-Process | Where-Object {$_.ProcessName -match "node"}

# Verificar portas em uso
Get-NetTCPConnection -LocalPort 4000,4001,9229

# Verificar variáveis de ambiente
Get-Content .env
```

### **Logs e Debugging**

```bash
# Logs do backend (no terminal integrado)
# Logs aparecem automaticamente no VS Code

# Logs do frontend (no terminal integrado)
# Logs aparecem automaticamente no VS Code
```

## 🔐 Variáveis de Ambiente

O debug Windows usa as mesmas variáveis do `.env`:

```bash
# Portas
PORT=4000
VITE_PORT=4000
BACKOFFICE_PORT=4001

# API
VITE_API_BASE_URL=http://localhost:4001

# Database
VITE_DB_HOST=10.0.0.8
VITE_DB_DATABASE=spedrevio
```

---

**Status:** ✅ **IMPLEMENTADO** - Debug Windows nativo funcionando completamente.