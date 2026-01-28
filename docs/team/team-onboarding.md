# 👥 Team Onboarding Guide

Welcome to the Fiscal System monorepo! This guide will help you get up and running quickly.

## 🎯 Quick Setup (5 minutes)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd fiscal-system
./scripts/setup/setup-pnpm.bat  # Windows
# or
./scripts/setup/setup-pnpm.ps1  # PowerShell
```

### 2. Start Development
```bash
pnpm dev  # Starts both frontend (3000) and backend (3001)
```

### 3. Verify Setup
```bash
./scripts/test/test-monorepo.bat  # Run diagnostics
```

## 📋 Essential Commands

### Daily Development
```bash
# Start development servers
pnpm dev                    # Both servers
pnpm dev:frontend          # Frontend only (port 3000)
pnpm dev:backend           # Backend only (port 3001)

# Install new dependencies
pnpm add <package>                    # Root level
pnpm --filter '@fiscal/frontend' add <package>  # Frontend only
pnpm --filter '@fiscal/backend' add <package>   # Backend only

# Build and test
pnpm build                 # Build all packages
pnpm test                  # Run all tests
pnpm lint                  # Lint all code
```

## 🏗️ Project Structure

```
fiscal-system/
├── apps/
│   ├── frontend/          # React app - UI components, pages, services
│   └── backend/           # Node.js API - routes, services, middleware
├── packages/
│   └── shared/            # Shared code - types, constants, schemas
├── docs/                  # Documentation
└── scripts/               # Build scripts
```

## 🔧 Package Manager Rules

### ✅ Always Use pnpm
```bash
# ✅ Correct
pnpm install
pnpm add react
pnpm dev

# ❌ Wrong - will cause issues
npm install
yarn add react
npm run dev
```

### Why pnpm?
- **Faster**: Hard links save time and space
- **Safer**: Strict dependency resolution
- **Monorepo-friendly**: Native workspace support
- **Consistent**: `.npmrc` enforces same version for everyone

## 📦 Working with Packages

### Adding Dependencies

```bash
# Frontend dependencies (React, UI libraries)
pnpm --filter '@fiscal/frontend' add react-query

# Backend dependencies (Express, database)
pnpm --filter '@fiscal/backend' add express

# Shared dependencies (used by multiple packages)
pnpm --filter '@fiscal/shared' add zod

# Dev dependencies
pnpm --filter '@fiscal/frontend' add -D @types/react
```

### Using Shared Code

```typescript
// ✅ Import from shared package
import { User, APIResponse } from '@fiscal/shared/types'
import { API_ENDPOINTS } from '@fiscal/shared/constants'
import { httpService } from '../services/httpService'

// ✅ Use httpService for ALL API calls
const user = await httpService.get<User>('/api/user/profile')

// ❌ Don't use direct fetch
const response = await fetch('/api/user/profile')
```

## 🎨 Code Style Guidelines

### TypeScript
- Use strict mode
- Define proper types (no `any`)
- Import from `@fiscal/shared` when possible

### Frontend
- Use httpService for ALL API calls
- Handle loading and error states
- Follow React best practices

### Backend
- Use middleware for authentication
- Validate input with Zod schemas
- Return consistent API responses

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run specific package tests
pnpm --filter '@fiscal/frontend' test
pnpm --filter '@fiscal/backend' test

# Watch mode for development
pnpm --filter '@fiscal/frontend' test --watch
```

## 🚀 Building and Deployment

```bash
# Build all packages
pnpm build

# Build specific package
pnpm build:frontend
pnpm build:backend
pnpm build:shared

# Clean build artifacts
pnpm clean
```

## 🔍 Troubleshooting

### Common Issues

1. **"pnpm command not found"**
   ```bash
   npm install -g pnpm@9.0.0
   ```

2. **"Cannot resolve @fiscal/shared"**
   ```bash
   pnpm --filter '@fiscal/shared' build
   ```

3. **"Port 3000 already in use"**
   ```bash
   npx kill-port 3000
   # or change port in apps/frontend/.env
   ```

4. **Dependencies not installing**
   ```bash
   # Clear cache and reinstall
   pnpm store prune
   rm -rf node_modules
   pnpm install
   ```

### Getting Help

1. Check `docs/troubleshooting/`
2. Run `./scripts/test/test-monorepo.bat` for diagnostics
3. Ask team members
4. Check the README.md

## 📚 Learning Resources

### Monorepo Concepts
- [pnpm Workspaces](https://pnpm.io/workspaces)
- [TypeScript Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)

### Project-Specific
- `docs/architecture/` - System architecture
- `docs/api/` - API documentation
- `docs/migration/migration-status.md` - Migration details

## 🤝 Team Workflow

### Before Starting Work
1. Pull latest changes: `git pull`
2. Install dependencies: `pnpm install`
3. Build shared package: `pnpm build:shared`
4. Start development: `pnpm dev`

### Before Committing
1. Run tests: `pnpm test`
2. Check types: `pnpm type-check`
3. Lint code: `pnpm lint`
4. Build successfully: `pnpm build`

### Adding New Features
1. Update shared types if needed
2. Follow architecture patterns
3. Add tests for new functionality
4. Update documentation

## 🎯 Best Practices

### Do's ✅
- Use pnpm for all package management
- Import shared types and constants
- Use httpService for API calls
- Write tests for new features
- Follow TypeScript strict mode
- Keep frontend/backend separation

### Don'ts ❌
- Don't use npm or yarn
- Don't access database from frontend
- Don't use direct fetch() calls
- Don't skip type definitions
- Don't commit without testing
- Don't mix business logic in UI

## 🆘 Emergency Procedures

### Reset Everything
```bash
# Nuclear option - reset entire workspace
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
rm pnpm-lock.yaml
pnpm install
pnpm build:shared
```

### Quick Health Check
```bash
./scripts/test/test-monorepo.bat  # Comprehensive diagnostics
```

---

**Welcome to the team! 🎉**

Remember: When in doubt, use pnpm and check the docs!