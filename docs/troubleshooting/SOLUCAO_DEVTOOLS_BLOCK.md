# 🔧 Solução: DevTools Bloqueando Requisição

## Problema
```
Request was blocked by DevTools
```

## Solução Rápida (3 passos)

### 1. Desabilitar Request Blocking

1. Abra DevTools (F12)
2. Vá para aba **Network**
3. Procure por um ícone de **bloqueio** 🚫 ou **filtro**
4. Clique nele
5. Desmarque **"Enable request blocking"**

### 2. Limpar e Recarregar

```
1. Ctrl+Shift+Delete (Limpar cache)
2. Marcar "Cached images and files"
3. Limpar
4. Ctrl+F5 (Hard reload)
```

### 3. Testar em Modo Anônimo

```
1. Ctrl+Shift+N (Janela anônima)
2. Acesse http://localhost:3000
3. Se funcionar, o problema é uma extensão
```

## Se Ainda Não Funcionar

### Opção A: Desabilitar Extensões

1. Vá para `chrome://extensions`
2. Desabilite TODAS as extensões
3. Recarregue a página
4. Se funcionar, habilite uma por uma

### Opção B: Resetar DevTools

1. DevTools → Settings (⚙️)
2. **Preferences** → **Restore defaults and reload**

### Opção C: Testar API com Curl

```bash
curl "http://localhost:3000/api/documents?collection=tbl_nfe_100&page=1&size=10&dtIni=2024-01-01&dtFim=2024-12-31"
```

Se curl funcionar, o problema é definitivamente no navegador.

## Causa Mais Comum

**Request Blocking** ativo no DevTools para debug.

## Como Evitar

Não use **Request Blocking** no DevTools a menos que esteja debugando especificamente isso.

## Verificação Rápida

```javascript
// Cole no Console (F12 → Console):

fetch('http://localhost:3000/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ API OK:', d))
  .catch(e => console.error('❌ Erro:', e))
```

Se funcionar, a API está OK e o problema é configuração do navegador.

## Resumo

1. ✅ Desabilitar Request Blocking no DevTools
2. ✅ Limpar cache (Ctrl+Shift+Delete)
3. ✅ Testar em modo anônimo
4. ✅ Desabilitar extensões se necessário

**Solução mais rápida**: Modo anônimo (Ctrl+Shift+N)
