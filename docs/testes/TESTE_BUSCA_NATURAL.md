# 🧪 TESTE: Busca Natural LLM

## ✅ O QUE DEVE FUNCIONAR

### 1. Abrir Ajuda
```
1. Clique no ícone (?) ao lado da busca
2. ✅ Deve abrir painel com exemplos
```

### 2. Clicar em Exemplo
```
1. Clique em qualquer exemplo (ex: "canceladas")
2. ✅ Deve preencher o campo de busca
3. ✅ Deve processar automaticamente
4. ✅ Deve fechar o painel de ajuda
5. ✅ Deve mostrar "Buscando: Status: Cancelada."
6. ✅ Deve filtrar a grid
```

### 3. Digitar Manualmente
```
1. Digite "entrada"
2. Clique "Buscar"
3. ✅ Deve processar
4. ✅ Deve filtrar
```

## 🔍 FLUXO COMPLETO

### Quando clica em exemplo:
```typescript
onClick={() => {
  setQuery(ex.texto)           // Preenche campo
  processarBusca(ex.texto)     // Processa
  setMostrarDicas(false)       // Fecha ajuda
}}
```

### processarBusca faz:
```typescript
1. Analisa o texto
2. Cria objeto de filtros
3. Chama onSearch(filtros)
```

### onSearch (no GridPaginada) faz:
```typescript
handleBuscaNatural(filtros) {
  1. Filtra os dados
  2. Atualiza dadosFiltrados
  3. Grid re-renderiza
}
```

## 🐛 SE NÃO FUNCIONAR

### Verificar Console:
```
🔍 BuscaNatural - Filtros processados: {...}
📝 BuscaNatural - Explicação: "..."
✅ BuscaNatural - Chamando onSearch
```

### Se não aparecer logs:
- processarBusca não está sendo chamado
- Verificar se onClick está funcionando

### Se aparecer logs mas grid não atualiza:
- handleBuscaNatural não está funcionando
- Verificar se setDadosFiltrados está sendo chamado

## 🧪 TESTE PASSO A PASSO

### Teste 1: Console
```
1. Abra console (F12)
2. Clique em exemplo "canceladas"
3. Veja se aparece:
   🔍 BuscaNatural - Filtros processados: {status: "cancelada"}
```

### Teste 2: Campo
```
1. Clique em exemplo
2. Veja se campo de busca foi preenchido
```

### Teste 3: Explicação
```
1. Clique em exemplo
2. Veja se aparece caixa roxa:
   "🔍 Buscando: Status: Cancelada."
```

### Teste 4: Grid
```
1. Clique em exemplo
2. Veja se grid filtra
3. Veja se mostra "(filtrado de X)"
```

## 📋 CHECKLIST

Ao clicar em "canceladas":
- [ ] Campo preencheu com "canceladas"
- [ ] Painel de ajuda fechou
- [ ] Apareceu caixa roxa com explicação
- [ ] Console mostrou logs
- [ ] Grid filtrou
- [ ] Mostra "(filtrado de X)"

## 🔧 SE TUDO FALHAR

Copie e cole aqui:
1. O que você clicou
2. O que apareceu no console
3. O que aconteceu (ou não aconteceu)
4. Print da tela

Com essas informações posso identificar exatamente o problema!
