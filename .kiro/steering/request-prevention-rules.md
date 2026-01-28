# Steering: Request Prevention - Regras Críticas

## **REGRAS CRÍTICAS PARA PREVENÇÃO DE REQUISIÇÕES EXCESSIVAS**

### **Problema: Milhões de Requisições Desnecessárias**

**Cenário Comum:**
- Usuário digita rapidamente em campo de busca
- Cada keystroke dispara uma requisição
- 10 caracteres = 10 requisições
- 100 usuários simultâneos = 1000 requisições/segundo
- Sistema sobrecarregado, custos elevados, performance degradada

**Solução Obrigatória: Camadas de Proteção**

## **Camada 1: Throttling (OBRIGATÓRIO)**

### **SEMPRE aplicar throttle em requisições de rede**

```typescript
// ✅ CORRETO - Throttle aplicado
const requestController = new RequestController();

const searchResults = await requestController.request(
  'search-query',
  (signal) => fetch('/api/search?q=' + query, { signal }),
  {
    throttleMs: 300,  // Máximo 1 request a cada 300ms
    deduplicate: true,
    cacheMs: 300000   // Cache por 5 minutos
  }
);

// ❌ INCORRETO - Sem throttle
const searchResults = await fetch('/api/search?q=' + query);
```

**Benefício:**
- 10 keystrokes em 1 segundo = 1 requisição (9 prevenidas)
- 90% de redução de requisições

### **Configuração de Throttle Obrigatória**

```typescript
export const THROTTLE_CONFIG = {
  // Busca/filtros: 300ms (padrão)
  SEARCH: 300,
  FILTER: 300,
  AUTOCOMPLETE: 300,
  
  // Operações críticas: 500ms
  SAVE: 500,
  DELETE: 500,
  
  // Analytics: 1000ms
  ANALYTICS: 1000,
  METRICS: 1000,
} as const;
```

## **Camada 2: Request Deduplication (OBRIGATÓRIO)**

### **SEMPRE deduplic requisições simultâneas idênticas**

```typescript
// ✅ CORRETO - Deduplicação automática
// 3 componentes fazem a mesma requisição simultaneamente
// Resultado: 1 requisição real, 3 componentes recebem o mesmo resultado

const deduplicator = new RequestDeduplicator();

// Componente A
const dataA = await deduplicator.deduplicate('user-123', fetchUser);

// Componente B (simultâneo)
const dataB = await deduplicator.deduplicate('user-123', fetchUser);

// Componente C (simultâneo)
const dataC = await deduplicator.deduplicate('user-123', fetchUser);

// Apenas 1 requisição HTTP foi feita!
// dataA === dataB === dataC (mesma Promise)

// ❌ INCORRETO - Sem deduplicação
const dataA = await fetchUser('user-123'); // Request 1
const dataB = await fetchUser('user-123'); // Request 2 (desnecessária!)
const dataC = await fetchUser('user-123'); // Request 3 (desnecessária!)
```

**Benefício:**
- 3 requisições simultâneas = 1 requisição real (2 prevenidas)
- 66% de redução de requisições

## **Camada 3: Request Cancellation (OBRIGATÓRIO)**

### **SEMPRE cancelar requisições antigas ao iniciar nova**

```typescript
// ✅ CORRETO - Cancela requisições antigas
const abortManager = new AbortControllerManager();

function search(query: string) {
  // Cancela busca anterior se ainda estiver pendente
  abortManager.abort('search');
  
  // Cria novo AbortSignal
  const signal = abortManager.create('search');
  
  return fetch('/api/search?q=' + query, { signal });
}

// Usuário digita "test" rapidamente
search('t');    // Request 1 iniciada
search('te');   // Request 1 CANCELADA, Request 2 iniciada
search('tes');  // Request 2 CANCELADA, Request 3 iniciada
search('test'); // Request 3 CANCELADA, Request 4 iniciada
// Apenas Request 4 completa!

// ❌ INCORRETO - Sem cancelamento
function search(query: string) {
  return fetch('/api/search?q=' + query);
}

// Todas as 4 requisições completam (3 desnecessárias!)
```

