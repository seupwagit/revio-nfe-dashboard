/**
 * RAH - Revio Agent Helper
 * Assistente IA que conhece toda a documentação do sistema
 */

import { env } from '../config/env'

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

SpedRevio é um dashboard para análise de documentos fiscais (NF-e, CT-e, CF-e) que consome dados da API Revio.

## FUNCIONALIDADES PRINCIPAIS

### 1. DASHBOARD
- Visão geral com cards de estatísticas
- Gráficos de faturamento, evolução mensal
- Top emitentes e distribuição por tipo
- Filtros por período e tipo de documento

### 2. ANALYTICS
- **Analytics MongoDB**: Agregação local dos dados
- **Analytics API**: Agregação via API REST
- **Analytics Agregado**: Versão otimizada com paginação e cache
- Gráficos interativos (Recharts)
- Exportação de dados

### 3. GRIDS (NF-e, CT-e, CF-e)
- Visualização tabular com 32+ colunas
- Paginação inteligente (1000 registros/página)
- Ordenação por colunas
- Filtros de cabeçalho
- Congelamento de colunas
- Busca global
- **Busca Natural com LLM**: Consultas em linguagem natural
- Exportação para Excel (sem limites)

### 4. BUSCA NATURAL (LLM)
Permite consultas como:
- "notas de entrada maiores que 5000"
- "notas autorizadas de setembro"
- "notas do emitente X para destinatário Y"
- "notas com ICMS maior que 1000"

### 5. CACHE INTELIGENTE
- Cache de 30 minutos
- Streaming incremental
- Indicador visual (badge "💾 Cache")
- Componente CacheStats para gerenciamento
- PageSize otimizado: 20.000 registros

### 6. SISTEMA DE CHUNKS
Para períodos > 60 dias:
- Divide em chunks de 15 dias
- Recuperação automática com sub-chunks de 7 dias
- Evita timeout da API
- Funciona com 60, 90, 120+ dias

## TECNOLOGIAS

- **Frontend**: React + TypeScript + Vite
- **UI**: TailwindCSS + Lucide Icons
- **Tabelas**: TanStack Table (React Table v8)
- **Gráficos**: Recharts
- **Excel**: SheetJS (xlsx)
- **HTTP**: Axios
- **IA**: OpenAI GPT-4

## ESTRUTURA DE PASTAS

\`\`\`
src/
├── components/     # Componentes reutilizáveis
├── contexts/       # Context API (NFContext)
├── pages/          # Páginas principais
├── services/       # Serviços (API, cache, LLM)
├── types/          # TypeScript types
├── utils/          # Utilitários
└── config/         # Configurações
\`\`\`

## COMO RESPONDER

1. Seja direto e objetivo
2. Use exemplos práticos
3. Cite funcionalidades específicas
4. Forneça código quando relevante
5. Indique onde encontrar mais informações

## ÁREAS DE CONHECIMENTO

- ✅ Configuração e instalação
- ✅ Uso de dashboards e gráficos
- ✅ Grids e filtros
- ✅ Busca natural com LLM
- ✅ Exportação para Excel
- ✅ Cache e performance
- ✅ Troubleshooting
- ✅ API Revio
- ✅ Desenvolvimento e customização

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
