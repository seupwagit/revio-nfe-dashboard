/**
 * Documents Routes
 * 
 * Endpoints para buscar documentos fiscais
 * Usa FiscalDocumentsService com roteamento automático
 */

import { Router, Response } from 'express'
import { authMiddleware, AuthenticatedRequest } from '../middleware/AuthMiddleware'
import { fiscalDocumentsService } from '../services/FiscalDocumentsService'

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
      status
    } = req.query

    console.log('[DOCUMENTS] 📄 Requisição recebida:', { 
      collection, 
      page, 
      size,
      usuario: req.user?.usrLogin,
      bancoDeDados: req.userDatabase
    })

    // Usar FiscalDocumentsService com roteamento automático
    const response = await fiscalDocumentsService.fetchDocuments({
      collection: collection as string,
      dtIni: dtIni as string,
      dtFin: dtFin as string,
      cnpjEmit: cnpjEmit as string,
      cnpjDest: cnpjDest as string,
      status: status as string,
      page: parseInt(page as string),
      size: parseInt(size as string)
    })

    res.json(response)
    
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
router.get('/count', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { collection, dtIni, dtFin, cnpjEmit, cnpjDest, status } = req.query
    
    console.log('[DOCUMENTS] 🔢 Requisição de count recebida:', { 
      collection, 
      usuario: req.user?.usrLogin,
      bancoDeDados: req.userDatabase
    })

    // Usar FiscalDocumentsService com roteamento automático
    const response = await fiscalDocumentsService.fetchCount({
      collection: collection as string,
      dtIni: dtIni as string,
      dtFin: dtFin as string,
      cnpjEmit: cnpjEmit as string,
      cnpjDest: cnpjDest as string,
      status: status as string
    })

    res.json(response)
    
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
    const { collection, dtIni, dtFin } = req.query
    
    console.log('[DOCUMENTS] 📊 Requisição de stats recebida:', { 
      collection, 
      usuario: req.user?.usrLogin,
      bancoDeDados: req.userDatabase
    })

    // Usar FiscalDocumentsService com roteamento automático
    const response = await fiscalDocumentsService.fetchStats({
      collection: collection as string,
      dtIni: dtIni as string,
      dtFin: dtFin as string
    })

    res.json(response)
    
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
