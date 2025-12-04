# Exemplos Práticos de Debug

## 🎯 Exemplo 1: Debug de Carregamento de Dados

### Problema
Dashboard não está mostrando dados.

### Solução com Debug

**1. Adicione breakpoints:**

```typescript
// src/pages/Dashboard.tsx
useEffect(() => {
  debugger; // ← Breakpoint 1
  loadDocuments();
}, []);

// src/hooks/useDocuments.ts
async function loadDocuments() {
  debugger; // ← Breakpoint 2
  const response = await api.get('/documents');
  debugger; // ← Breakpoint 3
  setDocuments(response.data);
}

// server/backoffice/routes/documents.ts
router.get('/api/documents', async (req, res) => {
  debugger; // ← Breakpoint 4
  const docs = await fetchFromMongoDB();
  debugger; // ← Breakpoint 5
  res.json(docs);
});
```

**2. Execute F5 e navegue:**

```
Breakpoint 1 (Dashboard useEffect)
├─ Variables: documents = []
├─ Watch: documents.length → 0
└─ Continue (F5)

Breakpoint 2 (loadDocuments início)
├─ Variables: loading = true
└─ Continue (F5)

Breakpoint 4 (Backend handler)
├─ Variables: req.query = { page: 1, size: 500 }
├─ Debug Console: console.log(req.query)
└─ Continue (F5)

Breakpoint 5 (Backend antes de responder)
├─ Variables: docs.length = 5199
├─ Watch: docs[0].valorTotal → 327.40
└─ Continue (F5)

Breakpoint 3 (loadDocuments após resposta)
├─ Variables: response.data.length = 5199
├─ Watch: response.status → 200
└─ Continue (F5)

✅ Dados carregados com sucesso!
```

---

## 🎯 Exemplo 2: Debug de Filtros

### Problema
Filtros de data não estão funcionando.

### Solução com Debug

**1. Adicione conditional breakpoint:**

```typescript
// src/components/Filters.tsx
function handleApplyFilters() {
  // Breakpoint condicional: startDate > endDate
  const filters = {
    startDate,
    endDate
  };
  onApply(filters);
}
```

**2. Configure breakpoint:**
- Clique com botão direito no breakpoint
- "Edit Breakpoint" → "Expression"
- Digite: `new Date(startDate) > new Date(endDate)`

**3. Teste:**
```
Usuário seleciona:
├─ startDate: "2025-01-01"
└─ endDate: "2024-01-01"

Breakpoint ativa! (data inválida)
├─ Variables:
│   ├─ startDate: "2025-01-01"
│   └─ endDate: "2024-01-01"
├─ Debug Console:
│   > new Date(startDate) > new Date(endDate)
│   → true ❌
└─ Solução: Adicionar validação
```

---

## 🎯 Exemplo 3: Debug de Performance

### Problema
Carregamento lento de documentos.

### Solução com Debug

**1. Use logpoints para medir tempo:**

```typescript
// src/hooks/useDocuments.ts
async function loadDocuments() {
  const startTime = performance.now();
  // Logpoint: "Início carregamento: {startTime}ms"
  
  const response = await api.get('/documents');
  // Logpoint: "API respondeu em: {performance.now() - startTime}ms"
  
  const processed = processDocuments(response.data);
  // Logpoint: "Processamento levou: {performance.now() - startTime}ms"
  
  setDocuments(processed);
  // Logpoint: "Total: {performance.now() - startTime}ms"
}
```

**2. Analise os logs:**
```
Início carregamento: 0ms
API respondeu em: 1640ms ← Lento!
Processamento levou: 1645ms
Total: 1645ms

Conclusão: API está lenta, não o processamento
```

**3. Debug no backend:**

```typescript
// server/backoffice/routes/documents.ts
router.get('/api/documents', async (req, res) => {
  const startTime = Date.now();
  // Logpoint: "Query iniciada"
  
  const docs = await collection.find(query).toArray();
  // Logpoint: "Query levou: {Date.now() - startTime}ms"
  
  const transformed = transformDocuments(docs);
  // Logpoint: "Transform levou: {Date.now() - startTime}ms"
  
  res.json(transformed);
});
```

**Resultado:**
```
Query iniciada
Query levou: 1500ms ← Problema aqui!
Transform levou: 1510ms

Solução: Adicionar índice no MongoDB
```

---

## 🎯 Exemplo 4: Debug de Estado React

### Problema
Estado não atualiza após ação.

### Solução com Debug

**1. Watch expressions:**

```typescript
// src/pages/Dashboard.tsx
function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [filters, setFilters] = useState({});
  
  // Adicione watches:
  // - documents.length
  // - filters
  // - JSON.stringify(filters)
  
  function handleFilterChange(newFilters) {
    debugger; // ← Breakpoint aqui
    setFilters(newFilters);
  }
}
```

**2. Inspecione no breakpoint:**

```
Antes do setState:
├─ Watch:
│   ├─ documents.length → 5199
│   ├─ filters → { startDate: "2024-01-01" }
│   └─ newFilters → { startDate: "2025-01-01" }
└─ Step Over (F10)

Após setState:
├─ Watch:
│   ├─ documents.length → 5199 (não mudou ainda)
│   ├─ filters → { startDate: "2024-01-01" } (não mudou ainda!)
│   └─ newFilters → { startDate: "2025-01-01" }
└─ Continue (F5)

Próximo render:
├─ Watch:
│   ├─ documents.length → 5199
│   └─ filters → { startDate: "2025-01-01" } ✅
└─ Estado atualizado!
```

---

## 🎯 Exemplo 5: Debug de Erro de API

### Problema
Erro 500 ao carregar documentos.

### Solução com Debug

**1. Adicione breakpoint com try/catch:**

