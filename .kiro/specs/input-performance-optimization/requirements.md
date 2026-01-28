# Requirements Document

## Introduction

This document specifies requirements for optimizing performance in the NFe Grid system, specifically addressing database query performance issues. The current implementation in `gridService.ts`, `fiscalDocuments.ts`, and `aggregation.ts` suffers from:

- Sequential page fetching causing slow data loading (up to 100 pages sequentially)
- No request cancellation when filters change rapidly
- Inefficient cache invalidation strategy
- Lack of query optimization at the database level
- No parallel request handling for independent operations

This feature will implement intelligent query optimization, parallel data fetching, request cancellation, and smart caching specifically for the NFe Grid components.

## Glossary

- **Grid_Service**: Service responsible for fetching NFe data with pagination (`gridService.ts`)
- **Fiscal_Documents_Service**: Service for querying fiscal documents (`fiscalDocuments.ts`)
- **Aggregation_Service**: Service for MongoDB aggregations and analytics (`aggregation.ts`)
- **Query_Optimizer**: Component that optimizes database queries before execution
- **Parallel_Fetcher**: Component that fetches multiple pages simultaneously
- **Request_Controller**: Component that manages request lifecycle (cancellation, deduplication)
- **Grid_Cache**: Intelligent cache for grid data with smart invalidation
- **AbortController**: Browser API for canceling in-flight HTTP requests
- **Batch_Size**: Number of pages to fetch in parallel (default: 5)
- **Page_Size**: Number of records per page (current: 10000)
- **Sequential_Fetch**: Current pattern of fetching pages one by one (SLOW)
- **Parallel_Fetch**: New pattern of fetching multiple pages simultaneously (FAST)

## Requirements

### Requirement 1: Parallel Page Fetching

**User Story:** As a user viewing the NFe grid, I want data to load faster, so that I can see results quickly even with large datasets.

#### Acceptance Criteria

1. WHEN fetching grid data with multiple pages, THE Parallel_Fetcher SHALL fetch up to 5 pages simultaneously
2. WHEN a page fetch completes, THE Parallel_Fetcher SHALL immediately start fetching the next pending page
3. WHEN all pages are fetched, THE Grid_Service SHALL aggregate results in correct order
4. THE Parallel_Fetcher SHALL respect the maximum of 100 pages limit
5. WHEN fetching in parallel, THE system SHALL show accurate progress (current page / total pages)

### Requirement 2: Request Cancellation on Filter Change

**User Story:** As a user changing filters rapidly, I want old requests to be cancelled, so that only the latest filter selection is processed.

#### Acceptance Criteria

1. WHEN a user changes grid filters, THE Request_Controller SHALL cancel all pending requests for the previous filter
2. WHEN requests are cancelled, THE Request_Controller SHALL use AbortController to stop in-flight HTTP requests
3. WHEN a request is cancelled, THE system SHALL NOT process its response
4. THE Request_Controller SHALL clean up cancelled request resources immediately
5. WHEN showing progress, THE system SHALL only count non-cancelled requests

### Requirement 3: Intelligent Grid Cache

**User Story:** As a user navigating between date ranges, I want previously loaded data to be cached, so that returning to the same period is instant.

#### Acceptance Criteria

1. WHEN grid data is successfully fetched, THE Grid_Cache SHALL store it with a cache key based on filters
2. WHEN the same filters are applied again within cache TTL, THE Grid_Cache SHALL return cached data without network requests
3. THE Grid_Cache SHALL implement a 5-minute TTL for grid data
4. WHEN cache size exceeds 50MB, THE Grid_Cache SHALL evict oldest entries first
5. WHEN filters change, THE Grid_Cache SHALL check for cached data before making network requests

### Requirement 4: Query Optimization at Database Level

**User Story:** As a system architect, I want database queries to be optimized, so that the backend responds faster and uses fewer resources.

#### Acceptance Criteria

