/**
 * DatabaseRouter - Roteador de Base de Dados
 * 
 * Responsável por gerenciar conexões dinâmicas com SQL Server e MongoDB
 * baseado na base de dados do cliente autenticado
 */

import { PrismaClient } from '@prisma/client'
import mongoose from 'mongoose'
import { getPrismaClient } from '../database/prisma'
import { ContextError, UserContext } from '../types/UserContext'
import { connectionMetricsService } from './ConnectionMetricsService'
import { fallbackNotificationService } from './FallbackNotificationService'
import { userContextManager } from './UserContextManager'

export interface ConnectionConfig {
  sqlServer: {
    host: string
    port: number
    user: string
    password: string
    database: string
  }
  mongodb: {
    connectionString: string
    database: string
  }
}

interface DatabaseCredentials {
  sqlServer: {
    host: string
    user: string
    password: string
    port: number
  }
  mongodb: {
    host: string
    connectionString: string
  }
}

interface ConnectionMetrics {
  totalConnections: number
  activeClientConnections: number
  fallbackUsage: number
  connectionErrors: number
  lastError?: Date
}

interface ConnectionResilience {
  maxRetries: number
  retryDelay: number
  backoffMultiplier: number
  circuitBreakerThreshold: number
  healthCheckInterval: number
}

export class DatabaseRouter {
  private globalDatabase: string
  private clientConnections: Map<string, PrismaClient> = new Map()
  private credentials: DatabaseCredentials
  private metrics: ConnectionMetrics
  private resilience: ConnectionResilience
  private circuitBreakers: Map<string, { failures: number; lastFailure: Date; isOpen: boolean }> = new Map()

  constructor() {
    this.globalDatabase = 'spedrevio'
    
    // Configurar credenciais baseadas nas variáveis de ambiente
    this.credentials = {
      sqlServer: {
        host: process.env.VITE_DB_SERVER || '10.0.0.4',
        user: process.env.VITE_DB_USER || 'sa',
        password: process.env.VITE_DB_PASSWORD || 'zaqwsx2001',
        port: 1433
      },
      mongodb: {
        host: process.env.VITE_DB_HOST || '10.0.0.8',
        connectionString: process.env.VITE_MONGODB_CONNECTION_STRING || ''
      }
    }

    // Inicializar métricas
    this.metrics = {
      totalConnections: 0,
      activeClientConnections: 0,
      fallbackUsage: 0,
      connectionErrors: 0
    }

    // Configurar resilência
    this.resilience = {
      maxRetries: 3,
      retryDelay: 1000,
      backoffMultiplier: 2,
      circuitBreakerThreshold: 5,
      healthCheckInterval: 30000
    }

    // Validar configurações críticas
    this.validateConfiguration()
  }

  /**
   * Valida se as variáveis de ambiente estão configuradas corretamente
   */
  private validateConfiguration(): void {
    console.log('[DatabaseRouter] Validando configuração de conexões...')
    
    // Validar SQL Server
    if (!process.env.DATABASE_URL) {
      console.warn('[DatabaseRouter] ⚠️ DATABASE_URL não configurado - usando fallback')
    } else {
      console.log('[DatabaseRouter] ✅ DATABASE_URL configurado')
    }
    
    // Validar MongoDB
    if (!this.credentials.mongodb.connectionString) {
      console.warn('[DatabaseRouter] ⚠️ VITE_MONGODB_CONNECTION_STRING não configurado')
    } else {
      console.log('[DatabaseRouter] ✅ VITE_MONGODB_CONNECTION_STRING configurado')
    }
    
    console.log('[DatabaseRouter] Configuração:')
    console.log('   SQL Server Host:', this.credentials.sqlServer.host)
    console.log('   MongoDB Host:', this.credentials.mongodb.host)
    console.log('   Base Global:', this.globalDatabase)
  }

