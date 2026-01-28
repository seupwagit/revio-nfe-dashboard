# 📦 Dependency Reorganization Analysis

## 🎯 **Current Problem**

O package.json raiz contém **todas as dependências** misturadas, incluindo:
- Dependências específicas do frontend (React, Vite, etc.)
- Dependências específicas do backend (Express, MongoDB, etc.)
- Dependências compartilhadas (TypeScript, ESLint, etc.)

**Problemas identificados:**
- 🚫 **Instalação desnecessária** - Frontend instala deps do backend
- 🚫 **Bundle size inflado** - Dependências não utilizadas
- 🚫 **Segurança** - Exposição de deps do backend no frontend
- 🚫 **Performance** - Instalação mais lenta
- 🚫 **Manutenção** - Difícil saber onde cada dep é usada

## 📊 **Análise das Dependências Atuais**

### **Dependencies (Production)**

**🎨 Frontend Only:**
- `@tanstack/react-table` - Tabelas React
- `html2canvas` - Screenshots no browser
- `jspdf` - Geração PDF no cliente
- `lucide-react` - Ícones React
- `pdfjs-dist` - Visualização PDF
- `react` - Framework React
- `react-arborist` - Componente árvore
- `react-dom` - React DOM
- `react-markdown` - Markdown renderer
- `react-pdf` - PDF viewer React
- `react-router-dom` - Roteamento React
- `recharts` - Gráficos React
- `remark-gfm` - Markdown GitHub flavored

**🔧 Backend Only:**
- `@prisma/client` - ORM database
- `@types/bcrypt` - Types para bcrypt
- `@types/jsonwebtoken` - Types para JWT
- `@types/uuid` - Types para UUID
- `bcrypt` - Hash de senhas
- `cors` - CORS middleware
- `danfe-pdf` - Geração DANFE
- `dotenv` - Variáveis ambiente
- `express` - Framework web
- `jsonwebtoken` - JWT tokens
- `mongodb` - Driver MongoDB
- `mongoose` - ODM MongoDB
- `nfe-danfe-pdf` - DANFE específico
- `nfe-xml-to-pdf` - Conversão XML
- `prisma` - ORM CLI
- `uuid` - Geração UUIDs

**📚 Shared (Usado em múltiplos projetos):**
- `xlsx` - Manipulação Excel (frontend + backend)
- `zod` - Validação (já no shared)

### **DevDependencies (Development)**

**🎨 Frontend Only:**
- `@vitejs/plugin-react` - Plugin Vite
- `autoprefixer` - PostCSS plugin
- `eslint-plugin-react-hooks` - ESLint React
- `eslint-plugin-react-refresh` - ESLint React
- `postcss` - CSS processor
- `tailwindcss` - CSS framework
- `vite` - Build tool
- `vitest` - Test runner

**🔧 Backend Only:**
- `@aws-sdk/client-s3` - AWS S3 client
- `@testcontainers/mongodb` - Testes MongoDB
- `@types/cors` - Types CORS
- `@types/express` - Types Express
- `fast-check` - Property testing
- `jszip` - ZIP manipulation
- `tsx` - TypeScript executor

**📚 Shared (Development):**
- `@types/node` - Types Node.js
- `@types/react` - Types React
- `@types/react-dom` - Types React DOM
- `@typescript-eslint/eslint-plugin` - ESLint TS
- `@typescript-eslint/parser` - Parser TS
- `concurrently` - Executar paralelo
- `eslint` - Linter
- `typescript` - Compilador TS

## 🎯 **Estratégia de Reorganização**

### **1. Root Package.json (Mínimo)**
```json
{
  "devDependencies": {
    "concurrently": "^9.2.1",
    "typescript": "^5.6.2"
  }
}
```

### **2. Frontend Package.json**
```json
{
  "dependencies": {
    "@fiscal/shared": "workspace:*",
    "@tanstack/react-table": "^8.21.3",
    "html2canvas": "^1.4.1",
    "jspdf": "^3.0.4",
    "lucide-react": "^0.441.0",
    "pdfjs-dist": "^5.4.530",
    "react": "^18.3.1",
    "react-arborist": "^3.4.0",
    "react-dom": "^18.3.1",
    "react-markdown": "^9.0.1",
    "react-pdf": "^10.2.0",
    "react-router-dom": "^6.26.1",
    "recharts": "^3.5.1",
    "remark-gfm": "^4.0.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@typescript-eslint/eslint-plugin": "^7.13.1",
    "@typescript-eslint/parser": "^7.13.1",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.0",
    "eslint-plugin-react-hooks": "^4.6.2",
    "eslint-plugin-react-refresh": "^0.4.7",
    "postcss": "^8.4.45",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.6.2",
    "vite": "^5.4.2",
    "vitest": "^4.0.15"
  }
}
```

