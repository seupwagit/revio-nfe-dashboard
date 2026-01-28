# Otimização de Performance do Campo de Pesquisa - Design

## 1. Visão Geral da Solução

Esta solução implementa otimizações de performance para os componentes de busca de notas fiscais, focando em:
- Debounce para reduzir processamentos desnecessários
- Cancelamento de requisições obsoletas
- Cache de resultados de busca
- Feedback visual claro de estados
- Otimização de re-renderizações React

## 2. Arquitetura da Solução

### 2.1 Componentes Principais

```
apps/frontend/src/
├── hooks/
│   ├── useDebounce.ts          # Hook de debounce customizado
│   ├── useSearchState.ts       # Gerenciamento de estado de busca
│   └── useSearchCache.ts       # Cache de resultados
├── services/
│   └── searchCacheService.ts   # Serviço de cache centralizado
└── components/
    ├── BuscaNatural.tsx        # Atualizado com debounce
    ├── BuscaNaturalSimples.tsx # Atualizado com debounce
    └── BuscaNaturalDireta.tsx  # Atualizado com debounce
```

### 2.2 Fluxo de Dados

```
Usuário digita
    ↓
useDebounce (500ms)
    ↓
useSearchState (gerencia estado)
    ↓
Verifica cache (useSearchCache)
    ↓
    ├─→ Cache HIT: Retorna resultado imediato
    └─→ Cache MISS: Processa busca
            ↓
        Cancela requisições anteriores (AbortController)
            ↓
        Executa busca (local ou LLM)
            ↓
        Armazena no cache
            ↓
        Atualiza UI
```


## 3. Implementação Detalhada

### 3.1 Hook useDebounce

**Arquivo**: `apps/frontend/src/hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react';

/**
 * Hook para debounce de valores
 * @param value - Valor a ser debounced
 * @param delay - Delay em ms (padrão: 500ms)
 * @returns Valor debounced
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Criar timer para atualizar valor após delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancelar timer se valor mudar antes do delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

**Características**:
- Delay configurável (padrão 500ms)
- Cleanup automático de timers
- Type-safe com TypeScript generics
- Zero dependências externas


### 3.2 Hook useSearchState

**Arquivo**: `apps/frontend/src/hooks/useSearchState.ts`

```typescript
import { useState, useRef, useCallback } from 'react';

export interface SearchState {
  isSearching: boolean;
  isDebouncing: boolean;
  error: string | null;
}

/**
 * Hook para gerenciar estado de busca
 */
export function useSearchState() {
  const [state, setState] = useState<SearchState>({
    isSearching: false,
    isDebouncing: false,
    error: null,
  });
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const startDebouncing = useCallback(() => {
    setState(prev => ({ ...prev, isDebouncing: true, error: null }));
  }, []);

  const startSearching = useCallback(() => {
    // Cancelar busca anterior se existir
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Criar novo AbortController
    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ 
      ...prev, 
      isSearching: true, 
      isDebouncing: false,
      error: null 
    }));
    
    return abortControllerRef.current.signal;
  }, []);

  const finishSearching = useCallback(() => {
    setState(prev => ({ ...prev, isSearching: false }));
    abortControllerRef.current = null;
  }, []);

  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, isSearching: false, isDebouncing: false }));
  }, []);

  return {
    state,
    startDebouncing,
    startSearching,
    finishSearching,
    setError,
  };
}
```


### 3.3 Serviço de Cache

**Arquivo**: `apps/frontend/src/services/searchCacheService.ts`

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Serviço de cache para resultados de busca
 */
export class SearchCacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly maxSize = 50;
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutos

  /**
   * Gerar chave de cache a partir de filtros
   */
  private generateKey(filtros: any): string {
    return JSON.stringify(filtros, Object.keys(filtros).sort());
  }

  /**
   * Armazenar resultado no cache
   */
  set<T>(filtros: any, data: T, ttl: number = this.defaultTTL): void {
    const key = this.generateKey(filtros);
    
    // Limpar cache se atingir limite
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Recuperar resultado do cache
   */
  get<T>(filtros: any): T | null {
    const key = this.generateKey(filtros);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Verificar se expirou
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Limpar entradas expiradas
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }

    // Se ainda está cheio, remover mais antigas
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toRemove = entries.slice(0, Math.floor(this.maxSize / 4));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  /**
   * Limpar todo o cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Obter estatísticas do cache
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

// Instância singleton
export const searchCache = new SearchCacheService();
```