**Benefício:**
- 4 requisições iniciadas = 1 requisição completa (3 canceladas)
- 75% de redução de requisições

## **Camada 4: Cache Inteligente (OBRIGATÓRIO)**

### **SEMPRE cachear resultados de requisições**

```typescript
// ✅ CORRETO - Cache com TTL
const cache = new CacheService({
  maxSize: 1000,
  defaultTTL: 300000 // 5 minutos
});

async function fetchData(key: string) {
  // Verifica cache primeiro
  const cached = cache.get(key);
  if (cached) {
    return cached; // Requisição prevenida!
  }
  
  // Busca do servidor apenas se não estiver em cache
  const data = await fetch('/api/data/' + key);
  
  // Armazena em cache
  cache.set(key, data);
  
  return data;
}

// ❌ INCORRETO - Sem cache
async function fetchData(key: string) {
  return fetch('/api/data/' + key); // Sempre faz requisição
}
```

**Benefício:**
- 10 requisições para mesmos dados = 1 requisição real (9 do cache)
- 90% de redução de requisições

## **Camada 5: Request Budget (OBRIGATÓRIO)**

### **SEMPRE limitar número de requisições por período**

```typescript
// ✅ CORRETO - Budget enforcement
const requestBudget: RequestBudget = {
  maxRequestsPerMinute: 60,      // Máximo 60 req/min
  maxConcurrentRequests: 5,      // Máximo 5 simultâneas
  maxQueuedRequests: 10,         // Máximo 10 na fila
  minTimeBetweenRequests: 100    // Mínimo 100ms entre requests
};

const guard = new RequestGuard();

async function makeRequest(key: string) {
  // Verifica se pode fazer requisição
  if (!guard.canMakeRequest(key, requestBudget)) {
    throw new Error('Request budget exceeded');
  }
  
  return fetch('/api/endpoint');
}

// ❌ INCORRETO - Sem budget
async function makeRequest(key: string) {
  return fetch('/api/endpoint'); // Sem limites!
}
```

**Benefício:**
- Previne sobrecarga do sistema
- Protege contra loops infinitos
- Garante fair usage

## **Métricas de Sucesso**

### **SEMPRE monitorar taxa de prevenção**

```typescript
interface RequestMetrics {
  totalRequests: number;           // Total de tentativas
  successfulRequests: number;      // Requisições completadas
  throttledRequests: number;       // Prevenidas por throttle
  deduplicatedRequests: number;    // Prevenidas por dedup
  cachedRequests: number;          // Servidas do cache
  cancelledRequests: number;       // Canceladas
  
  // MÉTRICA CRÍTICA: Taxa de prevenção
  preventionRate: number;          // (prevented / total)
}

// Meta: preventionRate > 0.7 (70% de requisições prevenidas)
```

### **Exemplo Real de Impacto**

**Sem Proteção:**
```
Usuário digita "fiscal documents" (16 caracteres)
= 16 requisições HTTP
× 100 usuários simultâneos
= 1,600 requisições/segundo
× 60 segundos
= 96,000 requisições/minuto
```

**Com Proteção (todas as camadas):**
```
Throttle (300ms): 16 → 3 requisições (81% redução)
Deduplication: 3 → 2 requisições (33% redução)
Cancellation: 2 → 1 requisição (50% redução)
Cache: 1 → 0.1 requisições (90% redução)

Total: 16 → 0.1 requisições efetivas
= 99.4% de redução!

× 100 usuários
= 10 requisições/segundo (vs 1,600)
× 60 segundos
= 600 requisições/minuto (vs 96,000)

Redução: 159x menos requisições!
```

## **Checklist de Implementação**

### **Antes de Fazer Qualquer Requisição HTTP**

- [ ] ✅ Throttle configurado (mínimo 300ms)
- [ ] ✅ Deduplicação habilitada
- [ ] ✅ AbortController implementado
- [ ] ✅ Cache configurado com TTL apropriado
- [ ] ✅ Request budget definido
- [ ] ✅ Métricas de prevenção monitoradas
- [ ] ✅ Testes validam prevenção de requisições

