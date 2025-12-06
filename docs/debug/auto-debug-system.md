# 🤖 Sistema Automático de Debug com Chrome DevTools MCP

Sistema completo de monitoramento e correção automática de bugs usando Chrome DevTools MCP e IA.

## 🎯 O que o Sistema Faz

### 1. Monitoramento Automático
- ✅ Monitora console do Chrome em tempo real
- ✅ Detecta erros e warnings automaticamente
- ✅ Analisa causa raiz dos problemas
- ✅ Gera relatórios detalhados

### 2. Análise Inteligente
- ✅ Identifica padrões de erro conhecidos
- ✅ Classifica por severidade (crítico, erro, warning)
- ✅ Categoriza por tipo (cache, network, javascript, auth)
- ✅ Sugere soluções específicas

### 3. Correção Automática
- ✅ Aplica correções para erros conhecidos
- ✅ Modifica arquivos automaticamente
- ✅ Pede confirmação antes de aplicar
- ✅ Mantém histórico de correções

## 🚀 Como Usar

### Modo 1: Comando Único

Peça ao Kiro:

```
"Monitore o console e me avise se houver erros"
```

**Resultado:**
```
🔍 Verificando console...

❌ 2 erro(s) detectado(s):

1. Network Error
   Mensagem: Failed to load resource: net::ERR_CONNECTION_REFUSED
   Arquivo: api.ts:156
   💡 Solução: Iniciar servidor proxy com 'npm run proxy'

2. TypeError
   Mensagem: Cannot read property 'razaoSocial' of undefined
   Arquivo: GridPaginadaLocal.tsx:89
   💡 Solução: Adicionar verificação: item.emitente?.razaoSocial
```

### Modo 2: Monitoramento Contínuo

Peça ao Kiro:

```
"Inicie monitoramento contínuo do console"
```

**Resultado:**
- Verifica console a cada 5 segundos
- Notifica imediatamente quando houver erro
- Mantém histórico de erros
- Gera relatório ao final

### Modo 3: Auto-Fix

Peça ao Kiro:

```
"Ative modo de correção automática de bugs"
```

**Resultado:**
- Monitora console
- Detecta erros conhecidos
- Aplica correções automaticamente
- Pede confirmação antes de aplicar

## 📊 Exemplo Real

### Cenário: Servidor Proxy Não Está Rodando

**1. Kiro Detecta:**
```
❌ Erro detectado:
   Tipo: Network Error - ERR_CONNECTION_REFUSED
   URL: http://localhost:3000/api/WebView/Consultar
   Severidade: 🔴 CRÍTICO
```

**2. Kiro Analisa:**
```
🔍 Analisando causa raiz...

Causa identificada:
   Servidor proxy não está rodando na porta 3000

Impacto:
   🔴 Aplicação não funcional
   🔴 Não consegue buscar dados
   🔴 UI mostra erro para usuário
```

**3. Kiro Sugere:**
```
💡 Solução sugerida:

Passo 1: Iniciar servidor proxy
   npm run proxy

Passo 2: Verificar conectividade
   curl http://localhost:3000/api/WebView/Consultar

Passo 3: Recarregar aplicação
   F5 no navegador

🔧 Aplicar correção automaticamente? (sim/não)
```

**4. Você Confirma:**
```
"Sim, aplique a correção"
```

**5. Kiro Executa:**
```
✅ Executando correção...

1. Iniciando servidor proxy...
   ✅ Servidor iniciado na porta 3000

2. Verificando conectividade...
   ✅ Servidor respondendo

3. Recarregando aplicação...
   ✅ Aplicação recarregada

✅ Correção aplicada com sucesso!
   Aplicação agora está funcional
```

## 🔍 Padrões de Erro Detectados

| Padrão | Categoria | Severidade | Correção Automática |
|--------|-----------|------------|---------------------|
| ERR_CONNECTION_REFUSED | network | 🔴 Crítico | Iniciar servidor |
| Cache EXPIRADO | cache | ⚠️ Warning | Aumentar duração |
| Cache MISS | cache | ℹ️ Info | Normal (primeira vez) |
| TypeError | javascript | 🔴 Erro | Adicionar verificação |
| Cannot read property | javascript | 🔴 Erro | Optional chaining |
| Unauthorized | auth | 🔴 Crítico | Validar token |
| CORS | network | 🔴 Erro | Configurar headers |
| 404 | network | 🔴 Erro | Verificar URL |
| timeout | network | ⚠️ Warning | Aumentar timeout |

