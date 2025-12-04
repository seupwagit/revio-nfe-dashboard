# Implementation Plan

## Important Guidelines

**Non-Breaking Implementation:**
- All changes must be additive - don't modify existing functionality
- Test existing features after each change
- Use composition and extension over modification
- Wrap existing components instead of rewriting them

**Continuous Validation:**
- Run `npm run checktype` after completing each sub-task
- Fix all TypeScript errors before proceeding to next task
- Use chrome-devtools MCP to monitor console errors in real-time
- Apply fixes immediately when errors are detected

**MCP Usage:**
- Use `chrome-devtools` MCP to monitor console, test UI, and check network requests
- Use `mssql` MCP to discover schema and test queries before implementation
- Check console messages after each code change
- Verify no new errors are introduced
- All new features MUST be additive - do not modify existing functionality
- Existing grids and components must continue to work without changes
- Use composition and wrapper patterns instead of modifying existing code
- Test existing features after each implementation step

**Type Safety (CRITICAL):**
- Run `npm run checktype` after completing EACH sub-task
- Fix all TypeScript errors before proceeding to next task
- Ensure no type regressions are introduced

**Real-Time Error Monitoring with MCP chrome-devtools:**
- After each UI component implementation, use `mcp_chrome_devtools_list_console_messages` to check for errors
- Use `mcp_chrome_devtools_navigate_page` to test user flows in browser
- Use `mcp_chrome_devtools_take_snapshot` to verify UI rendering
- Use `mcp_chrome_devtools_click` and `mcp_chrome_devtools_fill` to test interactions
- Fix console errors IMMEDIATELY before proceeding

**SQL Server Database Discovery with MCP mssqlMcp:**
- Before implementing Prisma schema, use `mcp_mssql_list_tables` to discover existing tables
- Use `mcp_mssql_describe_table` to understand CSV and tbl_nfe_dow_det structure
- Use `mcp_mssql_execute_query` to test INSERT/SELECT queries manually
- Verify foreign key relationships and constraints before coding

**Workflow for Each Task:**
```
1. Implement code changes
2. Run `npm run checktype` - fix any errors
3. If UI changes: Start dev server and use chrome-devtools MCP to check console
4. If database changes: Use mssqlMcp to verify schema and test queries
5. Fix any issues immediately
6. Proceed to next sub-task only when current is clean
```

**Type Checking Protocol:**
- Run `npm run checktype` after completing each sub-task
- Fix all TypeScript errors before proceeding to next task
- Do not introduce new type errors
- Ensure type safety throughout implementation

---

- [x] 1. Configure environment and project setup





  - [x] 1.1 Update vite.config.ts to use VITE_PORT environment variable


    - Read VITE_PORT from environment with fallback to 3000
    - Configure server.host: true for Coolify compatibility
    - Configure preview server with same port settings
    - **Run `npm run checktype` after completion**
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 1.2 Add environment variables to .env.example


    - Add VITE_PORT=3000
    - Add S3 configuration variables (endpoint, keys, bucket)
    - Add SQL Server connection variables
    - _Requirements: 7.1, 8.1, 8.2, 8.3, 8.4_


  - [x] 1.3 Install required dependencies

    - Install @aws-sdk/client-s3 for Wasabi S3 integration
    - Install jszip for ZIP file creation
    - Install @prisma/client for SQL Server access
    - Install fast-check for property-based testing
    - Install vitest if not already present
    - _Requirements: 5.4, 5.5, 6.1_

  - [x] 1.4 Set up Prisma schema for SQL Server


    - **FIRST - Use MCP mssqlMcp:** Run `mcp_mssql_list_tables` to discover existing tables
    - **THEN - Use MCP mssqlMcp:** Run `mcp_mssql_describe_table` for CSV and tbl_nfe_dow_det
    - Create prisma/schema.prisma with SQL Server provider matching discovered schema
    - Define CSV model with required fields (match existing table structure exactly)
    - Define NfeDownloadDetail model with foreign key (match existing table structure exactly)
    - Configure connection string using environment variables
    - **Run `npm run checktype` after completion**
    - _Requirements: 6.1, 6.2, 6.3, 6.6_

  - [x] 1.5 Generate Prisma client


    - Run prisma generate to create client
    - **Use MCP mssqlMcp:** Test connection with `mcp_mssql_execute_query` (simple SELECT 1)
    - Verify connection to SQL Server works
    - **Run `npm run checktype` after completion**
    - _Requirements: 6.1, 6.2_
-