### **Validação em Code Review**

**Perguntas obrigatórias:**
1. Esta requisição tem throttle?
2. Requisições duplicadas são prevenidas?
3. Requisições antigas são canceladas?
4. Resultados são cacheados?
5. Existe limite de requisições?
6. Métricas estão sendo coletadas?

**Se qualquer resposta for "não", o código NÃO deve ser aprovado!**

## **Anti-Patterns Proibidos**

### **❌ NUNCA fazer isso:**

```typescript
// ❌ Requisição em loop sem throttle
for (let i = 0; i < 1000; i++) {
  await fetch('/api/data/' + i); // 1000 requisições!
}

// ❌ Requisição em cada keystroke sem throttle
input.addEventListener('keyup', () => {
  fetch('/api/search?q=' + input.value); // Milhares de requisições!
});

// ❌ Polling agressivo
setInterval(() => {
  fetch('/api/status'); // A cada 100ms = 600 req/min!
}, 100);

// ❌ Requisições em useEffect sem dependências corretas
useEffect(() => {
  fetch('/api/data'); // Dispara em cada render!
});

// ❌ Requisições sem AbortController
async function search(query: string) {
  const data = await fetch('/api/search?q=' + query);
  // Se usuário digitar rápido, todas as requisições completam!
}
```

### **✅ SEMPRE fazer isso:**

```typescript
// ✅ Loop com Promise.all e limite
const chunks = chunkArray(items, 10);
for (const chunk of chunks) {
  await Promise.all(
    chunk.map(item => 
      requestController.request(
        `item-${item.id}`,
        () => fetch('/api/data/' + item.id),
        { throttleMs: 100, deduplicate: true }
      )
    )
  );
}

// ✅ Input com throttle
const debouncedSearch = useCallback(
  throttle((query: string) => {
    requestController.request(
      'search',
      (signal) => fetch('/api/search?q=' + query, { signal }),
      { throttleMs: 300, deduplicate: true, cacheMs: 300000 }
    );
  }, 300),
  []
);

input.addEventListener('keyup', (e) => {
  debouncedSearch(e.target.value);
});

// ✅ Polling com throttle e budget
const pollStatus = () => {
  requestController.request(
    'status',
    () => fetch('/api/status'),
    { 
      throttleMs: 5000,  // Máximo a cada 5 segundos
      cacheMs: 4000,     // Cache por 4 segundos
      deduplicate: true
    }
  );
};

setInterval(pollStatus, 5000); // Alinhado com throttle

// ✅ useEffect com dependências corretas e cleanup
useEffect(() => {
  const abortController = new AbortController();
  
  requestController.request(
    'user-data',
    (signal) => fetch('/api/user', { signal }),
    { throttleMs: 300, cacheMs: 60000 }
  );
  
  return () => abortController.abort();
}, [userId]); // Apenas quando userId muda
```

## **Monitoramento em Produção**

### **Alertas Obrigatórios**

```typescript
// Configurar alertas para:
if (metrics.preventionRate < 0.5) {
  alert('CRITICAL: Prevention rate below 50%');
}

if (metrics.totalRequests > 1000 per minute) {
  alert('WARNING: High request volume');
}

if (metrics.cacheHitRate < 0.7) {
  alert('WARNING: Low cache hit rate');
}
```

### **Dashboard de Métricas**

**Métricas obrigatórias para monitorar:**
- Taxa de prevenção (target: > 70%)
- Requisições por minuto (target: < 1000)
- Cache hit rate (target: > 80%)
- Requisições canceladas (indicador de UX)
- Requisições throttled (indicador de eficiência)

---

**LEMBRE-SE: Cada requisição prevenida é:**
- ✅ Menos carga no servidor
- ✅ Menos custo de infraestrutura
- ✅ Melhor performance
- ✅ Melhor experiência do usuário
- ✅ Mais sustentabilidade

**Meta: Prevenir 70-90% das requisições através das camadas de proteção!**
