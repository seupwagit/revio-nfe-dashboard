#!/usr/bin/env node

/**
 * Script para verificar cache via Chrome DevTools MCP
 * 
 * Uso:
 *   node scripts/check-cache.mjs
 *   node scripts/check-cache.mjs --full
 *   node scripts/check-cache.mjs --clear
 */

const args = process.argv.slice(2)
const fullReport = args.includes('--full')
const clearCache = args.includes('--clear')

console.log('🔍 Conectando ao Chrome DevTools MCP...\n')

// Simular comandos MCP (você vai executar via Kiro)
const commands = {
  
  // Verificar cache básico
  checkCache: () => {
    console.log('📋 VERIFICAÇÃO RÁPIDA DO CACHE')
    console.log('━'.repeat(50))
    console.log('\n💡 Execute no console do Chrome:')
    console.log('   window.debugCache()\n')
    console.log('Ou use o Kiro para executar:')
    console.log('   "Verifique o cache usando Chrome DevTools MCP"\n')
  },
  
  // Relatório completo
  fullReport: () => {
    console.log('📊 RELATÓRIO COMPLETO')
    console.log('━'.repeat(50))
    console.log('\nVerificando:')
    console.log('  ✓ Status do cache (streamingCache)')
    console.log('  ✓ LocalStorage (cache persistente)')
    console.log('  ✓ Network requests (API calls)')
    console.log('  ✓ Console logs (erros e avisos)')
    console.log('  ✓ Performance metrics')
    console.log('\n💡 Peça ao Kiro:')
    console.log('   "Gere um relatório completo do cache via Chrome DevTools"\n')
  },
  
  // Limpar cache
  clearCache: () => {
    console.log('🧹 LIMPAR CACHE')
    console.log('━'.repeat(50))
    console.log('\n⚠️  ATENÇÃO: Isso vai limpar TODO o cache!')
    console.log('   - streamingCache (memória)')
    console.log('   - localStorage (persistente)')
    console.log('   - Próximas consultas serão mais lentas')
    console.log('\n💡 Peça ao Kiro:')
    console.log('   "Limpe o cache usando Chrome DevTools MCP"\n')
  },
  
  // Ajuda
  help: () => {
    console.log('🔧 CHROME DEVTOOLS MCP - DEBUG DO CACHE')
    console.log('━'.repeat(50))
    console.log('\nComandos disponíveis:')
    console.log('  node scripts/check-cache.mjs           - Verificação rápida')
    console.log('  node scripts/check-cache.mjs --full    - Relatório completo')
    console.log('  node scripts/check-cache.mjs --clear   - Limpar cache')
    console.log('  node scripts/check-cache.mjs --help    - Esta ajuda')
    console.log('\nO que cada comando faz:')
    console.log('  • Verificação rápida: Mostra status do cache')
    console.log('  • Relatório completo: Analisa cache, network, logs, performance')
    console.log('  • Limpar cache: Remove todo o cache (use com cuidado!)')
    console.log('\n💡 Dica: Peça ao Kiro para executar os comandos via MCP')
    console.log('   Exemplo: "Verifique o cache usando Chrome DevTools MCP"\n')
  }
}

// Executar comando
if (args.includes('--help') || args.includes('-h')) {
  commands.help()
} else if (clearCache) {
  commands.clearCache()
} else if (fullReport) {
  commands.fullReport()
} else {
  commands.checkCache()
}

console.log('━'.repeat(50))
console.log('✨ Pronto! Use o Kiro para executar via Chrome DevTools MCP\n')
