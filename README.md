# 🏢 Fiscal System - Monorepo

Sistema completo de gestão fiscal com dashboard NFe e visualizador DANFE.

## 📁 Estrutura do Projeto

```
fiscal-system/
├── apps/
│   ├── frontend/          # React frontend application
│   └── backend/           # Node.js backend application
├── packages/
│   └── shared/            # Shared types, constants, and utilities
├── docs/                  # Documentation
├── scripts/               # Build and utility scripts
├── .npmrc                 # Package manager configuration
└── pnpm-workspace.yaml    # Workspace configuration
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 9.0.0 (will be installed automatically)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd fiscal-system
   ```

2. **Run setup script**
   ```bash
   # Windows (Command Prompt)
   ./scripts/setup/setup-pnpm.bat
   
   # Windows (PowerShell)
   ./scripts/setup/setup-pnpm.ps1
   
   # Manual setup
   npm install -g pnpm@9.0.0
   pnpm install
   ```

3. **Start development**
   ```bash
   # Start both frontend and backend
   pnpm dev
   
   # Or start individually
   pnpm dev:frontend  # http://localhost:3000
   pnpm dev:backend   # http://localhost:3001
   ```

## 🐛 Debug Setup (F5 in VS Code)

### Quick Setup for Local Debugging

1. **Install dependencies via WSL + pnpm**
   ```bash
   # Windows (Command Prompt)
   scripts\setup-local-debug.bat
   
   # Windows (PowerShell)
   scripts\Setup-Local-Debug.ps1
   
   # Or run complete setup via WSL
   wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && ./scripts/setup-complete.sh"
   ```

2. **Start debugging**
   - Press **F5** in VS Code
   - Select **"🖥️ Debug Backend (Local)"**
   - Backend starts at http://localhost:4001
   - Set breakpoints and debug!

### Available Debug Configurations

- **🖥️ Debug Backend (Local)** - Recommended for quick debugging
- **🐧 Debug Backend (WSL Docker)** - Full Docker environment
- **🚀 Debug Full Stack (Docker)** - Complete stack with frontend
- **🧪 Debug Tests** - Test debugging

### Troubleshooting Debug Issues

```bash
# Test your debug setup
scripts\test-debug-setup.bat

# Check requirements
node --version  # Should be 20+
pnpm --version  # Should be 9+
```

For detailed debug setup instructions, see: [docs/fixes/debug-f5-complete-solution.md](docs/fixes/debug-f5-complete-solution.md)

## ⚡ **WSL + pnpm + Monorepo Rules**

### **CRITICAL: All development commands MUST use WSL + pnpm**

**❌ NEVER use:**
- `npm install` (Windows native)
- `git` (Windows native)
- `docker` (Windows native)

**✅ ALWAYS use:**
```bash
# Template for ALL commands
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && [COMMAND]"

# Examples
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm install"
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && pnpm dev"
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && docker compose up"
```

### **File Organization Rules**

**MANDATORY: Maximum 500 lines per file**
- ✅ All .ts/.tsx files: max 500 lines
- ✅ All .md files: max 500 lines
- ✅ All scripts: max 500 lines
- ✅ All config files: max 500 lines

**Validation:**
```bash
# Validate file limits
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && ./scripts/validate-file-limits.sh"

# Generate file metrics
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && ./scripts/file-metrics.sh"
```

### **Monorepo Structure**

**MANDATORY workspace structure:**
```
project-root/
├── apps/frontend/          # React app
├── apps/backend/           # Node.js API  
├── packages/shared/        # Shared types, utils
├── .kiro/steering/         # Multiple steering files
├── pnpm-workspace.yaml     # Workspace config
└── Dockerfile              # SINGLE Docker file
```

**Validation:**
```bash
# Validate monorepo structure
wsl -d Ubuntu bash -c "cd /mnt/c/Drive/Projetos/revio-nfe-dashboard && ./scripts/validate-monorepo.sh"
```

## 📦 Package Manager

This project uses **pnpm** as the standardized package manager. The `.npmrc` file ensures everyone on the team uses the same version:

```ini
package-manager=pnpm@9.0.0
```

### Why pnpm?

- **Faster installs** - Uses hard links and content-addressable storage
- **Disk space efficient** - Shared dependencies across projects
- **Strict dependency resolution** - Prevents phantom dependencies
- **Better monorepo support** - Native workspace support

## 🛠️ Development Commands

### Root Level Commands

