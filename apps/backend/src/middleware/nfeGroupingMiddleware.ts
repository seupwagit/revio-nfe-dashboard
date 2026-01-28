/**
 * NFE Grouping Middleware
 * 
 * Middleware para inicializar e validar configuração de agrupamento por CHV_NFE
 */

import { NextFunction, Request, Response } from 'express'
import { getValidatedGroupingConfig, logGroupingConfig } from '../utils/nfeGrouping'

/**
 * Middleware para inicializar configuração de agrupamento
 * Executa apenas uma vez na inicialização do servidor
 */
export function initializeNfeGrouping(): void {
  console.log('[NFE_GROUPING] 🚀 Inicializando sistema de agrupamento...')
  
  try {
    const config = getValidatedGroupingConfig()
    
    if (config.enabled) {
      console.log('[NFE_GROUPING] ✅ Sistema de agrupamento habilitado')
      console.log('[NFE_GROUPING] 🔑 Chaves configuradas:', config.keys.join(', '))
      console.log('[NFE_GROUPING] 📋 Comportamento:')
      console.log('   - Notas com CHV_NFE idênticas (com ou sem prefixo "NFe") serão agrupadas')
      console.log('   - Apenas a primeira nota de cada grupo será retornada')
      console.log('   - Contadores e agregações considerarão apenas notas únicas')
    } else {
      console.log('[NFE_GROUPING] ❌ Sistema de agrupamento desabilitado')
      console.log('[NFE_GROUPING] 📋 Comportamento:')
      console.log('   - Todas as notas serão retornadas sem agrupamento')
      console.log('   - Notas duplicadas (com prefixos diferentes) aparecerão separadamente')
    }

    // Log da configuração para debug
    logGroupingConfig()

  } catch (error) {
    console.error('[NFE_GROUPING] ❌ Erro ao inicializar sistema de agrupamento:', error)
    console.error('[NFE_GROUPING] ⚠️ Sistema continuará funcionando sem agrupamento')
  }
}

/**
 * Middleware para adicionar informações de agrupamento aos headers de resposta
 * Útil para debug e monitoramento
 */
export function nfeGroupingInfoMiddleware(req: Request, res: Response, next: NextFunction): void {
  try {
    const config = getValidatedGroupingConfig()
    
    // Adicionar headers informativos
    res.setHeader('X-NFE-Grouping-Enabled', config.enabled.toString())
    
    if (config.enabled) {
      res.setHeader('X-NFE-Grouping-Keys', config.keys.join(','))
    }

    // Adicionar informações ao contexto da requisição para uso posterior
    ;(req as any).nfeGroupingConfig = config

  } catch (error) {
    console.error('[NFE_GROUPING] ❌ Erro no middleware de agrupamento:', error)
    // Não bloquear a requisição em caso de erro
  }

  next()
}

/**
 * Middleware para log de debug de agrupamento em rotas específicas
 * Usar apenas em desenvolvimento ou quando necessário debug
 */
export function nfeGroupingDebugMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (process.env.NODE_ENV === 'development') {
    const config = getValidatedGroupingConfig()
    
    console.log('[NFE_GROUPING_DEBUG] 🔍 Requisição:', {
      method: req.method,
      path: req.path,
      query: req.query,
      groupingEnabled: config.enabled,
      groupingKeys: config.keys
    })
  }

  next()
}

/**
 * Função utilitária para obter configuração de agrupamento de uma requisição
 */
export function getGroupingConfigFromRequest(req: Request): { enabled: boolean; keys: string[] } {
  const config = (req as any).nfeGroupingConfig
  
  if (config) {
    return config
  }

  // Fallback: obter configuração diretamente
  return getValidatedGroupingConfig()
}