### **3. Backend Package.json**
```json
{
  "dependencies": {
    "@fiscal/shared": "workspace:*",
    "@prisma/client": "^5.20.0",
    "bcrypt": "^6.0.0",
    "cors": "^2.8.5",
    "danfe-pdf": "^1.0.1",
    "dotenv": "^17.2.3",
    "express": "^4.18.2",
    "jsonwebtoken": "^9.0.3",
    "mongodb": "^7.0.0",
    "mongoose": "^9.0.0",
    "nfe-danfe-pdf": "^1.0.3",
    "nfe-xml-to-pdf": "^1.0.0",
    "prisma": "^5.20.0",
    "uuid": "^13.0.0",
    "xlsx": "^0.18.5"
  },
  "devDependencies": {
    "@aws-sdk/client-s3": "^3.958.0",
    "@testcontainers/mongodb": "^11.9.0",
    "@types/bcrypt": "^6.0.0",
    "@types/cors": "^2.8.19",
    "@types/express": "^5.0.6",
    "@types/jsonwebtoken": "^9.0.10",
    "@types/node": "^24.10.1",
    "@types/uuid": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^7.13.1",
    "@typescript-eslint/parser": "^7.13.1",
    "eslint": "^8.57.0",
    "fast-check": "^4.3.0",
    "jszip": "^3.10.1",
    "tsx": "^4.21.0",
    "typescript": "^5.6.2"
  }
}
```

### **4. Shared Package.json**
```json
{
  "dependencies": {
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "typescript": "^5.6.2"
  }
}
```

## 🎯 **Benefícios da Reorganização**

### **1. Performance**
- ⚡ **Instalação mais rápida** - Cada projeto instala apenas o necessário
- 📦 **Bundle menor** - Frontend não inclui deps do backend
- 🚀 **Build otimizado** - Menos dependências para processar

### **2. Segurança**
- 🔒 **Isolamento** - Backend deps não expostas no frontend
- 🛡️ **Menor superfície de ataque** - Menos deps no cliente
- 🔐 **Secrets seguros** - Deps sensíveis apenas no backend

### **3. Manutenção**
- 🎯 **Clareza** - Fácil saber onde cada dep é usada
- 🔧 **Atualizações precisas** - Atualizar apenas onde necessário
- 📋 **Auditoria** - Análise de segurança por projeto

### **4. Desenvolvimento**
- 👥 **Especialização** - Devs frontend/backend veem apenas suas deps
- 🧪 **Testes isolados** - Cada projeto testa suas próprias deps
- 📊 **Análise precisa** - Bundle analyzer mostra deps reais

## 📋 **Plano de Migração**

### **Fase 1: Preparação**
1. ✅ Backup do package.json atual
2. ✅ Documentar dependências por projeto
3. ✅ Identificar dependências compartilhadas

### **Fase 2: Migração**
1. 🔄 Mover deps específicas para cada projeto
2. 🔄 Manter apenas deps essenciais na raiz
3. 🔄 Atualizar scripts de build

### **Fase 3: Validação**
1. ✅ Testar build de cada projeto
2. ✅ Verificar funcionamento em desenvolvimento
3. ✅ Validar build de produção

### **Fase 4: Limpeza**
1. 🧹 Remover deps não utilizadas
2. 🧹 Limpar scripts legacy
3. 🧹 Atualizar documentação

## ⚠️ **Considerações Importantes**

### **Dependências Compartilhadas**
- `typescript` - Usado em todos os projetos
- `eslint` - Linting em todos os projetos
- `xlsx` - Usado no frontend e backend

### **Versioning**
- Manter versões consistentes entre projetos
- Usar ranges compatíveis (^x.y.z)
- Documentar breaking changes

### **Docker Impact**
- Dockerfile precisa ser atualizado
- Copiar package.json de cada workspace
- Build em ordem correta (shared → apps)

## 🎉 **Resultado Esperado**

Após a reorganização:
- 📦 **Root limpo** - Apenas workspace management
- 🎯 **Projetos focados** - Cada um com suas deps
- ⚡ **Performance melhor** - Instalação e build mais rápidos
- 🔒 **Segurança aprimorada** - Isolamento de dependências
- 👥 **DX melhorado** - Clareza para desenvolvedores

**Esta reorganização segue as melhores práticas de monorepo!** 📚✨