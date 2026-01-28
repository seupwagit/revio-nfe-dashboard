/**
 * Exemplo de uso da classe OrderingProcessor
 * 
 * Este arquivo demonstra como usar o processador de ordenação
 * para configurar ordenação de documentos NFe
 */

import { OrderingProcessor } from '../services/OrderingProcessor';

/**
 * Exemplo básico de uso do OrderingProcessor
 */
async function exemploBasico() {
  console.log('=== Exemplo Básico do OrderingProcessor ===\n');

  const processor = new OrderingProcessor();

  // 1. Parsear configuração de ordenação simples
  console.log('1. Parseando configuração simples:');
  const configSimples = 'DT_DOC DESC';
  const camposSimples = processor.parseOrderingConfig(configSimples);
  console.log(`Configuração: "${configSimples}"`);
  console.log('Campos parseados:', camposSimples);
  console.log();

  // 2. Parsear configuração com múltiplos campos
  console.log('2. Parseando configuração múltipla:');
  const configMultipla = 'DT_DOC DESC, PROTOCOLADA ASC, VALOR_TOTAL DESC';
  const camposMultiplos = processor.parseOrderingConfig(configMultipla);
  console.log(`Configuração: "${configMultipla}"`);
  console.log('Campos parseados:', camposMultiplos);
  console.log();

  // 3. Construir estágio MongoDB
  console.log('3. Construindo estágio MongoDB:');
  const sortStage = processor.buildSortStage(camposMultiplos);
  console.log('Estágio $sort:', JSON.stringify(sortStage, null, 2));
  console.log();

  // 4. Aplicar ordenação a pipeline
  console.log('4. Aplicando ordenação a pipeline:');
  const pipeline = [
    { $match: { CHV_NFE: { $exists: true } } },
    { $group: { _id: '$CHV_NFE', count: { $sum: 1 } } }
  ];
  console.log('Pipeline antes:', JSON.stringify(pipeline, null, 2));
  
  processor.applyGroupOrdering(pipeline, camposMultiplos);
  console.log('Pipeline depois:', JSON.stringify(pipeline, null, 2));
  console.log();
}

/**
 * Exemplo de configuração por variáveis de ambiente
 */
async function exemploVariaveisAmbiente() {
  console.log('=== Exemplo com Variáveis de Ambiente ===\n');

  const processor = new OrderingProcessor();

  // Simular configuração de ambiente
  process.env.TBL_NFE_100_ORDER_BY = 'CNPJ_EMIT ASC, VALOR_TOTAL DESC';

  console.log('1. Carregando configuração da variável de ambiente:');
  console.log('TBL_NFE_100_ORDER_BY =', process.env.TBL_NFE_100_ORDER_BY);

  const config = processor.getOrderingConfig('tbl_nfe_100');
  console.log('Configuração carregada:', config);
  console.log();

  // Limpar variável de ambiente
  delete process.env.TBL_NFE_100_ORDER_BY;

  console.log('2. Usando configuração padrão (sem variável):');
  const configPadrao = processor.getOrderingConfig('tbl_nfe_100');
  console.log('Configuração padrão:', configPadrao);
  console.log();
}

/**
 * Exemplo de validação de campos
 */
