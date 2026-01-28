/**
 * DANFE Routes - Rotas de DANFE
 * 
 * Rotas para geração e visualização de DANFE a partir de XMLs NFe
 * 
 * ARQUITETURA SIMPLIFICADA:
 * - /api/danfe/pdf/:documentId - Único endpoint para geração e entrega de PDF
 * - /api/danfe/status/:documentId - Status detalhado sem gerar PDF
 * - Autenticação gerenciada centralmente pelo userContextMiddleware
 */

import { Response, Router } from 'express'
import { AuthenticatedRequest } from '../middleware/AuthMiddleware'
import { apiLogger } from '../services/APILogger'
import { danfeGenerator } from '../services/DANFEGenerator'
import { pdfCacheService } from '../services/PDFCacheService'
import { s3Service } from '../services/S3Service'

const router = Router()

// Resource management
const activeRequests = new Map<string, { startTime: number; timeout: NodeJS.Timeout }>()
const MAX_CONCURRENT_REQUESTS = 5
const REQUEST_TIMEOUT_MS = 60000 // 60 seconds

// Note: authMiddleware is now handled by userContextMiddleware in the main app
// All routes here automatically have user context and database routing

/**
 * GET /api/danfe/status/:documentId
 * Retorna status detalhado do documento sem gerar PDF
 * Usado para feedback em tempo real no loading indicator
 */
router.get('/status/:documentId', async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  let { documentId } = req.params
  
  try {
    // Middleware já garantiu autenticação - req.user está disponível
    if (!documentId || typeof documentId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Document ID é obrigatório',
        code: 'MISSING_DOCUMENT_ID'
      })
    }

    // Remove .pdf extension if present (for flexibility)
    if (documentId.endsWith('.pdf')) {
      documentId = documentId.slice(0, -4);
    }

    console.log(`[DANFE Status] Checking status for document: ${documentId}`)

    // Check temp files
    const tempFiles = await danfeGenerator.checkTempFiles(documentId)
    
    // Check cache
    const cachedPDF = pdfCacheService.get(documentId)
    
    // Determine document status based on file existence
    let status: string
    let currentStep: string
    let progress: number
    
    if (!tempFiles.xmlExists && !cachedPDF) {
      // XML needs to be downloaded
      status = 'xml_not_found'
      currentStep = 'downloading'
      progress = 0
    } else if (tempFiles.xmlExists && !tempFiles.pdfExists && !cachedPDF) {
      // XML exists but PDF needs to be generated
      status = 'xml_downloaded'
      currentStep = 'generating'
      progress = 25
    } else if (cachedPDF) {
      // PDF is cached and ready
      status = 'pdf_cached'
      currentStep = 'loading'
      progress = 75
    } else if (tempFiles.pdfExists) {
      // PDF file exists and ready
      status = 'pdf_ready'
      currentStep = 'complete'
      progress = 100
    } else {
      // Fallback error state
      status = 'error'
      currentStep = 'complete'
      progress = 0
    }

    const response = {
      success: true,
      data: {
        status,
        xmlExists: tempFiles.xmlExists,
        pdfExists: tempFiles.pdfExists,
        pdfCached: !!cachedPDF,
        fileSize: tempFiles.pdfSize || cachedPDF?.pdfData.length,
        lastModified: tempFiles.pdfModified || cachedPDF?.timestamp,
        documentId,
        currentStep,
        progress
      }
    }

    console.log(`[DANFE Status] Status for ${documentId}:`, response.data)

    res.json(response)

  } catch (error: any) {
    console.error('[DANFE Status] Error checking status:', error)
    
    await apiLogger.logError(ip, '/api/danfe/status', `Status check error: ${error.message}`)

    res.status(500).json({
      success: false,
      status: 'error',
      error: 'Erro interno do servidor',
      documentId,
      code: 'INTERNAL_SERVER_ERROR'
    })
  }
})

/**
 * POST /api/danfe/pdf/:documentId
 * Gera PDF diretamente usando dados enviados pela grid (bypassa S3/DB)
 */
router.post('/pdf/:documentId', async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  let { documentId } = req.params
  const gridData = req.body

  try {
    if (!documentId) {
      return res.status(400).json({ success: false, error: 'Document ID é obrigatório' })
    }

    if (!gridData || Object.keys(gridData).length === 0) {
      return res.status(400).json({ success: false, error: 'Dados da grid são obrigatórios para esta operação' })
    }

    // Remove .pdf extension
    if (documentId.endsWith('.pdf')) {
      documentId = documentId.slice(0, -4);
    }

    console.log(`[DANFE PDF] Generating from Grid Data for: ${documentId}`)

    const conversionResult = await danfeGenerator.generatePDFFromGridObject(documentId, gridData)

    if (!conversionResult.success || !conversionResult.pdfData) {
      return res.status(500).json({
        success: false,
        error: conversionResult.error || 'Erro ao gerar PDF a partir dos dados da grid'
      })
    }

    // Cache the result
    pdfCacheService.set(documentId, conversionResult.pdfData, `${documentId}.pdf`)

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${documentId}.pdf"`)
    res.send(conversionResult.pdfData)

  } catch (error: any) {
    console.error('[DANFE PDF] Error generating from grid data:', error)
    res.status(500).json({ success: false, error: 'Erro interno na geração via grid' })
  }
})