### 3.4 Hook useSearchCache

**Arquivo**: `apps/frontend/src/hooks/useSearchCache.ts`

```typescript
import { useCallback } from 'react';
import { searchCache } from '../services/searchCacheService';

/**
 * Hook para usar cache de busca
 */
export function useSearchCache() {
  const getCached = useCallback(<T,>(filtros: any): T | null => {
    return searchCache.get<T>(filtros);
  }, []);

  const setCached = useCallback(<T,>(filtros: any, data: T, ttl?: number): void => {
    searchCache.set(filtros, data, ttl);
  }, []);

  const clearCache = useCallback(() => {
    searchCache.clear();
  }, []);

  const getStats = useCallback(() => {
    return searchCache.getStats();
  }, []);

  return {
    getCached,
    setCached,
    clearCache,
    getStats,
  };
}
```


## 4. Atualização dos Componentes de Busca

### 4.1 BuscaNatural.tsx - Mudanças Principais

**Mudanças necessárias**:

1. **Importar hooks**:
```typescript
import { useDebounce } from '../hooks/useDebounce';
import { useSearchState } from '../hooks/useSearchState';
import { useSearchCache } from '../hooks/useSearchCache';
```

2. **Adicionar estados e hooks**:
```typescript
const [query, setQuery] = useState('');
const debouncedQuery = useDebounce(query, 500);
const { state, startDebouncing, startSearching, finishSearching, setError } = useSearchState();
const { getCached, setCached } = useSearchCache();
```

3. **Efeito para processar busca debounced**:
```typescript
useEffect(() => {
  if (!debouncedQuery.trim()) {
    handleClear();
    return;
  }

  // Verificar cache primeiro
  const cached = getCached(debouncedQuery);
  if (cached) {
    console.log('✅ Cache HIT:', debouncedQuery);
    setResultado(cached.explicacao);
    onSearch(cached.filtros);
    return;
  }

  // Processar busca
  const signal = startSearching();
  processarBusca(debouncedQuery, signal)
    .then(resultado => {
      if (!signal.aborted) {
        setResultado(resultado.explicacao);
        setCached(debouncedQuery, resultado);
        onSearch(resultado.filtros);
        finishSearching();
      }
    })
    .catch(error => {
      if (error.name !== 'AbortError') {
        setError(error.message);
      }
    });
}, [debouncedQuery]);
```

4. **Atualizar processarBusca para aceitar AbortSignal**:
```typescript
const processarBusca = async (texto: string, signal?: AbortSignal) => {
  // ... lógica existente
  
  // Para chamadas LLM, passar signal:
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal, // ← Adicionar signal
  });
  
  // ... resto da lógica
};
```

5. **Indicador visual de estado**:
```typescript
<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
  {state.isDebouncing ? (
    <Clock className="h-5 w-5 text-gray-400 animate-pulse" />
  ) : state.isSearching ? (
    <Loader className="h-5 w-5 text-purple-500 animate-spin" />
  ) : (
    <Sparkles className="h-5 w-5 text-purple-500" />
  )}
</div>
```


### 4.2 BuscaNaturalSimples.tsx - Mudanças Principais

**Aplicar as mesmas mudanças de BuscaNatural.tsx**:

1. Importar hooks (useDebounce, useSearchState, useSearchCache)
2. Adicionar debounce ao query
3. Implementar verificação de cache
4. Adicionar AbortSignal às chamadas LLM
5. Atualizar indicadores visuais

**Diferenças específicas**:
- Manter lógica de detecção de busca simples vs complexa
- Cache separado para buscas locais vs LLM
- Indicador visual diferenciado para LLM (🤖)

### 4.3 BuscaNaturalDireta.tsx - Mudanças Principais

**Aplicar as mesmas mudanças**, com foco em:
- Busca direta sem interpretação LLM
- Cache mais agressivo (TTL maior)
- Feedback visual simplificado


## 5. Otimizações de React

### 5.1 Memoização de Componentes

**GridPaginada.tsx**:
```typescript
import { useMemo, useCallback } from 'react';

// Memoizar processamento de filtros
const dadosProcessados = useMemo(() => {
  if (!usandoBuscaNatural) return data;
  return aplicarFiltros(data, filtros);
}, [data, filtros, usandoBuscaNatural]);

// Memoizar callbacks
const handleBuscaNatural = useCallback((filtros: any) => {
  setUsandoBuscaNatural(true);
  setColumnFilters([]);
  // ... resto da lógica
}, [data]);
```

