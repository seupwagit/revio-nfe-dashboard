# ES Modules Configuration Fix

## Status: ✅ COMPLETED

**Date**: January 8, 2026  
**Issue**: Backend ES module import error during debug execution  
**Result**: Backend successfully configured for ES modules

## Problem Description

When running the backend in debug mode, the following error occurred:

```
SyntaxError: Cannot use import statement outside a module
```

This happened because:
1. TypeScript was compiling to ES2020 modules (`"module": "ES2020"`)
2. But package.json was set to `"type": "commonjs"`
3. Node.js tried to run ES module syntax in CommonJS mode

## Solution Implemented

### 1. Updated Backend Package Configuration

**File**: `apps/backend/package.json`

```json
{
  "type": "module",  // Changed from "commonjs"
  "scripts": {
    "start": "node --experimental-specifier-resolution=node dist/index.js"
  }
}
```

### 2. Fixed ES Module Patterns

**File**: `apps/backend/src/index.ts`

**Before** (CommonJS pattern):
```typescript
// Obter __dirname em CommonJS
const __dirname = path.resolve()
```

**After** (ES module pattern):
```typescript
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
```

### 3. Maintained CommonJS Compatibility

For libraries that require CommonJS (like `nfe-danfe-pdf`), the existing `createRequire` pattern was already properly implemented:

```typescript
// apps/backend/src/services/DANFEGenerator.ts
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

try {
  nfeDanfePdf = require('nfe-danfe-pdf');
} catch (error) {
  console.warn('[DANFEGenerator] nfe-danfe-pdf not available:', error.message);
}
```

## Debug Configuration Compatibility

### VS Code Launch Configuration

The existing debug configurations are already compatible with ES modules:

```json
{
  "name": "🖥️ Debug Backend (Local)",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/apps/backend/src/index.ts",
  "runtimeArgs": [
    "--import",
    "tsx/esm"  // Already configured for ES modules
  ]
}
```

### Development Scripts

The development script already uses the correct ES module loader:

```json
{
  "dev": "node --import tsx/esm --watch src/index.ts"
}
```

## Validation Results

### TypeScript Compilation
```bash
✅ Backend TypeScript compilation: PASSED
✅ ES module syntax: VALID
✅ Import statements: RESOLVED
```

### Runtime Execution
```bash
✅ Backend starts without ES module errors
✅ Debug configurations work properly
✅ CommonJS libraries load via createRequire
```

## Benefits of ES Modules

### 1. Modern JavaScript Standards
- Native ES module support in Node.js 22+
- Better tree-shaking and optimization
- Cleaner import/export syntax

### 2. TypeScript Compatibility
- Direct alignment between TS compilation and runtime
- No module format conversion needed
- Better source map accuracy

### 3. Performance Improvements
- Faster module loading
- Better memory usage
- Improved bundling optimization

## Code Quality Compliance

### Import Organization
Following the steering rules for import organization:

```typescript
// 1. Node.js built-ins
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// 2. External libraries
import express from 'express'
import cors from 'cors'

// 3. Internal packages (workspace)
import { UserDTO } from '@fiscal/shared/types'

// 4. Relative imports
import { AuthService } from './services/AuthService'
```

### Error Handling
Maintained proper error handling for module loading:

```typescript
try {
  nfeDanfePdf = require('nfe-danfe-pdf');
  console.log('[DANFEGenerator] nfe-danfe-pdf loaded successfully');
} catch (error: any) {
  console.warn('[DANFEGenerator] nfe-danfe-pdf not available:', error.message);
}
```

## Troubleshooting Guide

### Common ES Module Issues

1. **Import Statement Errors**
   - Ensure `"type": "module"` in package.json
   - Use `.js` extensions in imports if needed
   - Check TypeScript module compilation target

2. **__dirname/__filename Not Available**
   - Use `fileURLToPath(import.meta.url)` pattern
   - Import from 'url' and 'path' modules

3. **CommonJS Library Compatibility**
   - Use `createRequire(import.meta.url)` pattern
   - Wrap in try/catch for optional dependencies

### Debug Configuration Issues

1. **VS Code Debug Not Working**
   - Ensure `--import tsx/esm` in runtimeArgs
   - Check source map configuration
   - Verify program path is correct

2. **Module Resolution Errors**
   - Add `--experimental-specifier-resolution=node`
   - Check TypeScript path mapping
   - Verify workspace references

## Files Modified

- `apps/backend/package.json` - Updated to ES modules
- `apps/backend/src/index.ts` - Fixed __dirname pattern
- `docs/fixes/es-modules-configuration.md` - This documentation

## Conclusion

The backend is now properly configured for ES modules, resolving the import statement errors during debug execution. The configuration maintains compatibility with both modern ES modules and legacy CommonJS libraries through the `createRequire` pattern.

All debug configurations continue to work properly, and the codebase follows modern Node.js and TypeScript best practices while maintaining code quality standards.