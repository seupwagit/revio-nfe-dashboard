# Steering: Organização de Arquivos - Regras Prioritárias

## **LIMITE DE LINHAS - REGRA CRÍTICA**

### **Máximo 500 Linhas por Arquivo**

**OBRIGATÓRIO para todos os tipos de arquivo:**
- ✅ **Arquivos .ts/.tsx**: Máximo 500 linhas
- ✅ **Arquivos .md**: Máximo 500 linhas  
- ✅ **Arquivos .js/.jsx**: Máximo 500 linhas
- ✅ **Arquivos de configuração**: Máximo 500 linhas
- ✅ **Scripts**: Máximo 500 linhas

**Exceção APENAS quando absolutamente necessário:**
- ⚠️ Documentação técnica complexa
- ⚠️ Arquivos de configuração críticos
- ⚠️ Schemas de validação extensos

### **Estratégias de Divisão**

**Para arquivos TypeScript grandes:**
```typescript
// ANTES - arquivo-grande.ts (800 linhas)
export class ServicoCompleto {
  // 800 linhas de código
}

// DEPOIS - Dividir em módulos
// servico-base.ts (200 linhas)
// servico-validacao.ts (200 linhas)  
// servico-processamento.ts (200 linhas)
// servico-utils.ts (200 linhas)
```

**Para documentação .md grande:**
```markdown
# ANTES - documentacao-completa.md (1000 linhas)

# DEPOIS - Dividir por tópicos
# docs/setup/instalacao.md (300 linhas)
# docs/setup/configuracao.md (300 linhas)
# docs/setup/troubleshooting.md (300 linhas)
# docs/setup/README.md (100 linhas - índice)
```

## **Agent Steering - Organização Otimizada**

### **Múltiplos Arquivos de Steering**

**OBRIGATÓRIO dividir steering em arquivos específicos:**
- ✅ `wsl-docker-rules.md` - Regras WSL e Docker
- ✅ `file-organization-rules.md` - Organização de arquivos
- ✅ `monorepo-workspace-rules.md` - Regras de monorepo
- ✅ `performance-optimization-rules.md` - Otimizações
- ✅ `code-quality-rules.md` - Qualidade de código

**Benefícios da divisão:**
- 🚀 **Performance**: Agent carrega apenas steering relevante
- 🎯 **Foco**: Regras específicas por contexto
- 🔧 **Manutenção**: Fácil atualização de regras específicas
- 📋 **Clareza**: Regras organizadas por domínio

### **Estrutura de Steering Recomendada**

```
.kiro/steering/
├── wsl-docker-rules.md           # WSL, Docker, pnpm
├── file-organization-rules.md    # Organização e limites
├── monorepo-workspace-rules.md   # Workspaces e estrutura
├── performance-optimization-rules.md # Performance
├── code-quality-rules.md         # Qualidade e padrões
├── api-design-rules.md           # Design de APIs
├── database-rules.md             # Regras de banco de dados
├── security-rules.md             # Segurança
└── deployment-rules.md           # Deploy e produção
```

## **Monorepo - Organização Obrigatória**

### **Estrutura de Workspaces**

**SEMPRE usar esta estrutura:**
```
project-root/
├── apps/                    # Aplicações
│   ├── frontend/           # React app
│   └── backend/            # Node.js API
├── packages/               # Pacotes compartilhados
│   ├── shared/            # Tipos, constantes, utils
│   ├── ui/                # Componentes UI (se necessário)
│   └── config/            # Configurações compartilhadas
├── docs/                  # Documentação (max 500 linhas/arquivo)
├── scripts/               # Scripts utilitários
├── .kiro/                 # Configurações Kiro
│   └── steering/          # Múltiplos arquivos de steering
├── pnpm-workspace.yaml    # Configuração workspace
├── package.json           # Root package.json
└── Dockerfile             # ÚNICO arquivo Docker
```

### **Configuração Workspace Obrigatória**

**pnpm-workspace.yaml:**
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

**package.json (root):**
```json
{
  "name": "fiscal-system",
  "private": true,
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "dev": "pnpm --parallel --filter './apps/*' dev",
    "build": "pnpm --recursive build",
    "test": "pnpm --recursive test",
    "lint": "pnpm --recursive lint",
    "type-check": "pnpm --recursive type-check"
  }
}
```

## **Nomenclatura de Arquivos**

### **Padrões Obrigatórios**

**TypeScript/JavaScript:**
- ✅ `kebab-case.ts` - Para arquivos utilitários
- ✅ `PascalCase.tsx` - Para componentes React
- ✅ `camelCase.service.ts` - Para serviços
- ✅ `UPPER_CASE.constants.ts` - Para constantes