1. WHEN querying fiscal documents, THE backend SHALL use indexed fields (dtEmi, cnpjEmit, cnpjDest)
2. WHEN counting documents, THE backend SHALL use MongoDB countDocuments() instead of fetching all data
3. WHEN aggregating data, THE backend SHALL use MongoDB aggregation pipeline with $match first
4. THE backend SHALL limit query results to requested page size (no over-fetching)
5. WHEN queries are slow (> 2s), THE backend SHALL log query details for optimization

### Requirement 5: Progress Feedback During Loading

**User Story:** As a user waiting for grid data, I want to see accurate progress, so that I know how long to wait and that the system is working.

#### Acceptance Criteria

1. WHEN fetching grid data, THE Grid_Service SHALL emit progress events with current/total pages
2. WHEN using cached data, THE Grid_Service SHALL immediately show 100% progress
3. WHEN fetching in parallel, THE progress SHALL accurately reflect completed vs pending pages
4. THE progress indicator SHALL show estimated time remaining based on current fetch speed
5. WHEN an error occurs, THE progress SHALL show which page failed and allow retry

### Requirement 6: Error Handling and Retry Logic

**User Story:** As a user experiencing network issues, I want failed requests to be retried automatically, so that temporary issues don't require manual intervention.

#### Acceptance Criteria

1. WHEN a page fetch fails, THE Grid_Service SHALL retry up to 3 times with exponential backoff
2. WHEN all retries fail, THE Grid_Service SHALL continue fetching other pages and report the failure
3. WHEN a critical error occurs (auth failure), THE Grid_Service SHALL stop all fetching and show error
4. THE Grid_Service SHALL distinguish between retryable errors (timeout, 500) and non-retryable (401, 403)
5. WHEN retrying, THE system SHALL use the same AbortController to allow cancellation

### Requirement 7: Memory Management for Large Datasets

**User Story:** As a user loading large datasets (100k+ records), I want the system to handle memory efficiently, so that the browser doesn't crash or slow down.

#### Acceptance Criteria

1. WHEN accumulating grid data, THE Grid_Service SHALL monitor memory usage
2. WHEN memory usage exceeds 200MB, THE Grid_Service SHALL warn the user and suggest filtering
3. THE Grid_Service SHALL process data in chunks to avoid blocking the main thread
4. WHEN data is no longer needed, THE Grid_Service SHALL clear references to allow garbage collection
5. THE Grid_Cache SHALL implement size limits to prevent unbounded memory growth

### Requirement 8: Backward Compatibility

**User Story:** As a developer, I want the optimized services to maintain the same interface, so that existing components continue to work without changes.

#### Acceptance Criteria

1. THE optimized Grid_Service SHALL maintain the same `fetchGridData()` signature
2. THE optimized Fiscal_Documents_Service SHALL maintain the same `fetchDocuments()` signature
3. THE optimized Aggregation_Service SHALL maintain the same `fetchAnalyticsAggregation()` signature
4. WHEN components use the old interface, THE system SHALL work with improved performance
5. THE system SHALL provide migration guides for optional new features

### Requirement 9: Performance Monitoring and Metrics

**User Story:** As a DevOps engineer, I want performance metrics to be logged, so that I can track improvements and identify bottlenecks.

#### Acceptance Criteria

1. WHEN fetching grid data, THE system SHALL log total time, pages fetched, and cache hit/miss
2. WHEN using parallel fetching, THE system SHALL log average page fetch time and parallelism achieved
3. WHEN queries are slow, THE system SHALL log query parameters and execution time
4. THE system SHALL expose metrics via console for debugging (development mode)
5. WHEN performance degrades, THE system SHALL log warnings with actionable context

### Requirement 10: Code Organization and File Size

**User Story:** As a maintainer, I want code to be organized in focused files under 500 lines, so that the codebase remains maintainable.

#### Acceptance Criteria

1. WHEN creating new services, THE code SHALL be split into files under 500 lines each
2. THE Grid_Service SHALL be split into: core service, parallel fetcher, cache manager
3. THE Request_Controller SHALL be in a separate file from HTTP service
4. WHEN files exceed 500 lines, THE developer SHALL refactor into smaller modules
5. THE system SHALL use barrel exports for clean import paths
