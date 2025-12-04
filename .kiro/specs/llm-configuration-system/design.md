# Design Document

## Overview

Este documento descreve o design de um sistema completo de configuração e gerenciamento de provedores LLM para o serviço de busca natural. O sistema permitirá configurar múltiplos provedores (Google Gemini, OpenAI, Anthropic, Azure OpenAI, etc.), definir limites de uso, controlar custos, gerenciar permissões e monitorar consumo através de um backoffice web administrativo.

O sistema será composto por:
1. **Backend API** (Express + Prisma + SQL Server)
2. **Backoffice Web** (React + TypeScript)
3. **LLM Service** (Serviço de busca natural com suporte multi-provedor)
4. **Database Schema** (SQL Server com Prisma ORM)

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Backoffice Web UI                         │
│                    (React + TypeScript)                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend API Server                          │
│                   (Express + Prisma ORM)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Providers   │  │    Quotas    │  │  Audit Log   │         │
│  │  Controller  │  │  Controller  │  │  Controller  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────┬────────────────────────────────────┘
                             │ Prisma
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SQL Server                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Providers   │  │    Quotas    │  │  AuditLog    │         │
│  │    Table     │  │    Table     │  │    Table     │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                             ▲
                             │ Prisma
                             │
┌─────────────────────────────────────────────────────────────────┐
│                    LLM Service (Natural Search)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Provider   │  │    Quota     │  │    Cache     │         │
│  │   Selector   │  │   Manager    │  │   Manager    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Gemini     │  │   OpenAI     │  │  Anthropic   │         │
│  │   Adapter    │  │   Adapter    │  │   Adapter    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Database Schema (Prisma)

```prisma
// prisma/schema.prisma

model LLMProvider {
  id                String   @id @default(uuid())
  name              String   @unique
  type              String   // 'gemini', 'openai', 'anthropic', 'azure-openai'
  endpoint          String
  apiKey            String   // Encrypted
  model             String
  isActive          Boolean  @default(true)
  priority          Int      @default(0)
  
  // Configuration
  temperature       Float    @default(0.7)
  maxTokens         Int      @default(1000)
  timeout           Int      @default(30)
  retryAttempts     Int      @default(3)
  
  // Limits
  requestsPerMinute Int?
  tokensPerDay      Int?
  costPerMonth      Decimal?
  
  // Pricing
  costPer1kTokens   Decimal  @default(0)
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  createdBy         String?
  
  // Relations
  auditLogs         AuditLog[]
  routingRules      RoutingRule[]
  
  @@index([isActive, priority])
}

model TenantQuota {
  id                String   @id @default(uuid())
  tenantId          String   @unique
  tenantName        String
  
  // Daily Limits
  requestsPerDay    Int      @default(1000)
  tokensPerDay      Int      @default(100000)
  
  // Monthly Limits
  requestsPerMonth  Int      @default(30000)
  tokensPerMonth    Int      @default(3000000)
  costPerMonth      Decimal  @default(100)
  
  // Current Usage (reset periodically)
  currentRequests   Int      @default(0)
  currentTokens     Int      @default(0)
  currentCost       Decimal  @default(0)
  
  // Reset tracking
  lastDailyReset    DateTime @default(now())
  lastMonthlyReset  DateTime @default(now())
  
  // Status
  isActive          Boolean  @default(true)
  
  // Notifications
  notifyAt80Percent Boolean  @default(true)
  notifyEmail       String?
  
  // Metadata
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  @@index([tenantId])
}

model AuditLog {
  id              String   @id @default(uuid())
  timestamp       DateTime @default(now())
  
  // Request Info
  tenantId        String
  userId          String?
  query           String   @db.Text
  
  // Provider Info
  providerId      String
  provider        LLMProvider @relation(fields: [providerId], references: [id])
  providerType    String
  model           String
  
  // Usage Info
  tokensUsed      Int
  responseTime    Int      // milliseconds
  cost            Decimal
  
  // Result
  success         Boolean
  errorMessage    String?  @db.Text
  fromCache       Boolean  @default(false)
  
  // Response (optional, for debugging)
  response        String?  @db.Text
  
  @@index([tenantId, timestamp])
  @@index([providerId, timestamp])
  @@index([timestamp])
}

model RoutingRule {
  id              String   @id @default(uuid())
  name            String
  description     String?
  
  // Rule matching
  queryPattern    String   // Regex pattern
  priority        Int      @default(0)
  
  // Target provider
  providerId      String
  provider        LLMProvider @relation(fields: [providerId], references: [id])
  
  // Status
  isActive        Boolean  @default(true)
  
  // Metadata
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([isActive, priority])
}

model CacheEntry {
  id              String   @id @default(uuid())
  queryHash       String   @unique
  query           String   @db.Text
  response        String   @db.Text
  
  // Provider info
  providerId      String
  providerType    String
  model           String
  
  // Cache control
  createdAt       DateTime @default(now())
  expiresAt       DateTime
  hitCount        Int      @default(0)
  
  @@index([queryHash])
  @@index([expiresAt])
}

model ProviderHealth {
  id                  String   @id @default(uuid())
  providerId          String   @unique
  
  // Health status
  status              String   // 'online', 'offline', 'degraded'
  lastChecked         DateTime @default(now())
  
  // Metrics (last 5 minutes)
  totalRequests       Int      @default(0)
  successfulRequests  Int      @default(0)
  failedRequests      Int      @default(0)
  avgResponseTime     Int      @default(0)
  
  // Error tracking
  consecutiveFailures Int      @default(0)
  lastError           String?  @db.Text
  lastErrorAt         DateTime?
  
  // Metadata
  updatedAt           DateTime @updatedAt
  
  @@index([providerId])
}
```

