# Steering: Performance e Otimização - Regras Prioritárias

## **Regras de Performance Críticas**

### **Async/Await - Uso Correto Obrigatório**

**SEMPRE usar operações paralelas quando possível:**
```typescript
// ✅ CORRETO - Operações paralelas
const [users, orders, products] = await Promise.all([
  userService.getAll(),
  orderService.getAll(),
  productService.getAll()
]);

// ❌ INCORRETO - Operações sequenciais desnecessárias
const users = await userService.getAll();
const orders = await orderService.getAll();
const products = await productService.getAll();
```

**Tratamento de erros em operações paralelas:**
```typescript
// ✅ CORRETO - Com tratamento individual
const results = await Promise.allSettled([
  userService.getAll(),
  orderService.getAll(),
  productService.getAll()
]);

const [usersResult, ordersResult, productsResult] = results;

const users = usersResult.status === 'fulfilled' ? usersResult.value : [];
const orders = ordersResult.status === 'fulfilled' ? ordersResult.value : [];
const products = productsResult.status === 'fulfilled' ? productsResult.value : [];
```

### **Cache Inteligente Obrigatório**

**Implementação de cache em memória:**
```typescript
// apps/backend/src/services/cache.service.ts
export class CacheService {
  private cache = new Map<string, { data: any; expiry: number }>();
  private maxSize = 1000; // Limite de itens

  set(key: string, data: any, ttlMs: number = 300000): void {
    // Limpar cache se atingir limite
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}
```

**Cache com Redis para produção:**
```typescript
// apps/backend/src/services/redis-cache.service.ts
import Redis from 'ioredis';

export class RedisCacheService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async set(key: string, data: any, ttlSeconds: number = 300): Promise<void> {
    await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
```

## **Otimizações de Database**

### **Query Optimization Obrigatória**

**SEMPRE usar select específico:**
```typescript
// ✅ CORRETO - Query otimizada
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true,
    createdAt: true
  },
  where: {
    active: true,
    role: { in: ['admin', 'user'] }
  },
  orderBy: { createdAt: 'desc' },
  take: 50,
  skip: page * 50
});

// ❌ INCORRETO - Query não otimizada
const users = await prisma.user.findMany({
  where: { active: true }
}); // Busca todos os campos, sem paginação
```

**Usar índices apropriados:**
```sql
-- Prisma schema
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  active    Boolean  @default(true)
  role      String
  createdAt DateTime @default(now())

  @@index([active, role]) // Índice composto para queries frequentes
  @@index([createdAt])    // Índice para ordenação
}
```

### **Connection Pooling**

**Configuração otimizada do Prisma:**
```typescript
// apps/backend/src/database/prisma.ts
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error']
});

// Connection pool configuration
const connectionLimit = process.env.NODE_ENV === 'production' ? 10 : 5;
```

## **Memory Management**

### **Limpeza de Recursos Obrigatória**

**SEMPRE limpar recursos:**
```typescript
// ✅ CORRETO - Limpeza de recursos
export class DatabaseService {
  private connections = new Map<string, any>();
  private timers = new Set<NodeJS.Timeout>();

  async cleanup(): Promise<void> {
    // Limpar conexões
    for (const [key, connection] of this.connections) {
      await connection.close();
      this.connections.delete(key);
    }

    // Limpar timers
    for (const timer of this.timers) {
      clearTimeout(timer);
      this.timers.delete(timer);
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    await this.cleanup();
    process.exit(0);
  }
}
```

**Event listeners cleanup:**
```typescript
// ✅ CORRETO - Cleanup de event listeners
export class EventService {
  private listeners = new Map<string, Function[]>();

  addListener(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  removeAllListeners(): void {
    for (const [event, callbacks] of this.listeners) {
      callbacks.forEach(callback => {
        process.removeListener(event, callback as any);
      });
    }
    this.listeners.clear();
  }
}
```

## **Frontend Performance**

### **React Optimization**

**Memoização obrigatória para componentes pesados:**
```typescript
// ✅ CORRETO - Componente otimizado
import React, { memo, useMemo, useCallback } from 'react';

interface DataTableProps {
  data: any[];
  onRowClick: (row: any) => void;
}

export const DataTable = memo<DataTableProps>(({ data, onRowClick }) => {
  // Memoizar cálculos pesados
  const processedData = useMemo(() => {
    return data.map(item => ({
      ...item,
      formattedDate: new Date(item.date).toLocaleDateString()
    }));
  }, [data]);

  // Memoizar callbacks
  const handleRowClick = useCallback((row: any) => {
    onRowClick(row);
  }, [onRowClick]);

  return (
    <table>
      {processedData.map(row => (
        <tr key={row.id} onClick={() => handleRowClick(row)}>
          <td>{row.name}</td>
          <td>{row.formattedDate}</td>
        </tr>
      ))}
    </table>
  );
});
```