```typescript
// src/services/api.ts
async function getDocuments(filters) {
  try {
    debugger; // ← Breakpoint 1
    const response = await axios.get('/api/documents', {
      params: filters
    });
    debugger; // ← Breakpoint 2
    return response.data;
  } catch (error) {
    debugger; // ← Breakpoint 3 (erro)
    console.error('Erro ao carregar:', error);
    throw error;
  }
}
```

**2. Backend:**

```typescript
// server/backoffice/routes/documents.ts
router.get('/api/documents', async (req, res) => {
  try {
    debugger; // ← Breakpoint 4
    const { collection, startDate, endDate } = req.query;
    
    debugger; // ← Breakpoint 5
    const docs = await db.collection(collection).find({
      dataEmissao: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }).toArray();
    
    debugger; // ← Breakpoint 6
    res.json(docs);
  } catch (error) {
    debugger; // ← Breakpoint 7 (erro)
    console.error('Erro no backend:', error);
    res.status(500).json({ error: error.message });
  }
});
```

**3. Fluxo de debug:**

```
Breakpoint 1 (Frontend antes da requisição)
├─ Variables: filters = { startDate: "invalid-date" }
└─ Continue (F5)

Breakpoint 4 (Backend recebe requisição)
├─ Variables: req.query = { startDate: "invalid-date" }
└─ Continue (F5)

Breakpoint 5 (Backend antes da query)
├─ Variables: startDate = "invalid-date"
├─ Debug Console:
│   > new Date(startDate)
│   → Invalid Date ❌
└─ Continue (F5)

Breakpoint 7 (Backend erro)
├─ Variables:
│   └─ error.message = "Invalid date format"
└─ Continue (F5)

Breakpoint 3 (Frontend erro)
├─ Variables:
│   ├─ error.response.status = 500
│   └─ error.response.data = { error: "Invalid date format" }
└─ Solução: Validar data antes de enviar
```

---

## 🎯 Exemplo 6: Debug de Agregação MongoDB

### Problema
Totalizadores retornando valores errados.

### Solução com Debug

**1. Backend com pipeline inspection:**

```typescript
// server/backoffice/routes/analytics.ts
router.get('/api/analytics', async (req, res) => {
  const pipeline = [
    { $match: { status: 'autorizada' } },
    { $group: {
        _id: null,
        total: { $sum: '$valorTotal' },
        count: { $sum: 1 }
      }
    }
  ];
  
  debugger; // ← Breakpoint aqui
  const result = await collection.aggregate(pipeline).toArray();
  debugger; // ← E aqui
  
  res.json(result[0]);
});
```

**2. Debug Console:**

```javascript
// No breakpoint, teste a query:
> await collection.find({ status: 'autorizada' }).count()
→ 2476

> await collection.aggregate([
    { $match: { status: 'autorizada' } },
    { $group: { _id: null, count: { $sum: 1 } } }
  ]).toArray()
→ [{ _id: null, count: 2476 }] ✅

> await collection.aggregate([
    { $match: { status: 'autorizada' } },
    { $group: {
        _id: null,
        total: { $sum: '$valorTotal' }
      }
    }
  ]).toArray()
→ [{ _id: null, total: 0 }] ❌

// Problema: campo valorTotal não existe!
> await collection.findOne({ status: 'autorizada' })
→ { ..., vTotal: 327.40 } // Campo correto é vTotal

// Correção:
> pipeline[1].$group.total = { $sum: '$vTotal' }
```

---

## 🎯 Exemplo 7: Debug de Componente React

### Problema
Componente não re-renderiza.

### Solução com Debug

**1. Adicione breakpoint no render:**

```typescript
// src/components/DocumentGrid.tsx
function DocumentGrid({ documents, onSelect }) {
  debugger; // ← Breakpoint no início do render
  
  console.log('Render:', {
    documentsLength: documents.length,
    firstDoc: documents[0]
  });
  
  return (
    <div>
      {documents.map(doc => (
        <DocumentRow
          key={doc._id}
          document={doc}
          onClick={() => onSelect(doc)}
        />
      ))}
    </div>
  );
}
```

**2. Watch expressions:**

```
documents.length
documents[0]?._id
documents === prevDocuments (use React DevTools)
```

**3. Análise:**

```
Render 1:
├─ documents.length → 5199
├─ documents[0]._id → "c78b4c4e..."
└─ Renderizado ✅

Ação do usuário (filtro)
└─ Esperado: Render 2

Render 2 não acontece! ❌

Debug:
├─ Parent component:
│   └─ setDocuments(newDocs)
│       └─ newDocs === documents (mesma referência!)
└─ Solução: Criar novo array
    └─ setDocuments([...newDocs])
```

---

## 💡 Dicas Avançadas

### 1. Debug de Promises

```typescript
async function loadData() {
  debugger; // ← Breakpoint 1
  
  const promise = api.get('/data');
  debugger; // ← Breakpoint 2 (promise pendente)
  
  const result = await promise;
  debugger; // ← Breakpoint 3 (promise resolvida)
  
  return result;
}
```

### 2. Debug de Callbacks

```typescript
documents.forEach((doc, index) => {
  // Conditional breakpoint: index === 0
  debugger;
  processDocument(doc);
});
```

### 3. Debug de Event Handlers

```typescript
<button onClick={(e) => {
  debugger; // ← Inspecione o evento
  handleClick(e);
}}>
  Click me
</button>
```

---

## 📚 Recursos

- Use `console.table(data)` para visualizar arrays
- Use `console.time()` / `console.timeEnd()` para medir performance
- Use React DevTools para inspecionar props e state
- Use Network tab para ver requisições HTTP

---

**Próximos Passos:**
1. Pratique com estes exemplos
2. Crie seus próprios cenários
3. Explore o Debug Console
4. Domine conditional breakpoints
