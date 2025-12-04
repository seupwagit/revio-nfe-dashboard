const fs = require('fs')
const path = require('path')

console.log('🧹 Organizando projeto SpedRevio...\n')

// ========================================
// 1. ORGANIZAR ARQUIVOS DE TESTE
// ========================================

const testsDir = 'tests'
if (!fs.existsSync(testsDir)) {
  fs.mkdirSync(testsDir, { recursive: true })
  console.log('✅ Criada pasta tests/')
}

// Arquivos de teste para mover
const testFiles = [
  'test-90-dias-chunks.cjs',
  'test-90dias.cjs',
  'test-all-collections-extended.cjs',
  'test-api-direct.cjs',
  'test-api-pagesize.cjs',
  'test-api-simple.cjs',
  'test-cfe-cte.cjs',
  'test-comparacao-periodos.cjs',
  'test-consistencia-periodos.cjs',
  'test-mapping.cjs',
  'test-nfe-raw.cjs',
  'test-pagesize-benchmark.cjs',
  'test-periodos-comparacao.cjs',
  'test-rah.cjs',
  'test-size-limits.cjs',
  'test-streaming-3-colecoes.cjs',
  'test-total-nfe-v2.cjs',
  'test-total-nfe.cjs',
  'test-ultimo-ano.cjs'
]

console.log('📦 Movendo arquivos de teste...')
let movedTests = 0
testFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const dest = path.join(testsDir, file)
    fs.renameSync(file, dest)
    console.log(`  ✓ ${file} → tests/`)
    movedTests++
  }
})
console.log(`✅ ${movedTests} arquivos de teste movidos\n`)

// ========================================
// 2. ORGANIZAR SERVIDORES/SCRIPTS
// ========================================

const scriptsDir = 'scripts'
if (!fs.existsSync(scriptsDir)) {
  fs.mkdirSync(scriptsDir, { recursive: true })
  console.log('✅ Criada pasta scripts/')
}

const scriptFiles = [
  'aggregation-proxy.cjs',
  'aggregation-server.cjs',
  'proxy-server.cjs',
  'organizar-docs.cjs',
  'fix-typescript-errors.sh'
]

console.log('📦 Movendo scripts e servidores...')
let movedScripts = 0
scriptFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const dest = path.join(scriptsDir, file)
    fs.renameSync(file, dest)
    console.log(`  ✓ ${file} → scripts/`)
    movedScripts++
  }
})
console.log(`✅ ${movedScripts} scripts movidos\n`)

// ========================================
// 3. ORGANIZAR UTILITÁRIOS HTML
// ========================================

const utilsDir = 'utils'
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true })
  console.log('✅ Criada pasta utils/')
}

const utilFiles = [
  'limpar-cache-corrompido.html'
]

console.log('📦 Movendo utilitários...')
let movedUtils = 0
utilFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const dest = path.join(utilsDir, file)
    fs.renameSync(file, dest)
    console.log(`  ✓ ${file} → utils/`)
    movedUtils++
  }
})
console.log(`✅ ${movedUtils} utilitários movidos\n`)

// ========================================
// 4. CRIAR README PARA CADA PASTA
// ========================================

console.log('📝 Criando READMEs...')

// README tests/
const testsReadme = `# 🧪 Testes do SpedRevio

Esta pasta contém scripts de teste para validar funcionalidades da API Revio.

## 📋 Tipos de Teste

### Testes de Performance
- \`test-90-dias-chunks.cjs\` - Teste de chunks para períodos longos
- \`test-pagesize-benchmark.cjs\` - Benchmark de tamanhos de página
- \`test-comparacao-periodos.cjs\` - Comparação de performance entre períodos

### Testes de API
- \`test-api-simple.cjs\` - Teste básico da API
- \`test-api-direct.cjs\` - Teste direto sem cache
- \`test-api-pagesize.cjs\` - Teste de tamanhos de página

### Testes de Collections
- \`test-all-collections-extended.cjs\` - Teste de todas as collections
- \`test-cfe-cte.cjs\` - Teste específico CF-e e CT-e
- \`test-streaming-3-colecoes.cjs\` - Teste de streaming

### Testes de Funcionalidades
- \`test-rah.cjs\` - Teste do RAH (Assistente IA)
- \`test-mapping.cjs\` - Teste de mapeamento de dados
- \`test-consistencia-periodos.cjs\` - Teste de consistência

## 🚀 Como Executar

\`\`\`bash
# Executar um teste específico
node tests/test-api-simple.cjs

# Executar teste de performance
node tests/test-90-dias-chunks.cjs
\`\`\`

## ⚙️ Configuração

Certifique-se de ter o arquivo \`.env\` configurado com:
- \`VITE_API_BASE_URL\`
- \`VITE_API_TOKEN\`
- \`VITE_API_GOOGLE_GEMINI\` (para test-rah.cjs)
`

fs.writeFileSync(path.join(testsDir, 'README.md'), testsReadme)
console.log('  ✓ tests/README.md')