  /**
   * Obtém conexão SQL Server para uma base de dados específica
   * Usa DATABASE_URL como base e substitui o database dinamicamente
   * Implementa retry com backoff exponencial
   */
  async getSqlConnection(bancoDeDados?: string): Promise<PrismaClient | null> {
    // Se não especificado, usar conexão global
    if (!bancoDeDados) {
      return this.getGlobalSqlConnection()
    }

    // Verificar se já existe conexão para esta base
    if (this.clientConnections.has(bancoDeDados)) {
      return this.clientConnections.get(bancoDeDados)!
    }

    // Tentar criar conexão com retry
    return this.createSqlConnectionWithRetry(bancoDeDados)
  }

  /**
   * Cria conexão SQL com retry e backoff exponencial
   */
  private async createSqlConnectionWithRetry(bancoDeDados: string, attempt: number = 0): Promise<PrismaClient | null> {
    const startTime = Date.now()
    
    try {
      // Criar nova conexão dinâmica baseada em DATABASE_URL
      const baseUrl = process.env.DATABASE_URL
      if (!baseUrl) {
        console.warn('[DatabaseRouter] DATABASE_URL não configurado')
        return this.getGlobalSqlConnection()
      }

      // Substituir o database na connection string de forma robusta
      let dynamicUrl = baseUrl;
      
      if (baseUrl.includes('database=')) {
        dynamicUrl = baseUrl.replace(/database=([^;]+)/i, `database=${bancoDeDados}`);
      } else if (baseUrl.includes(';Initial Catalog=')) {
        dynamicUrl = baseUrl.replace(/Initial Catalog=([^;]+)/i, `Initial Catalog=${bancoDeDados}`);
      } else if (baseUrl.includes('//') && baseUrl.includes('/') && !baseUrl.includes('database=')) {
        // Formato URL: sqlserver://host:port/database?options
        const urlParts = baseUrl.split('?');
        const urlBase = urlParts[0];
        const lastSlashIndex = urlBase.lastIndexOf('/');
        if (lastSlashIndex > baseUrl.indexOf('//') + 1) {
          dynamicUrl = urlBase.substring(0, lastSlashIndex + 1) + bancoDeDados + (urlParts[1] ? '?' + urlParts[1] : '');
        }
      }
      
      const client = new PrismaClient({
        datasources: {
          db: {
            url: dynamicUrl
          }
        },
        log: ['error', 'warn'],
        errorFormat: 'pretty'
      })

      this.clientConnections.set(bancoDeDados, client)
      this.metrics.totalConnections++
      this.metrics.activeClientConnections = this.clientConnections.size
      
      // Registrar métrica de conexão bem-sucedida
      await connectionMetricsService.recordMetric(
        bancoDeDados,
        'sql',
        'connect',
        this.getCurrentContextFromManager() || undefined,
        Date.now() - startTime
      )
      
      console.log(`[DatabaseRouter] Conexão SQL criada para: ${bancoDeDados}`)
      
      return client
    } catch (error) {
      console.error(`[DatabaseRouter] Erro ao criar conexão SQL para ${bancoDeDados} (tentativa ${attempt + 1}/${this.resilience.maxRetries}):`, error)
      this.metrics.connectionErrors++
      this.metrics.lastError = new Date()
      this.updateCircuitBreaker(bancoDeDados, false)

      // Registrar métrica de erro
      await connectionMetricsService.recordMetric(
        bancoDeDados,
        'sql',
        'error',
        this.getCurrentContextFromManager() || undefined,
        Date.now() - startTime,
        error instanceof Error ? error.message : String(error)
      )

      // Tentar novamente com backoff exponencial
      if (attempt < this.resilience.maxRetries - 1) {
        const delay = this.resilience.retryDelay * Math.pow(this.resilience.backoffMultiplier, attempt)
        console.log(`[DatabaseRouter] Aguardando ${delay}ms antes de tentar novamente...`)
        
        // Usar setTimeout para aguardar antes de tentar novamente
        // Nota: Em produção, considere usar uma abordagem assíncrona
        const start = Date.now()
        while (Date.now() - start < delay) {
          // Busy wait (não ideal, mas funciona para demonstração)
        }
        
        return this.createSqlConnectionWithRetry(bancoDeDados, attempt + 1)
      }

      // Todas as tentativas falharam, usar fallback
      console.error(`[DatabaseRouter] Todas as tentativas falharam para ${bancoDeDados}, usando fallback`)
      
      // Registrar métrica de fallback
      await connectionMetricsService.recordMetric(
        bancoDeDados,
        'sql',
        'fallback',
        this.getCurrentContextFromManager() || undefined,
        undefined,
        'Todas as tentativas de conexão falharam'
      )
      
      return this.getGlobalSqlConnection()
    }
  }

