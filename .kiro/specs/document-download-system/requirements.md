# Requirements Document

## Introduction

This document specifies the requirements for a document download system that allows users to select fiscal documents from MongoDB collections (NFe, CTe, CFe), retrieve the original XML files from Wasabi S3 storage, and either download them immediately as a ZIP package or schedule the download for external processing. The system must also support CSV export of selected records and integrate with SQL Server for download scheduling.

## Glossary

- **System**: The document download system being specified
- **User**: A person interacting with the web application to select and download fiscal documents
- **Document**: A fiscal document (NFe, CTe, or CFe) stored in MongoDB collections
- **Document Key**: The unique identifier field for documents (CHV_NFE, CHV, or CHV_CFe depending on collection)
- **Wasabi S3**: The object storage service where original XML files are stored
- **Download Package**: A ZIP file containing selected XML documents and optionally a CSV file
- **SQL Server**: The Microsoft SQL Server database used for storing download scheduling records
- **Prisma**: The ORM tool used to interact with SQL Server
- **Coolify**: The deployment platform that the application must be compatible with
- **Frontend Port**: The port number (3000) used by the Vite development server
- **Collection**: A MongoDB collection containing fiscal document records (tbl_nfe_100, tbl_cte_100, tbl_cfe_100)
- **Upload History Collection**: The MongoDB collection (tbl_historico_upload) containing metadata about uploaded documents
- **Immediate Download**: A download operation that executes immediately and delivers the ZIP file to the user's browser
- **Scheduled Download**: A download operation that creates database records for external bot processing

## Requirements

### Requirement 1

**User Story:** As a user, I want to select multiple fiscal documents from grid views, so that I can download them in batch.

#### Acceptance Criteria

1. WHEN a grid displays fiscal documents THEN the System SHALL render a checkbox column as the first column
2. WHEN a user clicks a row checkbox THEN the System SHALL toggle the selection state for that document
3. WHEN a user selects a document THEN the System SHALL store the document key in memory without duplication
4. WHEN a user deselects a document THEN the System SHALL remove the document key from memory
5. WHERE the collection is tbl_nfe_100, WHEN storing document keys THEN the System SHALL use the CHV_NFE field value
6. WHERE the collection is tbl_cte_100, WHEN storing document keys THEN the System SHALL use the CHV field value
7. WHERE the collection is tbl_cfe_100, WHEN storing document keys THEN the System SHALL use the CHV_CFe field value

### Requirement 2

**User Story:** As a user, I want to see a download button that is only enabled when I have selected documents, so that I know when I can proceed with downloading.

#### Acceptance Criteria

1. WHEN no documents are selected THEN the System SHALL display the download button in a disabled state
2. WHEN at least one document is selected THEN the System SHALL display the download button in an enabled state
3. WHEN the download button is enabled THEN the System SHALL display the count of selected documents
4. WHEN a user hovers over the disabled download button THEN the System SHALL display a tooltip explaining that documents must be selected first

### Requirement 3

**User Story:** As a user, I want to choose between immediate download and scheduled download, so that I can decide when to process large batches.

#### Acceptance Criteria

1. WHEN the download interface is displayed THEN the System SHALL render a checkbox labeled "Baixar Agora" in checked state by default
2. WHEN a user clicks the "Baixar Agora" checkbox THEN the System SHALL toggle between immediate and scheduled download modes
3. WHEN the "Baixar Agora" checkbox is checked THEN the System SHALL prepare for immediate download execution
4. WHEN the "Baixar Agora" checkbox is unchecked THEN the System SHALL prepare for scheduled download execution

### Requirement 4

**User Story:** As a user, I want to optionally include a CSV export of selected records, so that I can have structured data alongside the XML files.

#### Acceptance Criteria

1. WHEN the download interface is displayed THEN the System SHALL render a checkbox labeled "CSV"
2. WHEN a user checks the "CSV" checkbox THEN the System SHALL include CSV generation in the download operation
3. WHEN a user unchecks the "CSV" checkbox THEN the System SHALL exclude CSV generation from the download operation
4. WHEN CSV generation is enabled THEN the System SHALL include all fields from the selected documents in the CSV file

### Requirement 5

**User Story:** As a user, I want to immediately download selected documents as a ZIP file, so that I can access them right away.

#### Acceptance Criteria

