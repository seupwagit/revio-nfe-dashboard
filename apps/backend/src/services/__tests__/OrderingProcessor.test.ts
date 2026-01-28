import { NFE_GROUPING_DEFAULTS } from '@fiscal/shared/constants/nfe-grouping.constants';
import { OrderingConfigurationError } from '@fiscal/shared/errors/ordering-configuration-error.class';
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

describe('OrderingProcessor', () => {
  let processor: OrderingProcessor;

  beforeEach(() => {
    processor = new OrderingProcessor();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Limpar variáveis de ambiente
    delete process.env.TBL_NFE_100_ORDER_BY;
  });

  describe('parseOrderingConfig', () => {
    it('deve parsear configuração simples corretamente', () => {
      const config = 'DT_DOC DESC';
      const result = processor.parseOrderingConfig(config);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        field: 'DT_DOC',
        direction: -1,
        priority: 0
      });
    });

    it('deve parsear múltiplos campos corretamente', () => {
      const config = 'DT_DOC DESC, PROTOCOLADA ASC, VALOR_TOTAL DESC';
      const result = processor.parseOrderingConfig(config);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({
        field: 'DT_DOC',
        direction: -1,
        priority: 0
      });
      expect(result[1]).toEqual({
        field: 'PROTOCOLADA',
        direction: 1,
        priority: 1
      });
      expect(result[2]).toEqual({
        field: 'VALOR_TOTAL',
        direction: -1,
        priority: 2
      });
    });

    it('deve usar DESC como padrão quando direção não especificada', () => {
      const config = 'DT_DOC';
      const result = processor.parseOrderingConfig(config);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        field: 'DT_DOC',
        direction: -1,
        priority: 0
      });
    });

    it('deve usar configuração padrão para entrada inválida', () => {
      const result = processor.parseOrderingConfig('');
      
      expect(result).toHaveLength(2); // DEFAULT_ORDER_BY tem 2 campos
      expect(result[0].field).toBe('DT_DOC');
      expect(result[1].field).toBe('PROTOCOLADA');
    });
  });

  describe('buildSortStage', () => {
    it('deve construir estágio de ordenação MongoDB corretamente', () => {
      const fields = [
        { field: 'DT_DOC', direction: -1 as const, priority: 0 },
        { field: 'PROTOCOLADA', direction: 1 as const, priority: 1 }
      ];

      const result = processor.buildSortStage(fields);

      expect(result).toEqual({
        $sort: {
          DT_DOC: -1,
          PROTOCOLADA: 1
        }
      });
    });

    it('deve usar configuração padrão para array vazio', () => {
      const result = processor.buildSortStage([]);

      expect(result.$sort).toHaveProperty('DT_DOC');
      expect(result.$sort).toHaveProperty('PROTOCOLADA');
    });
  });

  describe('validateOrderingFields', () => {
    it('deve validar campos válidos para tbl_nfe_100', () => {
      const fields = ['DT_DOC', 'PROTOCOLADA', 'VALOR_TOTAL'];
      
      expect(() => {
        processor.validateOrderingFields(fields, 'tbl_nfe_100');
      }).not.toThrow();
    });

    it('deve rejeitar campos inválidos para tbl_nfe_100', () => {
      const fields = ['DT_DOC', 'CAMPO_INEXISTENTE'];
      
      expect(() => {
        processor.validateOrderingFields(fields, 'tbl_nfe_100');
      }).toThrow(OrderingConfigurationError);
    });
  });

  describe('getOrderingConfig', () => {
    it('deve carregar configuração de variável de ambiente', () => {
      process.env.TBL_NFE_100_ORDER_BY = 'VALOR_TOTAL ASC, DT_DOC DESC';
      
      const config = processor.getOrderingConfig('tbl_nfe_100');

      expect(config.enabled).toBe(true);
      expect(config.defaultOrdering).toBe('VALOR_TOTAL ASC, DT_DOC DESC');
      expect(config.fields).toHaveLength(2);
      expect(config.fields[0].field).toBe('VALOR_TOTAL');
      expect(config.fields[0].direction).toBe(1);
    });

    it('deve usar configuração padrão quando variável não existe', () => {
      const config = processor.getOrderingConfig('tbl_nfe_100');

      expect(config.enabled).toBe(true);
      expect(config.defaultOrdering).toBe(NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY);
      expect(config.fields[0].field).toBe('DT_DOC');
      expect(config.fields[1].field).toBe('PROTOCOLADA');
    });
  });
});