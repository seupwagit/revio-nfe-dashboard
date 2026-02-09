/**
 * Documents Routes
 * 
 * Endpoints para buscar documentos fiscais
 * Usa FiscalDocumentsService com roteamento automático
 */

import { FilterItem } from '@fiscal/shared'
import { Response, Router } from 'express'
import { AuthenticatedRequest } from '../middleware/AuthMiddleware'
import { fiscalDocumentsService } from '../services/FiscalDocumentsService'
import { MongoFilterParser } from '../utils/MongoFilterParser'

const router = Router()

// Note: authMiddleware is now handled by userContextMiddleware in the main app
// All routes here automatically have user context and database routing

// GET /api/documents
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { 
      collection, 
      dtIni, 
      dtFin, 
      page = '1', 
      size = '100',
      cnpjEmit,
      cnpjDest,
      status,
      filters: filtersRaw
    } = req.query

    // Limitar o tamanho máximo para evitar sobrecarga (500 error)
    const requestedSize = parseInt(size as string)
    const maxAllowedSize = Number(process.env.MAX_BACKEND_PAGE_SIZE) || 5000 
    const finalSize = Math.min(requestedSize, maxAllowedSize)

    console.log('[DOCUMENTS] 📄 Requisição recebida:', { 
      collection, 
      page, 
      size: requestedSize,
      actualSize: finalSize,
      usuario: req.user?.usrLogin,
      bancoDeDados: req.userDatabase
    })

    // Converter datas de string para o tipo Date do MongoDB
    const filter: any = {}
    if (dtIni || dtFin) {
      filter.DT_DOC = {}
      if (dtIni) filter.DT_DOC.$gte = new Date(dtIni as string)
      if (dtFin) {
        // Garantir que englobe o dia inteiro (até 23:59:59)
        const dFin = new Date(dtFin as string)
        dFin.setHours(23, 59, 59, 999)
        filter.DT_DOC.$lte = dFin
      }
    }

    const finalFilter = {
      ...filter,
      ...(cnpjEmit && { CNPJ_EMIT: cnpjEmit }),
      ...(cnpjDest && { CNPJ_DEST: cnpjDest }),
      ...(status && { STATUS: status }),
      ...(filtersRaw && MongoFilterParser.parse(JSON.parse(filtersRaw as string) as FilterItem[]))
    }

    console.log('[DOCUMENTS] 🔍 Filtro construído para busca:', JSON.stringify(finalFilter, (key, value) => 
      value instanceof Date ? value.toISOString() : value
    ))

    // Usar FiscalDocumentsService com roteamento automático
    const documents = await fiscalDocumentsService.fetchDocuments({
      collection: collection as string,
      filter: finalFilter,
      sort: { DT_DOC: -1 },
      limit: finalSize,
      skip: (parseInt(page as string) - 1) * finalSize
    })

    // Além dos documentos, precisamos retornar metadados básicos para o frontend
    res.json({
      success: true,
      data: documents,
      pagination: {
        page: parseInt(page as string),
        size: finalSize,
        totalInPage: documents.length
      }
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
    }
    
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.name,
      errorCode: error.code,
      message: 'Ocorreu um erro ao processar sua consulta. Tente reduzir o período ou os filtros.'
    })
  }
})

// GET /api/documents/count
router.get('/count', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { collection, dtIni, dtFin, cnpjEmit, cnpjDest, status, filters: filtersRaw } = req.query
    
    console.log('[DOCUMENTS] 🔢 Requisição de count recebida:', { 
      collection, 
      usuario: req.user?.usrLogin,
      bancoDeDados: req.userDatabase
    })

    // Converter datas de string para o tipo Date do MongoDB
    const filter: any = {}
    if (dtIni || dtFin) {
      filter.DT_DOC = {}
      if (dtIni) filter.DT_DOC.$gte = new Date(dtIni as string)
      if (dtFin) {
        const dFin = new Date(dtFin as string)
        dFin.setHours(23, 59, 59, 999)
        filter.DT_DOC.$lte = dFin
      }
    }

    const finalFilter = {
      ...filter,
      ...(cnpjEmit && { CNPJ_EMIT: cnpjEmit }),
      ...(cnpjDest && { CNPJ_DEST: cnpjDest }),
      ...(status && { STATUS: status }),
      ...(filtersRaw && MongoFilterParser.parse(JSON.parse(filtersRaw as string) as FilterItem[]))
    }

    console.log('[DOCUMENTS] 🔍 Filtro construído para contagem:', JSON.stringify(finalFilter, (key, value) => 
      value instanceof Date ? value.toISOString() : value
    ))

    // Usar FiscalDocumentsService com roteamento automático
    const response = await fiscalDocumentsService.fetchCount({
      collection: collection as string,
      filter: finalFilter
    })

    res.json({
      success: true,
      count: response
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

// GET /api/documents/stats
router.get('/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { collection, dtIni, dtFin, cnpjEmit, cnpjDest, status, filters: filtersRaw } = req.query
    
    console.log('[DOCUMENTS] 📊 Requisição de stats recebida:', { 
      collection, 
      usuario: req.user?.usrLogin,
      bancoDeDados: req.userDatabase
    })

    // Converter datas de string para o tipo Date do MongoDB
    const filter: any = {}
    if (dtIni || dtFin) {
      filter.DT_DOC = {}
      if (dtIni) filter.DT_DOC.$gte = new Date(dtIni as string)
      if (dtFin) {
        const dFin = new Date(dtFin as string)
        dFin.setHours(23, 59, 59, 999)
        filter.DT_DOC.$lte = dFin
      }
    }

    const finalFilter = {
      ...filter,
      ...(cnpjEmit && { CNPJ_EMIT: cnpjEmit }),
      ...(cnpjDest && { CNPJ_DEST: cnpjDest }),
      ...(status && { STATUS: status }),
      ...(filtersRaw && MongoFilterParser.parse(JSON.parse(filtersRaw as string) as FilterItem[]))
    }

    console.log('[DOCUMENTS] 🔍 Filtro construído para stats:', JSON.stringify(finalFilter, (key, value) => 
      value instanceof Date ? value.toISOString() : value
    ))

    // Usar FiscalDocumentsService com roteamento automático
    const stats = await fiscalDocumentsService.fetchDashboardStats({
      collection: collection as string,
      filter: finalFilter
    })

    res.json({
      success: true,
      stats
    })
    
  } catch (error: any) {
    console.error('❌ Erro ao buscar estatísticas:', error.message)
    console.error('📋 Detalhes:', {
      name: error.name,
      code: error.code,
      collection: req.query.collection
    })
    
    res.status(500).json({
      success: false,
      error: error.message,
      errorType: error.name
    })
  }
})

export default router
