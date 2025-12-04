const fs = require('fs')
const path = require('path')

// Mapeamento de arquivos para categorias
const categorias = {
  'guias': [
    'GUIA_RAPIDO_USUARIO.md',
    'INICIO_RAPIDO.md',
    'LEIA_PRIMEIRO.md',
    'WELCOME.md',
    'EXEMPLOS_USO.md',
    'COMO_FUNCIONA_COLLECTIONS.md',
    'COMO_GERAR_NOVO_TOKEN.md',
    'CONFIGURACAO.md',
    'FAQ.md',
    'O_QUE_VOCE_DEVE_VER.md',
    'INSTRUCOES_TESTE_RAPIDO.md',
    'INSTRUCOES_USUARIO_VALIDACAO.md',
    'INSTRUCOES_LIMPAR_CACHE_AGORA.md'
  ],
  'implementacoes': [
    'IMPLEMENTACAO_ANALYTICS_OTIMIZADO.md',
    'IMPLEMENTACAO_COMPLETA_OTIMIZACOES.md',
    'IMPLEMENTACAO_COMPLETA_VALIDACAO.md',
    'BUSCA_NATURAL_IMPLEMENTADA.md',
    'BUSCA_NATURAL_MELHORADA.md',
    'BUSCA_NATURAL_GRID_IMPLEMENTADA.md',
    'BUSCA_NATURAL_NUMEROS_EXTENSO.md',
    'GRID_AVANCADA_IMPLEMENTADA.md',
    'GRID_CONGELAMENTO_COLUNAS.md',
    'PAGINACAO_GRID_IMPLEMENTADA.md',
    'PAGINACAO_INTELIGENTE_IMPLEMENTADA.md',
    'STREAMING_CACHE_IMPLEMENTADO.md',
    'FILTROS_IMPLEMENTADOS_TODAS_TELAS.md'
  ],
  'testes': [
    'TESTE_120_DIAS_SEM_CACHE.md',
    'TESTE_3_COLLECTIONS.md',
    'TESTE_BUSCA_NATURAL.md',
    'TESTE_COLLECTIONS.md',
    'TESTE_EXPORTACAO_EXCEL.md',
    'TESTE_GRIDS_AGORA.md',
    'TESTE_MANUAL.md',
    'TESTE_RAPIDO_TOKEN.md',
    'TESTE_VALIDACAO_CACHE.md',
    'BUSCA_NATURAL_CASOS_TESTE.md',
    'BENCHMARK_PERIODOS.md'
  ],
  'correcoes': [
    'CORRECAO_BUG_ULTIMO_ANO.md',
    'CORRECAO_FILTRO_DATAS.md',
    'CORRECAO_FILTROS_GRID.md',
    'CORRECAO_FILTROS_TEXTO.md',
    'CORRECAO_FILTROS.md',
    'CORRECAO_FINAL_DATAS.md',
    'CORRECAO_GRID_COMPLETA.md',
    'CORRECAO_GRID_VAZIA.md',
    'CORRECAO_PROGRESSO.md',
    'CORRECAO_STATUS_COMPLETA.md',
    'CORRECOES_CORS.md',
    'CORRECOES_FINAIS_GRID.md',
    'CORRECOES_PAGINACAO.md'
  ],
  'resumos': [
    'RESUMO_ANALISE_PERFORMANCE.txt',
    'RESUMO_EXECUTIVO.md',
    'RESUMO_FINAL_GRIDS.md',
    'RESUMO_FINAL_IMPLEMENTACOES.md',
    'RESUMO_FINAL_SOLUCAO_90_DIAS.md',
    'RESUMO_IMPLEMENTACAO_PERIODOS.md',
    'RESUMO_OTIMIZACOES.txt',
    'RESUMO_PROJETO.md',
    'RESUMO_SESSAO_30NOV2025.md',
    'RESUMO_SOLUCAO.md',
    'RESUMO_STREAMING_CACHE.md',
    'RESUMO_TESTE_120_DIAS.txt',
    'RESUMO_VALIDACAO_AUTOMATICA.md',
    'RESUMO_VISUAL_MELHORIAS.txt',
    'RESUMO_VISUAL.txt',
    'SUMARIO_EXECUTIVO.txt'
  ],
  'validacoes': [
    'VALIDACAO_CACHE_AUTOMATICA.md',
    'VALIDACAO_COMPLETA_LLM.md',
    'VALIDACAO_FINAL.md',
    'INDICE_VALIDACAO_CACHE.md',
    'CONFIRMACAO_ANALYTICS_AGREGADO.md',
    'CONFIRMACAO_FINAL.md',
    'CONFIRMACAO_STREAMING_3_COLECOES.md'
  ],
  'troubleshooting': [
    'TROUBLESHOOTING.md',
    'DEBUG_CHUNKS_ACUMULACAO.md',
    'DEBUG_DADOS_GRID.md',
    'DEBUG_INSTRUCOES.md',
    'DEBUG_OPERACAO_CAMPO.md',
    'DEBUG_STATUS_AUTORIZADA.md',
    'DIAGNOSTICO_E_SOLUCAO.md'
  ],
  'solucoes': [
    'SOLUCAO_90_DIAS_CHUNKS.md',
    'SOLUCAO_FINAL_GRID.md',
    'SOLUCAO_FINAL.md',
    'SOLUCAO_GRID_PAGINACAO_LOCAL.md',
    'SOLUCAO_GRID_PERFORMANCE.md',
    'SOLUCAO_MAPEAMENTO_API.md',
    'SOLUCAO_TEMPORARIA.md'
  ],
  'otimizacoes': [
    'OTIMIZACOES_ANALYTICS_AGREGADO.md',
    'MELHORIAS_CACHE_PERFORMANCE.md',
    'GERENCIADOR_CACHE.md',
    'ANALISE_PERFORMANCE_ANALYTICS.md',
    'PLANO_GRID_ULTRA_RAPIDA.md',
    'PLANO_MIGRACAO_AGREGACAO.md'
  ],
  'atualizacoes': [
    'ATUALIZACAO_GRIDS.md',
    'ATUALIZACAO_PERIODOS.md',
    'ATUALIZACOES_RECENTES.md',
    'CHANGELOG.md',
    'STATUS_COLLECTIONS.md',
    'STATUS_FINAL.md'
  ],
  'arquitetura': [
    'AUDITORIA_ARQUITETURA_UNIFICADA.md',
    'ESTRUTURA_PROJETO.md',
    'DESIGN.md',
    'CORES_REVIO.md',
    'SOBRE_REVIO.md'
  ],
  'outros': [
    'APRESENTACAO.md',
    'PREVIEW.md',
    'ENTREGA_FINAL.md',
    'CHECKLIST.md',
    'CONTRIBUTING.md',
    'DOCUMENTACAO_ORGANIZADA.md',
    'INDICE_DOCUMENTACAO.md',
    'INDEX.md',
    'COMPARACAO_REQUISICOES.md',
    'DESCOBERTA_SIZE_API.md',
    'REMOCAO_GRID_COMPLETA.md',
    'RESTAURACAO_SISTEMA_ORIGINAL.md',
    'RESTAURAR_BACKUP.md',
    'BACKUP_20251130_100333_INFO.md'
  ]
}

