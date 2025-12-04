import axios from 'axios'
import { DashboardStats, Filtros } from '../types'
import { env } from '../config/env'
import { logError } from '../utils/debug'
import { logTokenInfo, validateBearerToken } from '../utils/validateToken'
import { streamingCache } from './streamingCache'

// Validar token na inicialização
console.log('🔍 Validando configuração da API...')
logTokenInfo(env.api.bearerToken)
const tokenValidation = validateBearerToken(env.api.bearerToken)
if (!tokenValidation.valid) {
  console.error('⚠️ ATENÇÃO: Token pode estar inválido:', tokenValidation.message)
}

// Configuração do axios - APENAS headers permitidos pela API Revio
const api = axios.create({
  baseURL: env.api.baseUrl,
  headers: {
    'Authorization': `Bearer ${env.api.bearerToken}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
})

// Cache gerenciado por streamingCache.ts

// Interceptor para debug detalhado
api.interceptors.request.use(
  (config) => {
    console.group('🚀 REQUISIÇÃO API')
    console.log('Method:', config.method?.toUpperCase())
    console.log('URL:', config.url)
    console.log('Base URL:', config.baseURL)
    console.log('Full URL:', `${config.baseURL}${config.url}`)
    console.log('Params:', config.params)
    console.log('Headers:', {
      'Authorization': config.headers.Authorization ? 
        `${String(config.headers.Authorization).substring(0, 70)}...` : 
        'NÃO DEFINIDO',
      'Content-Type': config.headers['Content-Type']
    })
    console.log('Authorization Header Length:', config.headers.Authorization ? 
      String(config.headers.Authorization).length : 0)
    console.log('Token starts with "Bearer"?', 
      String(config.headers.Authorization).startsWith('Bearer'))
    console.groupEnd()
    return config
  },
  (error) => {
    console.error('❌ Erro na requisição:', error)
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    console.group('✅ RESPOSTA API')
    console.log('Status:', response.status, response.statusText)
    console.log('Headers:', response.headers)
    console.log('Data:', response.data)
    console.groupEnd()
    return response
  },
  (error) => {
    console.group('❌ ERRO NA RESPOSTA')
    console.log('Status:', error.response?.status)
    console.log('Status Text:', error.response?.statusText)
    console.log('Data:', error.response?.data)
    console.log('Message:', error.message)
    console.log('Config:', {
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers
    })
    console.groupEnd()
    return Promise.reject(error)
  }
)

export interface ConsultaParams {
  host: string
  dtIni: string
  dtFin: string
  pg: number
  size: number
  collection: string
  database: string
  cnpjEmit?: string
  cnpjDest?: string
}

export async function fetchNotasFiscais(
  filtros: Filtros, 
  onProgress?: (current: number, total: number, data: any[]) => void
): Promise<any[]> {
  try {
    const cacheKey = streamingCache.getCacheKey(filtros)
    const pageSize = 10000 // Otimizado para performance (API aceita até 20000)

    console.log('🔄 Iniciando busca com streaming incremental...')

    // Função para buscar uma página específica
    const fetchPage = async (page: number) => {
      const params: ConsultaParams = {
        host: env.database.host,
        collection: filtros.collection || env.database.collection,
        database: env.database.database,
        pg: page,
        size: pageSize,
        dtIni: filtros.dataInicio || getDefaultStartDate(),
        dtFin: filtros.dataFim || getDefaultEndDate(),
      }

      if (filtros.cnpjEmit) params.cnpjEmit = filtros.cnpjEmit
      if (filtros.cnpjDest) params.cnpjDest = filtros.cnpjDest

      const response = await api.get<any>('/WebView/Consultar', { params })
      const notasPagina = mapApiResponseToNotasFiscais(response.data)
      
      return {
        data: notasPagina,
        hasMore: notasPagina.length >= pageSize
      }
    }

    // Usa streaming cache com callbacks de progresso
    const resultado = await streamingCache.fetchWithStreaming(
      fetchPage,
      cacheKey,
      {
        onProgress: (current, total, data) => {
          console.log(`📊 Progresso: ${data.length} registros (página ${current}/${total})`)
          onProgress?.(current, total, data)
        },
        onComplete: (data) => {
          console.log(`✅ Busca completa: ${data.length} registros`)
        },
        onError: (error) => {
          console.error('❌ Erro no streaming:', error)
        }
      }
    )
    
    return resultado
  } catch (error: any) {
    logError('fetchNotasFiscais', error)
    return []
  }
}

export async function fetchContador(filtros: Filtros): Promise<number> {
  try {
    const params = {
      host: env.database.host,
      collection: env.database.collection,
      database: env.database.database,
      dtIni: filtros.dataInicio || getDefaultStartDate(),
      dtFin: filtros.dataFim || getDefaultEndDate(),
      cnpjEmit: filtros.cnpjEmit || '',
      cnpjDest: filtros.cnpjDest || '',
    }

    console.log('📊 Buscando contador com parâmetros:', params)
    
    const response = await api.get<any>('/WebView/ContadorConsulta', { params })
    
    console.log('📊 Resposta do contador:', response.data)
    
    // Tenta diferentes estruturas de resposta
    const total = response.data?.total || 
                  response.data?.count || 
                  response.data?.totalRegistros || 
                  response.data?.quantidade ||
                  (typeof response.data === 'number' ? response.data : 0)
    
    console.log('✅ Total de registros:', total)
    
    return total
  } catch (error: any) {
    console.error('❌ Erro ao buscar contador:', error)
    console.error('📍 Status:', error.response?.status)
    console.error('📍 Dados:', error.response?.data)
    return 0
  }
}

function mapApiResponseToNotasFiscais(data: any): any[] {
  // Otimizado: menos logs, mais rápido
  let items = data?.lista || data?.data || data?.items || data?.result || data?.notas || data
  
  if (!Array.isArray(items) && typeof data === 'object') {
    const arrayKey = Object.keys(data).find(key => Array.isArray(data[key]))
    if (arrayKey) {
      items = data[arrayKey]
    }
  }
  
  if (!Array.isArray(items)) {
    return []
  }
  
  return items.map((item: any, index: number) => {
    try {
      // Mapeia os campos REAIS da API Revio
      const mapped: any = {
        id: item._id || item.id || `temp-${index}`,
        numero: item.NUMERO || item.numero || '',
        serie: item.SERIE || item.serie || '1',
        modelo: item.MODELO || item.modelo || '55',
        chaveAcesso: item.CHV_NFE || item.chaveAcesso || '',
        dataEmissao: item.DT_DOC || item.dataEmissao || '',
        valorTotal: parseFloat(item.VL_DOC || item.valorTotal || 0),
        status: item.PROTOCOLADA === 'Sim' ? 'autorizada' : 'processando',
        tipo: item.TIPO || 'nfe',
        
        // Campos específicos NF-e
        naturezaOperacao: item.NAT_OPER || item.naturezaOperacao || '',
        tipoOperacao: item.IND_OPER || item.tipoOperacao || '',
        
        // Campos específicos CF-e
        numeroSAT: item.NUM_SAT || item.numeroSAT || '',
        
        // Campos específicos CT-e
        tipoServico: item.TP_SERV || item.tipoServico || '',
        
        // Emitente
        emitente: {
          cnpj: item.CNPJ_EMIT || item.cnpjEmit || '',
          razaoSocial: item.NOME_EMIT || item.razaoSocialEmit || '',
          nomeFantasia: item.FANTASIA_EMIT || item.nomeFantasiaEmit || '',
          ie: item.IE || item.ieEmit || '',
          endereco: item.END_EMIT || item.enderecoEmit || '',
          municipio: item.MUN_EMIT || item.municipioEmit || '',
          uf: item.UF_EMIT || item.ufEmit || '',
        },
        
        // Destinatário
        destinatario: {
          cnpj: item.CNPJ_DEST || item.cnpjDest || '',
          cpfCnpj: item.CPF_CNPJ_DEST || item.cpfCnpjDest || '',
          razaoSocial: item.NOME_DEST || item.razaoSocialDest || '',
          nome: item.NOME_DEST || item.nomeDest || '',
          ie: item.IE_DEST || item.ieDest || '',
          endereco: item.END_DEST || item.enderecoDest || '',
          municipio: item.MUN_DEST || item.municipioDest || '',
          uf: item.UF_DEST || item.ufDest || '',
        },
        
        // Tomador (CT-e)
        tomador: item.tomador ? {
          tipo: item.tomador.tipo || item.toma?.tipo || '',
          cnpj: item.tomador.cnpj || item.toma?.CNPJ || '',
          razaoSocial: item.tomador.razaoSocial || item.toma?.xNome || '',
          ie: item.tomador.ie || item.toma?.IE || '',
        } : undefined,
        
        // Remetente (CT-e)
        remetente: item.remetente ? {
          cnpj: item.remetente.cnpj || item.rem?.CNPJ || '',
          razaoSocial: item.remetente.razaoSocial || item.rem?.xNome || '',
          endereco: item.remetente.endereco || '',
          municipio: item.remetente.municipio || item.rem?.xMun || '',
          uf: item.remetente.uf || item.rem?.UF || '',
        } : undefined,
        
        // Expedidor (CT-e)
        expedidor: item.expedidor ? {
          cnpj: item.expedidor.cnpj || item.exped?.CNPJ || '',
          razaoSocial: item.expedidor.razaoSocial || item.exped?.xNome || '',
        } : undefined,
        
        // Recebedor (CT-e)
        recebedor: item.recebedor ? {
          cnpj: item.recebedor.cnpj || item.receb?.CNPJ || '',
          razaoSocial: item.recebedor.razaoSocial || item.receb?.xNome || '',
        } : undefined,
        
        // Carga (CT-e)
        carga: item.carga ? {
          produto: item.carga.produto || item.infCarga?.proPred || '',
          peso: item.carga.peso || item.infCarga?.vCarga || 0,
          volume: item.carga.volume || item.infCarga?.qCarga || 0,
          unidade: item.carga.unidade || item.infCarga?.cUnid || '',
        } : undefined,
        
        // Valores (CT-e)
        valores: item.valores ? {
          servico: item.valores.servico || item.vPrest?.vTPrest || 0,
          receber: item.valores.receber || item.vPrest?.vRec || 0,
          icms: item.valores.icms || item.imp?.ICMS?.vICMS || 0,
          baseCalculo: item.valores.baseCalculo || item.imp?.ICMS?.vBC || 0,
        } : undefined,
        
        // Rodoviário (CT-e)
        rodoviario: item.rodoviario ? {
          rntrc: item.rodoviario.rntrc || item.rodo?.RNTRC || '',
          veiculo: {
            placa: item.rodoviario.veiculo?.placa || item.rodo?.veic?.placa || '',
            uf: item.rodoviario.veiculo?.uf || item.rodo?.veic?.UF || '',
          },
          motorista: {
            cpf: item.rodoviario.motorista?.cpf || item.rodo?.moto?.CPF || '',
            nome: item.rodoviario.motorista?.nome || item.rodo?.moto?.xNome || '',
          },
        } : undefined,
        
        // Totais (NF-e)
        totais: {
          baseCalculo: parseFloat(item.VL_BC_ICMS || item.vBC || 0),
          valorICMS: parseFloat(item.VL_ICMS || item.vICMS || 0),
          valorIPI: parseFloat(item.VL_IPI || item.vIPI || 0),
          valorPIS: parseFloat(item.VL_PIS || item.vPIS || 0),
          valorCOFINS: parseFloat(item.VL_COFINS || item.vCOFINS || 0),
          valorFrete: parseFloat(item.VL_FRETE || item.vFrete || 0),
          valorSeguro: parseFloat(item.VL_SEG || item.vSeg || 0),
          valorDesconto: parseFloat(item.VL_DESC || item.vDesc || 0),
          valorOutros: parseFloat(item.VL_OUTRO || item.vOutro || 0),
          descontos: parseFloat(item.VL_DESC_SUBTOT || 0),
          acrescimos: parseFloat(item.VL_ACRES_SUBTOT || 0),
        },
        
        // Transporte (NF-e) - campos opcionais
        transporte: item.MOD_FRETE || item.TRANSP_CNPJ ? {
          modalidade: item.MOD_FRETE || '',
          transportadora: {
            cnpj: item.TRANSP_CNPJ || '',
            razaoSocial: item.TRANSP_NOME || '',
          },
          veiculo: {
            placa: item.VEIC_PLACA || '',
            uf: item.VEIC_UF || '',
          },
        } : undefined,
        
        // Pagamento - campos opcionais
        pagamento: item.FORMA_PAG || item.VL_PAG ? {
          forma: item.FORMA_PAG || '',
          valor: parseFloat(item.VL_PAG || 0),
          meios: item.FORMA_PAG ? [{
            tipo: item.FORMA_PAG,
            valor: parseFloat(item.VL_PAG || 0)
          }] : [],
        } : undefined,
        
        // Itens
        itens: mapItens(item.itens || item.det || item.produtos || []),
        
        // Informações adicionais
        informacoesAdicionais: item.INF_ADIC || item.OBS || '',
        
        // Campos extras da API Revio
        origem: item.ORIGEM || '',
        statusManifestacao: item.STATUS_MANIFESTACAO || '',
        protocolada: item.PROTOCOLADA || '',
      }
      
      return mapped
    } catch (error) {
      console.error(`❌ Erro ao mapear item ${index}:`, error, item)
      return null
    }
  }).filter(Boolean)
}

function mapItens(itens: any[]): any[] {
  if (!Array.isArray(itens)) return []
  
  return itens.map((item: any) => ({
    codigo: item.codigo || item.cProd || item.prod?.cProd || '',
    descricao: item.descricao || item.xProd || item.prod?.xProd || '',
    quantidade: parseFloat(item.quantidade || item.qCom || item.prod?.qCom || 0),
    valorUnitario: parseFloat(item.valorUnitario || item.vUnCom || item.prod?.vUnCom || 0),
    valorTotal: parseFloat(item.valorTotal || item.vProd || item.prod?.vProd || 0),
    ncm: item.ncm || item.NCM || item.prod?.NCM || '',
    cfop: item.cfop || item.CFOP || item.prod?.CFOP || '',
    unidade: item.unidade || item.uCom || item.prod?.uCom || '',
    ean: item.ean || item.cEAN || item.prod?.cEAN || '',
    desconto: parseFloat(item.desconto || item.vDesc || 0),
  }))
}



function getDefaultStartDate(): string {
  const date = new Date()
  date.setMonth(date.getMonth() - 1)
  return date.toISOString().split('T')[0]
}

function getDefaultEndDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function calcularStats(notas: any[]): DashboardStats {
  return {
    totalNotas: notas.length,
    valorTotal: notas.reduce((acc, nf) => acc + nf.valorTotal, 0),
    notasAutorizadas: notas.filter(nf => nf.status === 'autorizada').length,
    notasCanceladas: notas.filter(nf => nf.status === 'cancelada').length
  }
}