### 5.2 Lazy Loading de Componentes

**App.tsx ou Router**:
```typescript
import { lazy, Suspense } from 'react';

const BuscaNatural = lazy(() => import('./components/BuscaNatural'));

function App() {
  return (
    <Suspense fallback={<div>Carregando busca...</div>}>
      <BuscaNatural onSearch={handleSearch} onClear={handleClear} />
    </Suspense>
  );
}
```


## 6. Feedback Visual

### 6.1 Estados Visuais

**Estados possíveis**:
1. **Idle**: Ícone normal (Sparkles)
2. **Debouncing**: Ícone de relógio pulsando (Clock + animate-pulse)
3. **Searching**: Spinner girando (Loader + animate-spin)
4. **Error**: Ícone de alerta (AlertCircle)
5. **Success**: Ícone de check (CheckCircle)

### 6.2 Mensagens de Estado

```typescript
{state.isDebouncing && (
  <div className="text-xs text-gray-500 mt-1">
    ⏳ Aguardando digitação...
  </div>
)}

{state.isSearching && (
  <div className="text-xs text-purple-600 mt-1">
    🔍 Processando busca...
  </div>
)}

{state.error && (
  <div className="text-xs text-red-600 mt-1">
    ❌ {state.error}
  </div>
)}
```

### 6.3 Indicador de Cache

```typescript
{cached && (
  <div className="text-xs text-green-600 mt-1">
    ⚡ Resultado do cache (instantâneo)
  </div>
)}
```


## 7. Tratamento de Erros

### 7.1 Tipos de Erro

```typescript
// AbortError - Requisição cancelada (normal)
if (error.name === 'AbortError') {
  console.log('🚫 Busca cancelada (nova busca iniciada)');
  return; // Não mostrar erro
}

// NetworkError - Problema de rede
if (error.name === 'NetworkError') {
  setError('Erro de conexão. Verifique sua internet.');
  return;
}

// APIError - Erro da API Gemini
if (error.status === 429) {
  setError('Limite de requisições atingido. Aguarde um momento.');
  return;
}

// Erro genérico
setError('Erro ao processar busca. Tente novamente.');
```

### 7.2 Fallback para Processamento Local

```typescript
try {
  // Tentar LLM
  const resultado = await processarComLLM(query, signal);
  return resultado;
} catch (error) {
  if (error.name === 'AbortError') throw error;
  
  console.warn('⚠️ LLM falhou, usando processamento local');
  return processarLocal(query);
}
```


## 8. Métricas e Monitoramento

### 8.1 Logging de Performance

```typescript
const logSearchPerformance = (
  query: string,
  startTime: number,
  cached: boolean,
  resultCount: number
) => {
  const duration = Date.now() - startTime;
  
  console.log('📊 PERFORMANCE METRICS', {
    query,
    duration: `${duration}ms`,
    cached,
    resultCount,
    cacheStats: searchCache.getStats(),
  });
  
  // Alert para buscas lentas
  if (duration > 2000 && !cached) {
    console.warn('⚠️ Busca lenta detectada:', {
      query,
      duration: `${duration}ms`,
    });
  }
};
```

### 8.2 Estatísticas de Cache

```typescript
// Adicionar ao componente
const [cacheStats, setCacheStats] = useState({ hits: 0, misses: 0 });

useEffect(() => {
  const stats = searchCache.getStats();
  setCacheStats(stats);
}, [debouncedQuery]);

// Exibir no UI (dev mode)
{process.env.NODE_ENV === 'development' && (
  <div className="text-xs text-gray-500">
    Cache: {cacheStats.size}/{searchCache.maxSize} | 
    Hit Rate: {((cacheStats.hits / (cacheStats.hits + cacheStats.misses)) * 100).toFixed(1)}%
  </div>
)}
```


## 9. Configuração e Customização

### 9.1 Configuração de Debounce

**Arquivo**: `apps/frontend/src/config/searchConfig.ts`

```typescript
export const SEARCH_CONFIG = {
  // Debounce
  debounceDelay: 500, // ms
  
  // Cache
  cacheMaxSize: 50,
  cacheTTL: 5 * 60 * 1000, // 5 minutos
  
  // Performance
  maxSearchTime: 10000, // 10 segundos timeout
  
  // LLM
  llmEnabled: true,
  llmFallbackToLocal: true,
  
  // Logging
  enablePerformanceLogging: process.env.NODE_ENV === 'development',
} as const;
```

