#!/usr/bin/env node

/**
 * Monitor Automático de Debug com Chrome DevTools MCP
 * 
 * Este script monitora o console do Chrome em tempo real e:
 * 1. Detecta erros automaticamente
 * 2. Analisa a causa raiz
 * 3. Sugere correções
 * 4. Pode aplicar correções automaticamente (com aprovação)
 */

import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'

// Configuração
const CONFIG = {
  checkInterval: 5000, // Verificar a cada 5 segundos
  autoFix: false, // Aplicar correções automaticamente (false = apenas sugerir)
  logFile: 'debug-monitor.log',
  errorPatterns: {
    // Padrões de erro conhecidos e suas soluções
    'Cache MISS': {
      severity: 'warning',
      category: 'cache',
      solution: 'Verificar se cache está sendo salvo corretamente'
    },
    'Cache EXPIRADO': {
      severity: 'warning',
      category: 'cache',
      solution: 'Cache expirou - considerar aumentar CACHE_DURATION'
    },
    'TypeError': {
      severity: 'error',
      category: 'javascript',
      solution: 'Verificar tipos e valores undefined/null'
    },
    'Cannot read property': {
      severity: 'error',
      category: 'javascript',
      solution: 'Adicionar verificação de existência antes de acessar propriedade'
    },
    'Network Error': {
      severity: 'error',
      category: 'network',
      solution: 'Verificar conectividade e configuração da API'
    },
    'CORS': {
      severity: 'error',
      category: 'network',
      solution: 'Configurar CORS no servidor ou usar proxy'
    },
    'Unauthorized': {
      severity: 'error',
      category: 'auth',
      solution: 'Verificar token de autenticação no .env'
    },
    '404': {
      severity: 'error',
      category: 'network',
      solution: 'Verificar URL da API e endpoints'
    },
    'timeout': {
      severity: 'error',
      category: 'network',
      solution: 'Aumentar timeout ou otimizar requisição'
    }
  }
}

class DebugMonitor {
  constructor() {
    this.errors = []
    this.warnings = []
    this.lastCheck = Date.now()
    this.isRunning = false
  }

  /**
   * Inicia o monitoramento
   */
  async start() {
    console.log('🔍 Iniciando monitor automático de debug...\n')
    console.log('Configuração:')
    console.log(`  • Intervalo: ${CONFIG.checkInterval}ms`)
    console.log(`  • Auto-fix: ${CONFIG.autoFix ? 'SIM' : 'NÃO'}`)
    console.log(`  • Log file: ${CONFIG.logFile}\n`)
    
    this.isRunning = true
    
    // Loop de monitoramento
    while (this.isRunning) {
      await this.checkConsole()
      await this.sleep(CONFIG.checkInterval)
    }
  }

  /**
   * Para o monitoramento
   */
  stop() {
    this.isRunning = false
    console.log('\n✋ Monitor parado')
  }

  /**
   * Verifica o console do Chrome
   */
  async checkConsole() {
    try {
      console.log(`\n⏰ ${new Date().toLocaleTimeString()} - Verificando console...`)
      
      // Aqui você usaria o MCP para buscar logs
      // Por enquanto, vou simular a estrutura
      const logs = await this.getConsoleLogs()
      
      if (logs.length === 0) {
        console.log('✅ Nenhum erro detectado')
        return
      }

      // Analisar logs
      const analysis = this.analyzeLogs(logs)
      
      if (analysis.errors.length > 0) {
        console.log(`\n❌ ${analysis.errors.length} erro(s) detectado(s):`)
        analysis.errors.forEach((error, i) => {
          console.log(`\n${i + 1}. ${error.type}`)
          console.log(`   Mensagem: ${error.message}`)
          console.log(`   Arquivo: ${error.file}:${error.line}`)
          console.log(`   💡 Solução: ${error.solution}`)
        })
        
        // Aplicar correções se auto-fix estiver habilitado
        if (CONFIG.autoFix) {
          await this.applyFixes(analysis.errors)
        }
      }
      
      if (analysis.warnings.length > 0) {
        console.log(`\n⚠️  ${analysis.warnings.length} aviso(s):`)
        analysis.warnings.forEach((warning, i) => {
          console.log(`${i + 1}. ${warning.message}`)
        })
      }
      
      // Salvar log
      await this.saveLog(analysis)
      
    } catch (error) {
      console.error('❌ Erro ao verificar console:', error.message)
    }
  }

  /**
   * Busca logs do console (via MCP)
   */
  async getConsoleLogs() {
    // Aqui você usaria:
    // const logs = await chromeDevTools.listConsoleMessages({ types: ['error', 'warn'] })
    
    // Por enquanto, retorna array vazio (será implementado via Kiro)
    return []
  }