  /**
   * Obtém conexão SQL Server baseada no contexto atual do usuário
   * ATUALIZADO: Usa método transparente para garantir transparência total
   */
  async getCurrentSqlConnection(): Promise<PrismaClient | null> {
    try {
      // Tentar obter contexto do UserContextManager primeiro
      const userContext = this.getCurrentContextFromManager()
      
      if (userContext && userContext.bancoDeDados) {
        // Verificar circuit breaker
        if (this.isCircuitBreakerOpen(userContext.bancoDeDados)) {
          console.warn(`[DatabaseRouter] Circuit breaker aberto para ${userContext.bancoDeDados}, usando fallback`)
          this.metrics.fallbackUsage++
          this.logConnectionEvent('fallback_used', userContext.bancoDeDados, userContext.usrCodigo, 'Circuit breaker aberto')
          
          // Notificar usuário sobre fallback
          await this.notifyFallbackUsage(userContext, 'Circuit breaker ativo - base temporariamente indisponível', 'sql')
          
          return this.getGlobalSqlConnection()
        }

        const connection = await this.getSqlConnection(userContext.bancoDeDados)
        if (connection) {
          this.updateCircuitBreaker(userContext.bancoDeDados, true)
          this.logConnectionEvent('connection_created', userContext.bancoDeDados, userContext.usrCodigo)
          return connection
        } else {
          // Conexão falhou, notificar usuário
          await this.notifyFallbackUsage(userContext, 'Erro na conexão com base específica', 'sql')
        }
      }

      // Fallback para conexão global
      this.metrics.fallbackUsage++
      this.logConnectionEvent('fallback_used', 'spedrevio', userContext?.usrCodigo, 'Sem contexto de usuário')
      return this.getGlobalSqlConnection()

    } catch (error) {
      console.error('[DatabaseRouter] Erro ao obter conexão SQL atual:', error)
      this.metrics.connectionErrors++
      this.logConnectionEvent('connection_failed', 'unknown', undefined, error instanceof Error ? error.message : String(error))
      return this.getGlobalSqlConnection()
    }
  }

  /**
   * Obtém conexão SQL Server com fallback garantido
   */
  async getSqlConnectionWithFallback(): Promise<PrismaClient> {
    const connection = await this.getCurrentSqlConnection()
    if (connection) {
      return connection
    }

    // Fallback garantido
    const globalConnection = this.getGlobalSqlConnection()
    if (!globalConnection) {
      throw new ContextError('DATABASE_UNAVAILABLE', 'Nenhuma conexão SQL disponível')
    }

    return globalConnection
  }

  /**
   * Obtém conexão MongoDB para uma base de dados específica
   * Usa VITE_MONGODB_CONNECTION_STRING como base e substitui o database
   * Implementa retry com backoff exponencial
   */
  async getMongoConnection(bancoDeDados?: string): Promise<mongoose.Connection> {
    if (!bancoDeDados) {
      return mongoose.connection
    }

    return this.createMongoConnectionWithRetry(bancoDeDados)
  }

