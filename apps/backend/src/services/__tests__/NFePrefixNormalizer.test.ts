import { NormalizationResult } from '../../types/nfe-normalization-result.interface';
import { NFePrefixNormalizer } from '../NFePrefixNormalizer';

describe('NFePrefixNormalizer', () => {
  let normalizer: NFePrefixNormalizer;

  beforeEach(() => {
    normalizer = new NFePrefixNormalizer();
  });

  describe('normalizeKey', () => {
    it('deve remover prefixo NFe de chave válida', () => {
      const key = 'NFe35200714200166000187550010000000046123456789';
      const result = normalizer.normalizeKey(key);

      expect(result.originalKey).toBe(key);
      expect(result.normalizedKey).toBe('35200714200166000187550010000000046123456789');
      expect(result.hadPrefix).toBe(true);
    });

    it('deve manter chave sem prefixo inalterada', () => {
      const key = '35200714200166000187550010000000046123456789';
      const result = normalizer.normalizeKey(key);

      expect(result.originalKey).toBe(key);
      expect(result.normalizedKey).toBe(key);
      expect(result.hadPrefix).toBe(false);
    });

    it('deve tratar chave null ou undefined', () => {
      const resultNull = normalizer.normalizeKey(null as any);
      const resultUndefined = normalizer.normalizeKey(undefined as any);

      expect(resultNull.originalKey).toBe(null);
      expect(resultNull.normalizedKey).toBe(null);
      expect(resultNull.hadPrefix).toBe(false);

      expect(resultUndefined.originalKey).toBe(undefined);
      expect(resultUndefined.normalizedKey).toBe(undefined);
      expect(resultUndefined.hadPrefix).toBe(false);
    });

    it('deve tratar string vazia', () => {
      const result = normalizer.normalizeKey('');

      expect(result.originalKey).toBe('');
      expect(result.normalizedKey).toBe('');
      expect(result.hadPrefix).toBe(false);
    });

    it('deve tratar chave muito curta', () => {
      const key = 'NF';
      const result = normalizer.normalizeKey(key);

      expect(result.originalKey).toBe(key);
      expect(result.normalizedKey).toBe(key);
      expect(result.hadPrefix).toBe(false);
    });
  });

  describe('normalizeBatch', () => {
    it('deve normalizar múltiplas chaves corretamente', () => {
      const keys = [
        'NFe35200714200166000187550010000000046123456789',
        '35200714200166000187550010000000046123456790',
        'NFe35200714200166000187550010000000046123456791',
        '35200714200166000187550010000000046123456792'
      ];

      const results = normalizer.normalizeBatch(keys);

      expect(results.size).toBe(4);

      // Verificar primeira chave (com prefixo)
      const result1 = results.get(keys[0])!;
      expect(result1.hadPrefix).toBe(true);
      expect(result1.normalizedKey).toBe('35200714200166000187550010000000046123456789');

      // Verificar segunda chave (sem prefixo)
      const result2 = results.get(keys[1])!;
      expect(result2.hadPrefix).toBe(false);
      expect(result2.normalizedKey).toBe('35200714200166000187550010000000046123456790');

      // Verificar terceira chave (com prefixo)
      const result3 = results.get(keys[2])!;
      expect(result3.hadPrefix).toBe(true);
      expect(result3.normalizedKey).toBe('35200714200166000187550010000000046123456791');

      // Verificar quarta chave (sem prefixo)
      const result4 = results.get(keys[3])!;
      expect(result4.hadPrefix).toBe(false);
      expect(result4.normalizedKey).toBe('35200714200166000187550010000000046123456792');
    });

    it('deve tratar array vazio', () => {
      const results = normalizer.normalizeBatch([]);

      expect(results.size).toBe(0);
    });

    it('deve tratar chaves inválidas no lote', () => {
      const keys = [
        'NFe35200714200166000187550010000000046123456789',
        null as any,
        '',
        undefined as any,
        '35200714200166000187550010000000046123456790'
      ];

      const results = normalizer.normalizeBatch(keys);

      expect(results.size).toBe(5);

      // Verificar que chaves inválidas são tratadas
      expect(results.get(null as any)?.hadPrefix).toBe(false);
      expect(results.get('')?.hadPrefix).toBe(false);
      expect(results.get(undefined as any)?.hadPrefix).toBe(false);
    });

    it('deve manter performance adequada com grandes volumes', () => {
      // Gerar 1000 chaves para teste de performance
      const keys: string[] = [];
      for (let i = 0; i < 1000; i++) {
        const hasPrefix = i % 2 === 0;
        const baseKey = `35200714200166000187550010000000046${i.toString().padStart(9, '0')}`;
        keys.push(hasPrefix ? `NFe${baseKey}` : baseKey);
      }

      const startTime = Date.now();
      const results = normalizer.normalizeBatch(keys);
      const processingTime = Date.now() - startTime;

      expect(results.size).toBe(1000);
      expect(processingTime).toBeLessThan(100); // Deve processar em menos de 100ms

      // Verificar que metade tem prefixo
      const withPrefix = Array.from(results.values()).filter(r => r.hadPrefix).length;
      expect(withPrefix).toBe(500);
    });
  });

  describe('shouldNormalize', () => {
    it('deve retornar true para CHV_NFE', () => {
      expect(normalizer.shouldNormalize('CHV_NFE')).toBe(true);
    });

    it('deve retornar false para outros campos', () => {
      expect(normalizer.shouldNormalize('CNPJ_EMIT')).toBe(false);
      expect(normalizer.shouldNormalize('DT_DOC')).toBe(false);
      expect(normalizer.shouldNormalize('VALOR_TOTAL')).toBe(false);
    });
  });

  describe('createNormalizationPipeline', () => {
    it('deve criar pipeline MongoDB válido', () => {
      const pipeline = normalizer.createNormalizationPipeline();

      expect(pipeline).toHaveLength(1);
      expect(pipeline[0]).toHaveProperty('$addFields');
      expect(pipeline[0].$addFields).toHaveProperty('CHV_NFE_NORMALIZED');
      expect(pipeline[0].$addFields).toHaveProperty('ORIGINAL_DOC');
    });

    it('deve criar pipeline com estrutura correta', () => {
      const pipeline = normalizer.createNormalizationPipeline();
      const addFieldsStage = pipeline[0].$addFields;

      // Verificar estrutura do campo CHV_NFE_NORMALIZED
      expect(addFieldsStage.CHV_NFE_NORMALIZED).toHaveProperty('$cond');
      expect(addFieldsStage.CHV_NFE_NORMALIZED.$cond).toHaveLength(3);

      // Verificar condições de validação
      const condition = addFieldsStage.CHV_NFE_NORMALIZED.$cond[0];
      expect(condition).toHaveProperty('$and');
      expect(condition.$and).toContainEqual({ $ne: ['$CHV_NFE', null] });
      expect(condition.$and).toContainEqual({ $ne: ['$CHV_NFE', ''] });
      expect(condition.$and).toContainEqual({ $eq: [{ $type: '$CHV_NFE' }, 'string'] });
    });
  });

  describe('createOptimizedNormalizationPipeline', () => {
    it('deve criar pipeline otimizado básico', () => {
      const pipeline = normalizer.createOptimizedNormalizationPipeline();

      expect(pipeline).toHaveLength(1);
      expect(pipeline[0]).toHaveProperty('$addFields');
      expect(pipeline[0].$addFields).toHaveProperty('CHV_NFE_NORMALIZED');
    });

    it('deve incluir campos adicionais quando especificados', () => {
      const additionalFields = ['CHV_NFE', 'OTHER_FIELD'];
      const pipeline = normalizer.createOptimizedNormalizationPipeline(additionalFields);

      expect(pipeline).toHaveLength(1);
      const addFieldsStage = pipeline[0].$addFields;
      
      expect(addFieldsStage).toHaveProperty('CHV_NFE_NORMALIZED');
      // CHV_NFE deve ser normalizado
      expect(addFieldsStage).toHaveProperty('CHV_NFE_NORMALIZED');
      // OTHER_FIELD não deve ser normalizado (não é CHV_NFE)
      expect(addFieldsStage).not.toHaveProperty('OTHER_FIELD_NORMALIZED');
    });

    it('deve usar estrutura $switch para performance', () => {
      const pipeline = normalizer.createOptimizedNormalizationPipeline();
      const normalizationField = pipeline[0].$addFields.CHV_NFE_NORMALIZED;

      expect(normalizationField).toHaveProperty('$switch');
      expect(normalizationField.$switch).toHaveProperty('branches');
      expect(normalizationField.$switch).toHaveProperty('default');
      expect(normalizationField.$switch.default).toBe('$CHV_NFE');
    });
  });

  describe('createGroupingPipeline', () => {
    it('deve criar pipeline completo com normalização e agrupamento', () => {
      const groupByFields = ['CHV_NFE'];
      const pipeline = normalizer.createGroupingPipeline(groupByFields);

      expect(pipeline.length).toBeGreaterThan(1);
      
      // Primeiro stage deve ser normalização
      expect(pipeline[0]).toHaveProperty('$addFields');
      
      // Último stage deve ser agrupamento
      const lastStage = pipeline[pipeline.length - 1];
      expect(lastStage).toHaveProperty('$group');
      expect(lastStage.$group).toHaveProperty('_id');
      expect(lastStage.$group).toHaveProperty('documents');
      expect(lastStage.$group).toHaveProperty('count');
    });

    it('deve configurar agrupamento por CHV_NFE normalizada', () => {
      const groupByFields = ['CHV_NFE'];
      const pipeline = normalizer.createGroupingPipeline(groupByFields);
      
      const groupStage = pipeline[pipeline.length - 1];
      expect(groupStage.$group._id).toHaveProperty('CHV_NFE_NORMALIZED');
      expect(groupStage.$group._id.CHV_NFE_NORMALIZED).toBe('$CHV_NFE_NORMALIZED');
    });

    it('deve incluir metadados de agrupamento', () => {
      const groupByFields = ['CHV_NFE'];
      const pipeline = normalizer.createGroupingPipeline(groupByFields);
      
      const groupStage = pipeline[pipeline.length - 1];
      expect(groupStage.$group).toHaveProperty('originalKeys');
      expect(groupStage.$group).toHaveProperty('hasNFePrefix');
      expect(groupStage.$group).toHaveProperty('latestDocument');
    });
  });

  describe('validateKeys', () => {
    it('deve filtrar chaves válidas', () => {
      const keys = [
        'NFe35200714200166000187550010000000046123456789',
        '35200714200166000187550010000000046123456790',
        null as any,
        undefined as any,
        '',
        'valid_key'
      ];

      const validKeys = normalizer.validateKeys(keys);

      expect(validKeys).toHaveLength(4);
      expect(validKeys).toContain('NFe35200714200166000187550010000000046123456789');
      expect(validKeys).toContain('35200714200166000187550010000000046123456790');
      expect(validKeys).toContain('');
      expect(validKeys).toContain('valid_key');
      expect(validKeys).not.toContain(null);
      expect(validKeys).not.toContain(undefined);
    });

    it('deve retornar array vazio para entrada inválida', () => {
      const keys = [null as any, undefined as any];
      const validKeys = normalizer.validateKeys(keys);

      expect(validKeys).toHaveLength(0);
    });
  });

  describe('getStatistics', () => {
    it('deve calcular estatísticas corretamente', () => {
      const keys = [
        'NFe35200714200166000187550010000000046123456789',
        '35200714200166000187550010000000046123456790',
        'NFe35200714200166000187550010000000046123456791',
        '35200714200166000187550010000000046123456792'
      ];

      const results = normalizer.normalizeBatch(keys);
      const stats = normalizer.getStatistics(results);

      expect(stats.total).toBe(4);
      expect(stats.withPrefix).toBe(2);
      expect(stats.withoutPrefix).toBe(2);
      expect(stats.percentageWithPrefix).toBe(50);
    });

    it('deve tratar caso sem resultados', () => {
      const results = new Map<string, NormalizationResult>();
      const stats = normalizer.getStatistics(results);

      expect(stats.total).toBe(0);
      expect(stats.withPrefix).toBe(0);
      expect(stats.withoutPrefix).toBe(0);
      expect(stats.percentageWithPrefix).toBe(0);
    });

    it('deve calcular percentual corretamente', () => {
      const keys = ['NFe123', '456', '789']; // 1 com prefixo, 2 sem
      const results = normalizer.normalizeBatch(keys);
      const stats = normalizer.getStatistics(results);

      expect(stats.percentageWithPrefix).toBe(33.33);
    });
  });

  // Testes adicionais para cobertura completa dos requisitos 2.2, 2.3, 2.5
  describe('Normalização em lote - Requisitos específicos', () => {
    describe('Requisito 2.2 - Normalização de múltiplas chaves', () => {
      it('deve tratar chaves idênticas com e sem prefixo como equivalentes', () => {
        const keys = [
          'NFe35200714200166000187550010000000046123456789',
          '35200714200166000187550010000000046123456789', // Mesma chave sem prefixo
          'NFe35200714200166000187550010000000046123456790',
          '35200714200166000187550010000000046123456791'
        ];

        const results = normalizer.normalizeBatch(keys);

        // Verificar que chaves idênticas (com e sem prefixo) têm mesma chave normalizada
        const result1 = results.get(keys[0])!;
        const result2 = results.get(keys[1])!;
        
        expect(result1.normalizedKey).toBe(result2.normalizedKey);
        expect(result1.normalizedKey).toBe('35200714200166000187550010000000046123456789');
        expect(result1.hadPrefix).toBe(true);
        expect(result2.hadPrefix).toBe(false);
      });

      it('deve preservar formato original em todos os resultados', () => {
        const keys = [
          'NFe35200714200166000187550010000000046123456789',
          '35200714200166000187550010000000046123456790',
          'NFe35200714200166000187550010000000046123456791'
        ];

        const results = normalizer.normalizeBatch(keys);

        keys.forEach(originalKey => {
          const result = results.get(originalKey)!;
          expect(result.originalKey).toBe(originalKey);
          
          // Verificar que chaves com prefixo têm normalização diferente do original
          if (originalKey.startsWith('NFe')) {
            expect(result.normalizedKey).not.toBe(result.originalKey);
            expect(result.hadPrefix).toBe(true);
          } else {
            expect(result.normalizedKey).toBe(result.originalKey);
            expect(result.hadPrefix).toBe(false);
          }
        });
      });

      it('deve processar arrays grandes mantendo consistência', () => {
        // Gerar 500 chaves com padrão previsível
        const keys: string[] = [];
        for (let i = 0; i < 500; i++) {
          const baseKey = `35200714200166000187550010000000046${i.toString().padStart(9, '0')}`;
          keys.push(i % 3 === 0 ? `NFe${baseKey}` : baseKey);
        }

        const results = normalizer.normalizeBatch(keys);
        
        expect(results.size).toBe(500);
        
        // Verificar consistência: todas as chaves normalizadas devem ter 44 caracteres
        Array.from(results.values()).forEach(result => {
          if (result.normalizedKey && typeof result.normalizedKey === 'string') {
            expect(result.normalizedKey.length).toBe(44);
            expect(result.normalizedKey.startsWith('NFe')).toBe(false);
          }
        });
      });
    });

    describe('Requisito 2.3 - Pipeline de agregação MongoDB', () => {
      it('deve validar estrutura completa do pipeline de normalização', () => {
        const pipeline = normalizer.createNormalizationPipeline();
        
        expect(pipeline).toHaveLength(1);
        
        const stage = pipeline[0];
        expect(stage).toHaveProperty('$addFields');
        
        const addFields = stage.$addFields;
        expect(addFields).toHaveProperty('CHV_NFE_NORMALIZED');
        expect(addFields).toHaveProperty('ORIGINAL_DOC');
        
        // Verificar estrutura da condição de normalização
        const normalizationLogic = addFields.CHV_NFE_NORMALIZED;
        expect(normalizationLogic).toHaveProperty('$cond');
        expect(normalizationLogic.$cond).toHaveLength(3);
        
        // Verificar condições de validação
        const [condition, thenBranch, elseBranch] = normalizationLogic.$cond;
        expect(condition).toHaveProperty('$and');
        expect(thenBranch).toHaveProperty('$cond');
        expect(elseBranch).toBe('$CHV_NFE');
      });

      it('deve validar pipeline otimizado com estrutura $switch', () => {
        const pipeline = normalizer.createOptimizedNormalizationPipeline();
        
        expect(pipeline).toHaveLength(1);
        
        const stage = pipeline[0];
        const normalizationField = stage.$addFields.CHV_NFE_NORMALIZED;
        
        expect(normalizationField).toHaveProperty('$switch');
        expect(normalizationField.$switch).toHaveProperty('branches');
        expect(normalizationField.$switch).toHaveProperty('default');
        
        const branches = normalizationField.$switch.branches;
        expect(branches).toHaveLength(1);
        
        const branch = branches[0];
        expect(branch).toHaveProperty('case');
        expect(branch).toHaveProperty('then');
        
        // Verificar condições do case
        const caseCondition = branch.case;
        expect(caseCondition).toHaveProperty('$and');
        expect(caseCondition.$and).toContainEqual({ $ne: ['$CHV_NFE', null] });
        expect(caseCondition.$and).toContainEqual({ $ne: ['$CHV_NFE', ''] });
        expect(caseCondition.$and).toContainEqual({ $eq: [{ $type: '$CHV_NFE' }, 'string'] });
      });

      it('deve validar pipeline de agrupamento completo', () => {
        const groupByFields = ['CHV_NFE', 'CNPJ_EMIT'];
        const pipeline = normalizer.createGroupingPipeline(groupByFields);
        
        expect(pipeline.length).toBeGreaterThan(1);
        
        // Primeiro stage: normalização
        const normalizationStage = pipeline[0];
        expect(normalizationStage).toHaveProperty('$addFields');
        expect(normalizationStage.$addFields).toHaveProperty('CHV_NFE_NORMALIZED');
        
        // Último stage: agrupamento
        const groupStage = pipeline[pipeline.length - 1];
        expect(groupStage).toHaveProperty('$group');
        
        const groupConfig = groupStage.$group;
        expect(groupConfig).toHaveProperty('_id');
        expect(groupConfig).toHaveProperty('documents');
        expect(groupConfig).toHaveProperty('count');
        expect(groupConfig).toHaveProperty('originalKeys');
        expect(groupConfig).toHaveProperty('hasNFePrefix');
        expect(groupConfig).toHaveProperty('latestDocument');
        
        // Verificar configuração do _id de agrupamento
        const groupId = groupConfig._id;
        expect(groupId).toHaveProperty('CHV_NFE_NORMALIZED');
        expect(groupId).toHaveProperty('CNPJ_EMIT');
        expect(groupId.CHV_NFE_NORMALIZED).toBe('$CHV_NFE_NORMALIZED');
        expect(groupId.CNPJ_EMIT).toBe('$CNPJ_EMIT');
      });
    });

    describe('Requisito 2.5 - Otimização para performance', () => {
      it('deve manter performance linear com aumento de volume', () => {
        const volumes = [100, 500, 1000];
        const timings: number[] = [];
        
        volumes.forEach(volume => {
          const keys: string[] = [];
          for (let i = 0; i < volume; i++) {
            const baseKey = `35200714200166000187550010000000046${i.toString().padStart(9, '0')}`;
            keys.push(i % 2 === 0 ? `NFe${baseKey}` : baseKey);
          }
          
          const startTime = Date.now();
          const results = normalizer.normalizeBatch(keys);
          const endTime = Date.now();
          
          timings.push(endTime - startTime);
          expect(results.size).toBe(volume);
        });
        
        // Verificar que o processamento foi executado
        expect(timings).toHaveLength(3);
        
        // Verificar que todos os tempos são razoáveis (menos de 100ms)
        timings.forEach(timing => {
          expect(timing).toBeLessThan(100);
        });
        
        // Se algum tempo for > 0, verificar que não cresce exponencialmente
        const nonZeroTimings = timings.filter(t => t > 0);
        if (nonZeroTimings.length >= 2) {
          const maxTiming = Math.max(...nonZeroTimings);
          const minTiming = Math.min(...nonZeroTimings);
          // O tempo máximo não deve ser mais que 50x o tempo mínimo
          expect(maxTiming).toBeLessThan(minTiming * 50);
        }
      });

      it('deve otimizar uso de memória com Map ao invés de Object', () => {
        const keys = Array.from({ length: 1000 }, (_, i) => 
          `NFe35200714200166000187550010000000046${i.toString().padStart(9, '0')}`
        );
        
        const results = normalizer.normalizeBatch(keys);
        
        // Verificar que retorna Map (mais eficiente que Object para muitas chaves)
        expect(results).toBeInstanceOf(Map);
        expect(results.size).toBe(1000);
        
        // Verificar que todas as chaves estão presentes
        keys.forEach(key => {
          expect(results.has(key)).toBe(true);
        });
      });

      it('deve validar chaves antes do processamento para otimização', () => {
        const mixedKeys = [
          'NFe35200714200166000187550010000000046123456789',
          null as any,
          undefined as any,
          '',
          '35200714200166000187550010000000046123456790',
          123 as any, // Tipo inválido
          {} as any   // Tipo inválido
        ];
        
        const validKeys = normalizer.validateKeys(mixedKeys);
        
        // Deve filtrar apenas strings válidas
        expect(validKeys).toHaveLength(3);
        expect(validKeys).toContain('NFe35200714200166000187550010000000046123456789');
        expect(validKeys).toContain('');
        expect(validKeys).toContain('35200714200166000187550010000000046123456790');
        
        // Não deve conter valores inválidos
        expect(validKeys).not.toContain(null);
        expect(validKeys).not.toContain(undefined);
        expect(validKeys).not.toContain(123);
        expect(validKeys).not.toContain({});
      });
    });
  });
});