function organizarArquivos() {
  console.log('🗂️  Organizando arquivos de documentação...\n')
  
  let movidos = 0
  let erros = 0
  
  // Criar pastas se não existirem
  Object.keys(categorias).forEach(categoria => {
    const pastaDestino = path.join('docs', categoria)
    if (!fs.existsSync(pastaDestino)) {
      fs.mkdirSync(pastaDestino, { recursive: true })
      console.log(`📁 Criada pasta: docs/${categoria}`)
    }
  })
  
  console.log('')
  
  // Mover arquivos
  Object.entries(categorias).forEach(([categoria, arquivos]) => {
    console.log(`\n📦 Categoria: ${categoria}`)
    console.log('─'.repeat(50))
    
    arquivos.forEach(arquivo => {
      const origem = path.join(process.cwd(), arquivo)
      const destino = path.join('docs', categoria, arquivo)
      
      if (fs.existsSync(origem)) {
        try {
          fs.renameSync(origem, destino)
          console.log(`  ✅ ${arquivo}`)
          movidos++
        } catch (error) {
          console.log(`  ❌ ${arquivo} - Erro: ${error.message}`)
          erros++
        }
      } else {
        console.log(`  ⚠️  ${arquivo} - Não encontrado`)
      }
    })
  })
  
  console.log('\n' + '='.repeat(50))
  console.log(`\n📊 Resumo:`)
  console.log(`   ✅ Movidos: ${movidos}`)
  console.log(`   ❌ Erros: ${erros}`)
  console.log(`   📁 Categorias: ${Object.keys(categorias).length}`)
  console.log('\n✨ Organização concluída!\n')
}

// Executar
organizarArquivos()
