# 📁 Estrutura do Código Fonte

Esta pasta contém todo o código fonte do SpedRevio Dashboard.

## 📂 Organização

```
src/frontend/
├── assets/          # Recursos estáticos (imagens, logos)
├── components/      # Componentes React reutilizáveis
├── config/          # Configurações da aplicação
├── contexts/        # Context API (estado global)
├── pages/           # Páginas da aplicação
├── services/        # Serviços e integrações (API)
├── types/           # Definições TypeScript
├── App.tsx          # Componente raiz
├── main.tsx         # Entry point
├── index.css        # Estilos globais
└── vite-env.d.ts    # Tipos do Vite
```

## 🧩 Componentes

### Layout.tsx
Componente principal de layout com:
- Header com logo e menu
- Sidebar com navegação
- Footer
- Responsividade

### StatsCard.tsx
Card de estatísticas com:
- Ícone em gradiente
- Título e valor
- Cores personalizáveis
- Hover effect

### NotaCard.tsx
Card de nota fiscal com:
- Informações principais
- Status visual
- Dados de emitente/destinatário
- Navegação para detalhes

### LoadingSpinner.tsx
Indicador de carregamento com:
- Spinner duplo animado
- Texto informativo
- Design moderno

## 📄 Páginas

### Dashboard.tsx
Página inicial com:
- Cards de estatísticas
- Análise de performance
- Resumo financeiro
- Gráficos e métricas

### NotasFiscais.tsx
Listagem de notas com:
- Cards de notas
- Filtros de busca
- Filtro por status
- Empty state

### NotasFiscaisGrid.tsx
Grid avançada com:
- TanStack Table
- Ordenação por colunas
- Filtros avançados
- Paginação
- Busca rápida

### Detalhes.tsx
Detalhes da nota com:
- Informações completas
- Dados de emitente/destinatário
- Tabela de itens
- Chave de acesso

## ⚙️ Configuração

### config/env.ts
Configuração centralizada:
- Variáveis de ambiente
- Validação de configurações
- Valores padrão

## 🌐 Serviços

### services/api.ts
Integração com API:
- Cliente Axios configurado
- Endpoints de consulta
- Mapeamento de dados
- Tratamento de erros

## 📝 Tipos

### types/index.ts
Definições TypeScript:
- NotaFiscal
- ItemNF
- DashboardStats
- Filtros
- ApiResponse
- ContadorResponse

## 🎨 Estilos

### index.css
Estilos globais:
- Importação do Tailwind
- Classes utilitárias customizadas
- Fonte Inter
- Variáveis CSS

## 🔄 Contextos

### contexts/NFContext.tsx
Estado global com:
- Lista de notas
- Estatísticas
- Loading state
- Filtros
- Função de recarregar

## 🚀 Entry Points

### main.tsx
Ponto de entrada:
- Renderização do React
- Strict Mode
- Montagem no DOM

### App.tsx
Componente raiz:
- Configuração de rotas
- Provider de contexto
- Validação de ambiente

## 📦 Imports

### Padrão de Importação
```typescript
// 1. Bibliotecas externas
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

// 2. Contextos e hooks
import { useNF } from '../contexts/NFContext'

// 3. Componentes
import NotaCard from '../components/NotaCard'

// 4. Tipos
import { NotaFiscal } from '../types'

// 5. Serviços
import { fetchNotasFiscais } from '../services/api'
```

## 🎯 Boas Práticas

### Componentes
- Use TypeScript para props
- Extraia lógica complexa em hooks
- Mantenha componentes pequenos
- Use memo quando necessário

### Estado
- Use Context API para estado global
- Use useState para estado local
- Use useMemo para cálculos pesados
- Use useCallback para funções

### Estilos
- Use classes do Tailwind
- Use classes utilitárias customizadas
- Evite estilos inline
- Mantenha consistência

### API
- Centralize chamadas em services/
- Trate erros adequadamente
- Use loading states
- Valide dados recebidos

## 🔧 Extensibilidade

### Adicionar Nova Página
1. Crie arquivo em `pages/`
2. Adicione rota em `App.tsx`
3. Adicione link em `Layout.tsx`

### Adicionar Novo Componente
1. Crie arquivo em `components/`
2. Exporte como default
3. Use TypeScript para props
4. Documente uso

### Adicionar Novo Endpoint
1. Adicione função em `services/api.ts`
2. Defina tipos em `types/index.ts`
3. Trate erros adequadamente
4. Use no componente

### Adicionar Novo Contexto
1. Crie arquivo em `contexts/`
2. Defina Provider e hook
3. Adicione em `App.tsx`
4. Use nos componentes

## 📚 Recursos

- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Router](https://reactrouter.com)
- [TanStack Table](https://tanstack.com/table)

---

Para mais informações, consulte a [documentação completa](../INDEX.md).
