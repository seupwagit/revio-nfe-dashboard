# TypeScript Library Files Missing

## Problem
TypeScript configuration shows errors like:
```
Cannot find type definition file for 'node'.
File 'c:/Drive/Projetos/revio-nfe-dashboard/node_modules/typescript/lib/lib.d.ts' not found.
Cannot find global type 'Array', 'Boolean', 'Function', etc.
```

## Root Cause
The TypeScript library files are missing because:
1. Dependencies are not properly installed in the monorepo
2. TypeScript is looking for library files in the wrong location
3. The workspace setup needs proper dependency resolution

## Solution

### Step 1: Install Dependencies
Run the following commands to install all dependencies:

```bash
# Install root dependencies
pnpm install

# Install workspace dependencies
pnpm install --recursive

# Alternative if pnpm fails
npm install
```

### Step 2: Verify TypeScript Installation
Check that TypeScript is properly installed:

```bash
# Check TypeScript version
npx tsc --version

# Check if TypeScript lib files exist
ls node_modules/typescript/lib/
```

### Step 3: Correct Frontend TypeScript Configuration
The frontend `apps/frontend/tsconfig.json` should be configured for a React/Vite project:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@fiscal/shared": ["../../packages/shared/src"],
      "@fiscal/shared/*": ["../../packages/shared/src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"],
  "references": [
    { "path": "../../packages/shared" }
  ]
}
```

### Step 4: Key Differences from Backend Config
- **No `"types": ["node"]`** - Frontend doesn't need Node.js types
- **`"lib": ["ES2020", "DOM", "DOM.Iterable"]`** - Frontend needs DOM types
- **`"moduleResolution": "bundler"`** - Vite uses bundler resolution
- **`"noEmit": true`** - Vite handles the build, TypeScript just checks types

### Step 5: Verify Fix
After making changes, verify:

```bash
# Type check frontend
pnpm --filter "@fiscal/frontend" type-check

# Type check all projects
pnpm type-check

# Build frontend
pnpm --filter "@fiscal/frontend" build
```

## Temporary Workaround
If dependencies can't be installed immediately, add this to temporarily suppress errors:

```json
{
  "compilerOptions": {
    "skipLibCheck": true,
    "noLib": true
  }
}
```

**Note:** This is only a temporary workaround and should be removed once dependencies are properly installed.

## Prevention
To prevent this issue in the future:
1. Always run `pnpm install` after cloning the repository
2. Ensure all workspace dependencies are installed with `pnpm install --recursive`
3. Keep TypeScript versions consistent across all packages
4. Use proper TypeScript configurations for each project type (frontend vs backend)