### 9.2 Uso da Configuração

```typescript
import { SEARCH_CONFIG } from '../config/searchConfig';

const debouncedQuery = useDebounce(query, SEARCH_CONFIG.debounceDelay);
```


## 10. Testes

### 10.1 Testes Unitários

**useDebounce.test.ts**:
```typescript
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

describe('useDebounce', () => {
  it('should debounce value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );

    expect(result.current).toBe('initial');

    // Mudar valor
    rerender({ value: 'updated', delay: 500 });
    expect(result.current).toBe('initial'); // Ainda não mudou

    // Aguardar debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 600));
    });

    expect(result.current).toBe('updated'); // Agora mudou
  });

  it('should cancel previous timeout on rapid changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'a' } }
    );

    rerender({ value: 'b' });
    await act(async () => await new Promise(resolve => setTimeout(resolve, 200)));
    
    rerender({ value: 'c' });
    await act(async () => await new Promise(resolve => setTimeout(resolve, 600)));

    expect(result.current).toBe('c'); // Apenas última mudança
  });
});
```

### 10.2 Testes de Integração

**BuscaNatural.integration.test.tsx**:
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BuscaNatural from './BuscaNatural';

describe('BuscaNatural - Performance', () => {
  it('should debounce search input', async () => {
    const onSearch = jest.fn();
    render(<BuscaNatural onSearch={onSearch} onClear={jest.fn()} />);

    const input = screen.getByPlaceholderText(/pergunte em linguagem natural/i);

    // Digitar rapidamente
    fireEvent.change(input, { target: { value: 'a' } });
    fireEvent.change(input, { target: { value: 'ar' } });
    fireEvent.change(input, { target: { value: 'are' } });
    fireEvent.change(input, { target: { value: 'areia' } });

    // Não deve ter chamado ainda
    expect(onSearch).not.toHaveBeenCalled();

    // Aguardar debounce
    await waitFor(() => {
      expect(onSearch).toHaveBeenCalledTimes(1);
    }, { timeout: 1000 });
  });

  it('should use cache for repeated searches', async () => {
    const onSearch = jest.fn();
    const { rerender } = render(
      <BuscaNatural onSearch={onSearch} onClear={jest.fn()} />
    );

    const input = screen.getByPlaceholderText(/pergunte em linguagem natural/i);

    // Primeira busca
    fireEvent.change(input, { target: { value: 'areia' } });
    await waitFor(() => expect(onSearch).toHaveBeenCalledTimes(1));

    // Limpar
    fireEvent.click(screen.getByTitle('Limpar'));

    // Segunda busca (mesma query)
    fireEvent.change(input, { target: { value: 'areia' } });
    
    // Deve ser instantâneo (cache)
    await waitFor(() => {
      expect(screen.getByText(/cache/i)).toBeInTheDocument();
    }, { timeout: 100 });
  });
});
```


## 11. Migração e Compatibilidade

### 11.1 Estratégia de Migração

**Fase 1 - Infraestrutura** (1 dia):
1. Criar hooks (useDebounce, useSearchState, useSearchCache)
2. Criar serviço de cache
3. Criar testes unitários dos hooks

**Fase 2 - Componentes** (1 dia):
1. Atualizar BuscaNatural.tsx
2. Atualizar BuscaNaturalSimples.tsx
3. Atualizar BuscaNaturalDireta.tsx

**Fase 3 - Testes e Ajustes** (1 dia):
1. Testes de integração
2. Ajustes de performance
3. Validação com usuários

### 11.2 Compatibilidade com Código Existente

**Manter interfaces existentes**:
```typescript
// Interface não muda
interface BuscaNaturalProps {
  onSearch: (filtros: any) => void;
  onClear: () => void;
}

