# 📁 Estrutura do Projeto - Dashboard NF-e

## 🗂️ Organização de Arquivos

```
nf-dashboard/
├── .env                          # Variáveis de ambiente (não versionar)
├── .env.example                  # Exemplo de configuração
├── package.json                  # Dependências do projeto
├── vite.config.ts               # Configuração do Vite
├── tsconfig.json                # Configuração do TypeScript
├── tailwind.config.js           # Configuração do Tailwind CSS
├── postcss.config.js            # Configuração do PostCSS
├── index.html                   # HTML principal
│
├── src/
│   ├── main.tsx                 # Entry point da aplicação
│   ├── App.tsx                  # Componente raiz com rotas
│   ├── index.css                # Estilos globais + Tailwind
│   ├── vite-env.d.ts           # Tipos do Vite
│   │
│   ├── config/
│   │   └── env.ts              # Configuração centralizada de ambiente
│   │
│   ├── types/
│   │   └── index.ts            # Definições TypeScript
│   │
│   ├── services/
│   │   └── api.ts              # Serviços de API e integração
│   │
│   ├── contexts/
│   │   └── NFContext.tsx       # Context API para estado global
│   │
│   ├── components/
│   │   ├── Layout.tsx          # Layout principal com sidebar
│   │   ├── StatsCard.tsx       # Card de estatísticas
│   │   ├── NotaCard.tsx        # Card de nota fiscal
│   │   └── LoadingSpinner.tsx  # Componente de loading
│   │
│   └── pages/
│       ├── Dashboard.tsx        # Página de dashboard
│       ├── NotasFiscais.tsx    # Listagem com cards
│       ├── NotasFiscaisGrid.tsx # Grid com TanStack Table
│       └── Detalhes.tsx        # Detalhes da nota fiscal
│
└── docs/
    ├── README.md               # Documentação principal
    └── CONFIGURACAO.md         # Guia de configuração
```

## 📄 Descrição dos Arquivos Principais

### Configuração

- **`.env`**: Contém todas as variáveis de ambiente sensíveis (tokens, hosts, databases)
- **`vite.config.ts`**: Configuração do build tool, aliases de importação
- **`tsconfig.json`**: Configuração do TypeScript, strict mode, paths
- **`tailwind.config.js`**: Configuração do Tailwind CSS, temas, plugins

### Source Code

#### `/src/config/`
- **`env.ts`**: Centraliza acesso às variáveis de ambiente com validação

#### `/src/types/`
- **`index.ts`**: Todas as interfaces e tipos TypeScript do projeto
  - `NotaFiscal`: Estrutura da nota fiscal
  - `ItemNF`: Item da nota fiscal
  - `DashboardStats`: Estatísticas do dashboard
  - `Filtros`: Parâmetros de filtro
  - `ApiResponse`: Resposta da API
  - `ContadorResponse`: Resposta do contador

#### `/src/services/`
- **`api.ts`**: Integração com a API
  - `fetchNotasFiscais()`: Busca notas fiscais
  - `fetchContador()`: Busca total de registros
  - Mapeamento de dados da API para o formato interno
  - Configuração do axios com interceptors

#### `/src/contexts/`
- **`NFContext.tsx`**: Gerenciamento de estado global
  - Provider de notas fiscais
  - Estado de loading
  - Filtros compartilhados
  - Função de recarregar dados

#### `/src/components/`
- **`Layout.tsx`**: Layout principal com header e sidebar
- **`StatsCard.tsx`**: Card reutilizável para estatísticas
- **`NotaCard.tsx`**: Card para exibir nota fiscal na listagem
- **`LoadingSpinner.tsx`**: Indicador de carregamento

#### `/src/pages/`
- **`Dashboard.tsx`**: Página inicial com estatísticas e resumo
- **`NotasFiscais.tsx`**: Listagem de notas em formato de cards
- **`NotasFiscaisGrid.tsx`**: Grid completa com TanStack Table
  - Ordenação por colunas
  - Filtros avançados
  - Paginação
  - Busca rápida
- **`Detalhes.tsx`**: Visualização detalhada de uma nota fiscal

## 🔄 Fluxo de Dados

```
1. Usuário acessa a aplicação
   ↓
2. App.tsx valida variáveis de ambiente (env.ts)
   ↓
3. NFProvider inicializa o contexto
   ↓
4. Componentes consomem dados via useNF()
   ↓
5. Serviços (api.ts) fazem requisições HTTP
   ↓
6. Dados são mapeados para tipos TypeScript
   ↓
7. Estado é atualizado no contexto
   ↓
8. Componentes re-renderizam com novos dados
```

## 🎨 Padrões de Código

### Nomenclatura
- **Componentes**: PascalCase (ex: `NotaCard.tsx`)
- **Funções**: camelCase (ex: `fetchNotasFiscais`)
- **Constantes**: UPPER_SNAKE_CASE (ex: `API_BASE_URL`)
- **Interfaces**: PascalCase (ex: `NotaFiscal`)

### Organização de Imports
```typescript
// 1. Bibliotecas externas
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// 2. Componentes internos
import { useNF } from '../contexts/NFContext'
import NotaCard from '../components/NotaCard'

// 3. Tipos
import { NotaFiscal } from '../types'

// 4. Estilos (se houver)
import './styles.css'
```

### Estrutura de Componentes
```typescript
// 1. Imports
// 2. Interfaces/Types locais
// 3. Componente principal
// 4. Funções auxiliares (se necessário)
// 5. Export default
```

## 🔐 Segurança

- ✅ Variáveis sensíveis no `.env` (não versionado)
- ✅ `.env.example` para referência
- ✅ Bearer Token em headers HTTP
- ✅ Validação de variáveis obrigatórias
- ✅ TypeScript para type safety

## 📦 Build e Deploy

### Desenvolvimento
```bash
npm run dev
```

### Build de Produção
```bash
npm run build
```

### Preview da Build
```bash
npm run preview
```

## 🧪 Extensibilidade

O projeto foi estruturado para fácil extensão:

1. **Novos Endpoints**: Adicionar em `src/services/api.ts`
2. **Novos Tipos**: Adicionar em `src/types/index.ts`
3. **Novas Páginas**: Criar em `src/pages/` e adicionar rota em `App.tsx`
4. **Novos Componentes**: Criar em `src/components/`
5. **Novo Estado Global**: Estender `NFContext.tsx` ou criar novo contexto

## 📚 Tecnologias Utilizadas

- **React 18.3.1**: UI Library
- **TypeScript 5.6.2**: Type Safety
- **Vite 5.4.2**: Build Tool
- **React Router 6.26.1**: Roteamento
- **TanStack Table 8.x**: Grid de dados
- **Axios 1.x**: HTTP Client
- **Tailwind CSS 3.4.10**: Estilização
- **Lucide React**: Ícones