  /**
   * Cria conexão MongoDB com retry e backoff exponencial
   */
  private async createMongoConnectionWithRetry(bancoDeDados: string, attempt: number = 0): Promise<mongoose.Connection> {
    const startTime = Date.now()
    
    try {
      // Usar useDb para acessar base específica na mesma conexão
      const db = mongoose.connection.useDb(bancoDeDados)
      
      // Registrar métrica de conexão bem-sucedida
      await connectionMetricsService.recordMetric(
        bancoDeDados,
        'mongo',
        'connect',
        this.getCurrentContextFromManager() || undefined,
        Date.now() - startTime
      )
      
      console.log(`[DatabaseRouter] Usando MongoDB database: ${bancoDeDados}`)
      return db
    } catch (error) {
      console.error(`[DatabaseRouter] Erro ao acessar MongoDB database ${bancoDeDados} (tentativa ${attempt + 1}/${this.resilience.maxRetries}):`, error)
      this.metrics.connectionErrors++
      this.metrics.lastError = new Date()

      // Registrar métrica de erro
      await connectionMetricsService.recordMetric(
        bancoDeDados,
        'mongo',
        'error',
        this.getCurrentContextFromManager() || undefined,
        Date.now() - startTime,
        error instanceof Error ? error.message : String(error)
      )

      // Tentar novamente com backoff exponencial
      if (attempt < this.resilience.maxRetries - 1) {
        const delay = this.resilience.retryDelay * Math.pow(this.resilience.backoffMultiplier, attempt)
        console.log(`[DatabaseRouter] Aguardando ${delay}ms antes de tentar novamente...`)
        
        // Usar setTimeout para aguardar antes de tentar novamente
        const start = Date.now()
        while (Date.now() - start < delay) {
          // Busy wait (não ideal, mas funciona para demonstração)
        }
        
        return this.createMongoConnectionWithRetry(bancoDeDados, attempt + 1)
      }

      // Todas as tentativas falharam, usar fallback
      console.error(`[DatabaseRouter] Todas as tentativas falharam para MongoDB ${bancoDeDados}, usando fallback`)
      
      // Registrar métrica de fallback
      await connectionMetricsService.recordMetric(
        bancoDeDados,
        'mongo',
        'fallback',
        this.getCurrentContextFromManager() || undefined,
        undefined,
        'Todas as tentativas de conexão falharam'
      )
      
      return mongoose.connection
    }
  }

  /**
   * Obtém conexão MongoDB baseada no contexto atual do usuário
   * ATUALIZADO: Usa método transparente para garantir transparência total
   */
  async getCurrentMongoConnection(): Promise<mongoose.Connection> {
    try {
      // Tentar obter contexto do UserContextManager primeiro
      const userContext = this.getCurrentContextFromManager()
      
      if (userContext && userContext.bancoDeDados) {
        // Verificar circuit breaker
        if (this.isCircuitBreakerOpen(userContext.bancoDeDados)) {
          console.warn(`[DatabaseRouter] Circuit breaker aberto para MongoDB ${userContext.bancoDeDados}, usando fallback`)
          this.metrics.fallbackUsage++
          this.logConnectionEvent('fallback_used', userContext.bancoDeDados, userContext.usrCodigo, 'Circuit breaker aberto')
          
          // Notificar usuário sobre fallback
          await this.notifyFallbackUsage(userContext, 'Circuit breaker ativo - base temporariamente indisponível', 'mongo')
          
          return mongoose.connection
        }

        const connection = await this.getMongoConnection(userContext.bancoDeDados)
        this.updateCircuitBreaker(userContext.bancoDeDados, true)
        this.logConnectionEvent('connection_created', userContext.bancoDeDados, userContext.usrCodigo)
        return connection
      }

      // Fallback para conexão global
      this.metrics.fallbackUsage++
      this.logConnectionEvent('fallback_used', 'spedrevio', userContext?.usrCodigo, 'Sem contexto de usuário')
      return mongoose.connection

    } catch (error) {
      console.error('[DatabaseRouter] Erro ao obter conexão MongoDB atual:', error)
      this.metrics.connectionErrors++
      this.logConnectionEvent('connection_failed', 'unknown', undefined, error instanceof Error ? error.message : String(error))
      
      // Notificar usuário sobre erro se houver contexto
      const userContext = this.getCurrentContextFromManager()
      if (userContext) {
        await this.notifyFallbackUsage(userContext, 'Erro na conexão MongoDB', 'mongo')
      }
      
      return mongoose.connection
    }
  }

  /**
   * Obtém conexão MongoDB com fallback garantido
   */
  async getMongoConnectionWithFallback(): Promise<mongoose.Connection> {
    try {
      return await this.getCurrentMongoConnection()
    } catch (error) {
      console.error('[DatabaseRouter] Erro na conexão MongoDB, usando fallback:', error)
      return mongoose.connection
    }
  }