## 🛠️ Correções Automáticas Disponíveis

### 1. Network Errors

**ERR_CONNECTION_REFUSED:**
```bash
# Detecta que servidor não está rodando
# Executa automaticamente:
npm run proxy
```

**Unauthorized (401):**
```bash
# Detecta token inválido
# Sugere:
1. Verificar .env
2. Gerar novo token
3. Atualizar configuração
```

### 2. JavaScript Errors

**Cannot read property 'X' of undefined:**
```typescript
// Antes:
const nome = item.emitente.razaoSocial

// Depois (aplicado automaticamente):
const nome = item.emitente?.razaoSocial || 'N/A'
```

**TypeError:**
```typescript
// Antes:
if (data.length > 0) {
  // ...
}

// Depois:
if (data && Array.isArray(data) && data.length > 0) {
  // ...
}
```

### 3. Cache Issues

**Cache EXPIRADO:**
```typescript
// Antes:
private readonly CACHE_DURATION = 90 * 60 * 1000

// Depois:
private readonly CACHE_DURATION = 120 * 60 * 1000
```

## 📈 Relatórios Gerados

### Relatório Básico
```markdown
# Debug Report

## Erros Detectados: 2
## Warnings: 1
## Info: 45

### Erro 1: Network Error
- Severidade: Crítico
- Causa: Servidor não rodando
- Solução: npm run proxy
- Status: ✅ Corrigido

### Erro 2: TypeError
- Severidade: Erro
- Causa: Propriedade undefined
- Solução: Optional chaining
- Status: ⏳ Pendente
```

### Relatório Completo
- Todos os logs do console
- Network requests (sucesso e falha)
- Performance metrics
- LocalStorage status
- Cache statistics
- Timeline de eventos
- Sugestões de otimização

## 🎯 Comandos Úteis

### Monitoramento
```
"Monitore o console"
"Verifique se há erros"
"Mostre os últimos 50 logs"
"Filtre apenas erros críticos"
```

### Análise
```
"Analise a causa do erro"
"Por que o cache não está funcionando?"
"Por que a requisição falhou?"
"Qual o impacto deste erro?"
```

### Correção
```
"Corrija este erro automaticamente"
"Aplique a solução sugerida"
"Reverta a última correção"
"Mostre o que foi alterado"
```

### Relatórios
```
"Gere um relatório de debug"
"Mostre histórico de erros"
"Exporte relatório em JSON"
"Envie relatório por email"
```

## 💡 Dicas

### 1. Use Monitoramento Contínuo Durante Desenvolvimento
```
"Inicie monitoramento contínuo"
```
Deixe rodando enquanto desenvolve. Kiro avisa imediatamente de qualquer erro.

### 2. Revise Correções Antes de Aplicar
```
"Mostre o que será alterado antes de aplicar"
```
Sempre revise mudanças automáticas antes de confirmar.

### 3. Mantenha Histórico de Erros
```
"Salve este erro no histórico"
```
Útil para identificar padrões e problemas recorrentes.

### 4. Configure Alertas
```
"Me notifique apenas de erros críticos"
```
Evita spam de warnings não importantes.

### 5. Teste Correções em Dev Primeiro
```
"Aplique correção apenas em ambiente de dev"
```
Nunca aplique correções automáticas direto em produção.

## 🔗 Arquivos do Sistema

- **`scripts/auto-debug-monitor.mjs`** - Monitor automático
- **`scripts/chrome-debug-watcher.md`** - Comandos para Kiro
- **`debug-report-auto.md`** - Relatório gerado
- **`debug-monitor.log`** - Histórico de erros

## 📚 Recursos

- [Chrome DevTools MCP](./chrome-devtools-mcp.md)
- [VSCode Debug Setup](./vscode-debug-setup.md)
- [Cache System](./cache-system.md)

---

**Sistema desenvolvido com Chrome DevTools MCP + IA**
**Última atualização:** 01/12/2024