```bash
# Development
pnpm dev                    # Start all apps in parallel
pnpm dev:frontend          # Start frontend only
pnpm dev:backend           # Start backend only

# Building
pnpm build                 # Build all packages
pnpm build:shared          # Build shared package only
pnpm build:frontend        # Build frontend only
pnpm build:backend         # Build backend only

# Testing
pnpm test                  # Run all tests
pnpm test:frontend         # Test frontend only
pnpm test:backend          # Test backend only

# Code Quality
pnpm lint                  # Lint all packages
pnpm type-check            # TypeScript type checking
pnpm clean                 # Clean all build artifacts
```

### Package-Specific Commands

```bash
# Work on specific packages
pnpm --filter '@fiscal/frontend' dev
pnpm --filter '@fiscal/backend' build
pnpm --filter '@fiscal/shared' test
```

## 🏗️ Architecture

### Frontend (`apps/frontend`)

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **HTTP Client**: Custom httpService with resilience patterns

### Backend (`apps/backend`)

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB + Prisma
- **Authentication**: JWT with middleware
- **File Storage**: AWS S3

### Shared (`packages/shared`)

- **Types**: TypeScript interfaces and types
- **Constants**: API endpoints, error codes
- **Schemas**: Zod validation schemas
- **Utilities**: Error handling, DTOs

## 🔧 Configuration

### Environment Variables

Create `.env` files in each app directory:

**Frontend (apps/frontend/.env)**
```env
VITE_API_BASE_URL=http://localhost:3001
VITE_APP_NAME=Sistema Fiscal
```

**Backend (apps/backend/.env)**
```env
PORT=3001
DATABASE_URL=mongodb://localhost:27017/fiscal
JWT_SECRET=your-secret-key
AWS_S3_BUCKET=your-bucket
```

### TypeScript Configuration

The project uses TypeScript project references for better build performance:

- **Root**: `tsconfig.json` - Workspace configuration
- **Frontend**: `apps/frontend/tsconfig.json` - React app config
- **Backend**: `apps/backend/tsconfig.json` - Node.js app config
- **Shared**: `packages/shared/tsconfig.json` - Library config

## 📚 Key Features

### 🔐 Authentication System

- JWT-based authentication
- Centralized middleware
- User context management
- Database routing per user

### 📄 DANFE Viewer

- PDF generation from XML
- Real-time status updates
- Caching system
- Download functionality

### 📊 Analytics Dashboard

- MongoDB direct queries
- Real-time data aggregation
- Export functionality
- Advanced filtering

### 🌐 Network Resilience

- Automatic retry logic
- Exponential backoff
- Circuit breaker pattern
- Connectivity monitoring
- Offline-first approach

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run specific test suites
pnpm --filter '@fiscal/frontend' test
pnpm --filter '@fiscal/backend' test
```

## 🚀 Deployment

### Build for Production

```bash
# Build all packages
pnpm build

# The build artifacts will be in:
# - apps/frontend/dist/  (static files)
# - apps/backend/dist/   (compiled JS)
# - packages/shared/dist/ (library)
```

### Docker Support

```bash
# Build Docker image
docker build -f Dockerfile.fullstack.optimized -t fiscal-system .

# Run container
docker run -p 3000:3000 --env-file .env fiscal-system
```

## 📖 Documentation

- **Architecture**: `docs/architecture/`
- **API Documentation**: `docs/api/`
- **Troubleshooting**: `docs/troubleshooting/`
- **Migration Guide**: `docs/migration/migration-status.md`
- **Team Onboarding**: `docs/team/team-onboarding.md`

## 🤝 Contributing

1. **Follow the package manager**: Always use `pnpm`
2. **Respect the architecture**: Keep frontend/backend separation
3. **Use shared types**: Import from `@fiscal/shared`
4. **Write tests**: Maintain test coverage
5. **Follow TypeScript**: Enable strict mode

### Code Style

```bash
# Format code
pnpm format

# Lint code
pnpm lint

# Type check
pnpm type-check
```

## 🔍 Troubleshooting

### Common Issues

1. **"pnpm not found"**
   ```bash
   npm install -g pnpm@9.0.0
   ```

2. **"Module not found @fiscal/shared"**
   ```bash
   pnpm --filter '@fiscal/shared' build
   ```

3. **"Port already in use"**
   ```bash
   # Kill processes on ports 3000/3001
   npx kill-port 3000 3001
   ```

### Getting Help

1. Check `docs/troubleshooting/`
2. Run `./scripts/test/test-monorepo.bat` for diagnostics
3. Ask team members
4. Check the README.md

## 📄 License

This project is proprietary software. All rights reserved.

---

**Built with ❤️ using modern monorepo practices**