/**
 * GET /api/danfe/pdf/:documentId
 * Serve o PDF DANFE diretamente como arquivo
 * Aceita URLs com ou sem extensão .pdf
 */
router.get('/pdf/:documentId', async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  let { documentId } = req.params
  
  try {
    // Middleware já garantiu autenticação - req.user está disponível
    if (!documentId || typeof documentId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Document ID é obrigatório',
        code: 'MISSING_DOCUMENT_ID'
      })
    }

    // Remove .pdf extension if present (for flexibility)
    if (documentId.endsWith('.pdf')) {
      documentId = documentId.slice(0, -4);
    }

    console.log(`[DANFE PDF] Serving PDF for document: ${documentId}`)

    // Check if PDF already exists in temp files
    const tempFiles = await danfeGenerator.checkTempFiles(documentId)
    
    if (tempFiles.pdfExists && tempFiles.pdfPath) {
      console.log(`[DANFE PDF] Serving existing PDF file: ${tempFiles.pdfPath}`)
      
      // Set appropriate headers for PDF
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="${documentId}.pdf"`)
      res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
      
      // Stream the PDF file directly
      const fs = await import('fs')
      const pdfStream = fs.createReadStream(tempFiles.pdfPath)
      
      pdfStream.on('error', (error) => {
        console.error(`[DANFE PDF] Error streaming PDF file: ${error.message}`)
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: 'Erro ao carregar arquivo PDF',
            code: 'PDF_STREAM_ERROR'
          })
        }
      })
      
      pdfStream.pipe(res)
      return
    }

    // If PDF doesn't exist, check cache
    const cachedPDF = pdfCacheService.get(documentId)
    
    if (cachedPDF) {
      console.log(`[DANFE PDF] Serving PDF from cache for document: ${documentId}`)
      
      // Set appropriate headers for PDF
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `inline; filename="${documentId}.pdf"`)
      res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
      
      // Send cached PDF buffer directly
      res.send(cachedPDF.pdfData)
      return
    }

    // If neither temp file nor cache exists, generate PDF
    console.log(`[DANFE PDF] PDF not found, generating for document: ${documentId}`)
    
    // Download XML from S3
    const downloadResult = await s3Service.downloadXMLFile(documentId)
    
    let conversionResult;

    if (!downloadResult.success || !downloadResult.data) {
      console.warn(`[DANFE PDF] S3 download failed for ${documentId}: ${downloadResult.error || 'Unknown error'}. Falling back to database summary...`)
      
      // Fallback: Tentativa de gerar via resumo do banco se o S3 falhar
      conversionResult = await danfeGenerator.generateSummaryDANFE(documentId)
      
      if (!conversionResult.success) {
        return res.status(404).json({
          success: false,
          error: 'Documento não encontrado no S3 e falha ao reconstruir dados do banco',
          code: 'DOCUMENT_NOT_FOUND',
          details: conversionResult.error
        })
      }
    } else {
      // Generate PDF from downloaded XML
      conversionResult = await danfeGenerator.convertXMLToPDF(downloadResult.data, documentId)
    }
    
    if (!conversionResult.success || !conversionResult.pdfData) {
      return res.status(500).json({
        success: false,
        error: conversionResult.error || 'Erro ao gerar PDF',
        code: 'PDF_GENERATION_FAILED'
      })
    }

    // Cache the generated PDF
    const fileName = downloadResult.fileName?.replace('.xml', '.pdf') || `${documentId}.pdf`
    pdfCacheService.set(documentId, conversionResult.pdfData, fileName)

    // Set appropriate headers for PDF
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`)
    res.setHeader('Cache-Control', 'public, max-age=3600') // Cache for 1 hour
    
    // Send PDF buffer directly
    res.send(conversionResult.pdfData)

    await apiLogger.logSuccess(ip, '/api/danfe/pdf', 
      `PDF served for ${documentId}`, 
      parseInt(req.user?.usrCodigo || '0')
    )

  } catch (error: any) {
    console.error('[DANFE PDF] Error serving PDF:', error)
    
    await apiLogger.logError(ip, '/api/danfe/pdf', `PDF serve error: ${error.message}`)

    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR'
      })
    }
  }
})

