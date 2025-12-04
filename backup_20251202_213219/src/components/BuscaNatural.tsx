import { useState } from 'react'
import { Search, Sparkles, HelpCircle, X, AlertCircle } from 'lucide-react'

interface BuscaNaturalProps {
  onSearch: (filtros: any) => void
  onClear: () => void
}

interface Sugestao {
  campo: string
  descricao: string
  exemplo: string
}

export default function BuscaNatural({ onSearch, onClear }: BuscaNaturalProps) {
  const [query, setQuery] = useState('')
  const [mostrarDicas, setMostrarDicas] = useState(false)
  const [resultado, setResultado] = useState<string>('')
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [mostrarSugestoes, setMostrarSugestoes] = useState(false)

  const exemplos = [
    // Operações
    { texto: 'operação entrada', descricao: 'Notas de entrada' },
    { texto: 'operação saída', descricao: 'Notas de saída' },
    { texto: 'entradas', descricao: 'Todas as notas de entrada' },
    { texto: 'saídas', descricao: 'Todas as notas de saída' },
    
    // Valores (com números e por extenso)
    { texto: 'notas acima de 10000', descricao: 'Valor maior que R$ 10.000' },
    { texto: 'acima de dez mil', descricao: 'Valor > R$ 10.000 (por extenso)' },
    { texto: 'abaixo de mil', descricao: 'Valor < R$ 1.000 (por extenso)' },
    { texto: 'mais de cinco mil', descricao: 'Valor > R$ 5.000 (por extenso)' },
    { texto: 'valor entre 1000 e 5000', descricao: 'Faixa de valores' },
    { texto: 'valor menor que 500', descricao: 'Valor abaixo de R$ 500' },
    { texto: 'menos de mil', descricao: 'Valor < R$ 1.000 (por extenso)' },
    
    // Impostos
    { texto: 'icms maior que 500', descricao: 'Valor de ICMS específico' },
    { texto: 'ipi acima de 100', descricao: 'Valor de IPI' },
    { texto: 'pis maior que 50', descricao: 'Valor de PIS' },
    { texto: 'cofins acima de 100', descricao: 'Valor de COFINS' },
    { texto: 'frete maior que 200', descricao: 'Valor do frete' },
    
    // Status
    { texto: 'canceladas', descricao: 'Status cancelada' },
    { texto: 'autorizadas', descricao: 'Status autorizada' },
    { texto: 'processando', descricao: 'Status processando/pendente' },
    { texto: 'denegadas', descricao: 'Status denegada' },
    { texto: 'rejeitadas', descricao: 'Status rejeitada' },
    { texto: 'protocolada sim', descricao: 'Notas protocoladas' },
    { texto: 'protocolada não', descricao: 'Notas não protocoladas' },
    
    // Empresas (MELHORADO!)
    { texto: 'areia', descricao: 'Busca "areia" em razão social' },
    { texto: 'petrobras', descricao: 'Busca "petrobras" em emitente/destinatário' },
    { texto: 'vale', descricao: 'Busca "vale" em razão social' },
    { texto: 'emitente contém petrobras', descricao: 'Razão social do emitente específica' },
    { texto: 'destinatário contém vale', descricao: 'Razão social do destinatário específica' },
    { texto: 'razão social areia', descricao: 'Busca "areia" na razão social' },
    
    // Localização
    { texto: 'sp', descricao: 'Estado de São Paulo' },
    { texto: 'são paulo', descricao: 'Município de São Paulo' },
    { texto: 'rio de janeiro', descricao: 'Município do Rio de Janeiro' },
    { texto: 'município campinas', descricao: 'Município específico' },
    
    // Identificação
    { texto: 'cnpj 12345678', descricao: 'CNPJ parcial ou completo' },
    { texto: 'nota 12345', descricao: 'Número da nota' },
    { texto: 'série 1', descricao: 'Série da nota' },
    { texto: 'modelo 55', descricao: 'Modelo da nota (55=NF-e)' },
    
    // Datas
    { texto: 'data emissão maior que 27/11/2025', descricao: 'Data >= 27/11/2025' },
    { texto: 'após 01/12/2025', descricao: 'Data >= 01/12/2025' },
    { texto: 'antes de 30/11/2025', descricao: 'Data <= 30/11/2025' },
    { texto: 'entre 01/11/2025 e 30/11/2025', descricao: 'Período específico' },
    { texto: 'janeiro 2024', descricao: 'Mês e ano específico' },
    { texto: 'últimos 7 dias', descricao: 'Período relativo' },
    { texto: 'últimos 30 dias', descricao: 'Último mês' },
    
    // Outros
    { texto: 'natureza venda', descricao: 'Natureza da operação' },
    { texto: 'manifestação confirmada', descricao: 'Status de manifestação' },
    
    // Combinações
    { texto: 'entrada acima de 5000', descricao: 'Entradas com valor > R$ 5.000' },
    { texto: 'saída petrobras', descricao: 'Saídas da Petrobras' },
    { texto: 'sp acima de 10000', descricao: 'SP com valor > R$ 10.000' },
  ]

  // Mapa de campos disponíveis para sugestões inteligentes
  const camposDisponiveis: Record<string, Sugestao> = {
    'operacao': { campo: 'tipoOperacao', descricao: 'Tipo de operação (entrada/saída)', exemplo: 'operação entrada' },
    'entrada': { campo: 'tipoOperacao', descricao: 'Notas de entrada', exemplo: 'operação entrada' },
    'saida': { campo: 'tipoOperacao', descricao: 'Notas de saída', exemplo: 'operação saída' },
    'natureza': { campo: 'naturezaOperacao', descricao: 'Natureza da operação', exemplo: 'natureza venda' },
    'protocolada': { campo: 'protocolada', descricao: 'Se a nota foi protocolada', exemplo: 'protocolada sim' },
    'protocolo': { campo: 'protocolada', descricao: 'Se a nota foi protocolada', exemplo: 'protocolada sim' },
    'manifestacao': { campo: 'statusManifestacao', descricao: 'Status da manifestação', exemplo: 'manifestação confirmada' },
    'icms': { campo: 'totais.valorICMS', descricao: 'Valor do ICMS', exemplo: 'icms maior que 500' },
    'ipi': { campo: 'totais.valorIPI', descricao: 'Valor do IPI', exemplo: 'ipi acima de 100' },
    'pis': { campo: 'totais.valorPIS', descricao: 'Valor do PIS', exemplo: 'pis maior que 50' },
    'cofins': { campo: 'totais.valorCOFINS', descricao: 'Valor do COFINS', exemplo: 'cofins acima de 100' },
    'frete': { campo: 'totais.valorFrete', descricao: 'Valor do frete', exemplo: 'frete maior que 200' },
    'seguro': { campo: 'totais.valorSeguro', descricao: 'Valor do seguro', exemplo: 'seguro acima de 50' },
    'desconto': { campo: 'totais.valorDesconto', descricao: 'Valor do desconto', exemplo: 'desconto maior que 100' },
    'serie': { campo: 'serie', descricao: 'Série da nota', exemplo: 'serie 1' },
    'modelo': { campo: 'modelo', descricao: 'Modelo da nota', exemplo: 'modelo 55' },
    'chave': { campo: 'chaveAcesso', descricao: 'Chave de acesso', exemplo: 'chave 35210...' },
    'ie': { campo: 'emitente.ie', descricao: 'Inscrição Estadual', exemplo: 'ie 123456789' },
    'municipio': { campo: 'emitente.municipio', descricao: 'Município', exemplo: 'municipio são paulo' },
    'endereco': { campo: 'emitente.endereco', descricao: 'Endereço', exemplo: 'endereco avenida paulista' },
  }

  // Função para converter números por extenso
  const converterExtenso = (texto: string): string => {
    const extensos: Record<string, string> = {
      'mil': '1000',
      'dois mil': '2000',
      'três mil': '3000',
      'quatro mil': '4000',
      'cinco mil': '5000',
      'dez mil': '10000',
      'vinte mil': '20000',
      'trinta mil': '30000',
      'cinquenta mil': '50000',
      'cem mil': '100000',
      'duzentos mil': '200000',
      'quinhentos mil': '500000',
      'milhão': '1000000',
      'um milhão': '1000000',
      'milhao': '1000000',
      'um milhao': '1000000',
    }
    
    let textoConvertido = texto
    Object.entries(extensos).forEach(([extenso, numero]) => {
      const regex = new RegExp(`\\b${extenso}\\b`, 'gi')
      textoConvertido = textoConvertido.replace(regex, numero)
    })
    
    return textoConvertido
  }

  const processarBusca = (texto: string) => {
    const filtros: any = {}
    let textoLower = texto.toLowerCase().trim()
    const textoOriginal = texto.trim() // Manter original para datas
    
    // Converter números por extenso ANTES de processar
    textoLower = converterExtenso(textoLower)
    
    let explicacao = ''
    const sugestoesEncontradas: Sugestao[] = []

    // Limpar filtros se vazio
    if (!textoLower) {
      onClear()
      setResultado('')
      setSugestoes([])
      setMostrarSugestoes(false)
      return
    }

    // 0. DATAS (PROCESSAR PRIMEIRO e REMOVER do texto!)
    // Formato: "data emissão maior que 27/11/2025" ou "após 27/11/2025"
    const dataRegex = /(?:data\s+emissão|data|emissão)?\s*(?:maior que|após|depois de|a partir de|>)\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i
    const dataMatch = textoOriginal.match(dataRegex)
    if (dataMatch) {
      const dia = dataMatch[1].padStart(2, '0')
      const mes = dataMatch[2].padStart(2, '0')
      const ano = dataMatch[3]
      filtros.dataInicio = `${ano}-${mes}-${dia}`
      explicacao += `Data Emissão >= ${dia}/${mes}/${ano}. `
      
      // REMOVER a data do texto para não processar como valor!
      textoLower = textoLower.replace(dataRegex, '')
    }

    // Formato: "data emissão menor que 27/11/2025" ou "antes de 27/11/2025"
    const dataAntesRegex = /(?:data\s+emissão|data|emissão)?\s*(?:menor que|antes de|até|<=?)\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i
    const dataAntesMatch = textoOriginal.match(dataAntesRegex)
    if (dataAntesMatch) {
      const dia = dataAntesMatch[1].padStart(2, '0')
      const mes = dataAntesMatch[2].padStart(2, '0')
      const ano = dataAntesMatch[3]
      filtros.dataFim = `${ano}-${mes}-${dia}`
      explicacao += `Data Emissão <= ${dia}/${mes}/${ano}. `
      
      // REMOVER a data do texto para não processar como valor!
      textoLower = textoLower.replace(dataAntesRegex, '')
    }

    // Formato: "entre 01/11/2025 e 30/11/2025"
    const dataEntreRegex = /entre\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\s+e\s+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i
    const dataEntreMatch = textoOriginal.match(dataEntreRegex)
    if (dataEntreMatch) {
      const diaIni = dataEntreMatch[1].padStart(2, '0')
      const mesIni = dataEntreMatch[2].padStart(2, '0')
      const anoIni = dataEntreMatch[3]
      const diaFim = dataEntreMatch[4].padStart(2, '0')
      const mesFim = dataEntreMatch[5].padStart(2, '0')
      const anoFim = dataEntreMatch[6]
      filtros.dataInicio = `${anoIni}-${mesIni}-${diaIni}`
      filtros.dataFim = `${anoFim}-${mesFim}-${diaFim}`
      explicacao += `Data entre ${diaIni}/${mesIni}/${anoIni} e ${diaFim}/${mesFim}/${anoFim}. `
      
      // REMOVER a data do texto para não processar como valor!
      textoLower = textoLower.replace(dataEntreRegex, '')
    }

    // 1. OPERAÇÃO (entrada/saída) - NOVO!
    if (textoLower.includes('entrada') || textoLower.includes('entradas')) {
      filtros.tipoOperacao = 'entrada'
      explicacao += 'Operação: Entrada. '
    } else if (textoLower.includes('saída') || textoLower.includes('saida') || textoLower.includes('saídas') || textoLower.includes('saidas')) {
      filtros.tipoOperacao = 'saída'
      explicacao += 'Operação: Saída. '
    }

    // 2. Natureza da Operação
    const natureza = textoLower.match(/natureza\s+(?:de\s+)?(?:operação\s+)?([a-záàâãéèêíïóôõöúçñ\s]+)/i)
    if (natureza) {
      filtros.naturezaOperacao = natureza[1].trim()
      explicacao += `Natureza: "${filtros.naturezaOperacao}". `
    }

    // 3. Protocolada (sim/não)
    if (textoLower.includes('protocolada sim') || textoLower.includes('protocoladas')) {
      filtros.protocolada = 'sim'
      explicacao += 'Protocolada: Sim. '
    } else if (textoLower.includes('protocolada não') || textoLower.includes('protocolada nao') || textoLower.includes('não protocolada')) {
      filtros.protocolada = 'não'
      explicacao += 'Protocolada: Não. '
    }

    // 4. Status Manifestação
    const manifestacao = textoLower.match(/manifestação\s+([a-záàâãéèêíïóôõöúçñ\s]+)/i)
    if (manifestacao) {
      filtros.statusManifestacao = manifestacao[1].trim()
      explicacao += `Manifestação: "${filtros.statusManifestacao}". `
    }

    // 5. Valores específicos (ICMS, IPI, PIS, COFINS, Frete, Seguro, Desconto)
    const impostos = [
      { nome: 'icms', campo: 'valorICMS' },
      { nome: 'ipi', campo: 'valorIPI' },
      { nome: 'pis', campo: 'valorPIS' },
      { nome: 'cofins', campo: 'valorCOFINS' },
      { nome: 'frete', campo: 'valorFrete' },
      { nome: 'seguro', campo: 'valorSeguro' },
      { nome: 'desconto', campo: 'valorDesconto' },
    ]

    impostos.forEach(imposto => {
      const regex = new RegExp(`${imposto.nome}\\s+(?:acima de|maior que|>)\\s+(\\d+(?:\\.\\d+)?)`, 'i')
      const match = textoLower.match(regex)
      if (match) {
        filtros[`${imposto.campo}Min`] = parseFloat(match[1])
        explicacao += `${imposto.nome.toUpperCase()} > R$ ${filtros[`${imposto.campo}Min`].toLocaleString('pt-BR')}. `
      }
    })

    // 6. Valores gerais (acima de, maior que, >, mais de, superior a)
    const valorAcima = textoLower.match(/(?:valor\s+total\s+)?(?:valor\s+)?(?:acima de|maior que|mais de|superior a|>)\s*(\d+(?:\.\d+)?)/i)
    if (valorAcima && !explicacao.includes('R$')) {
      filtros.valorMin = parseFloat(valorAcima[1])
      explicacao += `Valor Total > R$ ${filtros.valorMin.toLocaleString('pt-BR')}. `
    }

    // 7. Valores (abaixo de, menor que, <, menos de, inferior a)
    const valorAbaixo = textoLower.match(/(?:valor\s+total\s+)?(?:valor\s+)?(?:abaixo de|menor que|menos de|inferior a|<)\s*(\d+(?:\.\d+)?)/i)
    if (valorAbaixo && !explicacao.includes('R$')) {
      filtros.valorMax = parseFloat(valorAbaixo[1])
      explicacao += `Valor Total < R$ ${filtros.valorMax.toLocaleString('pt-BR')}. `
    }

    // 8. Valores (entre X e Y)
    const valorEntre = textoLower.match(/(?:valor\s+)?entre\s+(\d+(?:\.\d+)?)\s+e\s+(\d+(?:\.\d+)?)/i)
    if (valorEntre) {
      filtros.valorMin = parseFloat(valorEntre[1])
      filtros.valorMax = parseFloat(valorEntre[2])
      explicacao += `Valor entre R$ ${filtros.valorMin.toLocaleString('pt-BR')} e R$ ${filtros.valorMax.toLocaleString('pt-BR')}. `
    }

    // 9. Status
    if (textoLower.includes('cancelada') || textoLower.includes('cancelado')) {
      filtros.status = 'cancelada'
      explicacao += 'Status: Cancelada. '
    } else if (textoLower.includes('autorizada') || textoLower.includes('autorizado')) {
      filtros.status = 'autorizada'
      explicacao += 'Status: Autorizada. '
    } else if (textoLower.includes('processando') || textoLower.includes('pendente') || textoLower.includes('em processamento')) {
      filtros.status = 'processando'
      explicacao += 'Status: Processando. '
    } else if (textoLower.includes('denegada') || textoLower.includes('denegado')) {
      filtros.status = 'denegada'
      explicacao += 'Status: Denegada. '
    } else if (textoLower.includes('rejeitada') || textoLower.includes('rejeitado')) {
      filtros.status = 'rejeitada'
      explicacao += 'Status: Rejeitada. '
    }

    // 10. Série e Modelo
    const serie = textoLower.match(/série\s+(\d+)/i)
    if (serie) {
      filtros.serie = serie[1]
      explicacao += `Série: ${serie[1]}. `
    }

    const modelo = textoLower.match(/modelo\s+(\d+)/i)
    if (modelo) {
      filtros.modelo = modelo[1]
      explicacao += `Modelo: ${modelo[1]}. `
    }

    // 11. CNPJ (qualquer sequência de 8+ dígitos)
    const cnpj = texto.match(/\d{8,}/g)
    if (cnpj) {
      filtros.cnpj = cnpj[0]
      explicacao += `CNPJ contém: ${cnpj[0]}. `
    }

    // 12. Número da nota
    const numeroNota = textoLower.match(/(?:nfe|nota|número|numero)\s+(\d+)/i)
    if (numeroNota) {
      filtros.numero = numeroNota[1]
      explicacao += `Número da nota: ${numeroNota[1]}. `
    }

    // 13. Emitente/Destinatário (contém texto) - MELHORADO!
    const emitente = textoLower.match(/(?:emitente|empresa|fornecedor|razão social)(?:\s+contém|\s+com|\s+contendo)?\s+([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s+e\s+|\s+ou\s+|$)/i)
    if (emitente) {
      filtros.emitente = emitente[1].trim()
      explicacao += `Emitente contém: "${filtros.emitente}". `
    }
    // Busca simples por palavra-chave (ex: "areia", "petrobras")
    else if (!textoLower.match(/\b(entrada|saida|valor|icms|ipi|serie|modelo|cnpj|numero|uf|municipio|dias|mes|ano)\b/i)) {
      // Se não tem palavras-chave conhecidas, assume que é busca por nome
      const palavras = textoLower.split(/\s+/).filter(p => p.length > 3)
      if (palavras.length > 0 && palavras.length <= 3) {
        filtros.emitente = palavras.join(' ')
        explicacao += `Buscando "${filtros.emitente}" em emitente/destinatário. `
      }
    }

    const destinatario = textoLower.match(/(?:destinatário|destinatario|cliente|comprador)(?:\s+contém|\s+com|\s+contendo)?\s+([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s+e\s+|\s+ou\s+|$)/i)
    if (destinatario) {
      filtros.destinatario = destinatario[1].trim()
      explicacao += `Destinatário contém: "${filtros.destinatario}". `
    }

    // 14. Estado (UF)
    const estados = ['ac', 'al', 'ap', 'am', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mt', 'ms', 'mg', 'pa', 'pb', 'pr', 'pe', 'pi', 'rj', 'rn', 'rs', 'ro', 'rr', 'sc', 'sp', 'se', 'to']
    const uf = estados.find(e => textoLower.includes(` ${e} `) || textoLower.startsWith(`${e} `) || textoLower.endsWith(` ${e}`))
    if (uf) {
      filtros.uf = uf.toUpperCase()
      explicacao += `Estado: ${filtros.uf}. `
    }

    // 15. Município
    const municipioMatch = textoLower.match(/município\s+([a-záàâãéèêíïóôõöúçñ\s]+)/i)
    if (municipioMatch) {
      filtros.municipio = municipioMatch[1].trim()
      explicacao += `Município: ${filtros.municipio}. `
    } else if (textoLower.includes('são paulo') || textoLower.includes('sao paulo')) {
      filtros.municipio = 'São Paulo'
      explicacao += 'Município: São Paulo. '
    } else if (textoLower.includes('rio de janeiro')) {
      filtros.municipio = 'Rio de Janeiro'
      explicacao += 'Município: Rio de Janeiro. '
    }

    // 16. Período (últimos X dias)
    const ultimosDias = textoLower.match(/últimos?\s+(\d+)\s+dias?/i)
    if (ultimosDias) {
      const dias = parseInt(ultimosDias[1])
      const fim = new Date()
      const inicio = new Date()
      inicio.setDate(inicio.getDate() - dias)
      filtros.dataInicio = inicio.toISOString().split('T')[0]
      filtros.dataFim = fim.toISOString().split('T')[0]
      explicacao += `Últimos ${dias} dias. `
    }

    // 17. Mês e ano (janeiro 2024, jan/2024, 01/2024)
    const mesAno = textoLower.match(/(janeiro|fevereiro|março|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro|jan|fev|mar|abr|mai|jun|jul|ago|set|out|nov|dez)\s*(?:de)?\s*(\d{4})/i)
    if (mesAno) {
      const meses: Record<string, number> = {
        'janeiro': 0, 'jan': 0, 'fevereiro': 1, 'fev': 1, 'março': 2, 'marco': 2, 'mar': 2,
        'abril': 3, 'abr': 3, 'maio': 4, 'mai': 4, 'junho': 5, 'jun': 5,
        'julho': 6, 'jul': 6, 'agosto': 7, 'ago': 7, 'setembro': 8, 'set': 8,
        'outubro': 9, 'out': 9, 'novembro': 10, 'nov': 10, 'dezembro': 11, 'dez': 11
      }
      const mes = meses[mesAno[1].toLowerCase()]
      const ano = parseInt(mesAno[2])
      const inicio = new Date(ano, mes, 1)
      const fim = new Date(ano, mes + 1, 0)
      filtros.dataInicio = inicio.toISOString().split('T')[0]
      filtros.dataFim = fim.toISOString().split('T')[0]
      explicacao += `${mesAno[1]} de ${ano}. `
    }

    // 18. Sistema de Sugestões Inteligentes
    if (Object.keys(filtros).length === 0 && textoLower.length > 2) {
      // Buscar campos similares
      Object.entries(camposDisponiveis).forEach(([palavra, sugestao]) => {
        if (textoLower.includes(palavra)) {
          sugestoesEncontradas.push(sugestao)
        }
      })

      if (sugestoesEncontradas.length > 0) {
        setSugestoes(sugestoesEncontradas)
        setMostrarSugestoes(true)
        explicacao = `🤔 Não encontrei um filtro específico. Você quis dizer algum destes campos?`
      } else {
        // Busca genérica em todos os campos
        filtros.busca = texto
        explicacao = `Buscando "${texto}" em todos os campos. `
      }
    } else {
      setSugestoes([])
      setMostrarSugestoes(false)
    }

    setResultado(explicacao || 'Nenhum filtro identificado.')
    
    console.log('🔍 BuscaNatural - Filtros processados:', filtros)
    console.log('📝 BuscaNatural - Explicação:', explicacao)
    console.log('🎯 BuscaNatural - Total de filtros:', Object.keys(filtros).length)
    
    // Só aplica filtros se encontrou algo específico
    if (Object.keys(filtros).length > 0) {
      console.log('✅ BuscaNatural - Chamando onSearch com:', filtros)
      onSearch(filtros)
    } else {
      console.log('⚠️ BuscaNatural - Nenhum filtro encontrado, não chamando onSearch')
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    processarBusca(query)
  }

  const handleClear = () => {
    setQuery('')
    setResultado('')
    onClear()
  }

  return (
    <div className="space-y-3">
      {/* Campo de Busca */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Sparkles className="h-5 w-5 text-purple-500" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Pergunte em linguagem natural: "notas acima de 10000 canceladas"'
            className="w-full pl-12 pr-24 py-3 border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-base"
          />
          <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-2">
            {query && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Limpar"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => setMostrarDicas(!mostrarDicas)}
              className="p-2 text-purple-500 hover:text-purple-700 rounded-lg hover:bg-purple-50"
              title="Ver exemplos"
            >
              <HelpCircle className="h-5 w-5" />
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 font-semibold flex items-center gap-2"
            >
              <Search className="h-4 w-4" />
              Buscar
            </button>
          </div>
        </div>
      </form>

      {/* Resultado da Interpretação */}
      {resultado && (
        <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
          <p className="text-sm text-purple-800">
            <strong>🔍 Buscando:</strong> {resultado}
          </p>
        </div>
      )}

      {/* Sugestões Inteligentes */}
      {mostrarSugestoes && sugestoes.length > 0 && (
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 rounded-xl p-4">
          <div className="flex items-start gap-3 mb-3">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-bold text-amber-900 mb-2">
                Você quis dizer algum destes campos?
              </h3>
              <p className="text-sm text-amber-800 mb-3">
                Não encontrei um filtro específico para sua busca. Talvez você esteja procurando por:
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {sugestoes.map((sug, i) => (
              <button
                key={i}
                onClick={() => {
                  setQuery(sug.exemplo)
                  processarBusca(sug.exemplo)
                  setMostrarSugestoes(false)
                }}
                className="w-full text-left p-3 bg-white rounded-lg hover:bg-amber-100 transition-colors border-2 border-amber-200 hover:border-amber-400"
              >
                <p className="text-sm font-bold text-amber-900">{sug.campo}</p>
                <p className="text-xs text-amber-700 mb-1">{sug.descricao}</p>
                <p className="text-xs text-amber-600 font-mono bg-amber-50 px-2 py-1 rounded">
                  Exemplo: "{sug.exemplo}"
                </p>
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-amber-200">
            <p className="text-xs text-amber-700">
              💡 <strong>Dica:</strong> Clique em uma sugestão para testar ou reformule sua busca com mais detalhes.
            </p>
          </div>
        </div>
      )}

      {/* Dicas e Exemplos */}
      {mostrarDicas && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-4">
          <h3 className="font-bold text-purple-900 mb-3 flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Como usar a Busca Inteligente
          </h3>
          
          <p className="text-sm text-purple-800 mb-3">
            Digite sua pergunta em <strong>linguagem natural</strong> e deixe a IA encontrar o que você precisa!
          </p>

          <div className="space-y-3">
            <p className="text-xs font-bold text-purple-900 uppercase">Campos Suportados:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-2 rounded-lg border border-purple-200">
                <p className="font-bold text-purple-900 mb-1">📊 Operação & Status</p>
                <ul className="space-y-0.5 text-purple-700">
                  <li>• operação entrada/saída</li>
                  <li>• natureza venda/compra</li>
                  <li>• canceladas/autorizadas</li>
                  <li>• protocolada sim/não</li>
                  <li>• manifestação confirmada</li>
                </ul>
              </div>
              <div className="bg-white p-2 rounded-lg border border-purple-200">
                <p className="font-bold text-purple-900 mb-1">💰 Valores</p>
                <ul className="space-y-0.5 text-purple-700">
                  <li>• acima de / maior que</li>
                  <li>• abaixo de / menor que</li>
                  <li>• entre X e Y</li>
                  <li>• icms/ipi/pis/cofins</li>
                  <li>• frete/seguro/desconto</li>
                </ul>
              </div>
              <div className="bg-white p-2 rounded-lg border border-purple-200">
                <p className="font-bold text-purple-900 mb-1">🏢 Partes & Local</p>
                <ul className="space-y-0.5 text-purple-700">
                  <li>• emitente/destinatário</li>
                  <li>• cnpj / ie</li>
                  <li>• município / uf</li>
                  <li>• série / modelo</li>
                  <li>• número da nota</li>
                </ul>
              </div>
            </div>

            <p className="text-xs font-bold text-purple-900 uppercase mt-3">✨ Exemplos Clicáveis (Clique para testar!):</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {exemplos.map((ex, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setQuery(ex.texto)
                    processarBusca(ex.texto)
                    setMostrarDicas(false)
                  }}
                  className="text-left p-2 bg-white rounded-lg hover:bg-purple-100 transition-colors border border-purple-200 hover:shadow-md"
                >
                  <p className="text-sm font-semibold text-purple-700">"{ex.texto}"</p>
                  <p className="text-xs text-purple-600">{ex.descricao}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-purple-200 space-y-2">
            <p className="text-xs font-bold text-purple-900 uppercase">🎯 Dicas Especiais:</p>
            
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-2">
              <p className="text-xs font-bold text-yellow-900 mb-1">🏢 Busca por Razão Social:</p>
              <ul className="space-y-1 text-xs text-yellow-800">
                <li>• Digite apenas o nome: <strong>"areia"</strong>, <strong>"petrobras"</strong>, <strong>"vale"</strong></li>
                <li>• Busca automática em emitente E destinatário</li>
                <li>• Funciona com palavras parciais</li>
                <li>• Exemplo: <strong>"areia"</strong> encontra "Areia Branca Ltda", "Comercial de Areia", etc</li>
              </ul>
            </div>
            
            <div className="bg-green-50 border border-green-300 rounded-lg p-2">
              <p className="text-xs font-bold text-green-900 mb-1">💰 Valores por Extenso (NOVO!):</p>
              <ul className="space-y-1 text-xs text-green-800">
                <li>• Use números: <strong>&quot;acima de 1000&quot;</strong> ou <strong>&quot;abaixo de 5000&quot;</strong></li>
                <li>• Use por extenso: <strong>&quot;acima de mil&quot;</strong>, <strong>&quot;abaixo de cinco mil&quot;</strong></li>
                <li>• Suportado: mil, dez mil, cem mil, milhão</li>
                <li>• Exemplo: <strong>&quot;abaixo de mil&quot;</strong> = Valor &lt; R$ 1.000</li>
                <li>• Variações: &quot;mais de&quot;, &quot;menos de&quot;, &quot;superior a&quot;, &quot;inferior a&quot;</li>
              </ul>
            </div>
            
            <p className="text-xs text-purple-700">
              💡 <strong>Combine filtros:</strong> &quot;operação entrada acima de 5000 canceladas sp janeiro 2024&quot;
            </p>
            <p className="text-xs text-purple-700">
              🔍 <strong>Busca genérica:</strong> Digite qualquer texto para buscar em todos os campos
            </p>
            <p className="text-xs text-purple-700">
              ❓ <strong>Não encontrou?</strong> O sistema sugere campos similares automaticamente
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
