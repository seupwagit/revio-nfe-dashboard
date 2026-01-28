# 📁 File Organization Rules

## 🚫 **PROHIBITED: Files in Project Root**

### **Never Create These in Root:**
- ❌ **Markdown files** (.md) - except README.md
- ❌ **Scripts** (.bat, .ps1, .sh, .js, .mjs, .py)
- ❌ **Temporary config files**
- ❌ **Test or debug files**
- ❌ **Documentation files**
- ❌ **Build or utility files**

### **Why This Rule Exists:**
1. **Clean root directory** - Easy to navigate
2. **Consistent organization** - Everyone knows where to find files
3. **Scalability** - Project can grow without root clutter
4. **Professional appearance** - Clean project structure
5. **Tool compatibility** - Many tools expect clean root

## ✅ **REQUIRED: Proper Directory Structure**

### **Documentation (.md files):**
```
docs/
├── architecture/          # System architecture docs
├── api/                  # API documentation
├── troubleshooting/      # Problem-solving guides
├── migration/            # Migration guides and status
└── team/                 # Team processes and onboarding
```

### **Scripts:**
```
scripts/
├── build/                # Build scripts
├── deploy/               # Deployment scripts
├── setup/                # Setup and installation scripts
├── test/                 # Testing scripts
├── cleanup/              # Cleanup utilities
└── utils/                # General utilities
```

### **Complete Allowed Root Structure:**
```
project-root/
├── apps/                 # ✅ Applications
├── packages/             # ✅ Shared packages
├── docs/                 # ✅ All documentation
├── scripts/              # ✅ All scripts
├── .kiro/                # ✅ Kiro configuration
├── .vscode/              # ✅ VS Code settings
├── node_modules/         # ✅ Dependencies
├── .env                  # ✅ Environment variables
├── .env.example          # ✅ Environment template
├── .gitignore            # ✅ Git ignore rules
├── .npmrc                # ✅ Package manager config
├── package.json          # ✅ Workspace configuration
├── pnpm-workspace.yaml   # ✅ Workspace definition
├── tsconfig.json         # ✅ TypeScript config
├── README.md             # ✅ ONLY .md file allowed in root
├── LICENSE               # ✅ License file
├── docker-compose.yml    # ✅ Docker compose
├── Dockerfile*           # ✅ Docker files
└── nginx.conf            # ✅ Nginx configuration
```

## 🔍 **File Creation Guidelines**

### **Documentation Files:**
```typescript
// ❌ WRONG - In root
fsWrite('API_GUIDE.md', content)
fsWrite('TROUBLESHOOTING.md', content)
fsWrite('TEAM_SETUP.md', content)

// ✅ CORRECT - In docs/
fsWrite('docs/api/api-guide.md', content)
fsWrite('docs/troubleshooting/common-issues.md', content)
fsWrite('docs/team/team-setup.md', content)
```

### **Script Files:**
```typescript
// ❌ WRONG - In root
fsWrite('build.bat', content)
fsWrite('deploy.sh', content)
fsWrite('test-setup.js', content)

// ✅ CORRECT - In scripts/
fsWrite('scripts/build/build.bat', content)
fsWrite('scripts/deploy/deploy.sh', content)
fsWrite('scripts/test/test-setup.js', content)
```

### **Configuration Files:**
```typescript
// ❌ WRONG - In root (unless specifically allowed)
fsWrite('custom-config.json', content)
fsWrite('debug-settings.js', content)

// ✅ CORRECT - In appropriate app directory
fsWrite('apps/frontend/config/custom-config.json', content)
fsWrite('apps/backend/config/debug-settings.js', content)
```

## 🛡️ **Enforcement Rules**

