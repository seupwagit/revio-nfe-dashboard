import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Trash2, Loader2 } from 'lucide-react'
import { rahAgent } from '../services/rahAgent'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function RAHAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  
  const handleSend = async () => {
    if (!input.trim() || loading) return
    
    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    
    try {
      const response = await rahAgent.ask(input)
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        timestamp: new Date()
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: '❌ Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }
  
  const handleClear = () => {
    if (confirm('Limpar toda a conversa?')) {
      setMessages([])
      rahAgent.clearHistory()
    }
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }
  
  // Sugestões de perguntas
  const suggestions = [
    "Como usar a busca natural?",
    "Como exportar dados para Excel?",
    "O que é o cache e como funciona?",
    "Como filtrar notas por período?",
    "Quais gráficos estão disponíveis?"
  ]
  
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 z-50"
        title="Abrir RAH - Assistente IA"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    )
  }
  
  return (
    <div className="fixed bottom-4 left-4 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border-2 border-purple-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-lg">RAH</h3>
            <p className="text-xs opacity-90">Revio Agent Helper</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleClear}
            className="p-2 hover:bg-white/20 rounded transition-colors"
            title="Limpar conversa"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded transition-colors"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-purple-600" />
            </div>
            <h4 className="font-bold text-gray-800 mb-2">Olá! Sou o RAH 👋</h4>
            <p className="text-sm text-gray-600 mb-4">
              Seu assistente para o SpedRevio.<br/>
              Pergunte-me qualquer coisa!
            </p>
            
            <div className="text-left space-y-2">
              <p className="text-xs font-semibold text-gray-700 mb-2">Sugestões:</p>
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => setInput(suggestion)}
                  className="block w-full text-left text-xs p-2 bg-white rounded border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors"
                >
                  💡 {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white border border-gray-200 text-gray-800'
                }`}
              >
                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                <div className={`text-xs mt-1 ${
                  message.role === 'user' ? 'text-white/70' : 'text-gray-500'
                }`}>
                  {message.timestamp.toLocaleTimeString('pt-BR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-gray-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">RAH está pensando...</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua pergunta..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none text-sm"
            rows={2}
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Enviar"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          💡 Pressione Enter para enviar
        </p>
      </div>
    </div>
  )
}