async function exemploValidacao() {
  console.log('=== Exemplo de Validação ===\n');

  const processor = new OrderingProcessor();

  // 1. Validar campos válidos
  console.log('1. Validando campos válidos:');
  const camposValidos = ['DT_DOC', 'PROTOCOLADA', 'VALOR_TOTAL'];
  try {
    const resultado = processor.validateOrderingFields(camposValidos, 'tbl_nfe_100');
    console.log(`Campos ${JSON.stringify(camposValidos)} são válidos:`, resultado);
  } catch (error) {
    console.log('Erro de validação:', (error as Error).message);
  }
  console.log();

  // 2. Validar campos inválidos
  console.log('2. Validando campos inválidos:');
  const camposInvalidos = ['DT_DOC', 'CAMPO_INEXISTENTE'];
  try {
    processor.validateOrderingFields(camposInvalidos, 'tbl_nfe_100');
    console.log('Validação passou (não deveria)');
  } catch (error) {
    console.log('Erro esperado:', (error as Error).message);
    if ((error as any).context) {
      console.log('Contexto do erro:', (error as any).context);
    }
  }
  console.log();

  // 3. Validar configuração completa
  console.log('3. Validando configurações:');
  const configs = [
    'DT_DOC DESC',
    'DT_DOC DESC, PROTOCOLADA ASC',
    '',
    'CAMPO_INEXISTENTE DESC'
  ];

  configs.forEach(config => {
    const validation = processor.validateOrderingConfig(config, 'tbl_nfe_100');
    console.log(`"${config}" é válida:`, validation.isValid);
  });
  console.log();
}

/**
 * Exemplo de normalização de configuração
 */
async function exemploNormalizacao() {
  console.log('=== Exemplo de Normalização ===\n');

  const processor = new OrderingProcessor();

  const configsProblematicas = [
    '  DT_DOC   DESC  ,   PROTOCOLADA   ASC  ',
    'DT_DOC,PROTOCOLADA ASC,VALOR_TOTAL',
    'DT_DOC INVALID_DIRECTION',
    ''
  ];

  configsProblematicas.forEach(config => {
    console.log(`Original: "${config}"`);
    const normalizada = processor.normalizeOrderingConfig(config);
    console.log(`Normalizada: "${normalizada}"`);
    console.log();
  });
}

/**
 * Exemplo de uso em pipeline de agregação MongoDB
 */
async function exemploAggregationPipeline() {
  console.log('=== Exemplo de Pipeline de Agregação ===\n');

  const processor = new OrderingProcessor();

  // Simular pipeline de agrupamento de NFe
  const pipeline = [
    // 1. Filtrar documentos
    {
      $match: {
        CHV_NFE: { $exists: true },
        DT_DOC: { $gte: new Date('2024-01-01') }
      }
    },
    
    // 2. Normalizar chaves NFe (simulado)
    {
      $addFields: {
        CHV_NFE_NORMALIZED: {
          $cond: [
            { $eq: [{ $substr: ['$CHV_NFE', 0, 3] }, 'NFe'] },
            { $substr: ['$CHV_NFE', 3, -1] },
            '$CHV_NFE'
          ]
        }
      }
    },
    
    // 3. Agrupar por chave normalizada
    {
      $group: {
        _id: '$CHV_NFE_NORMALIZED',
        documents: { $push: '$$ROOT' },
        count: { $sum: 1 },
        totalValue: { $sum: '$VALOR_TOTAL' },
        latestDocument: { $last: '$$ROOT' }
      }
    }
  ];

  console.log('Pipeline antes da ordenação:');
  console.log(JSON.stringify(pipeline, null, 2));
  console.log();

  // Aplicar ordenação configurável
  const ordenacao = processor.parseOrderingConfig('count DESC, totalValue DESC');
  processor.applyGroupOrdering(pipeline, ordenacao);

  console.log('Pipeline com ordenação aplicada:');
  console.log(JSON.stringify(pipeline, null, 2));
  console.log();
}

/**
 * Executar todos os exemplos
 */
async function executarExemplos() {
  try {
    await exemploBasico();
    await exemploVariaveisAmbiente();
    await exemploValidacao();
    await exemploNormalizacao();
    await exemploAggregationPipeline();
    
    console.log('✅ Todos os exemplos executados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar exemplos:', error);
  }
}

// Executar exemplos se este arquivo for executado diretamente
if (require.main === module) {
  executarExemplos();
}

export {
  exemploAggregationPipeline, exemploBasico, exemploNormalizacao, exemploValidacao, exemploVariaveisAmbiente
};

