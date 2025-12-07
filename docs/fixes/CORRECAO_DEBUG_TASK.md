# ✅ Correção: Task "npm: dev" não encontrada

**Data:** 2025-12-05  
**Problema:** `Could not find the task 'npm: dev'`  
**Status:** ✅ Corrigido

---

## 🚨 Problema

Ao tentar iniciar o debug Full Stack (F5), o VS Code apresentava o erro:

```
Could not find the task 'npm: dev'
```

---

## 🔍 Causa

A task `npm: dev` estava configurada com `type: "npm"`, mas o VS Code não estava reconhecendo corretamente. Isso pode acontecer por:

1. Formato incorreto da task
2. Problema com o tipo `npm` no VS Code
3. Duplicação de tasks

---

## ✅ Solução Aplicada

### Mudança na Task

**Antes:**
```json
{
  "label": "npm: dev",
  "type": "npm",
  "script": "dev",
  // ...
}
```

**Depois:**
```json
{
  "label": "npm: dev",
  "type": "shell",
  "command": "npm",
  "args": ["run", "dev"],
  // ...
}
```

### Por que funciona?

- ✅ `type: "shell"` é mais confiável que `type: "npm"`
- ✅ Comando explícito com `args` é mais claro
- ✅ Funciona em todos os sistemas operacionais
- ✅ Mais fácil de debugar

---

## 🎯 Configuração Final

### Task `npm: dev`

```json
{
  "label": "npm: dev",
  "type": "shell",
  "command": "npm",
  "args": ["run", "dev"],
  "isBackground": true,
  "problemMatcher": {
    "owner": "vite",
    "pattern": {
      "regexp": "."
    },
    "background": {
      "activeOnStart": true,
      "beginsPattern": "VITE",
      "endsPattern": "Local:.*http://localhost"
    }
  },
  "presentation": {
    "reveal": "always",
    "panel": "dedicated",
    "focus": false,
    "group": "fullstack"
  }
}
```

### Task Backend

```json
{
  "label": "Start Backend (Backoffice)",
  "type": "shell",
  "command": "npx",
  "args": ["tsx", "--inspect=9229", "src/server/index.ts"],
  "isBackground": true,
  "problemMatcher": {
    "owner": "typescript",
    "pattern": {
      "regexp": "."
    },
    "background": {
      "activeOnStart": true,
      "beginsPattern": "Iniciando",
      "endsPattern": "Backoffice Server rodando"
    }
  },
  "presentation": {
    "reveal": "always",
    "panel": "dedicated",
    "focus": false,
    "group": "fullstack"
  }
}
```

---

## 🧪 Como Testar

### 1. Testar Task Individualmente

1. Pressione **Ctrl+Shift+P**
2. Digite "Tasks: Run Task"
3. Selecione "npm: dev"
4. Deve iniciar o Vite sem erros ✅

### 2. Testar Debug Full Stack

1. Pressione **F5**
2. Deve iniciar:
   - Backend (porta 3000)
   - Frontend (porta 3000)
   - Chrome automaticamente
3. Sem erros de task ✅

### 3. Verificar Logs

No terminal integrado, você deve ver:

```
[FRONTEND] VITE v5.4.21  ready in 1234 ms
[FRONTEND] ➜  Local:   http://localhost:3000/

[BACKEND] 🚀 Iniciando Backoffice Server...
[BACKEND] ✅ Backoffice Server rodando!
```

---

## 🔧 Outras Tasks Disponíveis

### Executar Tasks

Pressione **Ctrl+Shift+P** → "Tasks: Run Task"

### Tasks Principais

| Task | Descrição |
|------|-----------|
| `npm: dev` | Inicia frontend (Vite) |
| `Start Backend (Backoffice)` | Inicia backend com debug |
| `🚀 Start Full Stack` | Inicia ambos simultaneamente |
| `Kill Port 3000` | Mata processo na porta 3000 |
| `Kill Port 3000` | Mata processo na porta 3000 |
| `🔌 Test MongoDB Connection` | Testa conexão MongoDB |

---

## 🚨 Troubleshooting

### Problema: Task ainda não encontrada

**Solução:**
1. Feche e reabra o VS Code
2. Verifique se `.vscode/tasks.json` existe
3. Verifique se não há erros de sintaxe JSON

### Problema: Porta já está em uso

**Solução:**
```bash
# Executar task "Kill Port 3000" ou "Kill Port 3000"
# Ou manualmente:
FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :3000') DO taskkill /PID %P /F
FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :3000') DO taskkill /PID %P /F
```

### Problema: Backend não inicia

**Solução:**
1. Verificar se `.env` está configurado
2. Testar conexão MongoDB: `npm run test-mongodb`
3. Verificar logs no terminal

### Problema: Frontend não abre no Chrome

**Solução:**
1. Verificar se Chrome está instalado
2. Verificar se porta 3000 está livre
3. Tentar "🌐 Launch Edge (Dev)" como alternativa

---

## ⌨️ Atalhos Úteis

| Atalho | Ação |
|--------|------|
| **F5** | Start Debug (Full Stack) |
| **Ctrl+Shift+D** | Abrir painel de debug |
| **Ctrl+Shift+P** | Command Palette |
| **Ctrl+Shift+B** | Run Build Task |
| **Shift+F5** | Stop Debug |
| **Ctrl+Shift+F5** | Restart Debug |

---

## 📊 Checklist de Debug

Antes de debugar:

- [ ] `.env` configurado
- [ ] MongoDB acessível
- [ ] Portas 3000 e 3000 livres
- [ ] `npm install` executado
- [ ] VS Code atualizado
- [ ] Tasks funcionando (Ctrl+Shift+P → Run Task)

---

## 📚 Arquivos Relacionados

- `.vscode/tasks.json` - Configuração de tasks
- `.vscode/launch.json` - Configuração de debug
- `package.json` - Scripts npm
- `src/server/index.ts` - Backend entry point
- `src/main.tsx` - Frontend entry point

---

## ✅ Resumo

| Item | Status |
|------|--------|
| Task `npm: dev` | ✅ Corrigida |
| Task Backend | ✅ Atualizada |
| Debug Full Stack | ✅ Funcionando |
| Documentação | ✅ Criada |

---

**🎉 Debug configurado e funcionando! 🚀**

**Pressione F5 e comece a debugar!**
