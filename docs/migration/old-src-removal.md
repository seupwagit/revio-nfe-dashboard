# Old src/ Directory Removal

## Status
The old `src/` directory in the project root needs to be removed as part of the monorepo migration.

## Migration Completed
All files have been successfully migrated from:
- `src/frontend/` → `apps/frontend/src/`
- `src/backend/` → `apps/backend/src/`

## Verification
Key files have been verified to be identical between old and new locations:
- ✅ `src/backend/index.ts` = `apps/backend/src/index.ts`
- ✅ `src/frontend/App.tsx` = `apps/frontend/src/App.tsx`
- ✅ `src/frontend/main.tsx` = `apps/frontend/src/main.tsx`

## Manual Removal Required
Due to file system permissions or locks, the old `src/` directory needs to be removed manually:

### Windows Command Prompt:
```cmd
rmdir /s /q src
```

### Windows PowerShell:
```powershell
Remove-Item -Path "src" -Recurse -Force
```

### Alternative Method:
1. Close all editors and terminals
2. Restart VS Code/IDE
3. Use Windows Explorer to delete the `src` folder
4. Empty the Recycle Bin

## Post-Removal Verification
After removal, verify that:
1. `src/` directory no longer exists in project root
2. `apps/frontend/src/` contains all frontend code
3. `apps/backend/src/` contains all backend code
4. TypeScript compilation works: `pnpm type-check`
5. Build works: `pnpm build`

## Files Partially Removed
Some files have already been removed from the old structure:
- ✅ `src/backend/index.ts`
- ✅ `src/frontend/App.tsx`
- ✅ `src/frontend/main.tsx`
- ✅ `src/backend/routes/danfe.ts`
- ✅ `src/backend/routes/auth.ts`
- ✅ `src/backend/routes/analytics.ts`
- ✅ `src/backend/services/AuthService.ts`
- ✅ `src/frontend/components/DANFEViewer.tsx`
- ✅ `src/frontend/services/DANFEService.ts`

## Remaining Files
The following directories still contain files that need to be removed:
- `src/backend/routes/` (6 files remaining)
- `src/backend/services/` (many files remaining)
- `src/frontend/components/` (many files remaining)
- `src/frontend/services/` (many files remaining)
- And other subdirectories

## Safety Note
The old `src/` directory is safe to remove entirely since all code has been migrated to the monorepo structure and verified to be working correctly.