  /**
   * Reverte para a base global (spedrevio)
   */
  resetToGlobal(): void {
    // Fechar todas as conexões específicas
    this.clientConnections.forEach(async (client, database) => {
      try {
        await client.$disconnect()
        console.log(`[DatabaseRouter] Conexão fechada para: ${database}`)
      } catch (error) {
        console.error(`[DatabaseRouter] Erro ao fechar conexão ${database}:`, error)
      }
    })
    
    this.clientConnections.clear()
    console.log('[DatabaseRouter] Reset para base global concluído')
  }

  /**
   * Obtém a conexão global (spedrevio)
   */
  getGlobalSqlConnection(): PrismaClient | null {
    try {
      console.log('[DatabaseRouter] 🔍 Obtendo conexão SQL global...')
      const globalClient = getPrismaClient()
      
      if (globalClient) {
        console.log('[DatabaseRouter] ✅ Conexão SQL global obtida com sucesso')
      } else {
        console.log('[DatabaseRouter] ❌ Conexão SQL global não disponível')
      }
      
      return globalClient
    } catch (error) {
      console.error('[DatabaseRouter] 💥 Erro ao obter conexão SQL global:', error)
      console.warn('[DatabaseRouter] Prisma não disponível:', error instanceof Error ? error.message : error)
      return null
    }
  }

  /**
   * Obtém a conexão MongoDB global
   */
  getGlobalMongoConnection(): mongoose.Connection {
    return mongoose.connection
  }

  /**
   * Fecha uma conexão específica
   */
  async closeConnection(bancoDeDados: string): Promise<void> {
    const client = this.clientConnections.get(bancoDeDados)
    if (client) {
      await client.$disconnect()
      this.clientConnections.delete(bancoDeDados)
      console.log(`Conexão fechada para: ${bancoDeDados}`)
    }
  }

  /**
   * Lista todas as conexões ativas
   */
  getActiveConnections(): string[] {
    return [this.globalDatabase, ...Array.from(this.clientConnections.keys())]
  }

  /**
   * Obtém informações sobre as configurações de conexão (para debug)
   */
  getConnectionInfo(): {
    sqlServer: { host: string; port: number; hasUrl: boolean }
    mongodb: { host: string; hasConnectionString: boolean }
    activeConnections: string[]
  } {
    return {
      sqlServer: {
        host: this.credentials.sqlServer.host,
        port: this.credentials.sqlServer.port,
        hasUrl: !!process.env.DATABASE_URL
      },
      mongodb: {
        host: this.credentials.mongodb.host,
        hasConnectionString: !!this.credentials.mongodb.connectionString
      },
      activeConnections: this.getActiveConnections()
    }
  }

  /**
   * Cleanup - fechar todas as conexões
   */
  async cleanup(): Promise<void> {
    // Fechar todas as conexões específicas
    for (const [database, client] of this.clientConnections) {
      try {
        await client.$disconnect()
        console.log(`Conexão fechada para: ${database}`)
      } catch (error) {
        console.error(`Erro ao fechar conexão ${database}:`, error)
      }
    }
    this.clientConnections.clear()
    this.metrics.activeClientConnections = 0
  }

  // ========== MÉTODOS CONTEXT-AWARE ==========

  /**
   * Define o contexto do usuário atual
   * @deprecated Agora o contexto é gerenciado automaticamente pelo UserContextMiddleware via AsyncLocalStorage
   */
  setUserContext(context: UserContext): void {
    const requestId = userContextManager.getCurrentRequestId()
    this.logConnectionEvent('context_set', context.bancoDeDados, context.usrCodigo, requestId ? `Request: ${requestId}` : 'No Request ID')
    console.log(`[DatabaseRouter] Contexto (ALS) disponível para: ${context.usrNome} -> ${context.bancoDeDados}`)
  }

  /**
   * Limpa o contexto do usuário atual
   * @deprecated Limpeza automática via UserContextMiddleware.cleanupContext
   */
  clearUserContext(): void {
    // Agora limpo automaticamente pelo manager ao fim da requisição
  }

