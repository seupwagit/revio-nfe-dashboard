# 🔍 Chrome Debug Watcher - Comandos para Kiro

Este documento contém comandos que você pode pedir ao Kiro para monitorar e corrigir bugs automaticamente usando Chrome DevTools MCP.

## 🚀 Comandos Básicos

### 1. Monitorar Console em Tempo Real

```
"Monitore o console do Chrome e me avise se houver erros"
```

**O que faz:**
- Lista mensagens do console
- Filtra erros e warnings
- Mostra detalhes de cada erro

### 2. Analisar Erros Recentes

```
"Mostre os últimos erros do console e sugira correções"
```

**O que faz:**
- Busca últimos 50 logs
- Identifica padrões de erro
- Sugere soluções específicas

### 3. Verificar Cache

```
"Verifique se há erros relacionados ao cache"
```

**O que faz:**
- Filtra logs com "cache", "Cache", "💾"
- Analisa idade do cache
- Verifica se está expirando prematuramente

### 4. Monitorar Network Requests

```
"Mostre requisições da API que falharam"
```

**O que faz:**
- Lista requisições com status 4xx ou 5xx
- Mostra tempo de resposta
- Identifica timeouts

### 5. Executar Diagnóstico Completo

```
"Execute um diagnóstico completo da aplicação"
```

**O que faz:**
- Verifica console logs
- Verifica network requests
- Verifica localStorage
- Verifica performance
- Gera relatório completo

## 🔧 Comandos de Correção Automática

### 1. Corrigir Erro de Cache

```
"Corrija o erro de cache expirado"
```

**O que faz:**
- Identifica problema no streamingCache.ts
- Aumenta CACHE_DURATION
- Aplica correção no arquivo

### 2. Corrigir Erro de Tipo

```
"Corrija o erro 'Cannot read property X of undefined'"
```

**O que faz:**
- Identifica linha do erro
- Adiciona verificação de existência
- Aplica optional chaining (?.)

### 3. Corrigir Erro de Network

```
"Corrija o erro de autenticação da API"
```

**O que faz:**
- Verifica .env
- Valida token
- Sugere regenerar token se necessário

### 4. Corrigir CORS

```
"Corrija o erro de CORS"
```

**O que faz:**
- Verifica configuração do servidor
- Sugere adicionar headers
- Ou sugere usar proxy

## 🎯 Comandos Avançados

### 1. Monitoramento Contínuo

```
"Inicie monitoramento contínuo do console e me avise de qualquer erro"
```

**O que faz:**
- Verifica console a cada 5 segundos
- Notifica imediatamente quando houver erro
- Mantém histórico de erros

### 2. Auto-Fix Mode

```
"Ative modo de correção automática de bugs"
```

**O que faz:**
- Monitora console
- Detecta erros conhecidos
- Aplica correções automaticamente
- Pede confirmação antes de aplicar

### 3. Debug Session

```
"Inicie uma sessão de debug completa"
```

**O que faz:**
- Abre DevTools automaticamente
- Coloca breakpoints em pontos críticos
- Monitora variáveis importantes
- Gera relatório ao final

### 4. Performance Analysis

```
"Analise a performance e sugira otimizações"
```

**O que faz:**
- Mede tempo de carregamento
- Identifica gargalos
- Sugere otimizações específicas
- Mostra antes/depois

## 📊 Exemplos de Uso

### Exemplo 1: Erro de Cache

**Você:**
```
"Monitore o console e me avise se houver erros"
```

**Kiro detecta:**
```
❌ Erro detectado:
   Tipo: Cache EXPIRADO
   Mensagem: ⏰ Cache EXPIRADO (95 minutos): removendo
   Arquivo: streamingCache.ts:48
   
💡 Solução sugerida:
   Aumentar CACHE_DURATION de 90 para 120 minutos
   
🔧 Aplicar correção automaticamente? (sim/não)
```

**Você:**
```
"Sim, aplique a correção"
```

**Kiro aplica:**
```
✅ Correção aplicada!
   Arquivo: src/services/streamingCache.ts
   Linha 24: private readonly CACHE_DURATION = 120 * 60 * 1000
   
🔄 Reinicie o servidor para aplicar mudanças
```

### Exemplo 2: Erro de Tipo

**Você:**
```
"Analise os erros do console"
```

**Kiro detecta:**
```
❌ Erro detectado:
   Tipo: TypeError
   Mensagem: Cannot read property 'razaoSocial' of undefined
   Arquivo: GridPaginadaLocal.tsx:156
   
💡 Solução sugerida:
   Adicionar verificação: item.emitente?.razaoSocial
   
📝 Código atual:
   const nome = item.emitente.razaoSocial
   
📝 Código corrigido:
   const nome = item.emitente?.razaoSocial || 'N/A'
   
🔧 Aplicar correção? (sim/não)
```

### Exemplo 3: Erro de Network

**Você:**
```
"Verifique erros de rede"
```

**Kiro detecta:**
```
❌ Erro detectado:
   Tipo: 401 Unauthorized
   URL: https://api.revio.com.br/consulta
   
💡 Solução sugerida:
   Token de autenticação inválido ou expirado
   
🔍 Verificando .env...
   ✅ VITE_API_BEARER_TOKEN está definido
   ⚠️  Token pode estar expirado
   
📚 Próximos passos:
   1. Gere um novo token em: https://api.revio.com.br/token
   2. Atualize o .env com o novo token
   3. Reinicie o servidor
   
💡 Quer que eu abra a página de geração de token?
```

## 🛠️ Configuração

### Habilitar Monitoramento Automático

Adicione ao `.vscode/tasks.json`:

```json
{
  "label": "Monitor: Start Auto-Debug",
  "type": "shell",
  "command": "node scripts/auto-debug-monitor.mjs",
  "isBackground": true,
  "problemMatcher": []
}
```

### Configurar Auto-Fix

Edite `scripts/auto-debug-monitor.mjs`:

```javascript
const CONFIG = {
  checkInterval: 5000,
  autoFix: true, // ← Mude para true
  // ...
}
```

## 📚 Padrões de Erro Detectados

| Padrão | Categoria | Solução Automática |
|--------|-----------|-------------------|
| Cache MISS | cache | Verificar salvamento |
| Cache EXPIRADO | cache | Aumentar duração |
| TypeError | javascript | Adicionar verificação |
| Cannot read property | javascript | Optional chaining |
| Network Error | network | Verificar conectividade |
| CORS | network | Configurar headers |
| Unauthorized | auth | Validar token |
| 404 | network | Verificar URL |
| timeout | network | Aumentar timeout |

## 💡 Dicas

1. **Use monitoramento contínuo** durante desenvolvimento
2. **Revise correções automáticas** antes de aplicar
3. **Mantenha log de erros** para análise posterior
4. **Configure alertas** para erros críticos
5. **Teste correções** em ambiente de dev primeiro

## 🔗 Recursos

- [Chrome DevTools MCP](../docs/debug/chrome-devtools-mcp.md)
- [Auto Debug Monitor](./auto-debug-monitor.mjs)
- [VSCode Debug Setup](../docs/debug/vscode-debug-setup.md)

---

**Última atualização:** 01/12/2024
