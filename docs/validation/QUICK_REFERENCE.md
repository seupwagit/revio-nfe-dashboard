# 🚀 Project Validation - Quick Reference

## One-Command Validation

### Using npm scripts (Cross-platform)
```bash
# Basic validation
pnpm validate:config

# Detailed validation with error details
pnpm validate:config:detailed

# Generate JSON report
pnpm validate:config:json
```

### Direct script execution

#### Windows (PowerShell)
```powershell
# Quick check
.\scripts\validate-project-config.ps1

# Detailed check
.\scripts\validate-project-config.ps1 -Detailed

# JSON output
.\scripts\validate-project-config.ps1 -JsonOutput -OutputFile "report.json"
```

#### WSL/Linux
```bash
# Quick check
./scripts/validate-project-config.sh

# Detailed check
./scripts/validate-project-config.sh --detailed

# JSON output
./scripts/validate-project-config.sh --json --output "report.json"
```

## What Gets Validated ✅

| Check | Description | Pass Criteria |
|-------|-------------|---------------|
| **Type Check** | TypeScript compilation | No type errors |
| **Lint** | Code quality standards | No lint errors |
| **Security** | Vulnerability scan | 0 critical vulnerabilities |
| **Dependencies** | Package updates | < 5 outdated packages |
| **Structure** | Monorepo integrity | All workspaces valid |

## Status Indicators

- ✅ **PASSED** - All checks successful
- ❌ **FAILED** - One or more checks failed
- ⚠️ **WARNING** - Non-critical issues found
- 🔧 **ERROR** - Validation script error

## Quick Fixes

### Type Check Failed
```bash
pnpm install
pnpm --recursive type-check
```

### Lint Failed
```bash
pnpm --recursive lint --fix
```

### Security Issues
```bash
pnpm audit --fix
```

### Outdated Dependencies
```bash
pnpm update --recursive
```

## Integration Points

### Pre-commit Hook
Automatically runs validation before each commit.

### CI/CD Pipeline
Runs on every push and pull request.

### Weekly Schedule
Automated validation every Sunday at 2 AM UTC.

## Emergency Bypass

If validation blocks critical work:

```bash
# Skip pre-commit validation (use sparingly)
git commit --no-verify -m "Emergency commit - validation bypass"

# Then fix issues immediately
pnpm validate:config:detailed
```

## Support

- 📋 Full documentation: `docs/validation/README.md`
- 📊 Latest report: `docs/validation/pnpm-project-validation-report.md`
- 🔧 Troubleshooting: Run with `--detailed` flag for error details