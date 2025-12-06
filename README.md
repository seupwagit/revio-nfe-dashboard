# 🚀 SpedRevio - Dashboard NF-e

Dashboard moderno para visualização e análise de Documentos Fiscais Eletrônicos (NF-e, CT-e, CF-e) usando React + TypeScript + Vite.

---

## 🤖 RAH - Assistente IA Integrado

**Novidade!** SpedRevio agora inclui o **RAH (Revio Agent Helper)**, um assistente inteligente baseado em IA que conhece toda a documentação do sistema e pode responder suas dúvidas em tempo real!

### Como Usar o RAH

1. Clique no ícone 💬 no **canto inferior esquerdo**
2. Digite sua pergunta em português
3. Receba resposta em segundos!

**Exemplos de perguntas:**
- "Como usar a busca natural?"
- "Como exportar dados para Excel?"
- "O que é o cache e como funciona?"
- "Por que demora para carregar 90 dias?"

📖 **[Documentação Completa do RAH](docs/RAH_ASSISTENTE_IA.md)**

---

## 📚 DOCUMENTAÇÃO

### 📖 Índice Completo
📄 **[DOCUMENTACAO.md](./DOCUMENTACAO.md)** - Índice completo de toda a documentação

### 🔥 Documentos Principais
- **[Manual do Usuário](./docs/MANUAL_COMPLETO_USUARIO.md)** - Guia completo de uso
- **[Arquitetura](./docs/ARCHITECTURE.md)** - Arquitetura do sistema
- **[Busca Natural](./docs/BUSCA_NATURAL_COM_IA_COMPLETA.md)** - Busca com IA
- **[RAH Assistente](./docs/RAH_ASSISTENTE_IA.md)** - Assistente inteligente

### 🔍 Auditoria e Validação (NOVO!)
📂 **[docs/auditoria/](./docs/auditoria/)** - Auditoria completa da busca natural (02/12/2025)
- Validação de 35 exemplos
- Correções aplicadas (V1 e V2)
- Planos de teste e resultados

**Comece aqui:** [docs/auditoria/LEIA_PRIMEIRO.md](./docs/auditoria/LEIA_PRIMEIRO.md)

---

## ✨ Funcionalidades

### 📊 Dashboards e Analytics
- **Dashboard Principal** com cards e gráficos interativos
- **Analytics MongoDB** - Agregação local
- **Analytics API** - Agregação via REST
- **Analytics Agregado** - Versão otimizada com cache (recomendado)

### 🔍 Grids Avançadas
- **32+ colunas** com todos os dados
- **Paginação inteligente** (até 5000 registros/página)
- **Filtros avançados** (cabeçalho + busca global)
- **Congelamento de colunas**
- **Ordenação por qualquer coluna**
- **Busca Natural com IA** (Google Gemini)

### 🤖 Busca Natural
Faça consultas em linguagem natural:
```
"notas de entrada maiores que 5000"
"notas autorizadas de setembro"
"notas com ICMS maior que 1000"
```

### 📥 Exportação Excel
- **Sem limites** de registros
- **Todos os campos** exportados
- **Compressão ativada**
- **Logs de progresso**

### ⚡ Cache Inteligente
- **30 minutos** de duração
- **300x mais rápido** em cache hits
- **Indicadores visuais** (badge "💾 Cache")
- **Gerenciamento fácil** (componente CacheStats)

### 🔧 Sistema de Chunks
Para períodos > 60 dias:
- Divide em **chunks de 15 dias**
- **Recuperação automática** com sub-chunks de 7 dias
- Funciona com **60, 90, 120+ dias**

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone [url-do-repo]

# Entre na pasta
cd RevioKiro

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais
```

### Configuração

Edite o arquivo `.env`:

```env
# API Revio
VITE_API_BASE_URL=http://localhost:3000/api
VITE_API_BEARER_TOKEN=seu-token-aqui

# Database
VITE_DB_HOST=10.0.0.8
VITE_DB_DATABASE=seu-database
VITE_DB_COLLECTION=tbl_nfe_100

# Google Gemini (para busca natural)
VITE_API_GOOGLE_GEMINI=sua-chave-aqui

