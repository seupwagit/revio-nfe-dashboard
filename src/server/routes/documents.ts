/**
 * Documents Routes
 * 
 * Endpoints para buscar documentos fiscais
 */

import { Router } from 'express'
import { mongoose } from '../database/mongodb'
import { createDocumentFilter, validateDates, formatDateRangeForLog } from '../utils/dateFilter'

const router = Router()

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const { 
      collection, 
      dtIni, 
      dtFin, 
      page = '1', 
      size = '100',
      cnpjEmit,
      cnpjDest 
    } = req.query
    
    // Validar datas
    validateDates(dtIni as string, dtFin as string)
    
    console.log('[DOCUMENTS] 📄 Buscando documentos:', { 
      collection, 
      periodo: formatDateRangeForLog(dtIni as string, dtFin as string),
      page, 
      size 
    })
    
    if (!mongoose.connection.db) {
      throw new Error('MongoDB não conectado')
    }
    
    const coll = mongoose.connection.db.collection(collection as string)
    
    // Criar filtro usando utilitário centralizado
    const filter = createDocumentFilter({
      dtIni: dtIni as string,
      dtFin: dtFin as string,
      cnpjEmit: cnpjEmit as string,
      cnpjDest: cnpjDest as string
    })
    
    // Paginação
    const skip = (parseInt(page as string) - 1) * parseInt(size as string)
    const limit = parseInt(size as string)
    
    // Buscar
    const startTime = Date.now()
    const documents = await coll
      .find(filter)
      .sort({ DT_DOC: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()
    
    // Usar estimatedDocumentCount quando não há filtros (muito mais rápido)
    // Usar countDocuments apenas quando há filtros aplicados
    const hasFilters = Object.keys(filter).length > 0
    const total = hasFilters 
      ? await coll.countDocuments(filter)
      : await coll.estimatedDocumentCount()
    const endTime = Date.now()
    
    console.log(`[DOCUMENTS] ✅ ${documents.length} documentos retornados em ${endTime - startTime}ms`)
    
    // Mapear campos do MongoDB para o formato esperado pelo frontend
    const mappedDocuments = documents.map(doc => ({
      id: doc._id?.toString() || doc.ID || '',
      numero: doc.NUM_DOC || doc.numero || '',
      serie: doc.SER || doc.serie || '',
      modelo: doc.COD_MOD || doc.modelo || '55',
      chaveAcesso: doc.CHV_NFE || doc.chaveAcesso || '',
      dataEmissao: doc.DT_DOC || doc.dataEmissao || '',
      valorTotal: parseFloat(doc.VL_DOC || doc.valorTotal || 0),
      status: doc.PROTOCOLADA === 'Sim' ? 'autorizada' : doc.PROTOCOLADA === 'Não' ? 'processando' : doc.status || 'processando',
      protocolada: doc.PROTOCOLADA || doc.protocolada || 'Não',
      tipo: doc.TIPO || doc.tipo || 'nfe',
      tipoOperacao: doc.IND_OPER || doc.tipoOperacao || '1',
      naturezaOperacao: doc.NAT_OPER || doc.naturezaOperacao || '',
      
      // Totais
      totais: {
        baseCalculo: parseFloat(doc.VL_BC_ICMS || 0),
        valorICMS: parseFloat(doc.VL_ICMS || 0),
        valorIPI: parseFloat(doc.VL_IPI || 0),
        valorPIS: parseFloat(doc.VL_PIS || 0),
        valorCOFINS: parseFloat(doc.VL_COFINS || 0),
        valorFrete: parseFloat(doc.VL_FRETE || 0),
        valorSeguro: parseFloat(doc.VL_SEGURO || 0),
        valorDesconto: parseFloat(doc.VL_DESCONTO || 0),
        valorOutros: parseFloat(doc.VL_OUTROS || 0)
      },
      
      // Emitente
      emitente: {
        cnpj: doc.CNPJ_EMIT || doc.emitente?.cnpj || '',
        razaoSocial: doc.NOME_EMIT || doc.EMIT_XNOME || doc.emitente?.razaoSocial || '',
        nomeFantasia: doc.EMIT_XFANT || doc.emitente?.nomeFantasia || '',
        ie: doc.IE_EMIT || doc.EMIT_IE || doc.emitente?.ie || '',
        endereco: doc.EMIT_XLGR || doc.emitente?.endereco || '',
        municipio: doc.EMIT_XMUN || doc.emitente?.municipio || '',
        uf: doc.UF_EMIT || doc.EMIT_UF || doc.emitente?.uf || ''
      },
      
      // Destinatário
      destinatario: {
        cnpj: doc.CNPJ_DEST || doc.destinatario?.cnpj || '',
        cpfCnpj: doc.CNPJ_DEST || doc.CPF_DEST || doc.destinatario?.cpfCnpj || '',
        razaoSocial: doc.NOME_DEST || doc.DEST_XNOME || doc.destinatario?.razaoSocial || '',
        nome: doc.NOME_DEST || doc.DEST_XNOME || doc.destinatario?.nome || '',
        ie: doc.IE_DEST || doc.DEST_IE || doc.destinatario?.ie || '',
        endereco: doc.DEST_XLGR || doc.destinatario?.endereco || '',
        municipio: doc.DEST_XMUN || doc.destinatario?.municipio || '',
        uf: doc.UF_DEST || doc.DEST_UF || doc.destinatario?.uf || ''
      },
      
      // Informações adicionais
      origem: doc.ORIGEM || doc.origem || '',
      statusManifestacao: doc.STATUS_MANIFESTACAO || doc.statusManifestacao || '',
      informacoesAdicionais: doc.INF_ADIC || doc.informacoesAdicionais || ''
    }))
    
    res.json({
      success: true,
      data: mappedDocuments,
      pagination: {
        page: parseInt(page as string),
        size: parseInt(size as string),
        total,
        totalPages: Math.ceil(total / parseInt(size as string))
      },
      executionTime: endTime - startTime
    })
    
  } catch (error: any) {
    console.error('[DOCUMENTS] ❌ Erro ao buscar documentos:', error.message)
    console.error('[DOCUMENTS] 📋 Detalhes do erro:', {
      name: error.name,
      code: error.code,
      codeName: error.codeName,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    })
    
    // Logs específicos por tipo de erro
    if (error.name === 'MongoNetworkError' || error.code === 'ECONNREFUSED') {
      console.error('[DOCUMENTS] 🔌 Erro de Conectividade MongoDB:')
      console.error('   - MongoDB pode estar offline')
      console.error('   - Verifique se o host está acessível')
      console.error('   - Verifique firewall e regras de rede')
      console.error('   - Host configurado:', process.env.VITE_DB_HOST)
    } else if (error.name === 'MongoServerError' && error.code === 18) {
      console.error('🔐 Erro de Autenticação MongoDB:')
      console.error('   - Credenciais inválidas')
      console.error('   - Verifique usuário e senha no .env')
      console.error('   - Verifique authSource na connection string')
    } else if (error.name === 'MongoServerError' && error.code === 13) {
      console.error('🚫 Erro de Permissão MongoDB:')
      console.error('   - Usuário não tem permissão na collection')
      console.error('   - Verifique roles do usuário no MongoDB')
    } else if (error.message.includes('Topology is closed')) {
      console.error('💔 Conexão MongoDB foi fechada:')
      console.error('   - Conexão perdida durante a operação')
      console.error('   - MongoDB pode ter reiniciado')
      console.error('   - Verifique logs do MongoDB')
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.name,
      errorCode: error.code
    })
  }
})