1. WHERE the "Baixar Agora" checkbox is checked, WHEN a user clicks the download button THEN the System SHALL retrieve document metadata from tbl_historico_upload collection
2. WHEN retrieving document metadata THEN the System SHALL match the CHAVE field in tbl_historico_upload with the stored document keys
3. WHEN document metadata is retrieved THEN the System SHALL extract the ARQUIVO field as the original filename and _id field as the S3 object key
4. WHEN S3 object keys are obtained THEN the System SHALL download files from Wasabi S3 using the provided credentials
5. WHEN all files are downloaded THEN the System SHALL create a ZIP archive containing the XML files
6. WHERE the "CSV" checkbox is checked, WHEN creating the ZIP archive THEN the System SHALL include a CSV file with selected document data
7. WHEN the ZIP archive is created THEN the System SHALL trigger a browser download with a descriptive filename
8. WHEN the download completes THEN the System SHALL clear the selection state and display a success message

### Requirement 6

**User Story:** As a user, I want to schedule downloads for external processing, so that I can handle large batches without blocking my browser.

#### Acceptance Criteria

1. WHERE the "Baixar Agora" checkbox is unchecked, WHEN a user clicks the download button THEN the System SHALL connect to SQL Server using Prisma
2. WHEN connecting to SQL Server THEN the System SHALL use the connection string with server 10.0.0.4 and database from VITE_DB_DATABASE environment variable
3. WHEN creating a scheduled download THEN the System SHALL insert a record into the CSV table with status value 1
4. WHERE the "CSV" checkbox is checked, WHEN inserting into CSV table THEN the System SHALL set the CSV column to value 1
5. WHERE the "CSV" checkbox is unchecked, WHEN inserting into CSV table THEN the System SHALL set the CSV column to value 0
6. WHEN a CSV table record is created THEN the System SHALL insert one or more child records into tbl_nfe_dow_det table with status value 1
7. WHEN child records are created THEN the System SHALL associate each selected document key with the parent CSV record
8. WHEN all database records are created THEN the System SHALL display a success message confirming the scheduled download
9. WHEN the scheduled download is confirmed THEN the System SHALL clear the selection state

### Requirement 7

**User Story:** As a system administrator, I want the application to use VITE_PORT environment variable for the frontend port, so that it can be deployed flexibly on Coolify.

#### Acceptance Criteria

1. WHEN the Vite development server starts THEN the System SHALL read the VITE_PORT environment variable
2. WHERE VITE_PORT is defined, WHEN starting the server THEN the System SHALL bind to the specified port number
3. WHERE VITE_PORT is not defined, WHEN starting the server THEN the System SHALL bind to port 3000 as default
4. WHEN the application is deployed on Coolify THEN the System SHALL respect the port configuration provided by the platform

### Requirement 8

**User Story:** As a developer, I want the system to securely connect to Wasabi S3, so that document files can be retrieved reliably.

#### Acceptance Criteria

1. WHEN the System needs to download files from S3 THEN the System SHALL use the endpoint URL https://s3.wasabisys.com
2. WHEN authenticating with S3 THEN the System SHALL use access key 7YDC7UG085G6BS8A714S
3. WHEN authenticating with S3 THEN the System SHALL use secret key HYKatJ4XbvaOsCsz9uJJGm2ZBgZWfsgZ5XHun1Vs
4. WHEN accessing S3 objects THEN the System SHALL use bucket name revio-bucket
5. WHEN constructing S3 object keys THEN the System SHALL use the _id value from tbl_historico_upload as the object name

### Requirement 9

**User Story:** As a user, I want to see progress feedback during download operations, so that I know the system is working.

#### Acceptance Criteria

1. WHEN a download operation starts THEN the System SHALL display a loading indicator
2. WHEN downloading files from S3 THEN the System SHALL display progress information showing current file and total files
3. WHEN an error occurs during download THEN the System SHALL display a clear error message with details
4. WHEN a download operation completes successfully THEN the System SHALL display a success message with the number of files processed

### Requirement 10

**User Story:** As a user, I want to clear my document selection, so that I can start a new selection without reloading the page.

#### Acceptance Criteria

1. WHEN documents are selected THEN the System SHALL display a "Clear Selection" button
2. WHEN a user clicks the "Clear Selection" button THEN the System SHALL remove all document keys from memory
3. WHEN selection is cleared THEN the System SHALL uncheck all row checkboxes in the grid
4. WHEN selection is cleared THEN the System SHALL disable the download button