- [x] 2. Implement core selection service







  - [-] 2.1 Create SelectionService class












    - Implement addSelection method with duplicate prevention
    - Implement removeSelection method
    - Implement getSelectedKeys method returning Map<CollectionType, Set<string>>
    - Implement clearSelections method
    - Implement getSelectionCount method
    - Implement isSelected method
    - Use Map with Set for efficient storage and lookup
    - **Run `npm run checktype` after completion**
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.2 Write property test for selection toggle




    - **Property 1: Selection toggle consistency**
    - **Validates: Requirements 1.2**


  - [ ]* 2.3 Write property test for selection uniqueness

    - **Property 2: Selection uniqueness**
    - **Validates: Requirements 1.3**



  - [ ]* 2.4 Write property test for deselection removal


    - **Property 3: Deselection removal**
    - **Validates: Requirements 1.4**

  - [x] 2.5 Create collection key mapping utility



    - Define CollectionType enum ('NFE' | 'CTE' | 'CFE')
    - Create function to get key field name for collection type
    - Map NFE -> CHV_NFE, CTE -> CHV, CFE -> CHV_CFe
    - **Run `npm run checktype` after completion**
    - _Requirements: 1.5, 1.6, 1.7_



  - [ ]* 2.6 Write property test for key field mapping


    - **Property 4: Collection key field mapping**
    - **Validates: Requirements 1.5, 1.6, 1.7**

- [ ] 3. Implement S3 service for Wasabi integration


  - [ ] 3.1 Create S3Service class
    - Initialize S3Client with Wasabi endpoint and credentials
    - Implement downloadFile method using GetObjectCommand
    - Implement downloadFiles method with parallel downloads (max 5 concurrent)
    - Handle S3 errors (404, 403, 503) with specific error messages
    - **Run `npm run checktype` after completion**
    - _Requirements: 5.4, 8.1, 8.2, 8.3, 8.4_




  - [ ]* 3.2 Write unit tests for S3Service
    - Test S3 client initialization with correct config
    - Test single file download with mocked S3 client
    - Test batch file download
    - Test error handling for various S3 failures



    - _Requirements: 5.4, 8.5_


  - [ ] 3.3 Write property test for S3 download completeness


    - **Property 12: S3 download completeness**
    - **Validates: Requirements 5.4**



  - [ ] 3.4 Write property test for S3 object key construction


    - **Property 22: S3 object key construction**
    - **Validates: Requirements 8.5**

- [ ] 4. Implement CSV generation service
  - [ ] 4.1 Create CSVService class
    - Implement generateCSV method that converts document array to CSV string
    - Handle all document fields dynamically
    - Escape special characters (quotes, commas, newlines)
    - Implement toBuffer method to convert CSV string to Buffer
    - **Run `npm run checktype` after completion**
    - _Requirements: 4.4_


  - [ ]4.2 Write unit tests for CSVService





    - Test CSV generation with various document structures
    - Test special character handling
    - Test buffer conversion
  - [ ] 4.3 Write property test for CSV field completeness


  - [ ]* 4.3 Write property test for CSV field completeness
    - **Property 9: CSV field completeness**
    - **Validates: Requirements 4.4**

- [ ] 5. Implement download orchestration service

  - [ ] 5.1 Create DownloadService class with progress tracking

    - Define DownloadProgress interface with status states
    - Implement progress state management
    - Implement getProgress method
    - **Run `npm run checktype` after completion**
    - _Requirements: 9.1, 9.2_

  - [ ] 5.2 Implement metadata retrieval from MongoDB

    - Create method to query tbl_historico_upload by CHAVE values
    - Extract ARQUIVO (filename) and _id (S3 key) from results
    - Handle case where metadata is not found for some keys
    - **Run `npm run checktype` after completion**
    - _Requirements: 5.1, 5.2, 5.3_


  - [ ] 5.3 Write property test for metadata query correctness



    - **Property 10: Metadata query correctness**
    - **Validates: Requirements 5.2**



  - [ ] 5.4 Write property test for metadata field extraction


    - **Property 11: Metadata field extraction**
    - **Validates: Requirements 5.3**


  - [ ] 5.5 Implement ZIP archive creation
    - Use JSZip to create archive
    - Add XML files with original filenames
    - Conditionally add CSV file if includeCSV is true
    - Generate descriptive ZIP filename with timestamp
    - **Run `npm run checktype` after completion**
    - _Requirements: 5.5, 5.6_



  - [ ] 5.6 Write property test for ZIP completeness


    - **Property 13: ZIP archive completeness**
    - **Validates: Requirements 5.5**

  - [ ]* 5.7 Write property test for ZIP CSV inclusion
    - **Property 14: ZIP CSV inclusion**
    - **Validates: Requirements 5.6**

  - [ ] 5.8 Implement browser download trigger

    - Create Blob from ZIP buffer
    - Create temporary download link
    - Trigger click and cleanup
    - **Run `npm run checktype` after completion**
    - _Requirements: 5.7_

  - [ ] 5.9 Implement downloadImmediate orchestration method
    - Update progress to 'fetching-metadata'
    - Call metadata retrieval
    - Update progress to 'downloading'
    - Call S3Service to download files
    - Update progress to 'zipping'
    - Create ZIP with XMLs and optional CSV
    - Trigger browser download
    - Update progress to 'complete'
    - Clear selection state
    - Display success message with file count
    - Handle errors at each step with specific messages
    - **Run `npm run checktype` after completion**
    - **Start dev server and use chrome-devtools MCP to verify no console errors**
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 9.1, 9.2, 9.3, 9.4_

  - [ ]* 5.10 Write property test for post-download cleanup
    - **Property 15: Post-download cleanup**
    - **Validates: Requirements 5.8**

