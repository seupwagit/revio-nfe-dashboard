# Implementation Plan - LLM Configuration System

## 1. Database Setup

- [ ] 1.1 Create Prisma schema for LLM configuration
  - Define LLMProvider model with all fields
  - Define TenantQuota model with usage tracking
  - Define AuditLog model for usage history
  - Define RoutingRule model for query routing
  - Define CacheEntry model for response caching
  - Define ProviderHealth model for health monitoring
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 6.1, 6.2_

- [ ] 1.2 Run Prisma migrations
  - Run `npx prisma migrate dev --name init-llm-config`
  - Verify tables created in SQL Server
  - Generate Prisma Client
  - _Requirements: 1.1_

- [ ] 1.3 Seed initial data
  - Create seed script with example providers
  - Create default tenant quota
  - Run seed: `npx prisma db seed`
  - _Requirements: 1.1, 3.1_

## 2. Backend API - Provider Management

- [ ] 2.1 Create provider controller
  - Implement list() - GET /api/providers
  - Implement getById() - GET /api/providers/:id
  - Implement create() - POST /api/providers
  - Implement update() - PUT /api/providers/:id
  - Implement delete() - DELETE /api/providers/:id (soft delete)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ] 2.2 Implement provider validation
  - Validate required fields (name, type, endpoint, apiKey, model)
  - Validate temperature range (0.0 to 1.0)
  - Validate maxTokens > 0
  - Validate timeout > 0
  - Validate provider type enum
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 2.3 Implement API key encryption
  - Encrypt API keys before storing in database
  - Decrypt API keys when loading configuration
  - Use environment variable for encryption key
  - _Requirements: 1.3_

- [ ] 2.4 Implement provider test endpoint
  - Create POST /api/providers/:id/test
  - Send test query to provider
  - Return response time and success/failure
  - Do not increment quota counters
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 2.5 Implement provider health endpoint
  - Create GET /api/providers/:id/health
  - Return current health status
  - Return recent metrics (success rate, avg response time)
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 2.6 Implement import/export endpoints
  - Create GET /api/providers/export
  - Create POST /api/providers/import
  - Validate JSON schema on import
  - Mask sensitive data on export
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

## 3. Backend API - Quota Management

- [ ] 3.1 Create quota controller
  - Implement list() - GET /api/quotas
  - Implement getByTenant() - GET /api/quotas/:tenantId
  - Implement update() - PUT /api/quotas/:tenantId
  - Implement reset() - POST /api/quotas/:tenantId/reset
  - Implement getUsage() - GET /api/quotas/:tenantId/usage
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 3.2 Implement quota validation
  - Validate limits are positive numbers
  - Validate email format for notifications
  - Validate tenant exists
  - _Requirements: 3.2, 3.3_

- [ ] 3.3 Implement quota reset logic
  - Create scheduled job for daily reset
  - Create scheduled job for monthly reset
  - Update lastDailyReset and lastMonthlyReset timestamps
  - Reset currentRequests, currentTokens, currentCost
  - _Requirements: 3.5_

- [ ] 3.4 Implement quota notification logic
  - Check if usage >= 80% of limit
  - Send email notification when threshold reached
  - Send critical alert at 100%
  - Log notification in audit log
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

## 4. Backend API - Audit Log

- [ ] 4.1 Create audit controller
  - Implement list() with filters - GET /api/audit
  - Implement getById() - GET /api/audit/:id
  - Implement getMetrics() - GET /api/audit/metrics
  - Implement exportCSV() - GET /api/audit/export
  - Implement getCostSummary() - GET /api/audit/costs
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 4.2 Implement audit log filters
  - Filter by date range (startDate, endDate)
  - Filter by tenantId
  - Filter by providerId
  - Filter by userId
  - Filter by success/failure
  - Implement pagination
  - _Requirements: 6.3_

- [ ] 4.3 Implement metrics calculation
  - Calculate total requests by provider
  - Calculate total tokens by period
  - Calculate estimated cost by provider
  - Group by day/week/month
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 4.4 Implement CSV export
  - Generate CSV with all filtered logs
  - Include all relevant fields
  - Stream large exports
  - _Requirements: 6.4_

