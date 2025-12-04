import { useState } from 'react'
import { Search, X, Sparkles, HelpCircle } from 'lucide-react'
import { parseFieldQuery } from '../config/gridColumns'

interface BuscaNaturalSimplesProps {
  onSearch: (filtros: any) => void
  onClear: () => void
}

export default function BuscaNaturalSimples({ onSearch, onClear }: BuscaNaturalSimplesProps) {
  const [query, setQuery] = useState('')
  const [resultado, setResultado] = useState('')
  const [mostrarAjuda, setMostrarAjuda] = useState(false)
  const [usandoLLM] = useState(true) // ✅ HABILITADO por padrão - IA interpreta tudo
  const [carregando, setCarregando] = useState(false)

  // Mapa de números por extenso
  const numerosExtenso: Record<string, number> = {
    'mil': 1000,
    'dois mil': 2000,
    'três mil': 3000,
    'quatro mil': 4000,
    'cinco mil': 5000,
    'seis mil': 6000,
    'sete mil': 7000,
    'oito mil': 8000,
    'nove mil': 9000,
    'dez mil': 10000,
    'vinte mil': 20000,
    'trinta mil': 30000,
    'quarenta mil': 40000,
    'cinquenta mil': 50000,
    'cem mil': 100000,
    'duzentos mil': 200000,
    'trezentos mil': 300000,
    'meio milhão': 500000,
    'milhão': 1000000,
    'um milhão': 1000000
  }

  const processarQueryComLLM = async (texto: string): Promise<{ filtros: any, explicacao: string }> => {
    const apiKey = import.meta.env.VITE_API_GOOGLE_GEMINI
    
    if (!apiKey) {
      console.warn('⚠️ Google Gemini API key não configurada, usando processamento local')
      return processarQuery(texto)
    }

    // ✅ BUSCA SIMPLES: Se é só uma palavra/nome, não usar LLM
    const textoLimpo = texto.trim().toLowerCase()
    const palavrasSimples = textoLimpo.split(/\s+/)
    
    // Se tem 1-2 palavras E não tem palavras de contexto, usar busca simples
    const palavrasContexto = ['razão', 'razao', 'social', 'emitente', 'destinatário', 'destinatario', 
                               'maior', 'menor', 'acima', 'abaixo', 'entre', 'valor', 'total',
                               'entrada', 'saída', 'saida', 'operação', 'operacao',
                               'cancelada', 'autorizada', 'status', 'protocolada']
    
    const temContexto = palavrasSimples.some(p => palavrasContexto.includes(p))
    
    if (palavrasSimples.length <= 2 && !temContexto) {
      console.log('✅ Busca simples detectada:', texto)
      return processarQuery(texto)
    }

    try {
      setCarregando(true)
      console.log('🤖 Processando com LLM (busca complexa):', texto)
      
      const prompt = `Você é um assistente especializado que converte consultas em linguagem natural para filtros JSON de documentos fiscais.

CAMPOS DISPONÍVEIS NA GRID (TODOS):

IDENTIFICAÇÃO:
- numero: Número da nota (texto)
- serie: Série (texto)
- modelo: Modelo (texto)
- chaveAcesso: Chave de acesso (texto)

DATAS E STATUS:
- dataEmissao: Data de emissão (formato: YYYY-MM-DD)
- status: Status ("autorizada", "cancelada", "processando", "denegada", "rejeitada")
- protocolada: Se foi protocolada ("Sim", "Não")

TIPO E OPERAÇÃO:
- tipo: Tipo do documento (valores: "recebida", "emitida", "nfe", "cte", "cfe")
- tipoOperacao: Tipo de operação ("0" = Entrada, "1" = Saída)
- naturezaOperacao: Natureza da operação (texto)

VALORES:
- valorTotal: Valor total do documento (número)
- totais.baseCalculo: Base de cálculo (número)
- totais.valorICMS: Valor do ICMS (número)
- totais.valorIPI: Valor do IPI (número)
- totais.valorPIS: Valor do PIS (número)
- totais.valorCOFINS: Valor do COFINS (número)
- totais.valorFrete: Valor do frete (número)
- totais.valorSeguro: Valor do seguro (número)
- totais.valorDesconto: Valor do desconto (número)
- totais.valorOutros: Outros valores (número)

EMITENTE:
- emitente.cnpj: CNPJ do emitente (texto)
- emitente.razaoSocial: Razão social do emitente (texto)
- emitente.nomeFantasia: Nome fantasia do emitente (texto)
- emitente.ie: Inscrição estadual do emitente (texto)
- emitente.municipio: Município do emitente (texto)
- emitente.uf: UF do emitente (texto - sigla estado)

DESTINATÁRIO:
- destinatario.cnpj: CNPJ do destinatário (texto)
- destinatario.razaoSocial: Razão social do destinatário (texto)
- destinatario.nome: Nome do destinatário (texto)
- destinatario.municipio: Município do destinatário (texto)
- destinatario.uf: UF do destinatário (texto - sigla estado)

IMPORTANTE SOBRE BUSCA DE EMPRESAS:
- Para "razão social emitente X" ou "emitente X": use {"emitente":"X"}
- Para "razão social destinatário X" ou "destinatário X": use {"destinatario":"X"}
- Para busca simples "X" (nome de empresa): use {"emitente":"X"}

CONSULTA DO USUÁRIO:
"${texto}"

INSTRUÇÕES IMPORTANTES:
1. Analise a consulta e identifique TODOS os filtros mencionados
2. Para valores numéricos com "maior que", "acima de", ">": use "valorMin", "icmsMin", "ipiMin", etc.
3. Para valores numéricos com "menor que", "abaixo de", "<": use "valorMax", "icmsMax", "ipiMax", etc.
4. Para datas com "maior que", "após", "a partir de": use "dataInicio" (formato YYYY-MM-DD)
5. Para datas com "menor que", "antes de", "até": use "dataFim" (formato YYYY-MM-DD)
6. Para "tipo doc = X": use {"tipoDoc": "X"}
7. Para "notas de entrada": use {"tipoOperacao": "0"}
8. Para "notas de saída": use {"tipoOperacao": "1"}
9. Para busca de texto em emitente/destinatário: use "emitente" ou "destinatario"
10. Para UF: use sigla maiúscula (SP, RJ, MG, etc.)
11. **IMPORTANTE:** Quando o usuário menciona "razão social emitente X" ou "emitente X", extraia APENAS o nome X, ignorando as palavras de contexto
12. **IMPORTANTE:** Se a consulta tem palavras como "razão social", "emitente", "destinatário", extraia apenas o VALOR após essas palavras
13. Retorne APENAS um objeto JSON válido, sem explicações ou texto adicional

EXEMPLOS:

Consulta: "tipo doc = recebida"
Resposta: {"tipoDoc":"recebida"}

Consulta: "total maior que 1000"
Resposta: {"valorMin":1000}

Consulta: "icms maior que 100"
Resposta: {"icmsMin":100}

Consulta: "notas de entrada valor maior que 5000"
Resposta: {"tipoOperacao":"0","valorMin":5000}

Consulta: "data emissao maior que 27/11/2025"
Resposta: {"dataInicio":"2025-11-27"}

Consulta: "petrobras"
Resposta: {"emitente":"petrobras"}

Consulta: "razão social emitente CIANO"
Resposta: {"emitente":"CIANO"}

Consulta: "razao social emitente CIANO ALIMENTOS SUSTENTAVEIS LTDA"
Resposta: {"emitente":"CIANO ALIMENTOS SUSTENTAVEIS LTDA"}

Consulta: "emitente vale"
Resposta: {"emitente":"vale"}

Consulta: "destinatário petrobras"
Resposta: {"destinatario":"petrobras"}

Consulta: "qual a razão social do emitente ciano"
Resposta: {"emitente":"ciano"}

Consulta: "me mostre notas do emitente infoco"
Resposta: {"emitente":"infoco"}

Consulta: "buscar razão social emitente areia"
Resposta: {"emitente":"areia"}

Consulta: "uf = sp"
Resposta: {"uf":"SP"}

Consulta: "serie = 1"
Resposta: {"serie":"1"}

Consulta: "frete maior que 50"
Resposta: {"freteMin":50}

Consulta: "pis maior que 20 cofins maior que 30"
Resposta: {"pisMin":20,"cofinsMin":30}

AGORA PROCESSE A CONSULTA E RETORNE APENAS O JSON:`

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 500,
            }
          })
        }
      )

      if (!response.ok) {
        throw new Error('Erro na API Gemini')
      }

      const data = await response.json()
      const resposta = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
      
      console.log('📥 Resposta da IA:', resposta)
      
      // Extrair JSON da resposta
      const jsonMatch = resposta.match(/\{[^}]+\}/)
      console.log('🔍 JSON extraído:', jsonMatch ? jsonMatch[0] : 'NENHUM')
      
      if (jsonMatch) {
        const filtros = JSON.parse(jsonMatch[0])
        console.log('🤖 Filtros interpretados pela LLM:', filtros)
        
        // Gerar explicação para TODOS os campos
        const explicacoes = []
        
        // Tipo e Operação
        if (filtros.tipoDoc) explicacoes.push(`Tipo Doc: "${filtros.tipoDoc}"`)
        if (filtros.tipoOperacao) explicacoes.push(`Operação: ${filtros.tipoOperacao === '0' ? 'Entrada' : 'Saída'}`)
        if (filtros.status) explicacoes.push(`Status: ${filtros.status}`)
        if (filtros.protocolada) explicacoes.push(`Protocolada: ${filtros.protocolada}`)
        
        // Valores
        if (filtros.valorMin) explicacoes.push(`Valor > R$ ${filtros.valorMin.toLocaleString('pt-BR')}`)
        if (filtros.valorMax) explicacoes.push(`Valor < R$ ${filtros.valorMax.toLocaleString('pt-BR')}`)
        
        // Impostos
        if (filtros.icmsMin) explicacoes.push(`ICMS > R$ ${filtros.icmsMin.toLocaleString('pt-BR')}`)
        if (filtros.icmsMax) explicacoes.push(`ICMS < R$ ${filtros.icmsMax.toLocaleString('pt-BR')}`)
        if (filtros.ipiMin) explicacoes.push(`IPI > R$ ${filtros.ipiMin.toLocaleString('pt-BR')}`)
        if (filtros.ipiMax) explicacoes.push(`IPI < R$ ${filtros.ipiMax.toLocaleString('pt-BR')}`)
        if (filtros.pisMin) explicacoes.push(`PIS > R$ ${filtros.pisMin.toLocaleString('pt-BR')}`)
        if (filtros.pisMax) explicacoes.push(`PIS < R$ ${filtros.pisMax.toLocaleString('pt-BR')}`)
        if (filtros.cofinsMin) explicacoes.push(`COFINS > R$ ${filtros.cofinsMin.toLocaleString('pt-BR')}`)
        if (filtros.cofinsMax) explicacoes.push(`COFINS < R$ ${filtros.cofinsMax.toLocaleString('pt-BR')}`)
        if (filtros.freteMin) explicacoes.push(`Frete > R$ ${filtros.freteMin.toLocaleString('pt-BR')}`)
        if (filtros.freteMax) explicacoes.push(`Frete < R$ ${filtros.freteMax.toLocaleString('pt-BR')}`)
        
        // Identificação
        if (filtros.numero) explicacoes.push(`Número: ${filtros.numero}`)
        if (filtros.serie) explicacoes.push(`Série: ${filtros.serie}`)
        if (filtros.modelo) explicacoes.push(`Modelo: ${filtros.modelo}`)
        
        // Emitente/Destinatário
        if (filtros.emitente) explicacoes.push(`Emitente: "${filtros.emitente}"`)
        if (filtros.destinatario) explicacoes.push(`Destinatário: "${filtros.destinatario}"`)
        if (filtros.uf) explicacoes.push(`UF: ${filtros.uf}`)
        if (filtros.municipio) explicacoes.push(`Município: ${filtros.municipio}`)
        
        // Datas
        if (filtros.dataInicio) explicacoes.push(`Data >= ${filtros.dataInicio}`)
        if (filtros.dataFim) explicacoes.push(`Data <= ${filtros.dataFim}`)
        
        return {
          filtros,
          explicacao: explicacoes.join('. ') + '.'
        }
      }
      
      console.error('❌ Não foi possível extrair JSON da resposta da IA')
      console.log('🔄 Usando processamento local como fallback')
      return processarQuery(texto)
      
    } catch (error: any) {
      console.error('❌ Erro ao processar com LLM:', error.message)
      console.log('🔄 Usando processamento local como fallback')
      return processarQuery(texto)
    } finally {
      setCarregando(false)
    }
  }

  const processarQuery = (texto: string) => {
    const filtros: any = {}
    let explicacao = ''
    const textoLower = texto.toLowerCase()
    const textoOriginal = texto.trim()

    // 0. TENTAR PARSER INTELIGENTE PRIMEIRO (campo = valor)
    const fieldQuery = parseFieldQuery(textoOriginal)
    if (fieldQuery) {
      console.log('🎯 Campo identificado:', fieldQuery.column.label, '→', fieldQuery.field, '=', fieldQuery.value)
      
      // Mapear para o filtro correto
      if (fieldQuery.field === 'tipo') {
        filtros.tipoDoc = fieldQuery.value.toLowerCase()
        explicacao += `${fieldQuery.column.label}: "${fieldQuery.value}". `
      } else if (fieldQuery.field === 'tipoOperacao') {
        const valor = fieldQuery.value.toLowerCase()
        if (valor === 'entrada' || valor === '0') {
          filtros.tipoOperacao = '0'
          explicacao += 'Operação: Entrada. '
        } else if (valor === 'saida' || valor === 'saída' || valor === '1') {
          filtros.tipoOperacao = '1'
          explicacao += 'Operação: Saída. '
        }
      } else if (fieldQuery.field === 'status') {
        filtros.status = fieldQuery.value.toLowerCase()
        explicacao += `Status: ${fieldQuery.value}. `
      } else if (fieldQuery.field === 'protocolada') {
        filtros.protocolada = fieldQuery.value
        explicacao += `Protocolada: ${fieldQuery.value}. `
      } else if (fieldQuery.field.includes('emitente.razaoSocial')) {
        filtros.emitente = fieldQuery.value
        explicacao += `Emitente: "${fieldQuery.value}". `
      } else if (fieldQuery.field.includes('destinatario.razaoSocial')) {
        filtros.destinatario = fieldQuery.value
        explicacao += `Destinatário: "${fieldQuery.value}". `
      } else if (fieldQuery.field === 'numero') {
        filtros.numero = fieldQuery.value
        explicacao += `Número: ${fieldQuery.value}. `
      } else if (fieldQuery.field === 'serie') {
        filtros.serie = fieldQuery.value
        explicacao += `Série: ${fieldQuery.value}. `
      } else if (fieldQuery.field === 'modelo') {
        filtros.modelo = fieldQuery.value
        explicacao += `Modelo: ${fieldQuery.value}. `
      }
      
      // Se encontrou filtro, retornar
      if (Object.keys(filtros).length > 0) {
        return { filtros, explicacao }
      }
    }

    // 1. DATAS (PROCESSAR PRIMEIRO e REMOVER do texto!)
    // Formato: "data emissão maior que 27/11/2025"
    const dataRegex = /(?:data\s+emissão|data|emissão)?\s*(?:maior que|após|depois de|a partir de|>)\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i
    const dataMatch = textoOriginal.match(dataRegex)
    let textoSemData = textoLower
    if (dataMatch) {
      const dia = dataMatch[1].padStart(2, '0')
      const mes = dataMatch[2].padStart(2, '0')
      const ano = dataMatch[3]
      filtros.dataInicio = `${ano}-${mes}-${dia}`
      explicacao += `Data >= ${dia}/${mes}/${ano}. `
      
      // REMOVER a data do texto!
      textoSemData = textoSemData.replace(dataRegex, '')
    }

    const dataAntesRegex = /(?:data\s+emissão|data|emissão)?\s*(?:menor que|antes de|até|<=?)\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i
    const dataAntesMatch = textoOriginal.match(dataAntesRegex)
    if (dataAntesMatch) {
      const dia = dataAntesMatch[1].padStart(2, '0')
      const mes = dataAntesMatch[2].padStart(2, '0')
      const ano = dataAntesMatch[3]
      filtros.dataFim = `${ano}-${mes}-${dia}`
      explicacao += `Data <= ${dia}/${mes}/${ano}. `
      
      // REMOVER a data do texto!
      textoSemData = textoSemData.replace(dataAntesRegex, '')
    }

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
      
      // REMOVER a data do texto!
      textoSemData = textoSemData.replace(dataEntreRegex, '')
    }

    // 1. Converter números por extenso (usar texto SEM data!)
    let textoProcessado = textoSemData
    Object.entries(numerosExtenso).forEach(([extenso, numero]) => {
      const regex = new RegExp(extenso, 'gi')
      textoProcessado = textoProcessado.replace(regex, numero.toString())
    })

    // 2. TIPO DOC (campo específico da grid)
    // Detectar "tipo doc = recebida" ou "tipo doc = emitida" etc.
    const tipoDocMatch = textoLower.match(/tipo\s+doc(?:umento)?\s*=?\s*([a-záàâãéèêíïóôõöúçñ]+)/i)
    
    if (tipoDocMatch) {
      filtros.tipoDoc = tipoDocMatch[1].trim()
      explicacao += `Tipo Doc: "${filtros.tipoDoc}". `
    }
    
    // 3. Tipo de operação (entrada/saída)
    // Detectar apenas em contextos específicos
    const entradaMatch = textoProcessado.match(/\b(notas?\s+de\s+entrada|operação\s+entrada|entrada\s+de\s+mercadoria)\b/i)
    const saidaMatch = textoProcessado.match(/\b(notas?\s+de\s+saída|notas?\s+de\s+saida|operação\s+saída|operação\s+saida|saída\s+de\s+mercadoria|saida\s+de\s+mercadoria)\b/i)
    
    if (entradaMatch) {
      filtros.tipoOperacao = '0'
      explicacao += 'Operação: Entrada. '
    } else if (saidaMatch) {
      filtros.tipoOperacao = '1'
      explicacao += 'Operação: Saída. '
    }

    // 4. Valores - SUPER SIMPLIFICADO
    // Se tem número + palavra indicando comparação
    const numero = textoProcessado.match(/(\d+(?:\.\d+)?)/i)
    
    if (numero) {
      const valor = parseFloat(numero[1])
      
      // Maior/Acima
      if (textoProcessado.match(/(?:maior|acima|superior|>)/i)) {
        filtros.valorMin = valor
        explicacao += `Valor > R$ ${valor.toLocaleString('pt-BR')}. `
      }
      // Menor/Abaixo
      else if (textoProcessado.match(/(?:menor|abaixo|inferior|<)/i)) {
        filtros.valorMax = valor
        explicacao += `Valor < R$ ${valor.toLocaleString('pt-BR')}. `
      }
      // Entre (pega dois números)
      else if (textoProcessado.match(/entre/i)) {
        const numeros = textoProcessado.match(/(\d+(?:\.\d+)?).*?(\d+(?:\.\d+)?)/i)
        if (numeros && numeros.length >= 3) {
          filtros.valorMin = parseFloat(numeros[1])
          filtros.valorMax = parseFloat(numeros[2])
          explicacao += `Valor entre R$ ${filtros.valorMin.toLocaleString('pt-BR')} e R$ ${filtros.valorMax.toLocaleString('pt-BR')}. `
        }
      }
    }

    // 7. Status
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

    // 8. Protocolada
    if (textoLower.includes('protocolada sim') || textoLower.includes('protocoladas')) {
      filtros.protocolada = 'Sim'
      explicacao += 'Protocolada: Sim. '
    } else if (textoLower.includes('protocolada não') || textoLower.includes('protocolada nao') || textoLower.includes('não protocolada')) {
      filtros.protocolada = 'Não'
      explicacao += 'Protocolada: Não. '
    }

    // 9. Impostos
    const impostos = [
      { nome: 'icms', campo: 'icms' },
      { nome: 'ipi', campo: 'ipi' },
      { nome: 'pis', campo: 'pis' },
      { nome: 'cofins', campo: 'cofins' },
      { nome: 'frete', campo: 'frete' }
    ]

    impostos.forEach(imposto => {
      const regex = new RegExp(`${imposto.nome}\\s+(?:acima de|maior que|>)\\s+(\\d+(?:\\.\\d+)?)`, 'i')
      const match = textoProcessado.match(regex)
      if (match) {
        filtros[`${imposto.campo}Min`] = parseFloat(match[1])
        explicacao += `${imposto.nome.toUpperCase()} > R$ ${filtros[`${imposto.campo}Min`].toLocaleString('pt-BR')}. `
      }
    })

    // 10. Emitente/Destinatário (busca por nome)
    // MELHORADO: Extrair apenas o VALOR, ignorando palavras de contexto
    const emitenteMatch = textoLower.match(/(?:qual\s+a?\s+)?(?:me\s+mostre\s+)?(?:buscar\s+)?(?:razão\s+social\s+(?:do\s+)?emitente|razao\s+social\s+(?:do\s+)?emitente|(?:do\s+)?emitente|empresa|fornecedor)(?:\s+contém|\s+com|\s+é|\s+e)?\s+([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s+e\s+|\s+ou\s+|$)/i)
    if (emitenteMatch) {
      // Extrair apenas o nome, removendo palavras extras
      const nomeEmitente = emitenteMatch[1].trim()
      filtros.emitente = nomeEmitente
      explicacao += `Emitente: "${filtros.emitente}". `
      console.log('✅ Emitente extraído:', nomeEmitente)
    }
    // Busca simples por palavra-chave (ex: "areia", "petrobras", "posto", etc.)
    // CORRIGIDO: NÃO buscar emitente se já tem outros filtros (valor, data, status, etc.)
    else if (Object.keys(filtros).length === 0) {
      console.log('🔍 Tentando buscar emitente (sem outros filtros)')
      // Remover palavras reservadas e números
      // CORRIGIDO: Não remover "entrada" e "saida" para permitir busca por "tipo doc = entrada"
      const palavrasReservadas = [
        'valor', 'maior', 'menor', 'entre', 'acima', 'abaixo',
        'data', 'emissao', 'emissão', 'que', 'de', 'do', 'da', 'notas',
        'icms', 'ipi', 'pis', 'cofins', 'frete',
        'autorizada', 'cancelada', 'processando', 'denegada',
        'serie', 'modelo', 'numero', 'nota', 'cnpj', 'operação', 'operacao',
        'tipo', 'doc', 'documento', // Adicionado para filtro "tipo doc = recebida"
        'total', 'vl', 'r$', 'reais' // Adicionado para evitar capturar "total maior 1000" como emitente
      ]
      
      const palavrasChave = textoProcessado
        .split(/\s+/)
        .filter(p => 
          p.length > 2 && 
          !palavrasReservadas.includes(p) &&
          !/^\d+$/.test(p) // Não é só número
        )
      
      if (palavrasChave.length > 0 && palavrasChave.length <= 5) {
        filtros.emitente = palavrasChave.join(' ')
        explicacao += `Buscando "${filtros.emitente}" em razão social. `
      }
    }

    // MELHORADO: Extrair apenas o VALOR, ignorando palavras de contexto
    const destinatarioMatch = textoLower.match(/(?:qual\s+a?\s+)?(?:me\s+mostre\s+)?(?:buscar\s+)?(?:razão\s+social\s+(?:do\s+)?destinatário|razão\s+social\s+(?:do\s+)?destinatario|razao\s+social\s+(?:do\s+)?destinatário|razao\s+social\s+(?:do\s+)?destinatario|(?:do\s+)?destinatário|(?:do\s+)?destinatario|cliente)(?:\s+contém|\s+com|\s+é|\s+e)?\s+([a-záàâãéèêíïóôõöúçñ\s]+?)(?:\s+e\s+|\s+ou\s+|$)/i)
    if (destinatarioMatch) {
      // Extrair apenas o nome, removendo palavras extras
      const nomeDestinatario = destinatarioMatch[1].trim()
      filtros.destinatario = nomeDestinatario
      explicacao += `Destinatário: "${filtros.destinatario}". `
      console.log('✅ Destinatário extraído:', nomeDestinatario)
    }

    // 11. Estado (UF)
    const estados = ['ac', 'al', 'ap', 'am', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mt', 'ms', 'mg', 'pa', 'pb', 'pr', 'pe', 'pi', 'rj', 'rn', 'rs', 'ro', 'rr', 'sc', 'sp', 'se', 'to']
    const uf = estados.find(e => textoLower.includes(` ${e} `) || textoLower.startsWith(`${e} `) || textoLower.endsWith(` ${e}`))
    if (uf) {
      filtros.uf = uf.toUpperCase()
      explicacao += `UF: ${filtros.uf}. `
    }

    // 12. Município
    if (textoLower.includes('são paulo') || textoLower.includes('sao paulo')) {
      filtros.municipio = 'São Paulo'
      explicacao += 'Município: São Paulo. '
    } else if (textoLower.includes('rio de janeiro')) {
      filtros.municipio = 'Rio de Janeiro'
      explicacao += 'Município: Rio de Janeiro. '
    }

    // 13. CNPJ
    const cnpj = texto.match(/\d{8,}/g)
    if (cnpj) {
      filtros.cnpj = cnpj[0]
      explicacao += `CNPJ: ${cnpj[0]}. `
    }

    // 14. Número da nota
    const numeroNota = textoLower.match(/(?:nota|número|numero)\s+(\d+)/i)
    if (numeroNota) {
      filtros.numero = numeroNota[1]
      explicacao += `Nota: ${numeroNota[1]}. `
    }

    // 15. Série
    const serie = textoLower.match(/série\s+(\d+)/i)
    if (serie) {
      filtros.serie = serie[1]
      explicacao += `Série: ${serie[1]}. `
    }

    // 16. Modelo
    const modelo = textoLower.match(/modelo\s+(\d+)/i)
    if (modelo) {
      filtros.modelo = modelo[1]
      explicacao += `Modelo: ${modelo[1]}. `
    }

    return { filtros, explicacao: explicacao || 'Nenhum filtro aplicado' }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      handleClear()
      return
    }

    // Usar LLM se disponível, senão usar processamento local
    const resultado = usandoLLM 
      ? await processarQueryComLLM(query)
      : processarQuery(query)
    
    setResultado(resultado.explicacao)
    onSearch(resultado.filtros)
  }

  const handleClear = () => {
    setQuery('')
    setResultado('')
    onClear()
  }

  const exemplos = [
    { texto: 'abaixo de mil', desc: 'Valor < R$ 1.000' },
    { texto: 'acima de dez mil', desc: 'Valor > R$ 10.000' },
    { texto: 'entrada', desc: 'Notas de entrada' },
    { texto: 'saída', desc: 'Notas de saída' },
    { texto: 'canceladas', desc: 'Status cancelada' },
    { texto: 'autorizadas', desc: 'Status autorizada' },
    { texto: 'processando', desc: 'Status processando/pendente' },
    { texto: 'denegadas', desc: 'Status denegada' },
    { texto: 'rejeitadas', desc: 'Status rejeitada' },
    { texto: 'areia', desc: 'Busca "areia" em razão social' },
    { texto: 'petrobras', desc: 'Busca "petrobras" em empresa' },
    { texto: 'razão social emitente ciano', desc: 'Busca "ciano" no emitente' },
    { texto: 'razao social emitente vale', desc: 'Busca "vale" no emitente' },
    { texto: 'sp', desc: 'Estado de São Paulo' },
    { texto: 'icms maior que 500', desc: 'ICMS > R$ 500' },
    { texto: 'entrada sp acima de 5000', desc: 'Entrada + SP + Valor > R$ 5.000' },
    { texto: 'saída canceladas', desc: 'Saídas canceladas' },
    { texto: 'protocolada sim', desc: 'Notas protocoladas' },
    { texto: 'entre 1000 e 5000', desc: 'Valor entre R$ 1.000 e R$ 5.000' },
    { texto: 'menos de cinco mil', desc: 'Valor < R$ 5.000' },
    { texto: 'mais de cem mil', desc: 'Valor > R$ 100.000' },
    { texto: 'ipi acima de 100', desc: 'IPI > R$ 100' },
    { texto: 'frete maior que 200', desc: 'Frete > R$ 200' },
    { texto: 'cnpj 12345678', desc: 'CNPJ contém 12345678' },
    { texto: 'nota 12345', desc: 'Número da nota 12345' },
    { texto: 'série 1', desc: 'Série 1' },
    { texto: 'modelo 55', desc: 'Modelo 55 (NF-e)' },
    { texto: 'são paulo', desc: 'Município de São Paulo' },
    { texto: 'rio de janeiro', desc: 'Município do Rio' },
    { texto: 'data emissão maior que 27/11/2025', desc: 'Data >= 27/11/2025' },
    { texto: 'após 01/12/2025', desc: 'Data >= 01/12/2025' },
    { texto: 'antes de 30/11/2025', desc: 'Data <= 30/11/2025' },
    { texto: 'entre 01/11/2025 e 30/11/2025', desc: 'Período específico' },
    { texto: 'emitente vale', desc: 'Emitente contém "vale"' },
    { texto: 'destinatário petrobras', desc: 'Destinatário contém "petrobras"' },
    { texto: 'entrada areia sp', desc: 'Entrada + "areia" + SP' },
    { texto: 'saída acima de mil canceladas', desc: 'Saída + > R$ 1.000 + Cancelada' },
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
            placeholder={usandoLLM ? '🤖 IA: "tipo doc = recebida", "notas de entrada", etc...' : 'Ex: "abaixo de mil", "entrada sp", "areia"...'}
            className="w-full pl-10 pr-32 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-revio-primary focus:border-transparent"
            disabled={carregando}
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
              disabled={carregando}
              className="px-4 py-1.5 bg-revio-primary text-white rounded-lg hover:bg-revio-primary-dark flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className={`w-4 h-4 ${carregando ? 'animate-spin' : ''}`} />
              {carregando ? 'Processando...' : usandoLLM ? '🤖 IA' : 'Buscar'}
            </button>
          </div>
        </div>
      </form>

      {resultado && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <strong>Filtros aplicados:</strong> {resultado}
        </div>
      )}

      {/* Ajuda com Exemplos */}
      {mostrarAjuda && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="font-bold text-purple-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Busca Natural com IA - Exemplos
              </h3>
              <p className="text-xs text-purple-700 mt-1">
                Clique em qualquer exemplo para testar
              </p>
            </div>
            <button
              onClick={() => setMostrarAjuda(false)}
              className="text-purple-600 hover:text-purple-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-96 overflow-y-auto">
            {exemplos.map((exemplo, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQuery(exemplo.texto)
                  setMostrarAjuda(false)
                }}
                className="text-left p-2 bg-white rounded border border-purple-200 hover:border-purple-400 hover:shadow-sm transition-all"
              >
                <div className="font-semibold text-sm text-purple-900">
                  "{exemplo.texto}"
                </div>
                <div className="text-xs text-purple-600 mt-1">
                  {exemplo.desc}
                </div>
              </button>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-purple-200">
            <p className="text-xs text-purple-700">
              💡 <strong>Dica:</strong> Você pode combinar múltiplos filtros! Ex: "entrada sp acima de cinco mil canceladas"
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
