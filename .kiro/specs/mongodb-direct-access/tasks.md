# Implementation Plan

## Completed Core Infrastructure ✅

- [x] 1. Setup and Dependencies
- [x] 1.1 Install required dependencies (mongodb, fast-check, @testcontainers/mongodb, zod)
- [x] 1.2 Update environment variables in .env
- [x] 2.1 Create src/services/mongoConnection.ts with singleton pattern
- [x] 2.2 Implement reconnection logic with exponential backoff (reconnectionManager.ts)
- [x] 2.4 Implement isHealthy() health check method
- [x] 2.5 Implement switchDatabase() for dynamic database switching
- [x] 3.1 Create src/services/mongoQuery.ts with QueryOptions and QueryResult
- [x] 3.2 Implement count methods with optimization (estimatedCount vs countDocuments)
- [x] 3.5 Implement aggregate() method
- [x] 3.6 Add read-only enforcement
- [x] 4.1 Create src/services/documentMapper.ts with mapping rules
- [x] 4.2 Implement mapDocument() method
- [x] 4.3 Implement mapDocuments() batch method
- [x] 4.4 Add Zod schema validation (documentSchemas.ts)
- [x] 5.1 Create src/services/mongoCache.ts adapted from streamingCache.ts
- [x] 5.2 Update cache key generation for MongoDB queries
- [x] 6.1 Create src/services/fiscalDocuments.ts
- [x] 6.2 Implement fetchDocuments() method
- [x] 6.3 Implement fetchCount() method
- [x] 6.4 Implement fetchStats() method

## Remaining Implementation Tasks

- [ ] 7. Adapt Natural Search Service for MongoDB
  - Update to generate MongoDB queries instead of REST filters
  - Integrate with LLM Configuration System (multi-provider support)
  - Validate generated queries
  - Add fallback for invalid queries
  - **NOTE:** This task depends on the LLM Configuration System spec being implemented first
  - See: `.kiro/specs/llm-configuration-system/` for full LLM system design
  - _Requirements: 2.4, 17.1, 17.2, 17.3, 17.5_

- [ ] 7.1 Create or update src/services/naturalSearch.ts
  - Define NaturalSearchResult interface
  - Implement NaturalSearchService class
  - Integrate with LLMService (from llm-configuration-system)
  - Pass tenantId and userId for quota tracking
  - _Requirements: 2.4, 17.1_

- [ ] 7.2 Implement parseQuery() method
  - Call LLMService.processQuery() with natural language text
  - Parse LLM response
  - Convert to MongoDB query filter
  - Validate query syntax
  - Return query with confidence score
  - _Requirements: 2.4, 17.2_

- [ ] 7.4 Implement executeSearch() method
  - Call parseQuery() to get MongoDB query
  - Execute query via FiscalDocumentsService
  - Return results
  - Handle errors with clear messages
  - Handle quota exceeded errors
  - _Requirements: 17.3, 17.5_

- [ ] 8. Update React Context to use MongoDB services
  - Replace mongoApi imports with fiscalDocuments service
  - Update carregarDados() to use new service
  - Maintain progress callbacks
  - Keep error handling
  - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [ ] 8.1 Update src/contexts/NFContext.tsx
  - Import fiscalDocumentsService instead of mongoApiService
  - Replace fetchDocuments() calls with fiscalDocumentsService.fetchDocuments()
  - Replace countDocuments() calls with fiscalDocumentsService.fetchCount()
  - Update to use MongoDB-based stats calculation
  - Keep progress callback logic
  - Keep error handling logic
  - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [ ] 9. Update Dashboard and Grid Components
  - Verify components work with new data source
  - Test all visualizations render correctly
  - Test filters apply correctly
  - Test pagination works
  - Test Excel export works
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

- [ ] 9.1 Test Dashboard component (src/pages/Dashboard.tsx)
  - Verify stats cards display correctly with MongoDB data
  - Verify charts render with MongoDB data
  - Test date range filters
  - Test collection selector
  - _Requirements: 2.1_

- [ ] 9.2 Test Grid components (GridPaginada, GridAvancada, etc.)
  - Verify grid renders with MongoDB data
  - Test pagination controls
  - Test column sorting
  - Test row selection
  - _Requirements: 2.2, 2.6_

- [ ] 9.3 Test Filter components (FiltroNotas, PeriodPresets)
  - Verify filters generate correct MongoDB queries
  - Test date range validation
  - Test CNPJ filters
  - Test status filters
  - _Requirements: 2.3, 3.4_