  /**
   * Obtém o contexto do usuário atual
   */
  getCurrentContext(): UserContext | null {
    return this.getCurrentContextFromManager()
  }

  /**
   * Obtém o contexto do usuário atual do UserContextManager
   * Usa AsyncLocalStorage isolado por requisição
   */
  private getCurrentContextFromManager(): UserContext | null {
    try {
      // Obter do AsyncLocalStorage via UserContextManager (Seguro para concorrência)
      const dbContext = userContextManager.getCurrentContext()
      if (dbContext && dbContext.userContext) {
        return dbContext.userContext
      }

      return null
    } catch (error) {
      console.error('[DatabaseRouter] Erro ao obter contexto do manager:', error)
      return null
    }
  }

  // ========== MÉTODOS DE TRANSPARÊNCIA DE ROTEAMENTO ==========

  /**
   * Obtém conexão SQL transparente - retorna automaticamente a conexão correta
   * baseada no contexto atual sem necessidade de especificar base
   */
  async getTransparentSqlConnection(): Promise<PrismaClient> {
    try {
      const userContext = this.getCurrentContextFromManager()
      
      if (userContext && userContext.bancoDeDados) {
        // Usuário autenticado - tentar conexão específica
        try {
          const specificConnection = await this.getSqlConnection(userContext.bancoDeDados)
          if (specificConnection) {
            this.logConnectionEvent('connection_created', userContext.bancoDeDados, userContext.usrCodigo)
            return specificConnection
          }
        } catch (error) {
          console.warn(`[DatabaseRouter] Erro na conexão específica para ${userContext.bancoDeDados}:`, error)
        }
        
        // Falha na conexão específica - usar fallback
        console.warn(`[DatabaseRouter] Falha na conexão específica para ${userContext.bancoDeDados}, usando fallback`)
        await this.notifyFallbackUsage(userContext, 'Conexão específica indisponível', 'sql')
        this.metrics.fallbackUsage++
      }

      // Sem contexto ou falha - usar conexão global
      const globalConnection = this.getGlobalSqlConnection()
      if (!globalConnection) {
        throw new ContextError('DATABASE_UNAVAILABLE', 'Nenhuma conexão SQL disponível')
      }

      this.logConnectionEvent('fallback_used', 'spedrevio', userContext?.usrCodigo, 'Usando conexão global')
      return globalConnection

    } catch (error) {
      console.error('[DatabaseRouter] Erro na conexão SQL transparente:', error)
      this.metrics.connectionErrors++
      
      // Último recurso - tentar conexão global
      const globalConnection = this.getGlobalSqlConnection()
      if (globalConnection) {
        return globalConnection
      }
      
      throw new ContextError('DATABASE_UNAVAILABLE', 'Todas as conexões SQL falharam')
    }
  }

  /**
   * Obtém conexão MongoDB transparente - retorna automaticamente a conexão correta
   * baseada no contexto atual sem necessidade de especificar base
   */
  async getTransparentMongoConnection(): Promise<mongoose.Connection> {
    try {
      const userContext = this.getCurrentContextFromManager()
      
      if (userContext && userContext.bancoDeDados) {
        // Usuário autenticado - tentar conexão específica
        try {
          const specificConnection = await this.getMongoConnection(userContext.bancoDeDados)
          this.logConnectionEvent('connection_created', userContext.bancoDeDados, userContext.usrCodigo)
          return specificConnection
        } catch (error) {
          // Falha na conexão específica - usar fallback
          console.warn(`[DatabaseRouter] Falha na conexão MongoDB específica para ${userContext.bancoDeDados}, usando fallback`)
          await this.notifyFallbackUsage(userContext, 'Conexão MongoDB específica indisponível', 'mongo')
          this.metrics.fallbackUsage++
        }
      }

      // Sem contexto ou falha - usar conexão global
      this.logConnectionEvent('fallback_used', 'spedrevio', userContext?.usrCodigo, 'Usando conexão MongoDB global')
      return mongoose.connection

    } catch (error) {
      console.error('[DatabaseRouter] Erro na conexão MongoDB transparente:', error)
      this.metrics.connectionErrors++
      
      // Sempre retornar conexão global como fallback
      return mongoose.connection
    }
  }

