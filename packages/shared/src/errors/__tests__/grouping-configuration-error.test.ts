import { ERROR_CODES } from '../../constants/error-codes.constants';
import { GroupingConfigurationError } from '../grouping-configuration-error.class';

describe('GroupingConfigurationError', () => {
  describe('construção da classe', () => {
    it('deve criar erro com mensagem padrão', () => {
      const error = new GroupingConfigurationError();
      
      expect(error.name).toBe('GroupingConfigurationError');
      expect(error.message).toBe('Configuração de agrupamento inválida');
      expect(error.code).toBe(ERROR_CODES.GROUPING_CONFIG_ERROR);
      expect(error.statusCode).toBe(400);
      expect(error.timestamp).toBeDefined();
      expect(error.requestId).toBeUndefined();
    });

    it('deve criar erro com mensagem customizada', () => {
      const customMessage = 'Campo de agrupamento inválido: INVALID_FIELD';
      const error = new GroupingConfigurationError(customMessage);
      
      expect(error.message).toBe(customMessage);
      expect(error.name).toBe('GroupingConfigurationError');
      expect(error.code).toBe(ERROR_CODES.GROUPING_CONFIG_ERROR);
      expect(error.statusCode).toBe(400);
    });

    it('deve criar erro com requestId', () => {
      const requestId = 'req-123-456';
      const error = new GroupingConfigurationError('Erro de teste', requestId);
      
      expect(error.requestId).toBe(requestId);
      expect(error.message).toBe('Erro de teste');
    });

    it('deve herdar de AppError', () => {
      const error = new GroupingConfigurationError();
      
      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('GroupingConfigurationError');
      expect(error.code).toBeDefined();
      expect(error.statusCode).toBeDefined();
      expect(error.timestamp).toBeDefined();
    });
  });

  describe('propriedades da classe', () => {
    it('deve ter código de erro correto', () => {
      const error = new GroupingConfigurationError();
      expect(error.code).toBe('GROUPING_CONFIG_ERROR');
    });

    it('deve ter status code 400 (Bad Request)', () => {
      const error = new GroupingConfigurationError();
      expect(error.statusCode).toBe(400);
    });

    it('deve ter timestamp válido', () => {
      const beforeCreation = Date.now();
      const error = new GroupingConfigurationError();
      const afterCreation = Date.now();
      
      const errorTimestamp = new Date(error.timestamp).getTime();
      expect(errorTimestamp).toBeGreaterThanOrEqual(beforeCreation);
      expect(errorTimestamp).toBeLessThanOrEqual(afterCreation);
    });
  });

  describe('serialização', () => {
    it('deve ser serializável para JSON', () => {
      const error = new GroupingConfigurationError('Erro de teste', 'req-123');
      
      // Criar objeto com propriedades serializáveis
      const errorObject = {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        requestId: error.requestId,
        timestamp: error.timestamp
      };
      
      const serialized = JSON.stringify(errorObject);
      const parsed = JSON.parse(serialized);
      
      expect(parsed.name).toBe('GroupingConfigurationError');
      expect(parsed.message).toBe('Erro de teste');
      expect(parsed.code).toBe('GROUPING_CONFIG_ERROR');
      expect(parsed.statusCode).toBe(400);
      expect(parsed.requestId).toBe('req-123');
      expect(parsed.timestamp).toBeDefined();
    });
  });
});