- [ ] 9.4 Test Excel export (ExportarExcel component)
  - Verify export generates file with MongoDB data
  - Test export with filters applied
  - Test export with large datasets
  - _Requirements: 2.5_

- [ ] 10. Implement Error Handling and Logging
  - Create centralized error handler
  - Add comprehensive logging
  - Implement timeout handling
  - Add user-friendly error messages
  - _Requirements: 9.2, 9.3, 17.5, 18.1, 18.2, 18.3, 18.5_

- [ ] 10.1 Create src/services/errorHandler.ts
  - Define ErrorResponse interface
  - Implement ErrorHandler class
  - Implement handle() method
  - Implement isRetryable() method
  - Implement shouldReconnect() method
  - Implement getUserMessage() method
  - _Requirements: 18.2, 18.5_

- [ ] 10.2 Add comprehensive logging to all MongoDB services
  - Log all MongoDB operations with timing
  - Log errors with stack traces
  - Log performance metrics
  - Use console.group for organized logs
  - _Requirements: 9.2, 9.3_

- [ ] 10.3 Implement timeout handling in mongoQuery.ts
  - Set timeout on MongoDB operations using VITE_QUERY_TIMEOUT_MS
  - Cancel operations that exceed timeout
  - Return timeout error to user
  - _Requirements: 18.3_

- [ ] 11. Implement Email Service (Brevo Integration) - OPTIONAL
  - Create email service using Brevo SMTP
  - Add email sending functionality
  - Add error handling for email failures
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 11.1 Create src/services/emailService.ts
  - Define EmailConfig interface
  - Implement EmailService class
  - Configure Brevo SMTP connection using env vars
  - _Requirements: 10.1_

- [ ] 11.2 Implement sendEmail() method
  - Accept recipient, subject, body parameters
  - Use configured EMAIL_FROM and EMAIL_FROM_NAME
  - Send email via Brevo SMTP
  - Handle errors with logging
  - _Requirements: 10.2, 10.3, 10.4_

- [ ] 12. Implement Storage Service (Wasabi S3 Integration) - OPTIONAL
  - Create storage service using Wasabi S3
  - Add upload functionality
  - Add download functionality
  - Add error handling for storage failures
  - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [ ] 12.1 Create src/services/storageService.ts
  - Define StorageConfig interface
  - Implement StorageService class
  - Configure Wasabi S3 client using env vars
  - _Requirements: 11.1_

- [ ] 12.2 Implement upload() method
  - Accept file and key parameters
  - Upload to configured bucket
  - Return file URL
  - Handle errors with logging
  - _Requirements: 11.2, 11.4_

- [ ] 12.3 Implement download() method
  - Accept key parameter
  - Download from configured bucket
  - Return file data
  - Handle errors with logging
  - _Requirements: 11.3, 11.4_

- [ ] 13. Remove REST API Dependencies
  - Remove or deprecate old REST API code
  - Clean up unused proxy server files
  - Update imports throughout codebase
  - _Requirements: 1.2_

- [ ] 13.1 Audit and update component imports
  - Search for imports from src/services/api.ts
  - Search for imports from src/services/mongoApi.ts
  - Update to use fiscalDocumentsService
  - _Requirements: 1.2_

- [ ] 13.2 Deprecate or remove old API files
  - Add deprecation notice to src/services/api.ts
  - Add deprecation notice to src/services/mongoApi.ts
  - Consider keeping for backward compatibility initially
  - _Requirements: 1.2_

- [ ] 13.3 Clean up proxy server files (optional)
  - Evaluate if scripts/proxy-server.cjs is still needed
  - Evaluate if scripts/aggregation-server.cjs is still needed
  - Evaluate if server/mongodb-proxy.ts is still needed
  - Document which files are deprecated
  - _Requirements: 1.2_

- [ ] 14. Create Documentation
  - Create SCHEMA.md with complete database schema
  - Create MongoDB setup guide
  - Create migration guide
  - Update architecture documentation
  - _Requirements: 7.1, 7.2, 7.3, 14.1, 14.2, 14.3, 14.4_

- [ ] 14.1 Create docs/SCHEMA.md
  - Document tbl_nfe_100 schema with all fields
  - Document tbl_cfe_100 schema with all fields
  - Document tbl_cte_100 schema with all fields
  - Document recommended indexes
  - Document common queries with examples
  - Include ERD diagrams (textual or Mermaid)
  - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [ ] 14.2 Create docs/guias/MONGODB_DIRECT_ACCESS_SETUP.md
  - Document environment variable setup
  - Document connection string configuration
  - Document how to test connection
  - Document index creation recommendations
  - Add troubleshooting section
  - _Requirements: 7.2_