## 5. LLM Service - Core Infrastructure

- [ ] 5.1 Create LLM Service base
  - Create src/services/llm/LLMService.ts
  - Implement processQuery() method
  - Implement testProvider() method
  - Implement invalidateCache() method
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 5.2 Create Provider Selector
  - Create src/services/llm/ProviderSelector.ts
  - Load active providers from database
  - Sort by priority
  - Select provider based on availability and limits
  - Implement fallback logic
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] 5.3 Create Quota Manager
  - Create src/services/llm/QuotaManager.ts
  - Check if tenant has available quota
  - Increment usage counters
  - Check provider limits
  - Block requests when limit exceeded
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4_

- [ ] 5.4 Create Cache Manager
  - Create src/services/llm/CacheManager.ts
  - Generate query hash
  - Check cache before calling provider
  - Store response in cache
  - Implement cache expiration
  - Track cache hits
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ] 5.5 Create Audit Logger
  - Create src/services/llm/AuditLogger.ts
  - Log every request to database
  - Include all relevant metadata
  - Calculate and log cost
  - Log errors with details
  - _Requirements: 6.1, 6.2, 6.5, 7.5_

## 6. LLM Service - Provider Adapters

- [ ] 6.1 Create base Provider Adapter
  - Create src/services/llm/adapters/BaseAdapter.ts
  - Define common interface
  - Implement error handling
  - Implement retry logic
  - Implement timeout handling
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 6.2 Create Google Gemini Adapter
  - Create src/services/llm/adapters/GeminiAdapter.ts
  - Implement query() method
  - Map request to Gemini API format
  - Map response to standard format
  - Count tokens used
  - _Requirements: 7.2, 12.4_

- [ ] 6.3 Create OpenAI Adapter
  - Create src/services/llm/adapters/OpenAIAdapter.ts
  - Implement query() method
  - Support GPT-3.5 and GPT-4 models
  - Map request/response formats
  - Count tokens used
  - _Requirements: 7.2, 12.4_

- [ ] 6.4 Create Anthropic Claude Adapter
  - Create src/services/llm/adapters/AnthropicAdapter.ts
  - Implement query() method
  - Support Claude models
  - Map request/response formats
  - Count tokens used
  - _Requirements: 7.2, 12.4_

- [ ] 6.5 Create Azure OpenAI Adapter
  - Create src/services/llm/adapters/AzureOpenAIAdapter.ts
  - Implement query() method
  - Support Azure-specific authentication
  - Map request/response formats
  - Count tokens used
  - _Requirements: 7.2, 12.3, 12.4_

## 7. LLM Service - Advanced Features

- [ ] 7.1 Implement routing rules
  - Create src/services/llm/RoutingEngine.ts
  - Load routing rules from database
  - Match query against regex patterns
  - Select provider based on matching rule
  - Use default provider if no match
  - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 7.2 Implement health monitoring
  - Create src/services/llm/HealthMonitor.ts
  - Track consecutive failures per provider
  - Mark provider as offline after N failures
  - Mark as degraded if error rate > threshold
  - Periodically check offline providers
  - Update ProviderHealth table
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [ ] 7.3 Implement cost calculation
  - Calculate cost based on tokens and price table
  - Update cost in audit log
  - Update current cost in tenant quota
  - Check if monthly cost limit exceeded
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [ ] 7.4 Implement configuration cache
  - Load all configurations on service start
  - Cache in memory for fast access
  - Implement cache invalidation endpoint
  - Reload from database when invalidated
  - Set cache TTL
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

## 8. Backoffice UI - Provider Management

- [ ] 8.1 Create provider list page
  - Display table with all providers
  - Show name, type, model, status, priority
  - Add search and filter functionality
  - Add pagination
  - Add "New Provider" button
  - _Requirements: 1.1_