  /**
   * Suporte para mudança dinâmica de contexto
   * Permite que o contexto seja alterado durante a execução
   */
  async switchUserContext(newContext: UserContext): Promise<void> {
    try {
      const oldContext = this.getCurrentContext()
      
      // Limpar contexto anterior se existir
      if (oldContext) {
        this.logConnectionEvent('context_cleared', oldContext.bancoDeDados, oldContext.usrCodigo, 'Mudança de contexto')
      }

      // Definir novo contexto
      this.setUserContext(newContext)
      
      // Pré-validar conexões do novo contexto
      await this.preValidateConnections(newContext)
      
      console.log(`[DatabaseRouter] Contexto alterado: ${oldContext?.usrNome || 'nenhum'} -> ${newContext.usrNome}`)
      
    } catch (error) {
      console.error('[DatabaseRouter] Erro ao alterar contexto:', error)
      throw new ContextError('CONTEXT_SWITCH_FAILED', `Falha ao alterar contexto: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  /**
   * Pré-valida conexões para um contexto específico
   */
  private async preValidateConnections(context: UserContext): Promise<void> {
    try {
      // Validar conexão SQL
      const sqlConnection = await this.getSqlConnection(context.bancoDeDados)
      if (sqlConnection) {
        await sqlConnection.$queryRaw`SELECT 1 as test`
      }

      // Validar conexão MongoDB
      const mongoConnection = await this.getMongoConnection(context.bancoDeDados)
      if (mongoConnection && mongoConnection.db) {
        await mongoConnection.db.admin().ping()
      }

      console.log(`[DatabaseRouter] Conexões validadas para contexto: ${context.bancoDeDados}`)

    } catch (error) {
      console.warn(`[DatabaseRouter] Aviso: Falha na pré-validação de conexões para ${context.bancoDeDados}:`, error)
      // Não propagar erro - fallback será usado quando necessário
    }
  }

  /**
   * Garante isolamento entre usuários simultâneos
   * Verifica se não há vazamento de contexto entre requisições
   */
  validateContextIsolation(requestId: string, expectedContext: UserContext | null): boolean {
    try {
      const currentContext = this.getCurrentContext()
      
      // Se não há contexto esperado, verificar se contexto atual também é nulo
      if (!expectedContext) {
        return !currentContext
      }

      // Se há contexto esperado, verificar se corresponde ao atual
      if (!currentContext) {
        console.warn(`[DatabaseRouter] Isolamento: Contexto esperado mas não encontrado (Request: ${requestId})`)
        return false
      }

      // Verificar se os contextos correspondem
      const isIsolated = (
        currentContext.usrCodigo === expectedContext.usrCodigo &&
        currentContext.bancoDeDados === expectedContext.bancoDeDados
      )

      if (!isIsolated) {
        console.error(`[DatabaseRouter] VIOLAÇÃO DE ISOLAMENTO: Contexto atual (${currentContext.usrCodigo}/${currentContext.bancoDeDados}) != Esperado (${expectedContext.usrCodigo}/${expectedContext.bancoDeDados}) (Request: ${requestId})`)
      }

      return isIsolated

    } catch (error) {
      console.error('[DatabaseRouter] Erro na validação de isolamento:', error)
      return false
    }
  }

  /**
   * Força limpeza de contexto para garantir isolamento
   */
  forceContextCleanup(reason: string = 'Limpeza forçada'): void {
    try {
      const requestId = userContextManager.getCurrentRequestId()
      
      if (requestId) {
        userContextManager.clearContext(requestId)
      }

      console.log(`[DatabaseRouter] Contexto limpo forçadamente: ${reason}`)

    } catch (error) {
      console.error('[DatabaseRouter] Erro na limpeza forçada de contexto:', error)
    }
  }

  /**
   * Obtém informações de diagnóstico sobre transparência
   */
  getTransparencyDiagnostics(): {
    hasContext: boolean
    currentUser: string | null
    currentDatabase: string | null
    isUsingFallback: boolean
    activeConnections: number
    metrics: ConnectionMetrics
  } {
    const context = this.getCurrentContext()
    
    return {
      hasContext: !!context,
      currentUser: context?.usrNome || null,
      currentDatabase: context?.bancoDeDados || null,
      isUsingFallback: this.isUsingFallback(),
      activeConnections: this.clientConnections.size,
      metrics: this.getConnectionMetrics()
    }
  }

  /**
   * Integração com UserContextManager para contextos por requisição
   * Este método será usado pelo middleware para definir contexto por requisição
   */
  setRequestContext(requestId: string, context: UserContext): void {
    // Para implementação futura com AsyncLocalStorage
    // Por enquanto, usar setUserContext para compatibilidade
    this.setUserContext(context)
  }

  /**
   * Limpa contexto de uma requisição específica
   */
  clearRequestContext(requestId: string): void {
    // Para implementação futura com AsyncLocalStorage
    // Por enquanto, usar clearUserContext para compatibilidade
    this.clearUserContext()
  }

  /**
   * Verifica se está usando fallback
   */
  isUsingFallback(): boolean {
    const context = this.getCurrentContext()
    return !context || !context.bancoDeDados
  }

  /**
   * Obtém métricas de conexão
   */
  getConnectionMetrics(): ConnectionMetrics {
    this.metrics.activeClientConnections = this.clientConnections.size
    return { ...this.metrics }
  }

  /**
   * Notifica usuário sobre uso de fallback
   */
  private async notifyFallbackUsage(userContext: UserContext, reason: string, databaseType: 'sql' | 'mongo'): Promise<void> {
    try {
      await fallbackNotificationService.notifyFallbackUsage(userContext, reason, databaseType)
    } catch (error) {
      console.error('[DatabaseRouter] Erro ao notificar fallback:', error)
    }
  }

  // ========== CIRCUIT BREAKER ==========

  /**
   * Registra eventos de conexão para auditoria
   */
  private logConnectionEvent(
    type: 'connection_created' | 'connection_failed' | 'fallback_used' | 'context_set' | 'context_cleared',
    database: string,
    userId?: string,
    error?: string
  ): void {
    try {
      const event = {
        type,
        database,
        userId,
        error,
        timestamp: new Date().toISOString()
      }

      console.log(`[DatabaseRouter] ${type.toUpperCase()}: ${database}${userId ? ` (user: ${userId})` : ''}${error ? ` - ${error}` : ''}`)

      // Para implementação futura: enviar para sistema de auditoria
      // auditLogger.logConnectionEvent(event)

    } catch (logError) {
      console.error('[DatabaseRouter] Erro ao registrar evento de conexão:', logError)
    }
  }

  /**
   * Verifica se o circuit breaker está aberto para uma base
   */
  private isCircuitBreakerOpen(database: string): boolean {
    const breaker = this.circuitBreakers.get(database)
    if (!breaker) {
      return false
    }

    if (breaker.isOpen) {
      // Verificar se deve tentar novamente (após 30 segundos)
      const timeSinceLastFailure = Date.now() - breaker.lastFailure.getTime()
      if (timeSinceLastFailure > 30000) {
        breaker.isOpen = false
        breaker.failures = 0
        console.log(`[DatabaseRouter] Circuit breaker resetado para: ${database}`)
        return false
      }
      return true
    }

    return false
  }

  /**
   * Atualiza o circuit breaker baseado no sucesso/falha
   */
  private updateCircuitBreaker(database: string, success: boolean): void {
    let breaker = this.circuitBreakers.get(database)
    
    if (!breaker) {
      breaker = { failures: 0, lastFailure: new Date(), isOpen: false }
      this.circuitBreakers.set(database, breaker)
    }

    if (success) {
      breaker.failures = 0
      breaker.isOpen = false
    } else {
      breaker.failures++
      breaker.lastFailure = new Date()
      
      if (breaker.failures >= this.resilience.circuitBreakerThreshold) {
        breaker.isOpen = true
        console.warn(`[DatabaseRouter] Circuit breaker aberto para: ${database} (${breaker.failures} falhas)`)
      }
    }
  }
}

// Singleton instance
export const databaseRouter = new DatabaseRouter()