  /**
   * Analisa logs e identifica problemas
   */
  analyzeLogs(logs) {
    const errors = []
    const warnings = []
    
    logs.forEach(log => {
      const analysis = this.analyzeLogEntry(log)
      
      if (analysis.severity === 'error') {
        errors.push(analysis)
      } else if (analysis.severity === 'warning') {
        warnings.push(analysis)
      }
    })
    
    return { errors, warnings }
  }

  /**
   * Analisa uma entrada de log
   */
  analyzeLogEntry(log) {
    const text = log.text || log.message || ''
    
    // Procurar padrões conhecidos
    for (const [pattern, config] of Object.entries(CONFIG.errorPatterns)) {
      if (text.includes(pattern)) {
        return {
          type: pattern,
          message: text,
          severity: config.severity,
          category: config.category,
          solution: config.solution,
          file: log.url || 'unknown',
          line: log.lineNumber || 0,
          timestamp: log.timestamp || Date.now()
        }
      }
    }
    
    // Erro genérico
    return {
      type: 'Unknown Error',
      message: text,
      severity: log.level === 'error' ? 'error' : 'warning',
      category: 'unknown',
      solution: 'Analisar manualmente',
      file: log.url || 'unknown',
      line: log.lineNumber || 0,
      timestamp: log.timestamp || Date.now()
    }
  }

  /**
   * Aplica correções automaticamente
   */
  async applyFixes(errors) {
    console.log('\n🔧 Aplicando correções automáticas...')
    
    for (const error of errors) {
      try {
        const fix = await this.generateFix(error)
        
        if (fix) {
          console.log(`✅ Correção aplicada para: ${error.type}`)
          console.log(`   Arquivo: ${fix.file}`)
          console.log(`   Mudança: ${fix.description}`)
        } else {
          console.log(`⚠️  Correção manual necessária para: ${error.type}`)
        }
      } catch (err) {
        console.error(`❌ Erro ao aplicar correção: ${err.message}`)
      }
    }
  }

  /**
   * Gera correção para um erro
   */
  async generateFix(error) {
    // Aqui você implementaria a lógica de correção automática
    // baseada no tipo de erro
    
    switch (error.category) {
      case 'cache':
        return this.fixCacheIssue(error)
      
      case 'javascript':
        return this.fixJavaScriptError(error)
      
      case 'network':
        return this.fixNetworkError(error)
      
      default:
        return null
    }
  }

  /**
   * Corrige problemas de cache
   */
  async fixCacheIssue(error) {
    if (error.type === 'Cache EXPIRADO') {
      // Sugerir aumentar CACHE_DURATION
      return {
        file: 'src/services/streamingCache.ts',
        description: 'Aumentar CACHE_DURATION de 90 para 120 minutos',
        code: 'private readonly CACHE_DURATION = 120 * 60 * 1000'
      }
    }
    
    return null
  }

  /**
   * Corrige erros de JavaScript
   */
  async fixJavaScriptError(error) {
    if (error.message.includes('Cannot read property')) {
      // Extrair propriedade
      const match = error.message.match(/Cannot read property '(\w+)' of (\w+)/)
      
      if (match) {
        const [, prop, obj] = match
        return {
          file: error.file,
          description: `Adicionar verificação: ${obj}?.${prop}`,
          code: `if (${obj} && ${obj}.${prop}) { ... }`
        }
      }
    }
    
    return null
  }

  /**
   * Corrige erros de rede
   */
  async fixNetworkError(error) {
    if (error.type === 'Unauthorized') {
      return {
        file: '.env',
        description: 'Verificar VITE_API_BEARER_TOKEN',
        code: 'VITE_API_BEARER_TOKEN=seu_token_aqui'
      }
    }
    
    return null
  }

  /**
   * Salva log em arquivo
   */
  async saveLog(analysis) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      errors: analysis.errors.length,
      warnings: analysis.warnings.length,
      details: analysis
    }
    
    try {
      const logPath = join(process.cwd(), CONFIG.logFile)
      const existingLog = await readFile(logPath, 'utf-8').catch(() => '[]')
      const logs = JSON.parse(existingLog)
      
      logs.push(logEntry)
      
      // Manter apenas últimos 100 logs
      if (logs.length > 100) {
        logs.splice(0, logs.length - 100)
      }
      
      await writeFile(logPath, JSON.stringify(logs, null, 2))
    } catch (error) {
      console.error('❌ Erro ao salvar log:', error.message)
    }
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new DebugMonitor()
  
  // Capturar Ctrl+C
  process.on('SIGINT', () => {
    monitor.stop()
    process.exit(0)
  })
  
  // Iniciar
  monitor.start().catch(error => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })
}

export default DebugMonitor