### 2. Backend API Controllers

```typescript
// server/backoffice/controllers/providerController.ts

interface CreateProviderDTO {
  name: string;
  type: 'gemini' | 'openai' | 'anthropic' | 'azure-openai';
  endpoint: string;
  apiKey: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  retryAttempts?: number;
  requestsPerMinute?: number;
  tokensPerDay?: number;
  costPerMonth?: number;
  costPer1kTokens?: number;
  priority?: number;
}

class ProviderController {
  // List all providers
  async list(req: Request, res: Response): Promise<void>
  
  // Get provider by ID
  async getById(req: Request, res: Response): Promise<void>
  
  // Create new provider
  async create(req: Request, res: Response): Promise<void>
  
  // Update provider
  async update(req: Request, res: Response): Promise<void>
  
  // Delete provider (soft delete)
  async delete(req: Request, res: Response): Promise<void>
  
  // Test provider connection
  async test(req: Request, res: Response): Promise<void>
  
  // Get provider health status
  async getHealth(req: Request, res: Response): Promise<void>
  
  // Export configuration
  async export(req: Request, res: Response): Promise<void>
  
  // Import configuration
  async import(req: Request, res: Response): Promise<void>
}
```

```typescript
// server/backoffice/controllers/quotaController.ts

interface UpdateQuotaDTO {
  requestsPerDay?: number;
  tokensPerDay?: number;
  requestsPerMonth?: number;
  tokensPerMonth?: number;
  costPerMonth?: number;
  notifyAt80Percent?: boolean;
  notifyEmail?: string;
}

class QuotaController {
  // List all tenant quotas
  async list(req: Request, res: Response): Promise<void>
  
  // Get quota by tenant ID
  async getByTenant(req: Request, res: Response): Promise<void>
  
  // Update tenant quota
  async update(req: Request, res: Response): Promise<void>
  
  // Reset quota counters
  async reset(req: Request, res: Response): Promise<void>
  
  // Get current usage
  async getUsage(req: Request, res: Response): Promise<void>
}
```

```typescript
// server/backoffice/controllers/auditController.ts

interface AuditLogFilter {
  startDate?: Date;
  endDate?: Date;
  tenantId?: string;
  providerId?: string;
  userId?: string;
  success?: boolean;
  page?: number;
  pageSize?: number;
}

class AuditController {
  // List audit logs with filters
  async list(req: Request, res: Response): Promise<void>
  
  // Get audit log by ID
  async getById(req: Request, res: Response): Promise<void>
  
  // Get usage metrics
  async getMetrics(req: Request, res: Response): Promise<void>
  
  // Export audit logs to CSV
  async exportCSV(req: Request, res: Response): Promise<void>
  
  // Get cost summary
  async getCostSummary(req: Request, res: Response): Promise<void>
}
```

### 3. LLM Service Layer

```typescript
// src/services/llm/LLMService.ts

interface LLMRequest {
  query: string;
  tenantId: string;
  userId?: string;
  context?: any;
}

interface LLMResponse {
  result: string;
  provider: string;
  model: string;
  tokensUsed: number;
  responseTime: number;
  cost: number;
  fromCache: boolean;
}

class LLMService {
  private providerSelector: ProviderSelector;
  private quotaManager: QuotaManager;
  private cacheManager: CacheManager;
  private auditLogger: AuditLogger;
  
  constructor() {
    this.providerSelector = new ProviderSelector();
    this.quotaManager = new QuotaManager();
    this.cacheManager = new CacheManager();
    this.auditLogger = new AuditLogger();
  }
  
  async processQuery(request: LLMRequest): Promise<LLMResponse>
  async testProvider(providerId: string, testQuery: string): Promise<LLMResponse>
  async invalidateCache(queryHash?: string): Promise<void>
}
```