### **Pre-Creation Validation:**
```typescript
function validateFilePath(path: string): void {
  const isRootFile = !path.includes('/') || path.startsWith('./');
  const isMarkdownFile = path.endsWith('.md');
  const isScriptFile = /\.(bat|ps1|sh|js|mjs|py)$/.test(path);
  
  if (isRootFile) {
    if (isMarkdownFile && path !== 'README.md') {
      throw new Error(`❌ Markdown files must be in docs/: ${path}`);
    }
    
    if (isScriptFile) {
      throw new Error(`❌ Scripts must be in scripts/: ${path}`);
    }
    
    // Check against allowed root files
    const allowedRootFiles = [
      'README.md', 'package.json', 'pnpm-workspace.yaml',
      'tsconfig.json', '.env', '.env.example', '.gitignore',
      '.npmrc', 'LICENSE', 'docker-compose.yml', 'nginx.conf'
    ];
    
    const allowedRootPatterns = [
      /^Dockerfile/,
      /^\.env\./
    ];
    
    const isAllowed = allowedRootFiles.includes(path) ||
                     allowedRootPatterns.some(pattern => pattern.test(path));
    
    if (!isAllowed) {
      throw new Error(`❌ File not allowed in root: ${path}`);
    }
  }
}
```

### **Directory Creation Rules:**
```typescript
// Always create parent directories when needed
function ensureDirectoryExists(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
```

## 📋 **Common Violations and Fixes**

### **1. Documentation in Root**
```bash
# ❌ Wrong
MIGRATION_GUIDE.md
API_DOCS.md
TROUBLESHOOTING.md

# ✅ Correct
docs/migration/migration-guide.md
docs/api/api-documentation.md
docs/troubleshooting/common-issues.md
```

### **2. Scripts in Root**
```bash
# ❌ Wrong
build.bat
setup.ps1
test.sh
deploy.js

# ✅ Correct
scripts/build/build.bat
scripts/setup/setup.ps1
scripts/test/test.sh
scripts/deploy/deploy.js
```

### **3. Config Files in Root**
```bash
# ❌ Wrong
test-config.json
debug.js
custom-settings.yaml

# ✅ Correct
apps/frontend/config/test-config.json
apps/backend/config/debug.js
packages/shared/config/custom-settings.yaml
```

## 🎯 **Benefits of This Organization**

1. **Clean Root** - Easy to understand project structure
2. **Predictable Locations** - Everyone knows where to find files
3. **Scalable** - Can add many files without cluttering root
4. **Professional** - Follows industry best practices
5. **Tool Friendly** - Works well with IDEs and build tools
6. **Team Efficiency** - Reduces time spent looking for files

## 🔧 **Implementation in Code**

When creating files programmatically, always validate the path:

```typescript
import { fsWrite } from './tools';

function createFile(path: string, content: string): void {
  // Validate path before creation
  validateFilePath(path);
  
  // Ensure directory exists
  ensureDirectoryExists(path);
  
  // Create the file
  fsWrite(path, content);
}

// Usage examples
createFile('docs/api/endpoints.md', apiDocs);           // ✅ Correct
createFile('scripts/build/compile.bat', buildScript);   // ✅ Correct
createFile('README.md', mainReadme);                    // ✅ Correct (exception)
```

## 🚨 **Violation Consequences**

Files created in wrong locations will:
1. **Be flagged** in code reviews
2. **Cause build failures** in CI/CD
3. **Be moved** to correct locations
4. **Require refactoring** of references

## 📚 **Quick Reference**

| File Type | ❌ Wrong Location | ✅ Correct Location |
|-----------|------------------|-------------------|
| Documentation | `GUIDE.md` | `docs/guides/guide.md` |
| Build Scripts | `build.bat` | `scripts/build/build.bat` |
| Setup Scripts | `setup.ps1` | `scripts/setup/setup.ps1` |
| Test Scripts | `test.js` | `scripts/test/test.js` |
| Config Files | `config.json` | `apps/*/config/config.json` |
| Utilities | `util.py` | `scripts/utils/util.py` |

Remember: **Keep the root clean, organize everything else!** 🧹