- [ ] 6. Implement scheduled download service
  - [ ] 6.1 Create ScheduleService class
    - Initialize Prisma client
    - Implement scheduleDownload method
    - _Requirements: 6.1_

  - [ ] 6.2 Implement CSV table record creation
    - Use Prisma transaction for atomicity
    - Insert record into CSV table with status=1
    - Set CSV column based on includeCSV flag (1 or 0)
    - Capture returned ID for child records
    - _Requirements: 6.3, 6.4, 6.5_

  - [ ]* 6.3 Write property test for scheduled download record creation
    - **Property 16: Scheduled download record creation**
    - **Validates: Requirements 6.3**

  - [ ]* 6.4 Write property test for CSV flag mapping
    - **Property 17: CSV flag mapping**
    - **Validates: Requirements 6.4, 6.5**

  - [ ] 6.5 Implement detail records creation
    - Insert records into tbl_nfe_dow_det with status=1
    - Set CSV_ID foreign key to parent record ID
    - Set CHAVE to each selected document key
    - Use bulk insert for efficiency
    - _Requirements: 6.6, 6.7_

  - [ ]* 6.6 Write property test for detail records creation
    - **Property 18: Detail records creation**
    - **Validates: Requirements 6.6**

  - [ ]* 6.7 Write property test for detail record association
    - **Property 19: Detail record association**
    - **Validates: Requirements 6.7**

  - [ ] 6.8 Implement transaction rollback on failure
    - Wrap all database operations in Prisma transaction
    - Rollback if any operation fails
    - Return error details to caller
    - _Requirements: 6.1, 6.3, 6.6_

  - [ ] 6.9 Implement post-schedule cleanup and feedback
    - Clear selection state after successful schedule
    - Display success message with schedule ID
    - _Requirements: 6.8, 6.9_

  - [ ]* 6.10 Write property test for post-schedule cleanup
    - **Property 20: Post-schedule cleanup**
    - **Validates: Requirements 6.9**

- [ ] 7. Create React components for UI
  - [ ] 7.1 Create GridWithSelection component
    - Add checkbox column as first column
    - Bind checkbox state to SelectionService
    - Handle checkbox click events
    - Extract document key using collection-specific field
    - Sync checkbox state with SelectionService
    - _Requirements: 1.1, 1.2, 1.5, 1.6, 1.7_

  - [ ]* 7.2 Write property test for selection toggle in UI
    - **Property 1: Selection toggle consistency** (UI integration)
    - **Validates: Requirements 1.2**

  - [ ] 7.3 Create DownloadManager component
    - Render download button with selection count
    - Disable button when selection is empty
    - Show tooltip on disabled button
    - Render "Baixar Agora" checkbox (checked by default)
    - Render "CSV" checkbox
    - Handle download button click based on mode
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, 4.1, 4.2_

  - [ ]* 7.4 Write property test for download button enablement
    - **Property 5: Download button enablement**
    - **Validates: Requirements 2.2**

  - [ ]* 7.5 Write property test for selection count accuracy
    - **Property 6: Selection count accuracy**
    - **Validates: Requirements 2.3**

  - [ ]* 7.6 Write property test for download mode toggle
    - **Property 7: Download mode toggle**
    - **Validates: Requirements 3.2**

  - [ ]* 7.7 Write property test for CSV inclusion configuration
    - **Property 8: CSV inclusion configuration**
    - **Validates: Requirements 4.2, 4.3**

  - [ ] 7.8 Create ProgressDisplay component
    - Show loading indicator during download
    - Display current file and total files
    - Show status message (fetching, downloading, zipping)
    - Display error messages with details
    - Display success message with file count
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 7.9 Write property test for progress accuracy
    - **Property 23: Progress accuracy**
    - **Validates: Requirements 9.2**

  - [ ]* 7.10 Write property test for error message display
    - **Property 24: Error message display**
    - **Validates: Requirements 9.3**

  - [ ]* 7.11 Write property test for success message with count
    - **Property 25: Success message with count**
    - **Validates: Requirements 9.4**

  - [ ] 7.12 Create ClearSelection component
    - Render "Clear Selection" button
    - Show button only when selection is not empty
    - Handle click to clear all selections
    - Uncheck all grid checkboxes
    - Disable download button after clear
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ] 7.13 Write property test for clear button visibility


    - **Property 26: Clear button visibility**
    - **Validates: Requirements 10.1**


  - [ ]* 7.14 Write property test for clear selection completeness
    - **Property 27: Clear selection completeness**
    - **Validates: Requirements 10.2**


  - [ ]* 7.15 Write property test for clear UI synchronization
    - **Property 28: Clear UI synchronization**
    - **Validates: Requirements 10.3, 10.4**