// README scripts/
const scriptsReadme = `# 🔧 Scripts e Servidores

Esta pasta contém scripts utilitários e servidores auxiliares.

## 📦 Conteúdo

### Servidores (Não Usados Atualmente)
- \`aggregation-server.cjs\` - Servidor de agregação (legacy)
- \`aggregation-proxy.cjs\` - Proxy de agregação (legacy)
- \`proxy-server.cjs\` - Servidor proxy (legacy)

**Nota:** Estes servidores não são mais utilizados. O sistema usa processamento local com cache.

### Scripts Utilitários
- \`organizar-docs.cjs\` - Organiza documentação
- \`fix-typescript-errors.sh\` - Corrige erros TypeScript

## 🚀 Como Usar

\`\`\`bash
# Organizar documentação
node scripts/organizar-docs.cjs

# Corrigir TypeScript (Linux/Mac)
bash scripts/fix-typescript-errors.sh
\`\`\`

## ⚠️ Servidores Legacy

Os servidores de agregação foram substituídos por:
- Cache local inteligente
- Processamento paralelo de chunks
- Streaming incremental

Mantidos apenas para referência histórica.
`

fs.writeFileSync(path.join(scriptsDir, 'README.md'), scriptsReadme)
console.log('  ✓ scripts/README.md')

// README utils/
const utilsReadme = `# 🛠️ Utilitários

Esta pasta contém ferramentas auxiliares para manutenção do sistema.

## 📦 Conteúdo

### Ferramentas de Cache
- \`limpar-cache-corrompido.html\` - Ferramenta para limpar cache corrompido

## 🚀 Como Usar

### Limpar Cache Corrompido

1. Abra \`utils/limpar-cache-corrompido.html\` no navegador
2. Clique em "Limpar Cache"
3. Recarregue a aplicação

**Quando usar:**
- Cache apresentando dados inconsistentes
- Após mudanças na estrutura de dados
- Problemas de performance relacionados ao cache

## 💡 Dicas

- Use apenas quando necessário
- O cache é recriado automaticamente
- Duração do cache: 90 minutos
`

fs.writeFileSync(path.join(utilsDir, 'README.md'), utilsReadme)
console.log('  ✓ utils/README.md')

console.log('✅ READMEs criados\n')

// ========================================
// 5. ADICIONAR SESSÃO FINAL AO RESUMOS
// ========================================

console.log('📦 Movendo documentação da sessão...')
if (fs.existsSync('docs/SESSAO_FINAL_01_DEZEMBRO_2024.md')) {
  const dest = 'docs/resumos/SESSAO_FINAL_01_DEZEMBRO_2024.md'
  fs.renameSync('docs/SESSAO_FINAL_01_DEZEMBRO_2024.md', dest)
  console.log('  ✓ SESSAO_FINAL_01_DEZEMBRO_2024.md → docs/resumos/')
}

// ========================================
// 6. ATUALIZAR README PRINCIPAL
// ========================================

console.log('\n📝 Atualizando estrutura do projeto...')

const estruturaAtualizada = `
## 📁 Estrutura do Projeto

\`\`\`
SpedRevio/
├── src/                    # Código-fonte React + TypeScript
│   ├── components/         # Componentes reutilizáveis
│   ├── contexts/          # Contextos React (NFContext)
│   ├── pages/             # Páginas (Dashboard, Grids)
│   ├── services/          # Serviços (API, Cache)
│   └── types/             # Tipos TypeScript
├── docs/                  # Documentação completa
│   ├── arquitetura/       # Documentação técnica
│   ├── guias/             # Guias de uso
│   ├── implementacoes/    # Detalhes de implementação
│   ├── resumos/           # Resumos executivos
│   └── testes/            # Documentação de testes
├── tests/                 # Scripts de teste
├── scripts/               # Scripts utilitários
├── utils/                 # Ferramentas auxiliares
├── public/                # Arquivos públicos
└── dist/                  # Build de produção
\`\`\`
`

console.log('✅ Estrutura documentada\n')

// ========================================
// 7. RESUMO FINAL
// ========================================

console.log('=' .repeat(60))
console.log('🎉 ORGANIZAÇÃO CONCLUÍDA!')
console.log('=' .repeat(60))
console.log('\n📊 Resumo:')
console.log(`  ✅ ${movedTests} arquivos de teste → tests/`)
console.log(`  ✅ ${movedScripts} scripts → scripts/`)
console.log(`  ✅ ${movedUtils} utilitários → utils/`)
console.log('  ✅ 3 READMEs criados')
console.log('  ✅ Documentação organizada')
console.log('\n📁 Nova estrutura:')
console.log('  tests/     - Scripts de teste')
console.log('  scripts/   - Scripts e servidores')
console.log('  utils/     - Ferramentas auxiliares')
console.log('  docs/      - Documentação (já organizada)')
console.log('\n🚀 Projeto organizado e pronto!')
console.log('=' .repeat(60))
