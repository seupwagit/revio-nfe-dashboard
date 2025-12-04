/**
 * Script de Debug Automático do Cache usando Chrome DevTools MCP
 * 
 * Este script conecta ao Chrome via MCP e executa verificações automáticas
 * do cache, logs, network requests, etc.
 */

// Funções auxiliares para usar com Chrome DevTools MCP
const debugCommands = {
  
  // 1. Ver status completo do cache
  async checkCacheStatus() {
    console.log('🔍 Verificando status do cache...')
    
    const result = await chromeDevTools.evaluateScript({
      function: `() => {
        if (window.debugCache) {
          window.debugCache()
          return { success: true, message: 'Cache debug executado' }
        }
        return { success: false, message: 'window.debugCache não encontrado' }
      }`
    })
    
    return result
  },
  
  // 2. Ver localStorage (cache persistente)
  async checkLocalStorage() {
    console.log('💾 Verificando localStorage...')
    
    const result = await chromeDevTools.evaluateScript({
      function: `() => {
        const keys = Object.keys(localStorage)
        const cacheKeys = keys.filter(k => 
          k.includes('cache') || 
          k.includes('grid') || 
          k.includes('analytics')
        )
        
        const cacheData = {}
        cacheKeys.forEach(key => {
          try {
            const data = JSON.parse(localStorage.getItem(key))
            cacheData[key] = {
              size: localStorage.getItem(key).length,
              timestamp: data.timestamp,
              age: data.timestamp ? Math.floor((Date.now() - data.timestamp) / 60000) : null,
              records: data.data?.length || 0
            }
          } catch (e) {
            cacheData[key] = { error: 'Parse error' }
          }
        })
        
        return {
          totalKeys: keys.length,
          cacheKeys: cacheKeys.length,
          cacheData
        }
      }`
    })
    
    return result
  },
  
  // 3. Ver últimas requisições da API
  async checkNetworkRequests() {
    console.log('🌐 Verificando requisições da API...')
    
    const requests = await chromeDevTools.listNetworkRequests({
      resourceTypes: ['xhr', 'fetch'],
      pageSize: 20
    })
    
    const apiRequests = requests.filter(r => 
      r.url.includes('revio') || 
      r.url.includes('api')
    )
    
    return {
      total: requests.length,
      apiRequests: apiRequests.length,
      requests: apiRequests.map(r => ({
        url: r.url,
        method: r.method,
        status: r.status,
        time: r.time,
        size: r.size
      }))
    }
  },
  
  // 4. Ver logs do console
  async checkConsoleLogs() {
    console.log('📋 Verificando logs do console...')
    
    const logs = await chromeDevTools.listConsoleMessages({
      pageSize: 50,
      types: ['log', 'warn', 'error']
    })
    
    const cacheLogs = logs.filter(log => 
      log.text.includes('cache') || 
      log.text.includes('Cache') ||
      log.text.includes('💾') ||
      log.text.includes('🔍')
    )
    
    return {
      total: logs.length,
      cacheLogs: cacheLogs.length,
      recentLogs: cacheLogs.slice(0, 10).map(l => ({
        type: l.type,
        text: l.text,
        timestamp: l.timestamp
      }))
    }
  },
  
  // 5. Verificar performance
  async checkPerformance() {
    console.log('⚡ Verificando performance...')
    
    const result = await chromeDevTools.evaluateScript({
      function: `() => {
        const perf = performance.getEntriesByType('navigation')[0]
        const resources = performance.getEntriesByType('resource')
        
        return {
          loadTime: perf ? Math.round(perf.loadEventEnd - perf.fetchStart) : null,
          domContentLoaded: perf ? Math.round(perf.domContentLoadedEventEnd - perf.fetchStart) : null,
          resources: resources.length,
          apiCalls: resources.filter(r => r.name.includes('api')).length
        }
      }`
    })
    
    return result
  },
  
  // 6. Limpar cache (se necessário)
  async clearCache() {
    console.log('🧹 Limpando cache...')
    
    const result = await chromeDevTools.evaluateScript({
      function: `() => {
        if (window.streamingCache && window.streamingCache.clearAll) {
          window.streamingCache.clearAll()
          return { success: true, message: 'Cache limpo via streamingCache' }
        }
        
        // Fallback: limpar localStorage
        const keys = Object.keys(localStorage)
        const cacheKeys = keys.filter(k => 
          k.includes('cache') || 
          k.includes('grid') || 
          k.includes('analytics')
        )
        
        cacheKeys.forEach(k => localStorage.removeItem(k))
        
        return { 
          success: true, 
          message: 'Cache limpo via localStorage',
          removed: cacheKeys.length 
        }
      }`
    })
    
    return result
  },
  
  // 7. Relatório completo
  async fullReport() {
    console.log('\n📊 ===== RELATÓRIO COMPLETO DE DEBUG =====\n')
    
    const results = {
      timestamp: new Date().toISOString(),
      cache: await this.checkCacheStatus(),
      localStorage: await this.checkLocalStorage(),
      network: await this.checkNetworkRequests(),
      console: await this.checkConsoleLogs(),
      performance: await this.checkPerformance()
    }
    
    console.log('\n✅ Relatório completo gerado!')
    console.log(JSON.stringify(results, null, 2))
    
    return results
  }
}

// Exportar para uso
if (typeof module !== 'undefined' && module.exports) {
  module.exports = debugCommands
}

// Instruções de uso
console.log(`
🔧 CHROME DEVTOOLS MCP - DEBUG AUTOMÁTICO

Comandos disponíveis:

1. debugCommands.checkCacheStatus()     - Ver status do cache
2. debugCommands.checkLocalStorage()    - Ver localStorage
3. debugCommands.checkNetworkRequests() - Ver requisições da API
4. debugCommands.checkConsoleLogs()     - Ver logs do console
5. debugCommands.checkPerformance()     - Ver performance
6. debugCommands.clearCache()           - Limpar cache
7. debugCommands.fullReport()           - Relatório completo

Exemplo de uso:
  const report = await debugCommands.fullReport()
`)
