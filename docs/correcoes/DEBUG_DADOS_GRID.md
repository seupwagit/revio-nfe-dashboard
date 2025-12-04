# 🔍 Debug - Dados da Grid Vazios

## ❌ Problema

Grid mostra apenas traços "-" mesmo tendo 52 registros.

## 🔎 Causa Provável

Os dados retornados pela API não têm a estrutura esperada. O TanStack Table está tentando acessar campos aninhados que retornam `undefined`:

```
"pagamento.forma" → undefined
"transporte.modalidade" → undefined
"transporte.transportadora.razaoSocial" → undefined
"transporte.veiculo.placa" → undefined
```

## 🧪 Como Investigar

### 1. Abra o Console do Navegador (F12)

### 2. Procure por:
```javascript
📊 GridNFe - Dados recebidos: Array(52)
📊 GridNFe - Primeiro item: {…}
```

### 3. Expanda o "Primeiro item" e veja a estrutura

### 4. Me diga o que aparece

Exemplo do que procurar:
```javascript
{
  id: "...",
  numero: "12345",
  serie: "1",
  chaveAcesso: "...",
  emitente: {
    cnpj: "...",
    razaoSocial: "..."
  },
  // Tem esses campos?
  transporte: undefined,  // ❌ Problema!
  pagamento: undefined,   // ❌ Problema!
  totais: undefined       // ❌ Problema!
}
```

## 🔧 Possíveis Soluções

### Solução 1: Dados Não Têm Esses Campos

Se a API não retorna `transporte`, `pagamento`, etc., precisamos:
1. Remover essas colunas da grid
2. Ou torná-las opcionais

### Solução 2: Mapeamento Incorreto

Se os dados vêm com nomes diferentes, precisamos:
1. Ajustar o mapeamento em `src/services/api.ts`
2. Verificar como a API retorna os dados

### Solução 3: Dados Vêm em Formato Diferente

Se os dados vêm em outro formato (ex: XML, string), precisamos:
1. Parsear os dados corretamente
2. Transformar para o formato esperado

## 📋 Checklist de Debug

1. [ ] Abrir console (F12)
2. [ ] Recarregar página
3. [ ] Procurar logs "📊 GridNFe"
4. [ ] Expandir "Primeiro item"
5. [ ] Copiar estrutura completa
6. [ ] Me enviar a estrutura

## 🎯 O Que Preciso Saber

**Me envie a estrutura do primeiro item que aparece no console!**

Exemplo de como copiar:
1. Clique com botão direito no objeto
2. "Copy object"
3. Cole aqui

Ou tire um print mostrando a estrutura expandida.

---

**Aguardando informações para corrigir!** 🔍
