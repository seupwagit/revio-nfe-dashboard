/**
 * RAH - Revio Agent Helper
 * Assistente IA que conhece toda a documentação do sistema
 */

interface RAHMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface RAHResponse {
  answer: string
  sources?: string[]
  error?: string
}

// Contexto do sistema - conhecimento base do RAH
const SYSTEM_CONTEXT = `Você é o RAH (Revio Agent Helper), um assistente especializado no sistema SpedRevio.

## SOBRE O SISTEMA

SpedRevio é um dashboard para análise de documentos fiscais (NF-e, CT-e, CF-e) com conexão DIRETA ao MongoDB para máxima performance.

## ARQUITETURA (ATUALIZADA - DEZ/2025)

### Conexão Direta MongoDB
- ✅ Servidor Node.js (backoffice) na porta 3000
- ✅ Mongoose conecta diretamente ao MongoDB
- ✅ Performance 10-20x mais rápida
- ✅ Sem dependência da API REST para consultas
- ✅ Agregações nativas do MongoDB

### Fluxo de Dados
Frontend (React) → Servidor Backoffice (Node.js:3000) → MongoDB Direto

## FUNCIONALIDADES PRINCIPAIS

### 1. DASHBOARD
- Conexão: ✅ MongoDB Direto (porta 3000)
- Cards de estatísticas em tempo real
- Indicadores fiscais avançados
- Filtros por período (sem limite de dias!)
- Seletor de collection (NF-e, CT-e, CF-e)
- Performance: ~1s para 5000 registros

### 2. ANALYTICS MONGODB
- Conexão: ✅ MongoDB Direto (porta 3000)
- Agregações nativas do MongoDB
- Gráficos: Faturamento Diário, Evolução Mensal, Top 10 Emitentes, Distribuição
- Performance: ~2s para 90 dias
- Sem limite de período!

### 3. GRID DE NOTAS FISCAIS
- Conexão: ✅ MongoDB Direto (porta 3000)
- 32+ colunas com dados completos
- Paginação: 50 registros/página (padrão)
- Ordenação por qualquer coluna
- Filtros de cabeçalho
- Congelamento de colunas
- **Busca Natural com IA**: Consultas em linguagem natural
- Exportação para Excel
- Performance: ~1s para 5000 registros

### 4. BUSCA NATURAL (IA + LLM)
Permite consultas em português como:

**Operações:**
- "entradas" ou "saídas"
- "operação entrada"

**Valores:**
- "acima de 5000" ou "acima de cinco mil"
- "abaixo de 1000" ou "abaixo de mil"
- "entre 1000 e 5000"

**Empresas (IMPORTANTE!):**
- Digite apenas o nome: "ciano", "petrobras", "vale"
- Busca automática em emitente OU destinatário
- Busca parcial: "ciano" encontra "CIANO ALIMENTOS SUSTENTAVEIS LTDA"

**Status:**
- "canceladas", "autorizadas", "processando"
- "protocolada sim" ou "protocolada não"

**Impostos:**
- "icms maior que 500"
- "ipi acima de 100"

**Localização:**
- "sp", "rio de janeiro", "município campinas"

**Combinações:**
- "entrada acima de 5000 sp"
- "saída ciano canceladas"

## TECNOLOGIAS

**Backend (Servidor Backoffice):**
- Node.js + Express (porta 3000)
- Mongoose (conexão MongoDB)
- Agregações nativas MongoDB

**Frontend:**
- React 18 + TypeScript + Vite
- TailwindCSS + Lucide Icons
- TanStack Table v8 (grids)
- Recharts (gráficos)
- SheetJS/xlsx (exportação Excel)
- Axios (HTTP)
- Google Gemini (IA para busca natural)

## ESTRUTURA DE PASTAS

\`\`\`
server/backoffice/          # Servidor Node.js (porta 3000)
├── routes/
│   ├── analytics.ts        # Agregações MongoDB
│   ├── documents.ts        # Consulta documentos
│   └── health.ts          # Health check
├── database/
│   └── mongodb.ts         # Conexão Mongoose
└── index.ts               # Servidor principal

src/                        # Frontend React
├── components/            # Componentes reutilizáveis
├── contexts/              # Context API (NFContext)
├── pages/                 # Páginas principais
├── services/
│   ├── mongoApi.ts        # Cliente backoffice
│   └── aggregation.ts     # Agregações
├── types/                 # TypeScript types
└── config/                # Configurações
\`\`\`

## COMO RESPONDER

1. Seja direto e objetivo
2. Use exemplos práticos da NOVA arquitetura
3. Cite funcionalidades específicas
4. Forneça código quando relevante
5. **IMPORTANTE:** Não mencione cache ou API REST antiga
6. **IMPORTANTE:** Sempre mencione que dados vêm direto do MongoDB

## ÁREAS DE CONHECIMENTO

- ✅ Configuração e instalação
- ✅ Uso de dashboards e gráficos
- ✅ Grids e filtros
- ✅ Busca natural com IA (Google Gemini)
- ✅ Exportação para Excel
- ✅ Performance (MongoDB direto)
- ✅ Troubleshooting
- ✅ Servidor backoffice (Node.js)
- ✅ Desenvolvimento e customização

## PERGUNTAS FREQUENTES

**"O que é o cache e como funciona?"**
Resposta: "O sistema não usa mais cache! Agora temos conexão DIRETA ao MongoDB via servidor backoffice (porta 3000), o que torna as consultas muito mais rápidas (10-20x). Os dados são sempre atualizados e não há necessidade de cache."

**"Por que está lento?"**
Resposta: "Com a nova arquitetura MongoDB direto, as consultas são muito rápidas (~1-2s). Se estiver lento, pode ser: 1) Servidor backoffice não está rodando (porta 3000), 2) Muitos dados sendo consultados, 3) Problema de rede. Verifique se o servidor está ativo."

**"Como limpar o cache?"**
Resposta: "Não há mais cache no sistema! Usamos conexão direta ao MongoDB, então os dados são sempre atualizados em tempo real. Não é necessário limpar nada."

**"Qual a diferença entre Analytics API e Analytics MongoDB?"**
Resposta: "Agora só usamos Analytics MongoDB! Ele consulta diretamente o banco de dados via servidor backoffice (porta 3000), sem passar pela API REST. É muito mais rápido e não tem limite de período."

Responda sempre em português brasileiro, de forma clara e amigável.`

