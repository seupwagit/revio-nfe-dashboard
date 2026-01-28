/**
 * Testes unitários e baseados em propriedades para ManifestationTypeService
 * Valida funcionalidade de cache, consultas de banco e integração com roteamento
 */

// 1. Node.js built-ins

// 2. External libraries
import fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from 'vitest';

// 3. Internal packages (workspace)
import { ManifestationConstants } from '@fiscal/shared/constants/manifestation.constants';

// 4. Relative imports
import { databaseRouter } from '../DatabaseRouter';
import { ManifestationTypeService } from '../ManifestationTypeService';

// Mock do DatabaseRouter
vi.mock('../DatabaseRouter', () => ({
  databaseRouter: {
    getCurrentSqlConnection: vi.fn()
  }
}));

// Mock do logger
vi.mock('../../utils/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }))
}));

describe('ManifestationTypeService', () => {
  let service: ManifestationTypeService;
  let mockPrisma: {
    $queryRaw: Mock;
  };

  const mockManifestationTypes = [
    {
      id: 1,
      codigo: '210200',
      descricao: 'Confirmação da Operação',
      ativo: true,
      ordem: 1
    },
    {
      id: 2,
      codigo: '210210',
      descricao: 'Ciência da Operação',
      ativo: true,
      ordem: 2
    },
    {
      id: 3,
      codigo: '210220',
      descricao: 'Desconhecimento da Operação',
      ativo: true,
      ordem: 3
    },
    {
      id: 4,
      codigo: '210240',
      descricao: 'Operação não Realizada',
      ativo: true,
      ordem: 4
    },
    {
      id: 5,
      codigo: '999999',
      descricao: 'Tipo Inativo',
      ativo: false,
      ordem: 999
    }
  ];

  beforeEach(() => {
    // Criar nova instância do serviço para cada teste
    service = new ManifestationTypeService();
    
    // Mock do Prisma
    mockPrisma = {
      $queryRaw: vi.fn()
    };

    // Configurar mock do DatabaseRouter
    (databaseRouter.getCurrentSqlConnection as Mock).mockResolvedValue(mockPrisma);
    
    // Configurar mock padrão do Prisma
    mockPrisma.$queryRaw.mockResolvedValue(mockManifestationTypes);
  });

  afterEach(() => {
    // Limpar todos os mocks
    vi.clearAllMocks();
    
    // Limpar cache do serviço
    service.clearAllCache();
  });

  describe('Property-Based Tests', () => {
    describe('Property 1: Manifestation Type Loading and Selection', () => {
      it('should load manifestation types from user database context and enable selection functionality', async () => {
        // **Validates: Requirements 1.1, 1.3, 1.4**
        // Property: Para qualquer usuário com autenticação válida, carregar tipos de manifestação 
        // deve popular o dropdown com tipos do contexto de banco do usuário, e selecionar um tipo 
        // deve habilitar a funcionalidade de manifestação

        await fc.assert(fc.asyncProperty(
          // Gerador de código de usuário válido (simplificado)
          fc.string({ minLength: 3, maxLength: 10 }).map(s => s.toUpperCase().replace(/[^A-Z0-9]/g, 'A')),
          // Gerador de tipos de manifestação do banco (simplificado)
          fc.array(
            fc.record({
              id: fc.integer({ min: 1, max: 999 }),
              codigo: fc.integer({ min: 210200, max: 210299 }).map(n => n.toString()),
              descricao: fc.constant('Tipo de Manifestação Teste'),
              ativo: fc.boolean(),
              ordem: fc.option(fc.integer({ min: 1, max: 10 }), { nil: undefined })
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (usrCodigo, rawDatabaseTypes) => {
            // Limpar cache e mocks antes de cada execução da propriedade
            service.clearAllCache();
            vi.clearAllMocks();

            // Reconfigurar mocks para esta execução
            (databaseRouter.getCurrentSqlConnection as Mock).mockResolvedValue(mockPrisma);
            mockPrisma.$queryRaw.mockResolvedValue(rawDatabaseTypes);

            // Executar carregamento de tipos
            const loadResult = await service.getAvailableTypes(usrCodigo);

            // Propriedade 1.1: Carregamento deve ser bem-sucedido para usuário válido
            expect(loadResult.success).toBe(true);
            expect(loadResult.data).toBeDefined();

            // Propriedade 1.2: Tipos devem ser do contexto do banco do usuário
            expect(databaseRouter.getCurrentSqlConnection).toHaveBeenCalled();

            // Propriedade 1.3: Apenas tipos ativos devem ser retornados
            const activeTypesFromDb = rawDatabaseTypes.filter(type => type.ativo);
            expect(loadResult.data!.length).toBe(activeTypesFromDb.length);
            
            loadResult.data!.forEach(type => {
              expect(type.ativo).toBe(true);
            });

            // Propriedade 1.4: Tipos devem estar ordenados corretamente
            const sortedTypes = loadResult.data!;
            for (let i = 1; i < sortedTypes.length; i++) {
              const prevOrder = sortedTypes[i - 1].ordem || 999;
              const currentOrder = sortedTypes[i].ordem || 999;
              expect(currentOrder).toBeGreaterThanOrEqual(prevOrder);
            }

            // Propriedade 1.5: Seleção de tipo válido deve habilitar funcionalidade
            if (loadResult.data!.length > 0) {
              const selectedType = loadResult.data![0];
              const validationResult = await service.validateManifestationType(
                selectedType.codigo, 
                usrCodigo
              );
              
              expect(validationResult.success).toBe(true);
              expect(validationResult.data).toBe(true);
            }

            // Propriedade 1.6: Cache deve funcionar corretamente
            const cachedResult = await service.getAvailableTypes(usrCodigo);
            expect(cachedResult.success).toBe(true);
            expect(cachedResult.data).toEqual(loadResult.data);
            
            // Verificar que não houve segunda consulta ao banco (cache hit)
            // Permitir 1 ou 2 chamadas dependendo se houve validação
            const expectedCalls = loadResult.data!.length > 0 ? 1 : 1;
            expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(expectedCalls);
          }
        ), { 
          numRuns: 20,
          timeout: 5000
        });
      });

      it('should handle database routing failures consistently', async () => {
        // Property: Para qualquer usuário, falhas de roteamento de banco devem ser tratadas consistentemente

        await fc.assert(fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 10 }).map(s => s.toUpperCase().replace(/[^A-Z0-9]/g, 'A')),
          async (usrCodigo) => {
            // Limpar cache
            service.clearAllCache();

            // Simular falha no roteamento de banco
            (databaseRouter.getCurrentSqlConnection as Mock).mockResolvedValueOnce(null);

            const result = await service.getAvailableTypes(usrCodigo);

            // Propriedade: Falha deve ser tratada consistentemente
            expect(result.success).toBe(false);
            expect(result.errorCode).toBe(ManifestationConstants.ERROR_CODES.DATABASE_ROUTING_ERROR);
            expect(result.error).toBe('Conexão com banco de dados não disponível');
            expect(result.data).toBeUndefined();
          }
        ), { 
          numRuns: 20,
          timeout: 3000
        });
      });

      it('should validate manifestation type format consistently', async () => {
        // Property: Para qualquer entrada de tipo, validação de formato deve ser consistente

        await fc.assert(fc.asyncProperty(
          fc.string({ minLength: 3, maxLength: 10 }).map(s => s.toUpperCase().replace(/[^A-Z0-9]/g, 'A')),
          fc.oneof(
            // Tipos válidos
            fc.integer({ min: 210200, max: 210299 }).map(n => n.toString()),
            // Tipos inválidos
            fc.string({ minLength: 1, maxLength: 20 }).filter(s => !/^[A-Z0-9]{1,10}$/.test(s))
          ),
          async (usrCodigo, typeCode) => {
            const isValidFormat = ManifestationConstants.REGEX.TYPE_CODE.test(typeCode);
            
            const result = await service.validateManifestationType(typeCode, usrCodigo);

            if (!isValidFormat) {
              // Propriedade: Formato inválido deve ser rejeitado
              expect(result.success).toBe(false);
              expect(result.errorCode).toBe(ManifestationConstants.ERROR_CODES.MANIFESTATION_TYPE_INVALID);
            } else {
              // Propriedade: Formato válido deve prosseguir para validação de existência
              expect(result.success).toBe(true);
              expect(typeof result.data).toBe('boolean');
            }
          }
        ), { 
          numRuns: 20,
          timeout: 4000
        });
      });
    });
  });

  describe('Unit Tests - Database Routing and Cache Behavior', () => {
    describe('Database Routing', () => {
      it('should handle database connection timeout gracefully', async () => {
        // Simular timeout na conexão - retornar null após delay
        (databaseRouter.getCurrentSqlConnection as Mock).mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve(null), 100))
        );

        const result = await service.getAvailableTypes('TEST001');

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe(ManifestationConstants.ERROR_CODES.DATABASE_ROUTING_ERROR);
        expect(result.error).toBe('Conexão com banco de dados não disponível');
      }, 15000);

      it('should handle database query timeout', async () => {
        // Simular query que demora mais que o timeout
        mockPrisma.$queryRaw.mockImplementation(
          () => new Promise(resolve => setTimeout(() => resolve(mockManifestationTypes), 15000))
        );

        const result = await service.getAvailableTypes('TEST002');

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe(ManifestationConstants.ERROR_CODES.DATABASE_ROUTING_ERROR);
        expect(result.error).toBe('Erro ao consultar tipos de manifestação no banco');
      }, 15000);

      it('should handle database query errors', async () => {
        // Simular erro na query
        mockPrisma.$queryRaw.mockRejectedValue(new Error('Connection lost'));

        const result = await service.getAvailableTypes('TEST003');

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe(ManifestationConstants.ERROR_CODES.DATABASE_ROUTING_ERROR);
        expect(result.error).toBe('Erro ao consultar tipos de manifestação no banco');
      });

      it('should route to correct database based on user context', async () => {
        const usrCodigo = 'EMPRESA001';
        
        await service.getAvailableTypes(usrCodigo);

        expect(databaseRouter.getCurrentSqlConnection).toHaveBeenCalledTimes(1);
        expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
          expect.arrayContaining([
            expect.stringContaining('SELECT'),
            expect.stringContaining('FROM tbl_tipo_manifestacao'),
            expect.stringContaining('WHERE ativo = 1'),
            expect.stringContaining('ORDER BY ordem ASC, descricao ASC')
          ])
        );
      });
    });

    describe('Cache Behavior - TTL and Expiration', () => {
      beforeEach(() => {
        // Mock do Date para controlar tempo
        vi.useFakeTimers();
      });

      afterEach(() => {
        vi.useRealTimers();
      });

      it('should cache results with correct TTL', async () => {
        const usrCodigo = 'CACHE001';
        
        // Primeira chamada - deve ir ao banco
        const result1 = await service.getAvailableTypes(usrCodigo);
        expect(result1.success).toBe(true);
        expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);

        // Segunda chamada imediata - deve usar cache
        const result2 = await service.getAvailableTypes(usrCodigo);
        expect(result2.success).toBe(true);
        expect(result2.data).toEqual(result1.data);
        expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1); // Não deve ter chamado novamente

        // Verificar estatísticas do cache
        const stats = service.getCacheStats();
        expect(stats.totalHits).toBe(1);
        expect(stats.totalMisses).toBe(1);
        expect(stats.hitRate).toBe(50);
      });

      it('should expire cache after TTL', async () => {
        const usrCodigo = 'CACHE002';
        
        // Primeira chamada
        await service.getAvailableTypes(usrCodigo);
        expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(1);

        // Avançar tempo além do TTL (5 minutos + 1 segundo)
        vi.advanceTimersByTime(ManifestationConstants.CACHE.MANIFESTATION_TYPES_TTL + 1000);

        // Segunda chamada após expiração - deve ir ao banco novamente
        await service.getAvailableTypes(usrCodigo);
        expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
      });
    });

    describe('Validation - Edge Cases', () => {
      it('should reject empty type code', async () => {
        const result = await service.validateManifestationType('', 'USER001');

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe(ManifestationConstants.ERROR_CODES.MANIFESTATION_TYPE_INVALID);
      });

      it('should reject null type code', async () => {
        const result = await service.validateManifestationType(null as any, 'USER001');

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe(ManifestationConstants.ERROR_CODES.MANIFESTATION_TYPE_INVALID);
      });

      it('should reject undefined type code', async () => {
        const result = await service.validateManifestationType(undefined as any, 'USER001');

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe(ManifestationConstants.ERROR_CODES.MANIFESTATION_TYPE_INVALID);
      });

      it('should reject type code with special characters', async () => {
        const result = await service.validateManifestationType('210200@#$', 'USER001');

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe(ManifestationConstants.ERROR_CODES.MANIFESTATION_TYPE_INVALID);
      });

      it('should reject type code too long', async () => {
        const result = await service.validateManifestationType('21020012345678901234567890', 'USER001');

        expect(result.success).toBe(false);
        expect(result.errorCode).toBe(ManifestationConstants.ERROR_CODES.MANIFESTATION_TYPE_INVALID);
      });

      it('should validate existing active type', async () => {
        const result = await service.validateManifestationType('210200', 'USER001');

        expect(result.success).toBe(true);
        expect(result.data).toBe(true);
      });

      it('should reject inactive type', async () => {
        const result = await service.validateManifestationType('999999', 'USER001');

        expect(result.success).toBe(true);
        expect(result.data).toBe(false); // Existe mas não está ativo
      });

      it('should reject non-existent type', async () => {
        const result = await service.validateManifestationType('999998', 'USER001');

        expect(result.success).toBe(true);
        expect(result.data).toBe(false); // Não existe
      });
    });
  });
});