**Lazy loading obrigatório:**
```typescript
// ✅ CORRETO - Lazy loading de componentes
import { lazy, Suspense } from 'react';

const DANFEViewer = lazy(() => import('./components/DANFEViewer'));
const Analytics = lazy(() => import('./pages/Analytics'));

function App() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <Routes>
        <Route path="/danfe" element={<DANFEViewer />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  );
}
```

### **Bundle Optimization**

**Code splitting obrigatório:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['lucide-react', '@tanstack/react-table'],
          charts: ['recharts'],
          pdf: ['@react-pdf-viewer/core']
        }
      }
    }
  }
});
```

## **Network Optimization**

### **HTTP Request Optimization**

**Request deduplication:**
```typescript
// apps/frontend/src/services/request-deduplication.service.ts
export class RequestDeduplicationService {
  private activeRequests = new Map<string, Promise<any>>();

  async request<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Se já existe uma requisição ativa, retornar a mesma Promise
    if (this.activeRequests.has(key)) {
      return this.activeRequests.get(key)!;
    }

    // Criar nova requisição
    const promise = requestFn().finally(() => {
      this.activeRequests.delete(key);
    });

    this.activeRequests.set(key, promise);
    return promise;
  }
}
```

**Request batching:**
```typescript
// apps/frontend/src/services/batch-request.service.ts
export class BatchRequestService {
  private batchQueue: Array<{ id: string; resolve: Function; reject: Function }> = [];
  private batchTimer: NodeJS.Timeout | null = null;

  async batchRequest(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.batchQueue.push({ id, resolve, reject });

      if (!this.batchTimer) {
        this.batchTimer = setTimeout(() => {
          this.processBatch();
        }, 50); // Aguardar 50ms para agrupar requisições
      }
    });
  }

  private async processBatch(): Promise<void> {
    const batch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimer = null;

    try {
      const ids = batch.map(item => item.id);
      const results = await this.fetchBatch(ids);

      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
    } catch (error) {
      batch.forEach(item => {
        item.reject(error);
      });
    }
  }

  private async fetchBatch(ids: string[]): Promise<any[]> {
    const response = await fetch('/api/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    return response.json();
  }
}
```

## **Monitoring e Métricas**

### **Performance Monitoring Obrigatório**

**Métricas de performance:**
```typescript
// apps/backend/src/middleware/performance.middleware.ts
export const performanceMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds

    // Log performance metrics
    console.log('[PERF] 📊', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration.toFixed(2)}ms`,
      timestamp: new Date().toISOString()
    });

    // Alert para requests lentos
    if (duration > 1000) {
      console.warn('[PERF] ⚠️ Slow request detected', {
        method: req.method,
        path: req.path,
        duration: `${duration.toFixed(2)}ms`
      });
    }
  });

  next();
};
```

**Memory monitoring:**
```typescript
// apps/backend/src/utils/memory-monitor.ts
export class MemoryMonitor {
  static logMemoryUsage(): void {
    const usage = process.memoryUsage();
    
    console.log('[MEMORY] 📊', {
      rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
      external: `${Math.round(usage.external / 1024 / 1024)}MB`,
      timestamp: new Date().toISOString()
    });

    // Alert para uso alto de memória
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 500) {
      console.warn('[MEMORY] ⚠️ High memory usage detected', {
        heapUsed: `${Math.round(heapUsedMB)}MB`
      });
    }
  }

  static startMonitoring(intervalMs: number = 60000): void {
    setInterval(() => {
      this.logMemoryUsage();
    }, intervalMs);
  }
}
```

## **Checklist de Performance**

### **Backend Performance**

**Verificações obrigatórias:**
- [ ] ✅ Queries otimizadas com select específico
- [ ] ✅ Índices apropriados no banco
- [ ] ✅ Cache implementado para dados frequentes
- [ ] ✅ Connection pooling configurado
- [ ] ✅ Operações paralelas quando possível
- [ ] ✅ Cleanup de recursos implementado
- [ ] ✅ Monitoring de performance ativo

### **Frontend Performance**

**Verificações obrigatórias:**
- [ ] ✅ Componentes memoizados quando necessário
- [ ] ✅ Lazy loading implementado
- [ ] ✅ Code splitting configurado
- [ ] ✅ Bundle size otimizado
- [ ] ✅ Request deduplication implementado
- [ ] ✅ Images otimizadas
- [ ] ✅ Virtual scrolling para listas grandes

### **Métricas de Performance**

**Metas obrigatórias:**
- ✅ **API Response Time**: < 200ms (95th percentile)
- ✅ **Database Query Time**: < 100ms (média)
- ✅ **Frontend Bundle Size**: < 1MB (gzipped)
- ✅ **Memory Usage**: < 512MB (backend idle)
- ✅ **Cache Hit Rate**: > 80%
- ✅ **First Contentful Paint**: < 1.5s
- ✅ **Time to Interactive**: < 3s