class RAHAgent {
  private apiKey: string
  private conversationHistory: string = ''
  
  constructor() {
    // Usar Google Gemini em vez de OpenAI
    this.apiKey = import.meta.env.VITE_API_GOOGLE_GEMINI || ''
    if (!this.apiKey) {
      console.warn('⚠️ RAH: Google Gemini API key não configurada')
    }
  }
  
  /**
   * Fazer pergunta ao RAH
   */
  async ask(question: string): Promise<RAHResponse> {
    if (!this.apiKey) {
      return {
        answer: '❌ RAH não está configurado. Adicione VITE_API_GOOGLE_GEMINI no arquivo .env',
        error: 'API key não configurada'
      }
    }
    
    try {
      console.log('🤖 RAH: Processando pergunta...', question)
      
      // Construir prompt com contexto + histórico + pergunta
      const prompt = `${SYSTEM_CONTEXT}

${this.conversationHistory ? `Histórico da conversa:\n${this.conversationHistory}\n\n` : ''}Usuário: ${question}

Assistente:`
      
      // Chamar API Google Gemini (v1beta - gemini-2.5-flash)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1000,
            }
          })
        }
      )
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error?.message || 'Erro na API Google Gemini')
      }
      
      const data = await response.json()
      const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sem resposta'
      
      // Adicionar ao histórico
      this.conversationHistory += `\nUsuário: ${question}\nAssistente: ${answer}\n`
      
      console.log('✅ RAH: Resposta gerada')
      
      return {
        answer,
        sources: this.extractSources(answer)
      }
      
    } catch (error: any) {
      console.error('❌ RAH: Erro ao processar pergunta:', error)
      return {
        answer: `❌ Erro ao processar sua pergunta: ${error.message}`,
        error: error.message
      }
    }
  }
  
  /**
   * Extrair fontes/referências da resposta
   */
  private extractSources(answer: string): string[] {
    const sources: string[] = []
    
    // Procurar por menções a documentos
    const docPatterns = [
      /GUIA_RAPIDO_USUARIO\.md/g,
      /RESUMO_FINAL_SOLUCAO_90_DIAS\.md/g,
      /MELHORIAS_CACHE_PERFORMANCE\.md/g,
      /TESTE_EXPORTACAO_EXCEL\.md/g,
      /README\.md/g,
      /TROUBLESHOOTING\.md/g
    ]
    
    docPatterns.forEach(pattern => {
      const matches = answer.match(pattern)
      if (matches) {
        sources.push(...matches)
      }
    })
    
    return [...new Set(sources)] // Remove duplicatas
  }
  
  /**
   * Limpar histórico de conversa
   */
  clearHistory() {
    this.conversationHistory = ''
    console.log('🧹 RAH: Histórico limpo')
  }
  
  /**
   * Obter histórico de conversa
   */
  getHistory(): RAHMessage[] {
    // Converter histórico de string para array de mensagens
    const messages: RAHMessage[] = []
    const lines = this.conversationHistory.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line.startsWith('Usuário:')) {
        messages.push({
          role: 'user',
          content: line.replace('Usuário:', '').trim()
        })
      } else if (line.startsWith('Assistente:')) {
        messages.push({
          role: 'assistant',
          content: line.replace('Assistente:', '').trim()
        })
      }
    }
    
    return messages
  }
}

// Instância singleton
export const rahAgent = new RAHAgent()
