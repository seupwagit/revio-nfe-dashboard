import { NFE_GROUPING_DEFAULTS } from '@fiscal/shared/constants/nfe-grouping.constants';
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

/**
 * Teste Unitário: Propriedade 3 - Comportamento Padrão com Configurações Ausentes
 * 
 * Valida: Requisitos 1.3, 3.2
 * 
 * Este teste verifica que o sistema mantém comportamento padrão correto quando:
 * - Variáveis de ambiente não estão definidas
 * - Configurações são inválidas ou vazias
 * - Sistema deve usar valores padrão apropriados
 */
describe('OrderingProcessor - Propriedade 3: Comportamento Padrão com Configurações Ausentes', () => {
  let processor: OrderingProcessor;

  beforeEach(() => {
    processor = new OrderingProcessor();
    vi.clearAllMocks();
    
    // Limpar todas as variáveis de ambiente relacionadas
    delete process.env.TBL_NFE_100_ORDER_BY;
    delete process.env.NFE_GROUPING_ENABLED;
    delete process.env.TBL_NFE_100_GROUPING_ENABLED;
  });

  afterEach(() => {
    // Garantir limpeza completa
    delete process.env.TBL_NFE_100_ORDER_BY;
    delete process.env.NFE_GROUPING_ENABLED;
    delete process.env.TBL_NFE_100_GROUPING_ENABLED;
  });

  describe('Requisito 3.2: Ordenação Padrão', () => {
    it('deve usar ordenação padrão quando TBL_NFE_100_ORDER_BY não estiver definida', () => {
      // Arrange - Garantir que variável não existe
      expect(process.env.TBL_NFE_100_ORDER_BY).toBeUndefined();

      // Act
      const config = processor.getOrderingConfig('tbl_nfe_100');

      // Assert - **Requisito 3.2**: Deve usar "DT_DOC DESC, PROTOCOLADA DESC" como padrão
      expect(config.enabled).toBe(true);
      expect(config.defaultOrdering).toBe(NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY);
      expect(config.defaultOrdering).toBe('DT_DOC DESC, PROTOCOLADA DESC');
      
      // Verificar campos parseados
      expect(config.fields).toHaveLength(2);
      expect(config.fields[0]).toEqual({
        field: 'DT_DOC',
        direction: -1,
        priority: 0
      });
      expect(config.fields[1]).toEqual({
        field: 'PROTOCOLADA',
        direction: -1,
        priority: 1
      });
    });

    it('deve usar ordenação padrão quando TBL_NFE_100_ORDER_BY estiver vazia', () => {
      // Arrange
      process.env.TBL_NFE_100_ORDER_BY = '';

      // Act
      const config = processor.getOrderingConfig('tbl_nfe_100');

      // Assert - **Requisito 3.2**: Deve usar configuração padrão para string vazia
      expect(config.enabled).toBe(true);
      expect(config.defaultOrdering).toBe(NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY);
      expect(config.fields[0].field).toBe('DT_DOC');
      expect(config.fields[1].field).toBe('PROTOCOLADA');
    });

    it('deve usar ordenação padrão quando TBL_NFE_100_ORDER_BY for apenas espaços', () => {
      // Arrange
      process.env.TBL_NFE_100_ORDER_BY = '   ';

      // Act
      const config = processor.getOrderingConfig('tbl_nfe_100');

      // Assert - **Requisito 3.2**: Deve usar configuração padrão para string com apenas espaços
      expect(config.enabled).toBe(true);
      // O parseOrderingConfig deve detectar string inválida e usar padrão
      expect(config.fields[0].field).toBe('DT_DOC');
      expect(config.fields[1].field).toBe('PROTOCOLADA');
      // Os campos devem usar a configuração padrão mesmo que defaultOrdering seja a string original
      expect(config.fields).toHaveLength(2);
    });
  });

  describe('Comportamento Padrão - Parsing de Configuração', () => {
    it('deve usar configuração padrão para entrada null', () => {
      // Act
      const result = processor.parseOrderingConfig(null as any);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].field).toBe('DT_DOC');
      expect(result[0].direction).toBe(-1);
      expect(result[1].field).toBe('PROTOCOLADA');
      expect(result[1].direction).toBe(-1);
    });

    it('deve usar configuração padrão para entrada undefined', () => {
      // Act
      const result = processor.parseOrderingConfig(undefined as any);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].field).toBe('DT_DOC');
      expect(result[1].field).toBe('PROTOCOLADA');
    });

    it('deve usar configuração padrão para string vazia', () => {
      // Act
      const result = processor.parseOrderingConfig('');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].field).toBe('DT_DOC');
      expect(result[1].field).toBe('PROTOCOLADA');
    });

    it('deve usar configuração padrão para tipo não-string', () => {
      // Act
      const result = processor.parseOrderingConfig(123 as any);

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].field).toBe('DT_DOC');
      expect(result[1].field).toBe('PROTOCOLADA');
    });
  });

  describe('Comportamento Padrão - Construção de Sort Stage', () => {
    it('deve usar configuração padrão para array vazio', () => {
      // Act
      const result = processor.buildSortStage([]);

      // Assert - Deve usar configuração padrão
      expect(result).toEqual({
        $sort: {
          DT_DOC: -1,
          PROTOCOLADA: -1
        }
      });
    });

    it('deve usar configuração padrão para array null', () => {
      // Act
      const result = processor.buildSortStage(null as any);

      // Assert
      expect(result).toEqual({
        $sort: {
          DT_DOC: -1,
          PROTOCOLADA: -1
        }
      });
    });

    it('deve usar configuração padrão para array undefined', () => {
      // Act
      const result = processor.buildSortStage(undefined as any);

      // Assert
      expect(result).toEqual({
        $sort: {
          DT_DOC: -1,
          PROTOCOLADA: -1
        }
      });
    });
  });

  describe('Comportamento Padrão - Validação de Campos', () => {
    it('deve aceitar campos padrão como válidos para tbl_nfe_100', () => {
      // Arrange
      const defaultFields = ['DT_DOC', 'PROTOCOLADA'];

      // Act & Assert - Não deve lançar erro
      expect(() => {
        processor.validateOrderingFields(defaultFields, 'tbl_nfe_100');
      }).not.toThrow();
    });

    it('deve aceitar array vazio sem lançar erro', () => {
      // Act & Assert - Não deve lançar erro para array vazio
      expect(() => {
        processor.validateOrderingFields([], 'tbl_nfe_100');
      }).not.toThrow();
    });
  });

  describe('Comportamento Padrão - Consistência', () => {
    it('deve manter consistência entre parseOrderingConfig e buildSortStage', () => {
      // Act
      const parsedFields = processor.parseOrderingConfig('');
      const sortStage = processor.buildSortStage(parsedFields);

      // Assert - Resultado deve ser consistente
      expect(sortStage).toEqual({
        $sort: {
          DT_DOC: -1,
          PROTOCOLADA: -1
        }
      });
    });

    it('deve manter consistência entre getOrderingConfig e parseOrderingConfig', () => {
      // Act
      const config = processor.getOrderingConfig('tbl_nfe_100');
      const parsedFields = processor.parseOrderingConfig(NFE_GROUPING_DEFAULTS.DEFAULT_ORDER_BY);

      // Assert - Campos devem ser idênticos
      expect(config.fields).toEqual(parsedFields);
    });
  });

  describe('Comportamento Padrão - Logging', () => {
    it('deve executar parseOrderingConfig sem erros para entrada inválida', () => {
      // Act & Assert - Não deve lançar erro
      expect(() => {
        processor.parseOrderingConfig('');
      }).not.toThrow();
    });

    it('deve executar getOrderingConfig sem erros', () => {
      // Act & Assert - Não deve lançar erro
      expect(() => {
        processor.getOrderingConfig('tbl_nfe_100');
      }).not.toThrow();
    });
  });
});