**Documentação:**
- ✅ `kebab-case.md` - Para documentação geral
- ✅ `UPPER_CASE.md` - Para documentos importantes (README, CHANGELOG)

**Scripts:**
- ✅ `kebab-case.sh` - Scripts Unix
- ✅ `PascalCase.ps1` - Scripts PowerShell
- ✅ `kebab-case.bat` - Scripts Windows

### **Organização por Funcionalidade**

**Agrupar arquivos relacionados:**
```
src/
├── auth/                  # Funcionalidade de autenticação
│   ├── auth.service.ts    # Serviço (< 500 linhas)
│   ├── auth.types.ts      # Tipos (< 500 linhas)
│   ├── auth.utils.ts      # Utilitários (< 500 linhas)
│   └── auth.test.ts       # Testes (< 500 linhas)
├── danfe/                 # Funcionalidade DANFE
│   ├── danfe.service.ts   # Serviço principal
│   ├── danfe.generator.ts # Gerador PDF
│   ├── danfe.validator.ts # Validações
│   └── danfe.types.ts     # Tipos específicos
```

## **Validação Automática**

### **Script de Verificação**

**Criar script para validar limites:**
```bash
#!/bin/bash
# scripts/validate-file-limits.sh

echo "🔍 Validando limites de arquivos..."

# Encontrar arquivos com mais de 500 linhas
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -o -name "*.md" | \
while read file; do
  lines=$(wc -l < "$file")
  if [ $lines -gt 500 ]; then
    echo "❌ $file: $lines linhas (limite: 500)"
  fi
done

echo "✅ Validação concluída"
```

### **Pre-commit Hook**

**Adicionar ao .git/hooks/pre-commit:**
```bash
#!/bin/bash
# Validar limites antes do commit
./scripts/validate-file-limits.sh

if [ $? -ne 0 ]; then
  echo "❌ Commit rejeitado: arquivos excedem limite de 500 linhas"
  exit 1
fi
```

## **Refatoração de Arquivos Grandes**

### **Estratégias de Divisão**

**1. Por Responsabilidade:**
```typescript
// user-service.ts (800 linhas) → Dividir em:
// user-auth.service.ts (200 linhas)
// user-profile.service.ts (200 linhas)
// user-validation.service.ts (200 linhas)
// user-utils.service.ts (200 linhas)
```

**2. Por Funcionalidade:**
```typescript
// analytics.service.ts (1000 linhas) → Dividir em:
// analytics-aggregation.service.ts (300 linhas)
// analytics-reporting.service.ts (300 linhas)
// analytics-caching.service.ts (200 linhas)
// analytics-utils.service.ts (200 linhas)
```

**3. Por Camadas:**
```typescript
// api-client.ts (600 linhas) → Dividir em:
// api-client.base.ts (200 linhas)
// api-client.auth.ts (200 linhas)
// api-client.types.ts (200 linhas
```

### **Manter Compatibilidade**

**Usar barrel exports:**
```typescript
// index.ts (arquivo de re-export)
export * from './user-auth.service'
export * from './user-profile.service'
export * from './user-validation.service'
export * from './user-utils.service'

// Mantém compatibilidade:
// import { UserService } from './user' // Ainda funciona
```

## **Métricas e Monitoramento**

### **Métricas de Qualidade**

**Acompanhar regularmente:**
- 📊 **Arquivos > 500 linhas**: Meta = 0
- 📊 **Arquivos > 300 linhas**: Meta < 10%
- 📊 **Arquivos > 200 linhas**: Meta < 30%
- 📊 **Complexidade ciclomática**: Meta < 10 por função

### **Relatório Automático**

**Script de métricas:**
```bash
#!/bin/bash
# scripts/file-metrics.sh

echo "📊 MÉTRICAS DE ARQUIVOS"
echo "======================"

# Contar arquivos por faixa de linhas
echo "Arquivos por tamanho:"
find . -name "*.ts" -o -name "*.tsx" | while read file; do
  wc -l "$file"
done | sort -n | awk '
  $1 <= 100 { small++ }
  $1 > 100 && $1 <= 300 { medium++ }
  $1 > 300 && $1 <= 500 { large++ }
  $1 > 500 { xlarge++ }
  END {
    print "  Pequenos (≤100): " small
    print "  Médios (101-300): " medium  
    print "  Grandes (301-500): " large
    print "  Muito grandes (>500): " xlarge
  }'
```