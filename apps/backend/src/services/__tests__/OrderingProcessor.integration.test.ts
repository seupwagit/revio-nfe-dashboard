import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { OrderingProcessor } from '../OrderingProcessor';

// Mock do logger
vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}));

describe('OrderingProcessor - Testes de Integração', () => {
  let processor: OrderingProcessor;

  beforeEach(() => {
    processor = new OrderingProcessor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Limpar todas as variáveis de ambiente de teste
    Object.keys(process.env).forEach(key => {
      if (key.includes('ORDER_BY') || key.includes('GROUPING')) {
        delete process.env[key];
      }
    });
  });

  describe('Cenários de configuração complexos', () => {
    it('deve processar configuração com múltiplos campos e direções mistas', () => {
      const config = 'DT_DOC DESC, PROTOCOLADA ASC, VALOR_TOTAL DESC, CHV_NFE ASC';
      const result = processor.parseOrderingConfig(config);

      expect(result).toHaveLength(4);
      expect(result[0]).toEqual({ field: 'DT_DOC', direction: -1, priority: 0 });
      expect(result[1]).toEqual({ field: 'PROTOCOLADA', direction: 1, priority: 1 });
      expect(result[2]).toEqual({ field: 'VALOR_TOTAL', direction: -1, priority: 2 });
      expect(result[3]).toEqual({ field: 'CHV_NFE', direction: 1, priority: 3 });
    });

    it('deve construir pipeline MongoDB complexo com ordenação múltipla', () => {
      const fields = [
        { field: 'DT_DOC', direction: -1 as const, priority: 0 },
        { field: 'PROTOCOLADA', direction: 1 as const, priority: 1 },
        { field: 'VALOR_TOTAL', direction: -1 as const, priority: 2 }
      ];

      const result = processor.buildSortStage(fields);

      expect(result).toEqual({
        $sort: {
          DT_DOC: -1,
          PROTOCOLADA: 1,
          VALOR_TOTAL: -1
        }
      });
    });

    it('deve aplicar ordenação a pipeline existente', () => {
      const pipeline = [
        { $match: { CHV_NFE: { $exists: true } } },
        { $group: { _id: '$CHV_NFE', count: { $sum: 1 } } }
      ];

      const ordering = [
        { field: 'count', direction: -1 as const, priority: 0 }
      ];

      processor.applyGroupOrdering(pipeline, ordering);

      expect(pipeline).toHaveLength(3);
      expect(pipeline[2]).toEqual({
        $sort: { count: -1 }
      });
    });
  });

  describe('Validação de configurações por variáveis de ambiente', () => {
    it('deve carregar configuração específica da coleção tbl_nfe_100', () => {
      process.env.TBL_NFE_100_ORDER_BY = 'CNPJ_EMIT ASC, VALOR_TOTAL DESC';
      
      const config = processor.getOrderingConfig('tbl_nfe_100');

      expect(config.enabled).toBe(true);
      expect(config.defaultOrdering).toBe('CNPJ_EMIT ASC, VALOR_TOTAL DESC');
      expect(config.fields).toHaveLength(2);
      expect(config.fields[0].field).toBe('CNPJ_EMIT');
      expect(config.fields[0].direction).toBe(1);
      expect(config.fields[1].field).toBe('VALOR_TOTAL');
      expect(config.fields[1].direction).toBe(-1);
    });

    it('deve usar configuração padrão para coleção sem variável específica', () => {
      const config = processor.getOrderingConfig('outra_colecao');

      expect(config.enabled).toBe(true);
      expect(config.defaultOrdering).toBe('DT_DOC DESC, PROTOCOLADA DESC');
      expect(config.fields[0].field).toBe('DT_DOC');
      expect(config.fields[1].field).toBe('PROTOCOLADA');
    });

    it('deve recuperar graciosamente de configuração inválida', () => {
      process.env.TBL_NFE_100_ORDER_BY = 'CAMPO_INEXISTENTE DESC';
      
      const config = processor.getOrderingConfig('tbl_nfe_100');

      // Deve usar configuração padrão devido ao erro de validação
      expect(config.enabled).toBe(true);
      expect(config.defaultOrdering).toBe('DT_DOC DESC, PROTOCOLADA DESC');
      expect(config.fields[0].field).toBe('DT_DOC');
    });
  });

  describe('Casos extremos e robustez', () => {
    it('deve tratar configuração com espaços em branco excessivos', () => {
      const config = '   DT_DOC   DESC   ,    PROTOCOLADA    ASC   ,   ';
      const result = processor.parseOrderingConfig(config);

      expect(result).toHaveLength(2);
      expect(result[0].field).toBe('DT_DOC');
      expect(result[1].field).toBe('PROTOCOLADA');
    });

    it('deve normalizar configuração malformada', () => {
      const config = 'DT_DOC,PROTOCOLADA ASC,VALOR_TOTAL';
      const normalized = processor.normalizeOrderingConfig(config);

      expect(normalized).toBe('DT_DOC DESC, PROTOCOLADA ASC, VALOR_TOTAL DESC');
    });

    it('deve validar configuração com isValidOrderingConfig', () => {
      expect(processor.isValidOrderingConfig('DT_DOC DESC')).toBe(true);
      expect(processor.isValidOrderingConfig('DT_DOC DESC, PROTOCOLADA ASC')).toBe(true);
      expect(processor.isValidOrderingConfig('')).toBe(false);
      expect(processor.isValidOrderingConfig('DT_DOC DESC', 'tbl_nfe_100')).toBe(true);
      expect(processor.isValidOrderingConfig('CAMPO_INEXISTENTE DESC', 'tbl_nfe_100')).toBe(false);
    });

    it('deve tratar entrada null/undefined sem quebrar', () => {
      expect(() => {
        processor.parseOrderingConfig(null as any);
      }).not.toThrow();

      expect(() => {
        processor.parseOrderingConfig(undefined as any);
      }).not.toThrow();

      expect(() => {
        processor.buildSortStage(null as any);
      }).not.toThrow();
    });
  });

  describe('Integração com MongoDB pipeline', () => {
    it('deve criar pipeline completo de ordenação para agregação', () => {
      const config = 'DT_DOC DESC, PROTOCOLADA ASC';
      const fields = processor.parseOrderingConfig(config);
      const sortStage = processor.buildSortStage(fields);

      // Simular pipeline de agregação
      const pipeline = [
        { $match: { CHV_NFE: { $exists: true } } },
        { $group: { _id: '$CHV_NFE', docs: { $push: '$$ROOT' } } }
      ];

      processor.applyGroupOrdering(pipeline, fields);

      expect(pipeline).toHaveLength(3);
      expect(pipeline[2]).toEqual(sortStage);
    });

    it('deve manter ordem de prioridade correta em pipeline complexo', () => {
      const fields = [
        { field: 'VALOR_TOTAL', direction: -1 as const, priority: 2 },
        { field: 'DT_DOC', direction: -1 as const, priority: 0 },
        { field: 'PROTOCOLADA', direction: 1 as const, priority: 1 }
      ];

      const sortStage = processor.buildSortStage(fields);
      const sortKeys = Object.keys(sortStage.$sort);

      // Deve ordenar por prioridade: DT_DOC (0), PROTOCOLADA (1), VALOR_TOTAL (2)
      expect(sortKeys[0]).toBe('DT_DOC');
      expect(sortKeys[1]).toBe('PROTOCOLADA');
      expect(sortKeys[2]).toBe('VALOR_TOTAL');
    });
  });

  describe('Logging e monitoramento', () => {
    it('deve processar configuração sem erros', () => {
      const config = 'DT_DOC DESC, PROTOCOLADA ASC';
      const result = processor.parseOrderingConfig(config);

      expect(result).toHaveLength(2);
      expect(result[0].field).toBe('DT_DOC');
      expect(result[1].field).toBe('PROTOCOLADA');
    });

    it('deve tratar configurações problemáticas graciosamente', () => {
      expect(() => {
        processor.parseOrderingConfig('CAMPO INVALID_DIRECTION');
      }).not.toThrow();
    });
  });
});