- [ ] 14.3 Create docs/implementacoes/MIGRACAO_REST_TO_MONGODB_DIRETO.md
  - Document migration steps from REST API to direct MongoDB
  - Document breaking changes
  - Document compatibility notes
  - Document rollback procedure
  - Add testing checklist
  - _Requirements: 7.2_

- [ ] 14.4 Update docs/arquitetura/ARCHITECTURE.md
  - Update architecture diagrams to show direct MongoDB access
  - Document new service layer components
  - Document data flow from MongoDB to UI
  - Document error handling strategy
  - Document caching strategy
  - _Requirements: 7.3_

- [ ] 15. Checkpoint - Manual Testing
  - Test all features manually
  - Verify data loads correctly
  - Verify filters work
  - Verify pagination works
  - Ask user if questions arise

- [ ] 16. Performance Testing and Optimization
  - Test query performance
  - Test cache effectiveness
  - Test large dataset handling
  - Optimize slow queries
  - _Requirements: 5.4, 16.4, 16.5_

- [ ] 16.1 Create performance test suite
  - Test query performance with various filters
  - Test pagination performance
  - Test aggregation performance
  - Test cache hit rate
  - Measure and log execution times
  - _Requirements: 5.4_

- [ ] 16.2 Test with large datasets
  - Test with 100k+ documents
  - Test with 365-day date ranges
  - Test with complex filters
  - Verify no memory issues
  - _Requirements: 16.5_

- [ ] 16.3 Verify index usage with explain()
  - Use MongoDB explain() to verify queries use indexes
  - Identify queries not using indexes
  - Document findings
  - _Requirements: 16.4_

- [ ] 16.4 Optimize slow queries
  - Identify queries taking > 1 second
  - Add appropriate indexes to MongoDB
  - Optimize aggregation pipelines
  - Use projections to reduce data transfer
  - _Requirements: 5.4, 16.4_

- [ ] 17. Final Testing and Validation
  - Perform comprehensive manual testing
  - Verify error handling works correctly
  - Validate documentation is complete
  - _Requirements: All_

- [ ] 17.1 Perform comprehensive manual testing
  - Test dashboard with various date ranges
  - Test all grid features (pagination, sorting, filtering)
  - Test natural search with various queries (if implemented)
  - Test Excel export
  - Test collection switching
  - Test error scenarios (disconnect MongoDB, invalid filters, etc.)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 17.2 Validate error handling
  - Test connection failures
  - Test query timeouts
  - Test invalid data
  - Verify error messages are clear and user-friendly
  - Verify reconnection works automatically
  - _Requirements: 1.5, 9.2, 9.3, 17.5, 18.1, 18.2, 18.3, 18.4, 18.5_

- [ ] 17.3 Validate documentation
  - Review all documentation files
  - Verify code examples work
  - Check for completeness
  - Fix any errors or omissions
  - _Requirements: 7.1, 7.2, 7.3, 14.1, 14.2, 14.3, 14.4_

- [ ] 17.4 Run typecheck and build
  - Run `npm run build` to verify TypeScript compilation
  - Fix any type errors
  - Verify no warnings
  - _Requirements: 13.4, 13.5_

- [ ] 18. Final Checkpoint - Production Readiness
  - Ensure all critical features work
  - Ensure error handling is robust
  - Ensure documentation is complete
  - Ask user for final approval before considering spec complete

## Optional Testing Tasks (Property-Based & Unit Tests)

These tasks are marked optional to focus on core functionality first. They can be implemented later for comprehensive test coverage.

- [ ]* 2.3 Write property test for reconnection backoff
  - **Property 4: Automatic Reconnection with Backoff**
  - **Validates: Requirements 1.5, 18.1**

- [ ]* 2.6 Write property test for dynamic database switching
  - **Property 9: Dynamic Database Switching**
  - **Validates: Requirements 4.1**

- [ ]* 2.7 Write unit tests for connection service
  - Test successful connection
  - Test connection failure handling
  - Test health check
  - Test database switching
  - _Requirements: 1.1, 1.5, 4.1_

- [ ]* 3.3 Write property test for optimized count strategy
  - **Property 10: Optimized Count Strategy**
  - **Validates: Requirements 5.1, 5.3**

- [ ]* 3.4 Write property test for pagination count calculation
  - **Property 11: Pagination Count Calculation**
  - **Validates: Requirements 5.2**

