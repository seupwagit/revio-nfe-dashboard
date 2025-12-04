# 🔄 Como Funciona a Troca de Collections

## ⚠️ IMPORTANTE: Não é pelo .env!

A troca entre as 3 collections (NF-e, CF-e, CT-e) **NÃO é feita** editando o arquivo `.env`!

## ✅ Como Funciona Corretamente

### 1. Collection Padrão no .env
O `.env` define apenas a collection **padrão inicial**:
```env
VITE_DB_COLLECTION=tbl_nfe_100  # Apenas padrão inicial
```

### 2. Troca Dinâmica no Frontend
A troca entre collections é feita **dinamicamente** pelo usuário clicando nos botões:

```
┌──────────────────┬──────────────────┬──────────────────┐
│  📄 NF-e         │  🧾 CF-e         │  🚚 CT-e         │
│  (clique aqui)   │  (clique aqui)   │  (clique aqui)   │
└──────────────────┴──────────────────┴──────────────────┘
```

### 3. Fluxo de Funcionamento

```
Usuário clica em "CF-e"
        ↓
CollectionSelector.tsx atualiza o estado
        ↓
NFContext.tsx recebe nova collection
        ↓
api.ts faz requisição com collection=tbl_cfe_100
        ↓
API Revio retorna dados de CF-e
        ↓
GridCFe.tsx exibe os dados
```

## 📊 Código Responsável

### CollectionSelector.tsx
```typescript
<button onClick={() => onChange('tbl_cfe_100')}>
  🧾 CF-e
</button>
```

### NFContext.tsx
```typescript
const [collection, setCollection] = useState<CollectionType>('tbl_nfe_100')

// Quando collection muda, recarrega dados
useEffect(() => {
  carregarDados()
}, [collection])
```

### api.ts
```typescript
export async function fetchNotasFiscais(filtros: Filtros) {
  const params = {
    collection: filtros.collection || env.database.collection,
    // ... outros parâmetros
  }
  
  const response = await api.get('/WebView/Consultar', { params })
  // ...
}
```

## 🎯 Como Testar as 3 Collections

### Passo a Passo
1. Acesse: http://localhost:5173
2. Clique em "Notas Fiscais"
3. Você verá 3 botões:

#### Teste 1: NF-e
```
Clique em: 📄 NF-e
Resultado: Grid mostra notas fiscais eletrônicas
Collection: tbl_nfe_100
```

#### Teste 2: CF-e
```
Clique em: 🧾 CF-e
Resultado: Grid muda e mostra cupons fiscais
Collection: tbl_cfe_100
```

#### Teste 3: CT-e
```
Clique em: 🚚 CT-e
Resultado: Grid muda e mostra conhecimentos de transporte
Collection: tbl_cte_100
```

## 🔍 Como Verificar nos Logs

### Logs do Proxy
Ao clicar em cada botão, você verá no terminal do proxy:

```bash
# Clicou em NF-e
🔄 Proxy: GET .../Consultar?collection=tbl_nfe_100
✅ Status: 200

# Clicou em CF-e
🔄 Proxy: GET .../Consultar?collection=tbl_cfe_100
✅ Status: 200

# Clicou em CT-e
🔄 Proxy: GET .../Consultar?collection=tbl_cte_100
✅ Status: 200
```

### Console do Navegador (F12)
```javascript
🚀 REQUISIÇÃO API
URL: /WebView/Consultar
Params: {collection: "tbl_cfe_100", ...}

✅ RESPOSTA API
Status: 200 OK
```

## ❌ Erro Comum

### ❌ ERRADO: Editar .env com 3 linhas
```env
VITE_DB_COLLECTION=tbl_nfe_100
VITE_DB_COLLECTION=tbl_cfe_100  # ❌ Não funciona!
VITE_DB_COLLECTION=tbl_cte_100  # ❌ Apenas a última é usada
```

### ✅ CORRETO: Deixar apenas 1 linha no .env
```env
VITE_DB_COLLECTION=tbl_nfe_100  # ✅ Padrão inicial
```

E trocar clicando nos botões da interface!

## 🎨 Visual da Interface

### Estado Inicial (NF-e selecionado)
```
┌──────────────────────────────────────────────────────┐
│  [📄 NF-e]  [🧾 CF-e]  [🚚 CT-e]                    │
│   ↑ AZUL     CINZA      CINZA                        │
└──────────────────────────────────────────────────────┘
│  Grid de Notas Fiscais Eletrônicas                   │
│  Número │ Série │ Chave │ Emitente │ Valor           │
└──────────────────────────────────────────────────────┘
```

### Após Clicar em CF-e
```
┌──────────────────────────────────────────────────────┐
│  [📄 NF-e]  [🧾 CF-e]  [🚚 CT-e]                    │
│    CINZA    ↑ AZUL      CINZA                        │
└──────────────────────────────────────────────────────┘
│  Grid de Cupons Fiscais Eletrônicos                  │
│  Número │ Nº SAT │ Cliente │ Formas Pgto │ Valor    │
└──────────────────────────────────────────────────────┘
```

### Após Clicar em CT-e
```
┌──────────────────────────────────────────────────────┐
│  [📄 NF-e]  [🧾 CF-e]  [🚚 CT-e]                    │
│    CINZA     CINZA     ↑ AZUL                        │
└──────────────────────────────────────────────────────┘
│  Grid de Conhecimentos de Transporte                 │
│  Número │ Tomador │ Remetente │ Carga │ Valor        │
└──────────────────────────────────────────────────────┘
```

## 📊 Dados Retornados por Collection

### tbl_nfe_100 (NF-e)
```json
{
  "numero": "12345",
  "serie": "1",
  "naturezaOperacao": "Venda",
  "emitente": {...},
  "destinatario": {...},
  "totais": {...}
}
```

### tbl_cfe_100 (CF-e)
```json
{
  "numero": "54321",
  "numeroSAT": "123456",
  "emitente": {...},
  "destinatario": {...},
  "pagamento": {
    "meios": [...]
  }
}
```

### tbl_cte_100 (CT-e)
```json
{
  "numero": "98765",
  "tipoServico": "Normal",
  "tomador": {...},
  "remetente": {...},
  "carga": {...},
  "rodoviario": {...}
}
```

## ✅ Confirmação de Funcionamento

O sistema está funcionando corretamente se:

1. ✅ Ao clicar em cada botão, a grid muda
2. ✅ Os dados exibidos são diferentes
3. ✅ Os logs mostram collection diferente em cada requisição
4. ✅ Todas retornam Status 200

## 🎯 Resumo

**NÃO EDITE** o `.env` com múltiplas linhas de `VITE_DB_COLLECTION`!

A troca é feita **automaticamente** pelo sistema quando você clica nos botões da interface.

O `.env` define apenas o **padrão inicial** quando a página carrega pela primeira vez.

---

**Pronto!** Agora você entende como funciona a troca de collections! 🚀