// GET /api/documents/count
router.get('/count', async (req, res) => {
  try {
    const { collection, dtIni, dtFin, cnpjEmit, cnpjDest } = req.query
    
    // Validar datas
    validateDates(dtIni as string, dtFin as string)
    
    if (!mongoose.connection.db) {
      throw new Error('MongoDB não conectado')
    }
    
    const coll = mongoose.connection.db.collection(collection as string)
    
    // Criar filtro usando utilitário centralizado
    const filter = createDocumentFilter({
      dtIni: dtIni as string,
      dtFin: dtFin as string,
      cnpjEmit: cnpjEmit as string,
      cnpjDest: cnpjDest as string
    })
    
    // Usar estimatedDocumentCount quando não há filtros (muito mais rápido)
    const hasFilters = Object.keys(filter).length > 0
    const count = hasFilters 
      ? await coll.countDocuments(filter)
      : await coll.estimatedDocumentCount()
    
    res.json({
      success: true,
      count
    })
    
  } catch (error: any) {
    console.error('❌ Erro ao contar documentos:', error.message)
    console.error('📋 Detalhes:', {
      name: error.name,
      code: error.code,
      collection: req.query.collection
    })
    
    if (error.name === 'MongoNetworkError') {
      console.error('🔌 Erro de rede ao contar documentos')
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.name
    })
  }
})

export default router