# OpenAI (para RAH - Assistente IA)
VITE_OPENAI_API_KEY=sk-proj-sua-chave-aqui
```

### Executar

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

---

## 📚 Documentação

### Para Usuários

- **[Manual Completo do Usuário](docs/MANUAL_COMPLETO_USUARIO.md)** ⭐
  - Guia completo de todas as funcionalidades
  - Dashboards, Analytics, Grids
  - Busca Natural, Exportação, Cache

- **[RAH - Assistente IA](docs/RAH_ASSISTENTE_IA.md)** 🤖
  - Como usar o assistente inteligente
  - Exemplos de perguntas
  - Configuração e troubleshooting

- **[Guia Rápido](docs/guias/)** 📖
  - Início rápido
  - Instruções de uso
  - Dicas e truques

### Para Desenvolvedores

- **[Documentação Completa](docs/README.md)**
  - Arquitetura do sistema
  - Estrutura de pastas
  - Como contribuir

- **[Arquitetura](docs/arquitetura/)**
  - Documentação técnica da API
  - Design system
  - Estrutura do projeto

---

## 🛠️ Tecnologias

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **TanStack Table** - Grids avançadas
- **Recharts** - Gráficos interativos

### Backend/API
- **Axios** - HTTP client
- **API Revio** - Dados fiscais
- **MongoDB** - Database (opcional)

### IA
- **OpenAI GPT-4** - RAH Assistente
- **Google Gemini** - Busca Natural

### Utilitários
- **SheetJS (xlsx)** - Exportação Excel
- **Lucide Icons** - Ícones
- **date-fns** - Manipulação de datas

---

## 📊 Performance

### Tempos de Carregamento

| Período | Primeira Vez | Com Cache |
|---------|--------------|-----------|
| 30 dias | ~2-3s | ~0.05s ⚡ |
| 60 dias | ~3-5s | ~0.05s ⚡ |
| 90 dias | ~5-8s | ~0.05s ⚡ |
| 120 dias | ~8-12s | ~0.05s ⚡ |

### Exportação Excel

| Registros | Tempo |
|-----------|-------|
| 200 | < 1s |
| 500 | 1-2s |
| 1.000 | 2-3s |
| 5.000 | 5-10s |
| 10.000 | 10-20s |

---

## 🎯 Estrutura do Projeto

```
SpedRevio/
├── src/                    # Código-fonte React + TypeScript
│   ├── components/         # Componentes reutilizáveis
│   │   ├── RAHAssistant.tsx    # Assistente IA
│   │   ├── CacheStats.tsx      # Estatísticas de cache
│   │   ├── GridPaginada.tsx    # Grid principal
│   │   └── ...
│   ├── pages/              # Páginas principais
│   │   ├── Dashboard.tsx       # Dashboard principal
│   │   ├── Analytics*.tsx      # Páginas de analytics
│   │   ├── Grid*.tsx           # Grids de documentos
│   │   └── ...
│   ├── services/           # Serviços e lógica de negócio
│   │   ├── rahAgent.ts         # Lógica do RAH
│   │   ├── api.ts              # API Revio
│   │   ├── streamingCache.ts   # Sistema de cache
│   │   └── ...
│   ├── contexts/           # Context API (NFContext)
│   ├── types/              # TypeScript types
│   └── utils/              # Funções utilitárias
│
├── docs/                   # 📚 Documentação completa
│   ├── arquitetura/        # Documentação técnica
│   ├── guias/              # Guias de uso
│   ├── implementacoes/     # Detalhes de implementação
│   ├── resumos/            # Resumos executivos
│   ├── testes/             # Documentação de testes
│   ├── solucoes/           # Soluções e correções
│   └── README.md           # Índice da documentação
│
├── tests/                  # 🧪 Scripts de teste
│   ├── test-api-*.cjs      # Testes de API
│   ├── test-90-dias-*.cjs  # Testes de performance
│   ├── test-rah.cjs        # Teste do RAH
│   └── README.md           # Documentação dos testes
│
├── scripts/                # 🔧 Scripts utilitários
│   ├── aggregation-*.cjs   # Servidores (legacy)
│   ├── organizar-*.cjs     # Scripts de organização
│   └── README.md           # Documentação dos scripts
│
├── utils/                  # 🛠️ Ferramentas auxiliares
│   ├── limpar-cache-corrompido.html
│   └── README.md           # Documentação das ferramentas
│
├── public/                 # Assets estáticos
├── dist/                   # Build de produção
├── .env                    # Variáveis de ambiente
└── package.json            # Dependências e scripts
```

---

## 🤝 Como Contribuir

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

📖 Veja [CONTRIBUTING.md](docs/outros/CONTRIBUTING.md) para mais detalhes.

---

## 🆘 Troubleshooting

### Problemas Comuns

**Grid não carrega:**
- Verifique conexão com internet
- Tente período menor
- Limpe o cache
- Recarregue a página (F5)

**RAH não funciona:**
- Verifique `VITE_OPENAI_API_KEY` no `.env`
- Reinicie a aplicação
- Verifique conexão com internet

**Exportação demora:**
- Normal para volumes grandes (>5k registros)
- Aguarde o processo completar
- Veja progresso no console (F12)

📖 Veja [Troubleshooting Completo](docs/troubleshooting/) para mais soluções.

---

## 📝 Changelog

Veja [CHANGELOG.md](docs/atualizacoes/CHANGELOG.md) para histórico de mudanças.

---

## 📄 Licença

Este projeto está sob a licença MIT. Veja [LICENSE](LICENSE) para mais detalhes.

---

## 🎉 Agradecimentos

- **Revio** - API de dados fiscais
- **OpenAI** - GPT-4 para RAH
- **Google** - Gemini para busca natural
- **Comunidade Open Source** - Bibliotecas incríveis

---

## 📞 Suporte

**Dúvidas?**
- Use o **RAH** (assistente IA) 🤖
- Consulte o [Manual Completo](docs/MANUAL_COMPLETO_USUARIO.md)
- Veja [Troubleshooting](docs/troubleshooting/)

**Problemas?**
- Abra uma [Issue](issues)
- Consulte [Troubleshooting](docs/troubleshooting/)
- Use o **RAH** para ajuda

---

**Desenvolvido com ❤️ para análise de documentos fiscais**

*Versão: 1.0.0*  
*Última atualização: Dezembro 2024*
