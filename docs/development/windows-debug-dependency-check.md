# Windows Debug - Verificação de Dependências

## ✅ **Verificação Automática Implementada**

O debug Windows agora inclui **verificação automática de dependências** em múltiplas camadas:

### 1. **Setup Script (Setup-Windows-Debug.ps1)**
```powershell
# Verificações realizadas:
✅ Node.js instalado (versão 20+)
✅ pnpm instalado (instala automaticamente se necessário)
✅ node_modules existe
✅ Integridade dos workspaces
✅ Workspaces específicos (@fiscal/backend, @fiscal/frontend)
✅ Arquivo .env configurado
✅ Variáveis de ambiente críticas
✅ Portas disponíveis
```

### 2. **Tasks de Start com Verificação**
As tasks de start agora verificam dependências antes de executar:

```json
{
  "label": "🪟 Start Backend (Windows Native)",
  "command": "powershell",
  "args": [
    "Verificar dependências → Verificar workspace → Iniciar serviço"
  ]
}
```

### 3. **Tasks de Diagnóstico**

#### **🪟 Pre-Debug Check**
- Verificação completa antes do debug
- Lista todos os problemas encontrados
- Sugere soluções automáticas

#### **🪟 Install Dependencies**
- Instala/atualiza todas as dependências
- Verifica integridade dos workspaces
- Corrige problemas automaticamente

## 🔍 **Verificações Realizadas**

### **Node.js e pnpm**
```powershell
# Verifica Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion"
} catch {
    Write-Host "❌ Node.js não encontrado"
    exit 1
}

# Verifica/instala pnpm
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm: v$pnpmVersion"
} catch {
    Write-Host "📦 Instalando pnpm..."
    npm install -g pnpm
}
```

### **Dependências do Projeto**
```powershell
# Verifica se node_modules existe
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..."
    pnpm install
} else {
    # Verifica integridade
    $workspaceTest = pnpm list --recursive --depth=0 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Reinstalando dependências..."
        Remove-Item -Recurse -Force node_modules
        pnpm install
    }
}
```

### **Workspaces Específicos**
```powershell
# Verifica workspace backend
$backendCheck = pnpm --filter "@fiscal/backend" --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Workspace @fiscal/backend OK"
} else {
    Write-Host "❌ Workspace @fiscal/backend com problemas"
}

# Verifica workspace frontend
$frontendCheck = pnpm --filter "@fiscal/frontend" --version 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Workspace @fiscal/frontend OK"
} else {
    Write-Host "❌ Workspace @fiscal/frontend com problemas"
}
```

### **Arquivo .env e Variáveis**
```powershell
# Verifica .env
if (!(Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "✅ Arquivo .env criado"
    } else {
        Write-Host "❌ .env.example não encontrado"
        exit 1
    }
}

# Valida variáveis críticas
$criticalVars = @("VITE_API_BASE_URL", "VITE_API_BEARER_TOKEN", "VITE_DB_HOST")
foreach ($var in $criticalVars) {
    if (!$envVars.ContainsKey($var)) {
        Write-Host "⚠️ Variável $var não configurada"
    }
}
```

## 🚀 **Como Usar**

### **Opção 1: Setup Completo**
```bash
# Executa verificação e instalação completa
.\scripts\Setup-Windows-Debug.ps1
```

### **Opção 2: Via VS Code Tasks**
1. `Ctrl+Shift+P` → `Tasks: Run Task`
2. Selecionar uma das opções:
   - `🪟 Pre-Debug Check` - Apenas verificação
   - `🪟 Install Dependencies` - Instalação completa
   - `🪟 Start Backend/Frontend` - Verifica e inicia

### **Opção 3: Debug Direto (F5)**
- As tasks de start verificam dependências automaticamente
- Se houver problemas, mostram mensagens de erro claras
- Sugerem soluções automáticas

## 🛠️ **Resolução Automática de Problemas**

### **Dependências Não Instaladas**
```powershell
# Detecta e resolve automaticamente
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..."
    pnpm install
}
```

### **Workspaces Corrompidos**
```powershell
# Detecta problemas e reinstala
$workspaceTest = pnpm list --recursive --depth=0 2>$null
if ($LASTEXITCODE -ne 0) {
    Remove-Item -Recurse -Force node_modules
    pnpm install
}
```

### **pnpm Não Instalado**
```powershell
# Instala automaticamente
try {
    pnpm --version
} catch {
    npm install -g pnpm
}
```

### **Arquivo .env Ausente**
```powershell
# Cria automaticamente do template
if (!(Test-Path ".env") -and (Test-Path ".env.example")) {
    Copy-Item ".env.example" ".env"
}
```

## 📊 **Feedback Visual**

### **Cores e Ícones**
- ✅ **Verde**: Tudo OK
- ⚠️ **Amarelo**: Avisos/ações automáticas
- ❌ **Vermelho**: Erros que precisam de atenção
- 📦 **Azul**: Instalações em progresso
- 💡 **Amarelo**: Sugestões de solução

### **Mensagens Claras**
```powershell
Write-Host "✅ Node.js: v20.11.0" -ForegroundColor Green
Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
Write-Host "❌ Workspace @fiscal/backend não encontrado" -ForegroundColor Red
Write-Host "💡 Execute: pnpm install" -ForegroundColor Yellow
```

## 🔄 **Fluxo de Verificação**

### **Ao Executar Debug (F5)**
1. **Task Start Backend/Frontend** inicia
2. **Verifica dependências** automaticamente
3. **Instala se necessário** (com feedback)
4. **Verifica workspace específico**
5. **Inicia serviço** se tudo OK
6. **Mostra erro claro** se houver problemas

### **Ao Executar Setup**
1. **Verifica Node.js** (obrigatório)
2. **Instala pnpm** (se necessário)
3. **Verifica/instala dependências**
4. **Testa integridade dos workspaces**
5. **Cria .env** (se necessário)
6. **Valida variáveis críticas**
7. **Verifica portas disponíveis**
8. **Relatório final** com status

## ✅ **Benefícios**

### **Para o Desenvolvedor**
- ✅ **Zero configuração manual** - Tudo automático
- ✅ **Feedback claro** - Sabe exatamente o que está acontecendo
- ✅ **Resolução automática** - Problemas comuns são corrigidos
- ✅ **Múltiplas opções** - Setup, tasks, ou debug direto

### **Para o Projeto**
- ✅ **Consistência** - Todos usam a mesma configuração
- ✅ **Confiabilidade** - Menos erros de ambiente
- ✅ **Produtividade** - Menos tempo perdido com setup
- ✅ **Manutenibilidade** - Fácil de atualizar e corrigir

## 🎯 **Status Final**

**Verificação de dependências 100% implementada:**
- ✅ Setup script com verificação completa
- ✅ Tasks de start com verificação automática
- ✅ Tasks de diagnóstico dedicadas
- ✅ Resolução automática de problemas comuns
- ✅ Feedback visual claro e acionável
- ✅ Múltiplas formas de uso (setup, tasks, debug direto)

**O debug Windows agora é completamente autônomo e confiável!**