- [ ] 8. Integrate components into existing grids
  - [ ] 8.1 Update NFe grid component

    - Wrap existing grid with GridWithSelection
    - Pass collectionType='NFE'
    - Pass getDocumentKey function extracting CHV_NFE
    - Add DownloadManager component above or below grid
    - Add ClearSelection component
    - _Requirements: 1.1, 1.5_

  - [ ] 8.2 Update CTe grid component
    - Wrap existing grid with GridWithSelection
    - Pass collectionType='CTE'
    - Pass getDocumentKey function extracting CHV
    - Add DownloadManager component above or below grid
    - Add ClearSelection component
    - _Requirements: 1.1, 1.6_

  - [ ] 8.3 Update CFe grid component
    - Wrap existing grid with GridWithSelection
    - Pass collectionType='CFE'
    - Pass getDocumentKey function extracting CHV_CFe
    - Add DownloadManager component above or below grid
    - Add ClearSelection component
    - _Requirements: 1.1, 1.7_

- [ ] 9. Create property test generators
  - [ ] 9.1 Create generators.ts file
    - Create arbitrary for CollectionType
    - Create arbitrary for document keys (44-character strings)
    - Create arbitrary for document records with random fields
    - Create arbitrary for selection states
    - Create arbitrary for download options
    - _Requirements: All property tests_

- [ ] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Create Dockerfile for Coolify deployment
  - [ ] 11.1 Create multi-stage Dockerfile
    - Stage 1: Build application with npm run build
    - Stage 2: Production image with built files
    - Expose port 3000
    - Set CMD to run preview server
    - _Requirements: 7.4_

  - [ ] 11.2 Create .dockerignore file
    - Exclude node_modules
    - Exclude .git
    - Exclude development files
    - _Requirements: 7.4_

- [ ] 12. Add error handling and logging
  - [ ] 12.1 Implement error boundary component
    - Catch React errors in download components
    - Display user-friendly error messages
    - Log errors for debugging
    - _Requirements: 9.3_

  - [ ] 12.2 Add error logging to services
    - Log S3 errors with request details
    - Log MongoDB errors with query details
    - Log SQL Server errors with operation details
    - Use console.error for development, consider logging service for production
    - _Requirements: 9.3_

  - [ ] 12.3 Implement retry logic for transient failures
    - Add retry for S3 downloads (max 3 attempts)
    - Add retry for MongoDB queries (max 2 attempts)
    - Add exponential backoff
    - _Requirements: 5.4, 5.1_

- [ ] 13. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Documentation and deployment preparation
  - [ ] 14.1 Update README with download feature documentation
    - Document environment variables
    - Document deployment steps for Coolify
    - Document SQL Server setup requirements
    - _Requirements: 7.1, 7.4_

  - [ ] 14.2 Create migration guide for Prisma
    - Document how to run prisma migrate
    - Document how to verify SQL Server connection
    - _Requirements: 6.1, 6.2_

  - [ ] 14.3 Create deployment checklist
    - List all environment variables to configure
    - List all database connections to verify
    - List all external services to test (S3, MongoDB, SQL Server)
    - _Requirements: 7.4, 8.1, 8.2, 8.3, 8.4_