// Comportamento externo idêntico
// Apenas otimizações internas
```

**Backward compatibility**:
- Todos os filtros existentes continuam funcionando
- Busca por voz mantida
- Exemplos e dicas mantidos
- Sugestões inteligentes mantidas


## 12. Métricas de Sucesso

### 12.1 Métricas Técnicas

**Antes da Otimização**:
- Chamadas LLM por busca: ~5-10 (uma por tecla)
- Tempo de resposta: 2-5 segundos
- Travamentos de UI: Frequentes
- Cache hit rate: 0%

**Depois da Otimização (Metas)**:
- Chamadas LLM por busca: 1 (após debounce)
- Tempo de resposta: < 300ms (local), < 2s (LLM)
- Travamentos de UI: Zero
- Cache hit rate: > 30%

### 12.2 Métricas de Experiência

**Indicadores de Sucesso**:
- ✅ Feedback visual em < 100ms
- ✅ Redução de 80% em chamadas API
- ✅ Busca instantânea para queries repetidas
- ✅ Zero reclamações de lentidão
- ✅ Aumento de 50% no uso da busca natural

### 12.3 Monitoramento Contínuo

```typescript
// Adicionar ao analytics
trackSearchPerformance({
  query,
  duration,
  cached,
  resultCount,
  timestamp: Date.now(),
});
```


## 13. Riscos e Mitigações

### 13.1 Riscos Técnicos

**Risco 1: Debounce pode parecer lento**
- **Probabilidade**: Média
- **Impacto**: Baixo
- **Mitigação**: Feedback visual claro ("Aguardando digitação...")
- **Plano B**: Reduzir delay para 300ms

**Risco 2: Cache pode retornar dados desatualizados**
- **Probabilidade**: Baixa
- **Impacto**: Médio
- **Mitigação**: TTL curto (5 min) + invalidação manual
- **Plano B**: Adicionar botão "Forçar atualização"

**Risco 3: AbortController não suportado em navegadores antigos**
- **Probabilidade**: Muito Baixa
- **Impacto**: Baixo
- **Mitigação**: Polyfill ou fallback gracioso
- **Plano B**: Ignorar cancelamento em navegadores antigos

### 13.2 Riscos de Negócio

**Risco 1: Usuários estranharem delay inicial**
- **Mitigação**: Comunicação clara + feedback visual
- **Plano B**: Configuração por usuário

**Risco 2: Cache ocupar muita memória**
- **Mitigação**: Limite de 50 entradas + cleanup automático
- **Plano B**: Reduzir limite ou desabilitar cache


## 14. Documentação e Treinamento

### 14.1 Documentação Técnica

**README.md** (atualizar):
```markdown
## Busca Otimizada

A busca foi otimizada com:
- **Debounce**: Aguarda 500ms após última tecla
- **Cache**: Resultados armazenados por 5 minutos
- **Cancelamento**: Requisições antigas são canceladas
- **Feedback**: Estados visuais claros

### Configuração

Edite `src/config/searchConfig.ts` para ajustar:
- Delay do debounce
- Tamanho do cache
- TTL do cache
```

### 14.2 Guia do Usuário

**Adicionar ao help/dicas**:
```
💡 Dicas de Performance:

- A busca aguarda você terminar de digitar (500ms)
- Buscas repetidas são instantâneas (cache)
- Ícones indicam o estado:
  ⏳ Aguardando digitação
  🔍 Processando busca
  ⚡ Resultado do cache
```


## 15. Próximos Passos e Melhorias Futuras

### 15.1 Melhorias Futuras (Fora do Escopo Atual)

**Performance**:
- Web Workers para processamento pesado
- IndexedDB para cache persistente
- Service Worker para cache offline

**Funcionalidades**:
- Histórico de buscas
- Sugestões baseadas em histórico
- Busca por voz melhorada
- Autocomplete inteligente

**Monitoramento**:
- Dashboard de métricas de busca
- A/B testing de delays
- Heatmap de queries mais usadas

### 15.2 Dependências Externas

**Nenhuma dependência externa necessária**:
- Todos os hooks são implementados com React nativo
- Cache usa Map nativo do JavaScript
- AbortController é nativo do navegador

### 15.3 Checklist de Implementação

- [ ] Criar hook useDebounce
- [ ] Criar hook useSearchState
- [ ] Criar serviço searchCacheService
- [ ] Criar hook useSearchCache
- [ ] Atualizar BuscaNatural.tsx
- [ ] Atualizar BuscaNaturalSimples.tsx
- [ ] Atualizar BuscaNaturalDireta.tsx
- [ ] Adicionar indicadores visuais
- [ ] Implementar logging de performance
- [ ] Criar testes unitários
- [ ] Criar testes de integração
- [ ] Atualizar documentação
- [ ] Validar com usuários
- [ ] Deploy em produção

## 16. Aprovações

- [ ] Tech Lead
- [ ] Product Owner
- [ ] UX Designer
- [ ] QA Lead

---

**Última atualização**: Janeiro 2026  
**Versão**: 1.0  
**Status**: Aguardando aprovação