- [ ]* 3.7 Write property test for read-only operations
  - **Property 2: Read-Only Operations**
  - **Validates: Requirements 1.3**

- [ ]* 3.8 Write property test for cursor-based pagination
  - **Property 16: Cursor-Based Pagination**
  - **Validates: Requirements 16.1**

- [ ]* 3.9 Write unit tests for query service
  - Test find with various filters
  - Test pagination parameters
  - Test count methods
  - Test aggregate
  - Test read-only enforcement
  - _Requirements: 1.2, 1.3, 5.1, 5.3, 16.1_

- [ ]* 4.5 Write property test for document mapping consistency
  - **Property 3: Document Mapping Consistency**
  - **Validates: Requirements 1.4, 6.1, 6.4**

- [ ]* 4.6 Write property test for data validation
  - **Property 19: Data Validation**
  - **Validates: Requirements 18.4**

- [ ]* 4.7 Write unit tests for document mapper
  - Test NF-e mapping
  - Test CF-e mapping
  - Test CT-e mapping
  - Test validation with Zod
  - Test error handling for invalid data
  - _Requirements: 1.4, 6.1, 6.4, 13.3, 18.4_

- [ ]* 5.3 Write property test for cache hit optimization
  - **Property 12: Cache Hit Optimization**
  - **Validates: Requirements 15.1, 15.2**

- [ ]* 5.4 Write property test for cache expiration
  - **Property 13: Cache Expiration**
  - **Validates: Requirements 15.3**

- [ ]* 5.5 Write property test for cache key uniqueness
  - **Property 14: Cache Key Uniqueness**
  - **Validates: Requirements 15.4**

- [ ]* 5.6 Write property test for cache cleanup
  - **Property 15: Cache Cleanup**
  - **Validates: Requirements 15.5**

- [ ]* 5.7 Write unit tests for cache service
  - Test cache hit
  - Test cache miss
  - Test expiration
  - Test cleanup
  - Test key generation
  - _Requirements: 15.1, 15.2, 15.3, 15.4, 15.5_

- [ ]* 6.5 Write property test for filter to MongoDB query translation
  - **Property 5: Filter to MongoDB Query Translation**
  - **Validates: Requirements 2.3**

- [ ]* 6.6 Write property test for pagination correctness
  - **Property 7: Pagination Correctness**
  - **Validates: Requirements 2.6, 16.2, 16.3**

- [ ]* 6.7 Write integration tests for fiscal documents service
  - Use Testcontainers to spin up MongoDB
  - Test fetchDocuments with real database
  - Test fetchCount with real database
  - Test fetchStats with real database
  - Test cache integration
  - _Requirements: 1.2, 2.1, 2.2, 2.3, 15.1, 15.2_

- [ ]* 7.3 Write property test for natural language to MongoDB query
  - **Property 6: Natural Language to MongoDB Query**
  - **Validates: Requirements 2.4, 17.2**

- [ ]* 7.5 Write unit tests for natural search
  - Mock Gemini API
  - Test query generation
  - Test query validation
  - Test error handling
  - _Requirements: 2.4, 17.1, 17.2, 17.5_

- [ ]* 8.2 Write integration tests for NFContext
  - Mock FiscalDocumentsService
  - Test data loading
  - Test progress updates
  - Test error handling
  - Test collection switching
  - _Requirements: 2.1, 2.2, 2.3, 2.6_

- [ ]* 9.5 Write E2E tests with Cypress
  - Test dashboard loading
  - Test grid pagination
  - Test filtering
  - Test Excel export
  - Test natural search
  - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6_

- [ ]* 10.4 Write property test for error logging and user feedback
  - **Property 17: Error Logging and User Feedback**
  - **Validates: Requirements 9.2, 9.3, 10.4, 11.4, 17.5, 18.2, 18.5**

- [ ]* 10.5 Write property test for query timeout handling
  - **Property 18: Query Timeout Handling**
  - **Validates: Requirements 18.3**

- [ ]* 10.6 Write unit tests for error handler
  - Test error categorization
  - Test user message generation
  - Test retryable detection
  - Test reconnection detection
  - _Requirements: 18.2, 18.3, 18.5_

- [ ]* 11.3 Write unit tests for email service
  - Mock SMTP transport
  - Test successful email send
  - Test error handling
  - Test configuration usage
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ]* 12.4 Write unit tests for storage service
  - Mock S3 client
  - Test successful upload
  - Test successful download
  - Test error handling
  - Test configuration usage
  - _Requirements: 11.1, 11.2, 11.3, 11.4_
