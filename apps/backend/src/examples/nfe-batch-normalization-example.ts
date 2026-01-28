import { NFePrefixNormalizer } from '../services/NFePrefixNormalizer';
import { logger } from '../utils/logger';

/**
 * Exemplo de uso da normalização em lote de chaves NFe
 * 
 * Este exemplo demonstra como usar a classe NFePrefixNormalizer
 * para processar grandes volumes de chaves de forma eficiente.
 */

/**
 * Exemplo básico de normalização em lote
 */
export async function exemploNormalizacaoBasica(): Promise<void> {
  const normalizer = new NFePrefixNormalizer();

  // Simular chaves vindas do banco de dados
  const chavesDoDatabase = [
    'NFe35200714200166000187550010000000046123456789',
    '35200714200166000187550010000000046123456790',
    'NFe35200714200166000187550010000000046123456791',
    '35200714200166000187550010000000046123456792',
    'NFe35200714200166000187550010000000046123456793'
  ];

  logger.info('[EXEMPLO] 🚀 Iniciando normalização em lote', {
    totalChaves: chavesDoDatabase.length
  });

  // Normalizar todas as chaves em lote
  const resultados = normalizer.normalizeBatch(chavesDoDatabase);

  // Obter estatísticas
  const stats = normalizer.getStatistics(resultados);

  logger.info('[EXEMPLO] 📊 Estatísticas de normalização', stats);

  // Processar resultados
  resultados.forEach((resultado, chaveOriginal) => {
    if (resultado.hadPrefix) {
      logger.info('[EXEMPLO] 🔄 Chave normalizada', {
        original: resultado.originalKey,
        normalizada: resultado.normalizedKey,
        removeuPrefixo: resultado.hadPrefix
      });
    }
  });
}

/**
 * Exemplo de uso com pipeline MongoDB para agrupamento
 */
export async function exemploAgrupamentoMongoDB(): Promise<void> {
  const normalizer = new NFePrefixNormalizer();

  // Configurar campos de agrupamento
  const camposAgrupamento = ['CHV_NFE'];

  logger.info('[EXEMPLO] 🔧 Criando pipeline de agrupamento MongoDB', {
    campos: camposAgrupamento
  });

  // Criar pipeline completo com normalização e agrupamento
  const pipeline = normalizer.createGroupingPipeline(camposAgrupamento);

  logger.info('[EXEMPLO] 📋 Pipeline MongoDB criado', {
    stages: pipeline.length,
    pipeline: JSON.stringify(pipeline, null, 2)
  });

  // Exemplo de como usar o pipeline (simulado)
  const exemploConsultaMongoDB = {
    collection: 'tbl_nfe_100',
    pipeline: pipeline,
    filtros: {
      DT_DOC: { $gte: new Date('2024-01-01') },
      PROTOCOLADA: true
    }
  };

  logger.info('[EXEMPLO] 🗄️ Consulta MongoDB configurada', exemploConsultaMongoDB);
}

/**
 * Exemplo de processamento otimizado para grandes volumes
 */
export async function exemploProcessamentoOtimizado(): Promise<void> {
  const normalizer = new NFePrefixNormalizer();

  // Simular grande volume de chaves (10.000 registros)
  const chavesGrandeVolume: string[] = [];
  for (let i = 0; i < 10000; i++) {
    const temPrefixo = i % 3 === 0; // 1/3 das chaves terão prefixo
    const chaveBase = `35200714200166000187550010000000046${i.toString().padStart(9, '0')}`;
    chavesGrandeVolume.push(temPrefixo ? `NFe${chaveBase}` : chaveBase);
  }

  logger.info('[EXEMPLO] ⚡ Iniciando processamento otimizado', {
    totalChaves: chavesGrandeVolume.length
  });

  const inicioTempo = Date.now();

  // Processar em lotes menores para otimização de memória
  const tamanhoBatch = 1000;
  const resultadosCompletos = new Map();

  for (let i = 0; i < chavesGrandeVolume.length; i += tamanhoBatch) {
    const batch = chavesGrandeVolume.slice(i, i + tamanhoBatch);
    const resultadoBatch = normalizer.normalizeBatch(batch);
    
    // Combinar resultados
    resultadoBatch.forEach((valor, chave) => {
      resultadosCompletos.set(chave, valor);
    });

    logger.info('[EXEMPLO] 📦 Batch processado', {
      batchNumero: Math.floor(i / tamanhoBatch) + 1,
      chavesProcessadas: Math.min(i + tamanhoBatch, chavesGrandeVolume.length),
      totalChaves: chavesGrandeVolume.length
    });
  }

  const tempoProcessamento = Date.now() - inicioTempo;
  const stats = normalizer.getStatistics(resultadosCompletos);

  logger.info('[EXEMPLO] 🏁 Processamento otimizado concluído', {
    ...stats,
    tempoProcessamentoMs: tempoProcessamento,
    chavesProcessadasPorSegundo: Math.round((chavesGrandeVolume.length / tempoProcessamento) * 1000)
  });
}

/**
 * Exemplo de integração com consulta MongoDB existente
 */