- [ ] 8.2 Create provider form page
  - Create form for adding/editing provider
  - Include all configuration fields
  - Validate inputs client-side
  - Show validation errors
  - Save to backend API
  - _Requirements: 1.2, 1.3, 1.4, 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 8.3 Create provider test dialog
  - Add "Test" button on provider list
  - Show dialog with test query input
  - Call test endpoint
  - Display result (success/failure, response time)
  - Show error message if failed
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 8.4 Create provider health indicator
  - Show status badge (online/offline/degraded)
  - Show recent metrics (success rate, avg response time)
  - Auto-refresh every 30 seconds
  - _Requirements: 17.1, 17.2, 17.3, 17.4_

- [ ] 8.5 Create import/export functionality
  - Add "Export" button to download JSON
  - Add "Import" button to upload JSON
  - Validate imported file
  - Show confirmation before applying
  - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5_

## 9. Backoffice UI - Quota Management

- [ ] 9.1 Create quota list page
  - Display table with all tenant quotas
  - Show tenant name, limits, current usage
  - Show usage percentage bars
  - Add search and filter
  - _Requirements: 3.1_

- [ ] 9.2 Create quota edit dialog
  - Show form to edit quota limits
  - Include daily and monthly limits
  - Include notification settings
  - Validate inputs
  - Save to backend API
  - _Requirements: 3.2, 3.3, 11.1_

- [ ] 9.3 Create quota usage dashboard
  - Show current usage vs limits
  - Show progress bars for each limit
  - Highlight limits close to threshold (>80%)
  - Show time until next reset
  - _Requirements: 3.1, 5.1, 5.2_

- [ ] 9.4 Create quota reset button
  - Add manual reset button
  - Show confirmation dialog
  - Call reset endpoint
  - Refresh usage display
  - _Requirements: 3.5_

## 10. Backoffice UI - Audit & Metrics

- [ ] 10.1 Create audit log page
  - Display table with all audit logs
  - Show timestamp, tenant, provider, query, tokens, cost
  - Add filters (date range, tenant, provider, success)
  - Add pagination
  - Add "Export CSV" button
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ] 10.2 Create metrics dashboard
  - Show total requests by provider (chart)
  - Show total tokens by period (chart)
  - Show estimated cost by provider (chart)
  - Add date range selector
  - Add tenant filter
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 10.3 Create cost summary page
  - Show cost breakdown by provider
  - Show cost breakdown by tenant
  - Show cost trend over time (chart)
  - Add date range selector
  - Add export functionality
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

## 11. Integration & Testing

- [ ] 11.1 Update Natural Search Service
  - Replace hardcoded Gemini config with LLMService
  - Pass tenantId and userId to LLMService
  - Handle LLMResponse
  - Handle quota exceeded errors
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 11.2 Test provider adapters
  - Test Gemini adapter with real API
  - Test OpenAI adapter with real API
  - Test Anthropic adapter with real API
  - Test Azure OpenAI adapter with real API
  - Verify token counting accuracy
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 11.3 Test quota enforcement
  - Test daily limit enforcement
  - Test monthly limit enforcement
  - Test cost limit enforcement
  - Test quota reset logic
  - Test notification triggers
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.4, 11.1, 11.2, 11.3_

- [ ] 11.4 Test fallback logic
  - Test provider failover
  - Test priority ordering
  - Test health monitoring
  - Test routing rules
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 17.1, 17.2, 17.3, 18.1, 18.2, 18.3_

- [ ] 11.5 Test cache functionality
  - Test cache hit/miss
  - Test cache expiration
  - Test cache invalidation
  - Verify quota not incremented on cache hit
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

## 12. Documentation & Deployment

- [ ] 12.1 Create API documentation
  - Document all endpoints
  - Include request/response examples
  - Document error codes
  - Create Postman collection
  - _Requirements: All_

- [ ] 12.2 Create user guide
  - Document how to add providers
  - Document how to configure quotas
  - Document how to view metrics
  - Include screenshots
  - _Requirements: All_

- [ ] 12.3 Create deployment guide
  - Document SQL Server setup
  - Document Prisma migration steps
  - Document environment variables
  - Document backup procedures
  - _Requirements: All_

- [ ] 12.4 Final testing
  - Test all backoffice features
  - Test all API endpoints
  - Test LLM service integration
  - Test with multiple tenants
  - Test error scenarios
  - _Requirements: All_
