# 🐛 Guia de Debug - VS Code

## 🎯 Configurações de Debug Disponíveis

### 1. 🚀 Full Stack Debug (PADRÃO - F5)

**O que faz:**
- Inicia o backend (Node.js com tsx)
- Inicia o frontend (Vite)
- Abre o Chrome automaticamente
- Permite debug de ambos simultaneamente

**Como usar:**
1. Pressione **F5**
2. Aguarde o Vite iniciar (aparecerá "Local: http://localhost:3000")
3. O Chrome abrirá automaticamente
4. Coloque breakpoints no código TypeScript/React
5. Coloque breakpoints no código do backend

**Portas:**
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3000`
- Debug Backend: `9229`
- Debug Chrome: `9222`

---

### 2. 🚀 Launch Chrome (Dev)

**O que faz:**
- Inicia apenas o frontend no Chrome
- Útil quando o backend já está rodando

**Como usar:**
1. Abra o painel de debug (Ctrl+Shift+D)
2. Selecione "🚀 Launch Chrome (Dev)"
3. Pressione F5 ou clique em "Start Debugging"

**Pré-requisito:**
- A task `npm: dev` será executada automaticamente

---

### 3. 🔗 Attach to Chrome

**O que faz:**
- Conecta a uma instância do Chrome já aberta
- Útil para debug de uma sessão existente

**Como usar:**
1. Inicie o Chrome com debug habilitado:
   ```bash
   chrome.exe --remote-debugging-port=9222
   ```
2. Abra `http://localhost:3000`
3. No VS Code, selecione "🔗 Attach to Chrome"
4. Pressione F5

---

### 4. 🌐 Launch Edge (Dev)

**O que faz:**
- Inicia o frontend no Microsoft Edge
- Alternativa ao Chrome

**Como usar:**
1. Selecione "🌐 Launch Edge (Dev)"
2. Pressione F5

---

### 5. 🔧 Backend (Node.js)

**O que faz:**
- Inicia apenas o backend com debug habilitado
- Útil para debug isolado do backend

**Como usar:**
1. Selecione "🔧 Backend (Node.js)"
2. Pressione F5
3. Coloque breakpoints em `server/backoffice/**/*.ts`

**Porta de debug:** `9229`

---

### 6. 🔌 Attach Backend

**O que faz:**
- Conecta a um backend já rodando com debug

**Como usar:**
1. Inicie o backend manualmente:
   ```bash
   npm run backend:debug
   ```
2. No VS Code, selecione "🔌 Attach Backend"
3. Pressione F5

---

### 7. 🐛 Debug Cache (Chrome)

**O que faz:**
- Inicia o Chrome com DevTools aberto automaticamente
- Útil para debug de problemas de cache

**Como usar:**
1. Selecione "🐛 Debug Cache (Chrome)"
2. Pressione F5
3. DevTools abrirá automaticamente

---

### 8. 🧪 Debug Tests

**O que faz:**
- Executa testes com debug habilitado
- Permite breakpoints em testes

**Como usar:**
1. Coloque breakpoints nos arquivos de teste
2. Selecione "🧪 Debug Tests"
3. Pressione F5

---

## 🔧 Tasks Disponíveis

### Executar Tasks

Pressione **Ctrl+Shift+P** → Digite "Tasks: Run Task"

### Tasks Principais

#### 🚀 Start Full Stack
- Inicia frontend e backend simultaneamente
- Útil para desenvolvimento sem debug

#### npm: dev
- Inicia apenas o frontend (Vite)
- Usado automaticamente pelo debug

#### Start Backend (Backoffice)
- Inicia apenas o backend com debug
- Porta: 3000

#### Kill Port 3000 / 3000
- Mata processos nas portas 3000 ou 3000
- Útil quando a porta está ocupada

#### 🔌 Test MongoDB Connection
- Testa conexão com MongoDB
- Útil para verificar configuração

---

## 🐛 Colocando Breakpoints

### Frontend (React/TypeScript)

1. Abra um arquivo `.tsx` ou `.ts` em `src/`
2. Clique na margem esquerda (ao lado do número da linha)
3. Um ponto vermelho aparecerá
4. Execute o debug (F5)
5. A execução pausará no breakpoint

**Exemplo:**
```typescript
// src/components/Dashboard.tsx
export function Dashboard() {
  const [data, setData] = useState([])
  
  useEffect(() => {
    debugger; // Ou coloque breakpoint aqui
    fetchData()
  }, [])
}
```

