import { useState } from 'react'
import { Search, X, HelpCircle } from 'lucide-react'

interface BuscaNaturalDiretaProps {
  onSearch: (filtros: any) => void
  onClear: () => void
}

interface Sugestao {
  texto: string
  descricao: string
  query: string
}

export default function BuscaNaturalDireta({ onSearch, onClear }: BuscaNaturalDiretaProps) {
  const [query, setQuery] = useState('')
  const [resultado, setResultado] = useState('')
  const [mostrarAjuda, setMostrarAjuda] = useState(false)
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)

  // Mapeamento DIRETO de campos (você tem a faca e o queijo!)
  const campos: Record<string, { campo: string, tipo: 'texto' | 'numero' | 'data' }> = {
    // Identificação
    'numero': { campo: 'numero', tipo: 'texto' },
    'nota': { campo: 'numero', tipo: 'texto' },
    'serie': { campo: 'serie', tipo: 'texto' },
    'série': { campo: 'serie', tipo: 'texto' },
    'modelo': { campo: 'modelo', tipo: 'texto' },
    'chave': { campo: 'chaveAcesso', tipo: 'texto' },
    
    // Tipo e Status
    'tipo doc': { campo: 'tipoDoc', tipo: 'texto' },
    'tipo': { campo: 'tipoDoc', tipo: 'texto' },
    'status': { campo: 'status', tipo: 'texto' },
    'protocolada': { campo: 'protocolada', tipo: 'texto' },
    
    // Valores
    'total': { campo: 'valorTotal', tipo: 'numero' },
    'valor': { campo: 'valorTotal', tipo: 'numero' },
    'icms': { campo: 'icms', tipo: 'numero' },
    'ipi': { campo: 'ipi', tipo: 'numero' },
    'pis': { campo: 'pis', tipo: 'numero' },
    'cofins': { campo: 'cofins', tipo: 'numero' },
    'frete': { campo: 'frete', tipo: 'numero' },
    'seguro': { campo: 'seguro', tipo: 'numero' },
    'desconto': { campo: 'desconto', tipo: 'numero' },
    
    // Partes
    'emitente': { campo: 'emitente', tipo: 'texto' },
    'destinatario': { campo: 'destinatario', tipo: 'texto' },
    'destinatário': { campo: 'destinatario', tipo: 'texto' },
    'cnpj': { campo: 'cnpj', tipo: 'texto' },
    'uf': { campo: 'uf', tipo: 'texto' },
    'municipio': { campo: 'municipio', tipo: 'texto' },
    'município': { campo: 'municipio', tipo: 'texto' },
    
    // Data
    'data': { campo: 'dataEmissao', tipo: 'data' },
    'data emissao': { campo: 'dataEmissao', tipo: 'data' },
    'data emissão': { campo: 'dataEmissao', tipo: 'data' },
  }

  const gerarSugestoes = (texto: string): Sugestao[] => {
    const textoLower = texto.toLowerCase().trim()
    const sugestoesGeradas: Sugestao[] = []

    // Detectar palavras-chave e sugerir sintaxe correta
    if (textoLower.includes('tipo') || textoLower.includes('recebida') || textoLower.includes('emitida')) {
      sugestoesGeradas.push({
        texto: 'Filtrar por Tipo de Documento',
        descricao: 'Buscar notas recebidas ou emitidas',
        query: 'tipo doc = recebida'
      })
      sugestoesGeradas.push({
        texto: 'Notas Emitidas',
        descricao: 'Filtrar apenas documentos emitidos',
        query: 'tipo doc = emitida'
      })
    }

    if (textoLower.includes('total') || textoLower.includes('valor') || /\d+/.test(textoLower)) {
      sugestoesGeradas.push({
        texto: 'Valor maior que 1000',
        descricao: 'Notas com valor total acima de R$ 1.000',
        query: 'total maior que 1000'
      })
      sugestoesGeradas.push({
        texto: 'Valor maior que 5000',
        descricao: 'Notas com valor total acima de R$ 5.000',
        query: 'total maior que 5000'
      })
    }

    if (textoLower.includes('icms') || textoLower.includes('imposto')) {
      sugestoesGeradas.push({
        texto: 'ICMS maior que 100',
        descricao: 'Notas com ICMS acima de R$ 100',
        query: 'icms maior que 100'
      })
      sugestoesGeradas.push({
        texto: 'IPI maior que 50',
        descricao: 'Notas com IPI acima de R$ 50',
        query: 'ipi maior que 50'
      })
    }

    if (textoLower.includes('entrada') || textoLower.includes('saida') || textoLower.includes('saída') || textoLower.includes('operação')) {
      sugestoesGeradas.push({
        texto: 'Notas de Entrada',
        descricao: 'Todas as notas de entrada',
        query: 'entrada'
      })
      sugestoesGeradas.push({
        texto: 'Notas de Saída',
        descricao: 'Todas as notas de saída',
        query: 'saída'
      })
    }

    if (textoLower.includes('status') || textoLower.includes('cancelada') || textoLower.includes('autorizada')) {
      sugestoesGeradas.push({
        texto: 'Notas Canceladas',
        descricao: 'Filtrar apenas notas canceladas',
        query: 'status cancelada'
      })
      sugestoesGeradas.push({
        texto: 'Notas Autorizadas',
        descricao: 'Filtrar apenas notas autorizadas',
        query: 'status autorizada'
      })
    }

    if (textoLower.includes('serie') || textoLower.includes('série')) {
      sugestoesGeradas.push({
        texto: 'Série 1',
        descricao: 'Notas da série 1',
        query: 'serie 1'
      })
    }

    // Se não encontrou nada específico, sugerir exemplos gerais
    if (sugestoesGeradas.length === 0) {
      sugestoesGeradas.push(
        {
          texto: 'Tipo Doc = Recebida',
          descricao: 'Filtrar notas recebidas',
          query: 'tipo doc = recebida'
        },
        {
          texto: 'Total maior que 1000',
          descricao: 'Notas acima de R$ 1.000',
          query: 'total maior que 1000'
        },
        {
          texto: 'Notas de Entrada',
          descricao: 'Todas as entradas',
          query: 'entrada'
        },
        {
          texto: 'Status Cancelada',
          descricao: 'Notas canceladas',
          query: 'status cancelada'
        }
      )
    }

    return sugestoesGeradas
  }

  const processarQuery = (texto: string) => {
    const filtros: any = {}
    const explicacoes: string[] = []
    const textoLower = texto.toLowerCase().trim()

    // 1. PADRÃO: "campo = valor" ou "campo valor"
    // Ex: "tipo doc = recebida", "serie 1", "status cancelada"
    for (const [nome, config] of Object.entries(campos)) {
      // Tentar "campo = valor"
      const regexIgual = new RegExp(`${nome}\\s*=\\s*([^\\s,]+)`, 'i')
      const matchIgual = textoLower.match(regexIgual)
      
      if (matchIgual) {
        const valor = matchIgual[1].trim()
        
        if (config.tipo === 'texto') {
          filtros[config.campo] = valor
          explicacoes.push(`${nome}: "${valor}"`)
        }
        continue
      }
      
      // Tentar "campo valor" (sem =)
      const regexDireto = new RegExp(`${nome}\\s+([a-záàâãéèêíïóôõöúçñ0-9]+)`, 'i')
      const matchDireto = textoLower.match(regexDireto)
      
      if (matchDireto && config.tipo === 'texto') {
        const valor = matchDireto[1].trim()
        filtros[config.campo] = valor
        explicacoes.push(`${nome}: "${valor}"`)
      }
    }

    // 2. PADRÃO: "campo maior que X" ou "campo > X"
    // Ex: "total maior que 1000", "icms > 100"
    for (const [nome, config] of Object.entries(campos)) {
      if (config.tipo !== 'numero') continue
      
      const regexMaior = new RegExp(`${nome}\\s+(?:maior que|acima de|>)\\s+(\\d+(?:\\.\\d+)?)`, 'i')
      const matchMaior = textoLower.match(regexMaior)
      
      if (matchMaior) {
        const valor = parseFloat(matchMaior[1])
        filtros[`${config.campo}Min`] = valor
        explicacoes.push(`${nome} > R$ ${valor.toLocaleString('pt-BR')}`)
      }
    }

    // 3. PADRÃO: "campo menor que X" ou "campo < X"
    for (const [nome, config] of Object.entries(campos)) {
      if (config.tipo !== 'numero') continue
      
      const regexMenor = new RegExp(`${nome}\\s+(?:menor que|abaixo de|<)\\s+(\\d+(?:\\.\\d+)?)`, 'i')
      const matchMenor = textoLower.match(regexMenor)
      
      if (matchMenor) {
        const valor = parseFloat(matchMenor[1])
        filtros[`${config.campo}Max`] = valor
        explicacoes.push(`${nome} < R$ ${valor.toLocaleString('pt-BR')}`)
      }
    }

    // 4. PADRÃO: "data maior que DD/MM/YYYY"
    const dataRegex = /data\s+(?:emissão|emissao)?\s*(?:maior que|após|>)\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i
    const dataMatch = texto.match(dataRegex)
    if (dataMatch) {
      const dia = dataMatch[1].padStart(2, '0')
      const mes = dataMatch[2].padStart(2, '0')
      const ano = dataMatch[3]
      filtros.dataInicio = `${ano}-${mes}-${dia}`
      explicacoes.push(`Data >= ${dia}/${mes}/${ano}`)
    }

    // 5. ATALHOS ESPECIAIS
    // "entrada" ou "saida"
    if (textoLower.includes('entrada') && !textoLower.includes('tipo doc')) {
      filtros.tipoOperacao = '0'
      explicacoes.push('Operação: Entrada')
    } else if (textoLower.includes('saida') || textoLower.includes('saída')) {
      filtros.tipoOperacao = '1'
      explicacoes.push('Operação: Saída')
    }

    // Status comuns
    if (textoLower.includes('cancelada')) {
      filtros.status = 'cancelada'
      explicacoes.push('Status: Cancelada')
    } else if (textoLower.includes('autorizada')) {
      filtros.status = 'autorizada'
      explicacoes.push('Status: Autorizada')
    }

    // 6. BUSCA LIVRE (se não encontrou nada específico)
    if (Object.keys(filtros).length === 0) {
      // Buscar em emitente/destinatário
      const palavras = textoLower.split(/\s+/).filter(p => p.length > 2)
      if (palavras.length > 0 && palavras.length <= 3) {
        filtros.emitente = palavras.join(' ')
        explicacoes.push(`Buscando "${filtros.emitente}" em razão social`)
      }
    }

    // 7. SE NÃO ENCONTROU NADA, MOSTRAR SUGESTÕES
    if (Object.keys(filtros).length === 0 && texto.trim().length > 0) {
      const sugestoesGeradas = gerarSugestoes(texto)
      setSugestoes(sugestoesGeradas)
      setMostrarSugestoes(true)
      setResultado('🤔 Não entendi sua busca. Veja as sugestões abaixo:')
      return
    }

    // Limpar sugestões se encontrou filtros
    setSugestoes([])
    setMostrarSugestoes(false)
    setResultado(explicacoes.join('. ') || 'Nenhum filtro aplicado')
    
    console.log('🔍 Filtros:', filtros)
    console.log('📝 Explicação:', explicacoes)
    
    if (Object.keys(filtros).length > 0) {
      onSearch(filtros)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      handleClear()
      return
    }
    processarQuery(query)
  }

  const handleClear = () => {
    setQuery('')
    setResultado('')
    onClear()
  }

  const exemplos = [
    'tipo doc = recebida',
    'total maior que 1000',
    'icms > 100',
    'serie 1',
    'status cancelada',
    'entrada',
    'saída',
    'petrobras',
    'areia',
    'sp',
  ]

  return (
    <div className="space-y-2">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Ex: "tipo doc = recebida", "total maior que 1000", "petrobras"'
            className="w-full pl-10 pr-24 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-revio-primary focus:border-transparent"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMostrarAjuda(!mostrarAjuda)}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
              title="Ver exemplos"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <button
              type="submit"
              className="px-4 py-1.5 bg-revio-primary text-white rounded-lg hover:bg-revio-primary-dark"
            >
              Buscar
            </button>
          </div>
        </div>
      </form>

      {resultado && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <strong>Filtros:</strong> {resultado}
        </div>
      )}

      {/* Sugestões Inteligentes (quando não encontra filtros) */}
      {mostrarSugestoes && sugestoes.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="text-2xl">🤔</div>
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-1">
                Não entendi sua busca
              </h3>
              <p className="text-sm text-amber-800">
                Talvez você esteja procurando por uma destas opções:
              </p>
            </div>
            <button
              onClick={() => setMostrarSugestoes(false)}
              className="text-amber-600 hover:text-amber-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {sugestoes.map((sug, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(sug.query)
                  processarQuery(sug.query)
                  setMostrarSugestoes(false)
                }}
                className="w-full text-left p-3 bg-white rounded-lg hover:bg-amber-100 transition-colors border-2 border-amber-200 hover:border-amber-400"
              >
                <p className="text-sm font-bold text-amber-900">{sug.texto}</p>
                <p className="text-xs text-amber-700 mb-1">{sug.descricao}</p>
                <p className="text-xs text-amber-600 font-mono bg-amber-50 px-2 py-1 rounded inline-block">
                  "{sug.query}"
                </p>
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-amber-200">
            <p className="text-xs text-amber-700">
              💡 <strong>Dica:</strong> Clique em uma sugestão para aplicar o filtro automaticamente
            </p>
          </div>
        </div>
      )}

      {/* Ajuda com Exemplos */}
      {mostrarAjuda && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-bold text-gray-900">Exemplos</h3>
            <button onClick={() => setMostrarAjuda(false)} className="text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {exemplos.map((ex, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(ex)
                  setMostrarAjuda(false)
                }}
                className="text-left p-2 bg-white rounded border hover:border-revio-primary text-sm"
              >
                "{ex}"
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