/**
 * GET /api/danfe/test
 * Testa a disponibilidade das bibliotecas DANFE
 */
router.get('/test', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Middleware já garantiu autenticação - req.user está disponível
    const testResult = {
      librariesAvailable: false,
      nfeXmlToPdfAvailable: false,
      danfePdfAvailable: false,
      tempDirectoryExists: false,
      tempDirectoryPath: '',
      error: null as string | null
    };

    // Test temp directory
    try {
      const tempDirs = danfeGenerator.getTempDirectories();
      testResult.tempDirectoryPath = tempDirs.main;
      testResult.tempDirectoryExists = true;
    } catch (error: any) {
      testResult.error = `Temp directory error: ${error.message}`;
    }

    // Test libraries by checking the debug info
    try {
      // This will trigger the debug output in the console
      const tempGenerator = new (await import('../services/DANFEGenerator')).DANFEGenerator();
      testResult.librariesAvailable = true;
    } catch (error: any) {
      testResult.error = `Library test error: ${error.message}`;
    }

    res.json({
      success: true,
      test: testResult,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('[DANFE Test] Test error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Erro no teste das bibliotecas DANFE',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
})

/**
 * GET /api/danfe/health
 * Verifica a saúde dos serviços DANFE
 */
router.get('/health', async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  try {
    // Middleware já garantiu autenticação - req.user está disponível
    const healthCheck = {
      s3Service: false,
      danfeGenerator: false,
      tempDirectory: false,
      pdfCache: false,
      activeRequests: activeRequests.size,
      maxConcurrentRequests: MAX_CONCURRENT_REQUESTS
    }

    // Test S3 connection
    try {
      healthCheck.s3Service = await s3Service.testConnection()
    } catch (error) {
      console.warn('[DANFE Health] S3 service check failed:', error)
    }

    // Test DANFE generator temp directories
    try {
      const tempDirs = danfeGenerator.getTempDirectories()
      const tempFiles = await danfeGenerator.listTempFiles()
      healthCheck.tempDirectory = true
      healthCheck.danfeGenerator = true
      
      console.log(`[DANFE Health] Temp directories: XML=${tempFiles.xml.length} files, PDF=${tempFiles.pdf.length} files`)
    } catch (error) {
      console.warn('[DANFE Health] DANFE generator check failed:', error)
    }

    // Test PDF cache
    try {
      const cacheStats = pdfCacheService.getStats()
      healthCheck.pdfCache = true
    } catch (error) {
      console.warn('[DANFE Health] PDF cache check failed:', error)
    }

    const allHealthy = healthCheck.s3Service && healthCheck.danfeGenerator && healthCheck.tempDirectory && healthCheck.pdfCache

    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      services: healthCheck,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('[DANFE Health] Health check error:', error)
    
    await apiLogger.logError(ip, '/api/danfe/health', `Health check error: ${error.message}`)

    res.status(500).json({
      success: false,
      error: 'Erro na verificação de saúde dos serviços',
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * GET /api/danfe/cache/stats
 * Retorna estatísticas do cache de PDF
 */
router.get('/cache/stats', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Middleware já garantiu autenticação - req.user está disponível
    const stats = pdfCacheService.getStats()
    
    res.json({
      success: true,
      cache: {
        ...stats,
        sizeMB: pdfCacheService.getSizeMB(),
        usagePercentage: pdfCacheService.getUsagePercentage()
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('[DANFE Cache] Stats error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Erro ao obter estatísticas do cache',
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * DELETE /api/danfe/cache/clear
 * Limpa todo o cache de PDF
 */
router.delete('/cache/clear', async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  try {
    // Middleware já garantiu autenticação - req.user está disponível
    const statsBefore = pdfCacheService.getStats()
    pdfCacheService.clear()
    
    await apiLogger.logSuccess(ip, '/api/danfe/cache/clear', 
      `Cache cleared: ${statsBefore.totalEntries} entries`, 
      parseInt(req.user?.usrCodigo || '0')
    )

    res.json({
      success: true,
      message: 'Cache limpo com sucesso',
      clearedEntries: statsBefore.totalEntries,
      freedSizeMB: Math.round((statsBefore.totalSize / (1024 * 1024)) * 100) / 100,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('[DANFE Cache] Clear error:', error)
    
    await apiLogger.logError(ip, '/api/danfe/cache/clear', `Cache clear error: ${error.message}`)

    res.status(500).json({
      success: false,
      error: 'Erro ao limpar cache',
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * DELETE /api/danfe/cache/:documentId
 * Remove um documento específico do cache
 */
router.delete('/cache/:documentId', async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  const { documentId } = req.params
  
  try {
    // Middleware já garantiu autenticação - req.user está disponível
    const wasInCache = pdfCacheService.has(documentId)
    const removed = pdfCacheService.delete(documentId)
    
    if (removed) {
      await apiLogger.logSuccess(ip, '/api/danfe/cache/delete', 
        `Cache entry removed: ${documentId}`, 
        parseInt(req.user?.usrCodigo || '0')
      )
    }

    res.json({
      success: true,
      removed,
      wasInCache,
      documentId,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('[DANFE Cache] Delete error:', error)
    
    await apiLogger.logError(ip, '/api/danfe/cache/delete', `Cache delete error: ${error.message}`)

    res.status(500).json({
      success: false,
      error: 'Erro ao remover entrada do cache',
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * GET /api/danfe/temp/files
 * Lista arquivos temporários nos diretórios XML e PDF
 */
router.get('/temp/files', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Middleware já garantiu autenticação - req.user está disponível
    const tempFiles = await danfeGenerator.listTempFiles()
    const tempDirs = danfeGenerator.getTempDirectories()
    
    res.json({
      success: true,
      directories: tempDirs,
      files: tempFiles,
      totalFiles: tempFiles.xml.length + tempFiles.pdf.length,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('[DANFE Temp] List files error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Erro ao listar arquivos temporários',
      timestamp: new Date().toISOString()
    })
  }
})

/**
 * POST /api/danfe/temp/cleanup
 * Limpa arquivos temporários antigos
 */
router.post('/temp/cleanup', async (req: AuthenticatedRequest, res: Response) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown'
  
  try {
    // Middleware já garantiu autenticação - req.user está disponível
    const { maxAgeHours = 24 } = req.body
    
    const filesBefore = await danfeGenerator.listTempFiles()
    const totalBefore = filesBefore.xml.length + filesBefore.pdf.length
    
    await danfeGenerator.cleanupOldTempFiles(maxAgeHours)
    
    const filesAfter = await danfeGenerator.listTempFiles()
    const totalAfter = filesAfter.xml.length + filesAfter.pdf.length
    const cleaned = totalBefore - totalAfter
    
    await apiLogger.logSuccess(ip, '/api/danfe/temp/cleanup', 
      `Cleaned ${cleaned} temp files older than ${maxAgeHours}h`, 
      parseInt(req.user?.usrCodigo || '0')
    )

    res.json({
      success: true,
      message: `Limpeza concluída: ${cleaned} arquivos removidos`,
      filesBefore: totalBefore,
      filesAfter: totalAfter,
      filesRemoved: cleaned,
      maxAgeHours,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('[DANFE Temp] Cleanup error:', error)
    
    await apiLogger.logError(ip, '/api/danfe/temp/cleanup', `Temp cleanup error: ${error.message}`)

    res.status(500).json({
      success: false,
      error: 'Erro na limpeza de arquivos temporários',
      timestamp: new Date().toISOString()
    })
  }
})

export default router

// Cleanup old requests periodically (every 5 minutes)
setInterval(() => {
  const now = Date.now()
  const expiredRequests: string[] = []
  
  for (const [requestId, info] of activeRequests.entries()) {
    if (now - info.startTime > REQUEST_TIMEOUT_MS) {
      clearTimeout(info.timeout)
      expiredRequests.push(requestId)
    }
  }
  
  expiredRequests.forEach(requestId => {
    activeRequests.delete(requestId)
    console.log(`[DANFE Cleanup] Removed expired request: ${requestId}`)
  })
  
  if (expiredRequests.length > 0) {
    console.log(`[DANFE Cleanup] Cleaned up ${expiredRequests.length} expired requests`)
  }
}, 5 * 60 * 1000) // 5 minutes

/**
 * GET /api/danfe/status
 * Retorna informações sobre recursos ativos
 */
router.get('/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Middleware já garantiu autenticação - req.user está disponível
    const now = Date.now()
    const activeRequestsInfo = Array.from(activeRequests.entries()).map(([id, info]) => ({
      requestId: id,
      duration: now - info.startTime,
      startTime: new Date(info.startTime).toISOString()
    }))

    const tempFiles = await danfeGenerator.listTempFiles()
    const tempDirs = danfeGenerator.getTempDirectories()

    res.json({
      success: true,
      activeRequests: activeRequestsInfo,
      totalActiveRequests: activeRequests.size,
      maxConcurrentRequests: MAX_CONCURRENT_REQUESTS,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      tempDirectories: tempDirs,
      tempFiles: {
        xml: tempFiles.xml.length,
        pdf: tempFiles.pdf.length,
        total: tempFiles.xml.length + tempFiles.pdf.length
      },
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('[DANFE Status] Status check error:', error)
    
    res.status(500).json({
      success: false,
      error: 'Erro na verificação de status',
      timestamp: new Date().toISOString()
    })
  }
})