### Backend (Node.js/Express)

1. Abra um arquivo `.ts` em `server/backoffice/`
2. Coloque breakpoint na margem esquerda
3. Execute o debug do backend
4. Faça uma requisição que execute aquele código

**Exemplo:**
```typescript
// server/backoffice/routes/documents.ts
router.get('/', async (req, res) => {
  debugger; // Ou coloque breakpoint aqui
  const documents = await fetchDocuments()
  res.json(documents)
})
```

---

## 🔍 Inspecionando Variáveis

### Durante o Debug

Quando a execução pausar em um breakpoint:

1. **Painel Variables:** Mostra todas as variáveis no escopo
2. **Painel Watch:** Adicione expressões para monitorar
3. **Debug Console:** Execute código JavaScript/TypeScript
4. **Call Stack:** Veja a pilha de chamadas

### Atalhos Úteis

- **F5:** Continue (próximo breakpoint)
- **F10:** Step Over (próxima linha)
- **F11:** Step Into (entrar na função)
- **Shift+F11:** Step Out (sair da função)
- **Ctrl+Shift+F5:** Restart
- **Shift+F5:** Stop

---

## 🚨 Problemas Comuns

### 1. "Cannot connect to runtime process"

**Causa:** Porta já está em uso

**Solução:**
```bash
# Windows
npm run kill-ports

# Ou manualmente
FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :3000') DO taskkill /PID %P /F
FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :3000') DO taskkill /PID %P /F
```

### 2. "preLaunchTask 'npm: dev' not found"

**Causa:** Task não está definida no `tasks.json`

**Solução:** ✅ Já corrigido! A task `npm: dev` foi adicionada.

### 3. Breakpoints não funcionam

**Causa:** Source maps não estão corretos

**Solução:**
1. Verifique se `sourceMaps: true` no `vite.config.ts`
2. Limpe o cache: `npm run debug:cache:clear`
3. Reinicie o VS Code

### 4. "Debugger attached" mas não para nos breakpoints

**Causa:** Código foi otimizado ou minificado

**Solução:**
- Use `npm run dev` (não `npm run build`)
- Verifique se está em modo desenvolvimento

### 5. Backend não conecta ao MongoDB

**Causa:** Variáveis de ambiente não configuradas

**Solução:**
1. Copie `.env.example` para `.env`
2. Configure as variáveis obrigatórias
3. Execute: `npm run test-mongodb`

---

## 📊 Monitoramento Durante Debug

### Console do Navegador

Com o debug ativo, você pode:
1. Ver logs do frontend
2. Inspecionar elementos
3. Ver requisições de rede
4. Verificar cache/storage

### Terminal Integrado

Durante o debug, você verá:
- Logs do Vite (frontend)
- Logs do backend (MongoDB, requisições)
- Erros de compilação

### Debug Console

No VS Code, use o Debug Console para:
```javascript
// Avaliar expressões
> data.length
> JSON.stringify(user)

// Chamar funções
> fetchDocuments()

// Modificar variáveis
> data = []
```

---

## 🎯 Fluxo de Debug Recomendado

### Para Desenvolvimento Normal

1. Pressione **F5** (Full Stack Debug)
2. Aguarde Vite iniciar
3. Chrome abre automaticamente
4. Desenvolva normalmente
5. Breakpoints funcionam automaticamente

### Para Debug de Problema Específico

1. Identifique onde está o problema (frontend ou backend)
2. Coloque breakpoints estratégicos
3. Execute o debug apropriado
4. Inspecione variáveis
5. Use Step Over/Into para navegar

### Para Debug de Performance

1. Use "🐛 Debug Cache (Chrome)"
2. Abra Performance tab no DevTools
3. Grave uma sessão
4. Analise o flamegraph

---

## 📚 Recursos Adicionais

- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)
- [Vite Debug](https://vitejs.dev/guide/troubleshooting.html)
- [Node.js Debugging](https://nodejs.org/en/docs/guides/debugging-getting-started/)

---

## ✅ Checklist de Debug

Antes de começar a debugar:

- [ ] `.env` configurado com variáveis corretas
- [ ] MongoDB acessível (teste com `npm run test-mongodb`)
- [ ] Portas 3000 e 3000 livres
- [ ] Dependências instaladas (`npm install`)
- [ ] VS Code atualizado
- [ ] Extensões recomendadas instaladas

---

**🎉 Configuração de debug pronta para uso! 🚀**

**Pressione F5 e comece a debugar!**