export async function exemploIntegracaoConsultaExistente(): Promise<void> {
  const normalizer = new NFePrefixNormalizer();

  // Simular filtro de consulta existente
  const filtroOriginal = {
    CHV_NFE: 'NFe35200714200166000187550010000000046123456789',
    DT_DOC: { $gte: new Date('2024-01-01') },
    PROTOCOLADA: true
  };

  logger.info('[EXEMPLO] 🔍 Filtro original da consulta', filtroOriginal);

  // Criar pipeline que preserva filtros originais
  const pipeline = [
    // Stage 1: Aplicar filtros originais
    { $match: filtroOriginal },
    
    // Stage 2: Adicionar normalização
    ...normalizer.createNormalizationPipeline(),
    
    // Stage 3: Agrupar por chave normalizada
    {
      $group: {
        _id: '$CHV_NFE_NORMALIZED',
        documentos: { $push: '$$ROOT' },
        quantidade: { $sum: 1 },
        valorTotal: { $sum: '$VALOR_TOTAL' },
        ultimoDocumento: { $last: '$$ROOT' },
        chavesOriginais: { $addToSet: '$CHV_NFE' },
        temPrefixoNFe: {
          $max: {
            $cond: [
              { $eq: [{ $substr: ['$CHV_NFE', 0, 3] }, 'NFe'] },
              true,
              false
            ]
          }
        }
      }
    },
    
    // Stage 4: Ordenar por valor total decrescente
    { $sort: { valorTotal: -1 } }
  ];

  logger.info('[EXEMPLO] 🔧 Pipeline integrado criado', {
    stages: pipeline.length,
    preservaFiltrosOriginais: true,
    incluiNormalizacao: true,
    incluiAgrupamento: true
  });

  // Exemplo de resultado esperado
  const resultadoEsperado = {
    _id: '35200714200166000187550010000000046123456789', // Chave normalizada
    documentos: [
      // Array com documentos agrupados
    ],
    quantidade: 2, // Número de documentos com a mesma chave normalizada
    valorTotal: 3000.00, // Soma dos valores
    ultimoDocumento: {}, // Último documento do grupo
    chavesOriginais: [
      'NFe35200714200166000187550010000000046123456789',
      '35200714200166000187550010000000046123456789'
    ],
    temPrefixoNFe: true // Indica se algum documento tinha prefixo
  };

  logger.info('[EXEMPLO] 📋 Estrutura de resultado esperada', {
    estrutura: Object.keys(resultadoEsperado),
    agrupamentoPorChaveNormalizada: true,
    preservaInformacaoOriginal: true
  });
}

/**
 * Exemplo de validação e tratamento de erros
 */
export async function exemploValidacaoTratamentoErros(): Promise<void> {
  const normalizer = new NFePrefixNormalizer();

  // Simular dados com problemas
  const chavesComProblemas = [
    'NFe35200714200166000187550010000000046123456789', // Válida
    null as any, // Inválida
    undefined as any, // Inválida
    '', // String vazia (válida mas vazia)
    'chave_muito_curta', // Válida mas sem prefixo NFe
    123 as any, // Tipo inválido
    'NFe35200714200166000187550010000000046123456790' // Válida
  ];

  logger.info('[EXEMPLO] ⚠️ Processando dados com problemas', {
    totalItens: chavesComProblemas.length
  });

  try {
    // Validar chaves antes do processamento
    const chavesValidas = chavesComProblemas.filter(chave => {
      const validation = normalizer.validateKeyFormat(chave);
      return validation.isValid;
    });
    
    logger.info('[EXEMPLO] ✅ Validação concluída', {
      chavesOriginais: chavesComProblemas.length,
      chavesValidas: chavesValidas.length,
      chavesInvalidas: chavesComProblemas.length - chavesValidas.length
    });

    // Processar apenas chaves válidas
    if (chavesValidas.length > 0) {
      const resultados = normalizer.normalizeBatch(chavesValidas);
      const stats = normalizer.getStatistics(resultados);

      logger.info('[EXEMPLO] 📊 Processamento com validação concluído', stats);
    } else {
      logger.warn('[EXEMPLO] ⚠️ Nenhuma chave válida encontrada para processamento');
    }

  } catch (error) {
    logger.error('[EXEMPLO] ❌ Erro durante processamento', {
      erro: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

/**
 * Executar todos os exemplos
 */
export async function executarTodosExemplos(): Promise<void> {
  logger.info('[EXEMPLO] 🎯 Iniciando demonstração da normalização em lote NFe');

  try {
    await exemploNormalizacaoBasica();
    await exemploAgrupamentoMongoDB();
    await exemploProcessamentoOtimizado();
    await exemploIntegracaoConsultaExistente();
    await exemploValidacaoTratamentoErros();

    logger.info('[EXEMPLO] ✅ Todos os exemplos executados com sucesso');
  } catch (error) {
    logger.error('[EXEMPLO] ❌ Erro durante execução dos exemplos', {
      erro: error instanceof Error ? error.message : 'Erro desconhecido'
    });
  }
}

// Executar exemplos se arquivo for executado diretamente
if (require.main === module) {
  executarTodosExemplos().catch(console.error);
}