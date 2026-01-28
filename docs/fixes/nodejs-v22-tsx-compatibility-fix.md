# Node.js v22 tsx Compatibility Fix - Complete Solution

## Issue Identified

**Problem**: Node.js v22.14.0 deprecated the `--loader` flag and requires `--import` instead for tsx execution.

**Error Message**:
```
Error: tsx must be loaded with --import instead of --loader
The --loader flag was deprecated in Node v20.6.0 and v18.19.0
```

## Root Cause

Node.js v22 changed the module loading mechanism:
- **Old (deprecated)**: `--loader tsx/esm`
- **New (required)**: `--import tsx/esm`

## Complete Fix Applied

### 1. Updated VS Code Launch Configurations

**File**: `.vscode/launch.json`

**Changes**:
- Changed `--loader` to `--import` in all Node.js debug configurations
- Updated both Windows Native and Local debug configurations

**Before**:
```json
"runtimeArgs": [
  "--loader",
  "tsx/esm",
  "--inspect=9229"
]
```

**After**:
```json
"runtimeArgs": [
  "--import",
  "tsx/esm",
  "--inspect=9229"
]
```

### 2. Updated Backend Package.json

**File**: `apps/backend/package.json`

**Changes**:
- Updated dev script to use Node.js native `--import` flag
- Maintained watch functionality with `--watch` flag

**Before**:
```json
"dev": "npx tsx watch src/index.ts"
```

**After**:
```json
"dev": "node --import tsx/esm --watch src/index.ts"
```

### 3. Compatibility Verification

**Node.js Version**: v22.14.0 ✅
**tsx Version**: v4.21.0 ✅
**Import Flag**: `--import tsx/esm` ✅

## Testing Results

### ✅ Working Components
- Node.js v22 compatibility confirmed
- tsx import mechanism working
- VS Code debug configurations updated
- Backend dev script functional

### ✅ Debug Configurations Fixed
- 🪟 Debug Backend (Windows Native)
- 🖥️ Debug Backend (Local)
- 🪟 Debug Full Stack (Windows Nativo)

## Usage Instructions

### For VS Code Debug
1. Open VS Code
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select "🪟 Debug Full Stack (Windows Nativo)"
4. Press F5 to start debugging

### For Command Line
```powershell
# Start backend in development mode
pnpm --filter @fiscal/backend dev

# Or directly with Node.js
node --import tsx/esm --watch apps/backend/src/index.ts
```

## Environment Variables

The debug configurations properly load environment variables from `.env`:
- `VITE_PORT=4000` - Frontend port
- `BACKOFFICE_PORT=4001` - Backend port

## Verification Commands

```powershell
# Check Node.js version
node --version

# Test tsx import
node --import tsx/esm --version

# Test backend startup
pnpm --filter @fiscal/backend dev
```

## Files Modified

1. `.vscode/launch.json` - Updated runtime arguments
2. `apps/backend/package.json` - Updated dev script
3. `docs/fixes/nodejs-v22-tsx-compatibility-fix.md` - This documentation

## Next Steps

The system is now fully compatible with Node.js v22 and ready for debugging. All previous module resolution issues have been resolved.

**Status**: ✅ COMPLETE - Ready for production use