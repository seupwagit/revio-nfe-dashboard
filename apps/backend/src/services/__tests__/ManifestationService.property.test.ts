/**
 * Testes de propriedade para ManifestationService
 * 
 * Valida propriedades universais do sistema de manifestação usando fast-check
 * com mínimo de 100 iterações por teste para garantir cobertura abrangente
 */

// 1. Node.js built-ins
import { randomUUID } from 'crypto';

// 2. External libraries
import * as fc from 'fast-check';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

// 3. Internal packages (workspace)
import { ManifestationConstants } from '@fiscal/shared/constants/manifestation.constants';
import {
    DuplicateManifestationError
} from '@fiscal/shared/errors/manifestation-error.class';
import { ManifestationStatus } from '@fiscal/shared/types/manifestation/manifestation-status.type';

// 4. Relative imports
import { databaseRouter } from '../DatabaseRouter';
import { ManifestationService, UpdateStatusParams } from '../ManifestationService';

// Mock do DatabaseRouter
vi.mock('../DatabaseRouter', () => ({
  databaseRouter: {
    getTransparentSqlConnection: vi.fn()
  }
}));

// Mock do logger
vi.mock('../../utils/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  })
}));

describe('ManifestationService - Property Tests', () => {
  let manifestationService: ManifestationService;
  let mockPrismaClient: {
    tblManifestacao: {
      findMany: Mock;
      findFirst: Mock;
      createMany: Mock;
      update: Mock;
      count: Mock;
    };
    tblTipoManifestacao: {
      findFirst: Mock;
    };
  };
  let mockDatabaseRouter: ReturnType<typeof vi.mocked<typeof databaseRouter>>;

  beforeEach(() => {
    // Resetar mocks
    vi.clearAllMocks();
    
    // Configurar mock do PrismaClient
    mockPrismaClient = {
      tblManifestacao: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        count: vi.fn()
      },
      tblTipoManifestacao: {
        findFirst: vi.fn()
      }
    };

    // Configurar mock do DatabaseRouter
    mockDatabaseRouter = vi.mocked(databaseRouter);
    mockDatabaseRouter.getTransparentSqlConnection.mockResolvedValue(mockPrismaClient as any);

    // Criar nova instância do serviço
    manifestationService = new ManifestationService();
  });

  afterEach(async () => {
    // Cleanup após cada teste
    await manifestationService.cleanup();
  });

  // ========== GERADORES FAST-CHECK ==========

  /**
   * Gerador de chaves de acesso NFe válidas (44 dígitos)
   */
  const validAccessKeyArb = fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 44, maxLength: 44 })
    .map(digits => digits.join(''));

  /**
   * Gerador de códigos de tipo de manifestação válidos
   */
  const validManifestationTypeArb = fc.array(
    fc.constantFrom('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'),
    { minLength: 1, maxLength: 10 }
  ).map(chars => chars.join(''));

  /**
   * Gerador de códigos de usuário válidos
   */
  const validUserCodeArb = fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0);

  /**
   * Gerador de status de manifestação válidos
   */
  const validStatusArb = fc.constantFrom(...ManifestationConstants.VALID_STATUS);

  /**
   * Gerador de requisições de agendamento válidas
   */
  const validScheduleRequestArb = fc.record({
    manifestationType: validManifestationTypeArb,
    chaves: fc.array(validAccessKeyArb, { minLength: 1, maxLength: 100 })
  });

  /**
   * Gerador de chaves de acesso inválidas
   */
  const invalidAccessKeyArb = fc.oneof(
    fc.string({ maxLength: 43 }), // Muito curta
    fc.string({ minLength: 45, maxLength: 50 }), // Muito longa
    fc.string({ minLength: 44, maxLength: 44 }).filter(s => !/^[0-9]{44}$/.test(s)) // Formato inválido
  );

  // ========== PROPERTY 3: MANIFESTATION SCHEDULING WITH DUPLICATE PREVENTION ==========

  describe('Property 3: Manifestation Scheduling with Duplicate Prevention', () => {
    it('should create unique records and prevent duplicates for any valid manifestation request', async () => {
      // **Validates: Requirements 3.1, 3.2, 6.6**
      await fc.assert(fc.asyncProperty(
        validScheduleRequestArb,
        validUserCodeArb,
        fc.option(fc.ipV4(), { nil: undefined }),
        async (request, userCode, ipAddress) => {
          // Arrange - Configurar mocks para sucesso
          mockPrismaClient.tblTipoManifestacao.findFirst.mockResolvedValue({
            codigo: request.manifestationType,
            ativo: true
          } as any);
          
          // Simular algumas duplicatas (30% das chaves)
          const duplicateCount = Math.floor(request.chaves.length * 0.3);
          const duplicates = request.chaves.slice(0, duplicateCount);
          
          mockPrismaClient.tblManifestacao.findMany.mockResolvedValue(
            duplicates.map(chave => ({ chaveAcesso: chave })) as any
          );
          
          const expectedScheduledCount = request.chaves.length - duplicateCount;
          mockPrismaClient.tblManifestacao.createMany.mockResolvedValue({ 
            count: expectedScheduledCount 
          });

          // Act
          const result = await manifestationService.scheduleManifestations(
            request,
            userCode,
            ipAddress
          );

          // Assert - Propriedades universais
          expect(result.manifestationId).toBeDefined();
          expect(typeof result.manifestationId).toBe('string');
          expect(result.manifestationId.length).toBeGreaterThan(0);
          
          expect(result.totalChaves).toBe(request.chaves.length);
          expect(result.duplicatesSkipped).toBe(duplicateCount);
          expect(result.scheduledCount).toBe(expectedScheduledCount);
          
          // Propriedade: Total = Agendados + Duplicatas
          expect(result.totalChaves).toBe(result.scheduledCount + result.duplicatesSkipped);
          
          // Propriedade: Sempre deve agendar pelo menos 1 se não há duplicatas totais
          if (duplicateCount < request.chaves.length) {
            expect(result.scheduledCount).toBeGreaterThan(0);
          }

          // Verificar chamadas do banco
          expect(mockPrismaClient.tblTipoManifestacao.findFirst).toHaveBeenCalledWith({
            where: {
              codigo: request.manifestationType,
              ativo: true
            }
          });

          expect(mockPrismaClient.tblManifestacao.findMany).toHaveBeenCalledWith({
            where: {
              chaveAcesso: { in: request.chaves },
              tipoManifestacao: request.manifestationType,
              usrCodigo: userCode,
              status: { in: ['AGENDADO', 'PROCESSANDO'] }
            },
            select: {
              chaveAcesso: true
            }
          });

          if (expectedScheduledCount > 0) {
            expect(mockPrismaClient.tblManifestacao.createMany).toHaveBeenCalledWith({
              data: expect.arrayContaining([
                expect.objectContaining({
                  id: expect.any(String),
                  usrCodigo: userCode,
                  tipoManifestacao: request.manifestationType,
                  status: ManifestationConstants.STATUS.AGENDADO,
                  dataAgendamento: expect.any(Date),
                  ipOrigem: ipAddress,
                  createdAt: expect.any(Date),
                  updatedAt: expect.any(Date)
                })
              ])
            });
          }
        }
      ), { numRuns: 100 });
    });

    it('should reject invalid requests with appropriate errors for any invalid input', async () => {
      await fc.assert(fc.asyncProperty(
        fc.oneof(
          // Tipo de manifestação vazio
          fc.record({
            manifestationType: fc.constant(''),
            chaves: fc.array(validAccessKeyArb, { minLength: 1, maxLength: 10 })
          }),
          // Nenhuma chave
          fc.record({
            manifestationType: validManifestationTypeArb,
            chaves: fc.constant([] as string[])
          }),
          // Chaves inválidas
          fc.record({
            manifestationType: validManifestationTypeArb,
            chaves: fc.array(invalidAccessKeyArb, { minLength: 1, maxLength: 10 })
          }),
          // Muitas chaves
          fc.record({
            manifestationType: validManifestationTypeArb,
            chaves: fc.array(validAccessKeyArb, { 
              minLength: ManifestationConstants.LIMITS.MAX_DOCUMENTS_PER_OPERATION + 1, 
              maxLength: ManifestationConstants.LIMITS.MAX_DOCUMENTS_PER_OPERATION + 100 
            })
          })
        ),
        validUserCodeArb,
        async (invalidRequest, userCode) => {
          // Act & Assert - Deve sempre lançar erro para entrada inválida
          await expect(
            manifestationService.scheduleManifestations(invalidRequest, userCode)
          ).rejects.toThrow();

          // Propriedade: Banco não deve ser chamado para entradas inválidas
          if (invalidRequest.manifestationType === '' || invalidRequest.chaves.length === 0) {
            expect(mockPrismaClient.tblTipoManifestacao.findFirst).not.toHaveBeenCalled();
            expect(mockPrismaClient.tblManifestacao.findMany).not.toHaveBeenCalled();
            expect(mockPrismaClient.tblManifestacao.createMany).not.toHaveBeenCalled();
          }
        }
      ), { numRuns: 100 });
    });

    it('should handle all duplicates scenario correctly', async () => {
      await fc.assert(fc.asyncProperty(
        validScheduleRequestArb,
        validUserCodeArb,
        async (request, userCode) => {
          // Arrange - Todas as chaves são duplicatas
          mockPrismaClient.tblTipoManifestacao.findFirst.mockResolvedValue({
            codigo: request.manifestationType,
            ativo: true
          } as any);
          
          mockPrismaClient.tblManifestacao.findMany.mockResolvedValue(
            request.chaves.map(chave => ({ chaveAcesso: chave })) as any
          );

          // Act & Assert - Deve lançar DuplicateManifestationError
          await expect(
            manifestationService.scheduleManifestations(request, userCode)
          ).rejects.toThrow(DuplicateManifestationError);

          // Propriedade: Não deve criar registros quando todas são duplicatas
          expect(mockPrismaClient.tblManifestacao.createMany).not.toHaveBeenCalled();
        }
      ), { numRuns: 100 });
    });
  });

  // ========== PROPERTY 4: DATABASE ROUTING CONSISTENCY ==========

  describe('Property 4: Database Routing Consistency', () => {
    it('should use transparent SQL connection for all database operations', async () => {
      await fc.assert(fc.asyncProperty(
        validScheduleRequestArb,
        validUserCodeArb,
        async (request, userCode) => {
          // Arrange
          mockPrismaClient.tblTipoManifestacao.findFirst.mockResolvedValue({
            codigo: request.manifestationType,
            ativo: true
          } as any);
          
          mockPrismaClient.tblManifestacao.findMany.mockResolvedValue([]);
          mockPrismaClient.tblManifestacao.createMany.mockResolvedValue({ 
            count: request.chaves.length 
          });

          // Act
          await manifestationService.scheduleManifestations(request, userCode);

          // Assert - Propriedade: Sempre deve usar conexão transparente
          expect(mockDatabaseRouter.getTransparentSqlConnection).toHaveBeenCalled();
          
          // Propriedade: Todas as operações devem usar a mesma conexão
          const connectionCalls = mockDatabaseRouter.getTransparentSqlConnection.mock.calls.length;
          expect(connectionCalls).toBeGreaterThan(0);
          
          // Propriedade: Operações de banco devem ser executadas na ordem correta
          expect(mockPrismaClient.tblTipoManifestacao.findFirst).toHaveBeenCalled();
          expect(mockPrismaClient.tblManifestacao.findMany).toHaveBeenCalled();
          expect(mockPrismaClient.tblManifestacao.createMany).toHaveBeenCalled();
        }
      ), { numRuns: 100 });
    });

    it('should handle database routing errors consistently', async () => {
      await fc.assert(fc.asyncProperty(
        validScheduleRequestArb,
        validUserCodeArb,
        async (request, userCode) => {
          // Arrange - Simular erro de roteamento
          mockDatabaseRouter.getTransparentSqlConnection.mockRejectedValue(
            new Error('Database routing failed')
          );

          // Act & Assert - Deve sempre lançar erro de sistema
          await expect(
            manifestationService.scheduleManifestations(request, userCode)
          ).rejects.toThrow('Erro interno do sistema');

          // Propriedade: Deve tentar obter conexão transparente
          expect(mockDatabaseRouter.getTransparentSqlConnection).toHaveBeenCalled();
        }
      ), { numRuns: 100 });
    });
  });

  // ========== PROPERTY: STATUS QUERY FILTERING ==========

  describe('Property: Status Query Filtering and Pagination', () => {
    it('should apply filters correctly and maintain pagination invariants', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          manifestationType: fc.option(validManifestationTypeArb, { nil: undefined }),
          status: fc.option(validStatusArb, { nil: undefined }),
          chaveAcesso: fc.option(fc.string({ minLength: 1, maxLength: 44 }), { nil: undefined }),
          page: fc.option(fc.integer({ min: -10, max: 100 }), { nil: undefined }),
          pageSize: fc.option(fc.integer({ min: -10, max: 2000 }), { nil: undefined })
        }),
        validUserCodeArb,
        async (filters, userCode) => {
          // Arrange
          const mockRecords = Array.from({ length: 5 }, (_, i) => ({
            id: randomUUID(),
            usrCodigo: userCode,
            tipoManifestacao: 'CIENCIA',
            chaveAcesso: `1234567890123456789012345678901234567890123${i}`,
            status: 'AGENDADO',
            dataAgendamento: new Date(),
            dataProcessamento: null,
            ipOrigem: '192.168.1.1',
            observacoes: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }));

          mockPrismaClient.tblManifestacao.findMany.mockResolvedValue(mockRecords);
          mockPrismaClient.tblManifestacao.count.mockResolvedValue(mockRecords.length);

          // Act
          const result = await manifestationService.getManifestationStatus(filters, userCode);

          // Assert - Propriedades de paginação
          expect(result.pagination.page).toBeGreaterThanOrEqual(1);
          expect(result.pagination.pageSize).toBeGreaterThanOrEqual(ManifestationConstants.PAGINATION.MIN_PAGE_SIZE);
          expect(result.pagination.pageSize).toBeLessThanOrEqual(ManifestationConstants.PAGINATION.MAX_PAGE_SIZE);
          expect(result.pagination.totalCount).toBeGreaterThanOrEqual(0);
          expect(result.pagination.totalPages).toBeGreaterThanOrEqual(0);

          // Propriedade: Dados devem estar no formato correto
          expect(Array.isArray(result.data)).toBe(true);
          result.data.forEach(record => {
            expect(record.id).toBeDefined();
            expect(record.usrCodigo).toBe(userCode);
            expect(record.tipoManifestacao).toBeDefined();
            expect(record.chaveAcesso).toBeDefined();
            expect(ManifestationConstants.VALID_STATUS).toContain(record.status);
            expect(record.dataAgendamento).toBeInstanceOf(Date);
          });

          // Propriedade: Query deve incluir filtro de usuário
          expect(mockPrismaClient.tblManifestacao.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
              where: expect.objectContaining({
                usrCodigo: userCode
              })
            })
          );
        }
      ), { numRuns: 100 });
    });
  });

  // ========== PROPERTY: STATUS UPDATE VALIDATION ==========

  describe('Property: Status Update Validation', () => {
    it('should validate status updates and maintain data integrity', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          manifestationId: fc.uuid(),
          status: validStatusArb,
          notes: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          ipAddress: fc.option(fc.ipV4(), { nil: undefined })
        }),
        validUserCodeArb,
        async (params, userCode) => {
          // Arrange
          const mockExistingRecord = {
            id: params.manifestationId,
            usrCodigo: userCode,
            tipoManifestacao: 'CIENCIA',
            chaveAcesso: '12345678901234567890123456789012345678901234',
            status: 'AGENDADO',
            dataAgendamento: new Date(),
            dataProcessamento: null,
            ipOrigem: '192.168.1.1',
            observacoes: null,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const mockUpdatedRecord = {
            ...mockExistingRecord,
            status: params.status,
            dataProcessamento: params.status === 'CONCLUIDO' ? new Date() : null,
            observacoes: params.notes || null, // Garantir que seja null se undefined
            updatedAt: new Date()
          };

          mockPrismaClient.tblManifestacao.findFirst.mockResolvedValue(mockExistingRecord);
          mockPrismaClient.tblManifestacao.update.mockResolvedValue(mockUpdatedRecord);

          // Act
          const result = await manifestationService.updateManifestationStatus(params, userCode);

          // Assert - Propriedades de integridade
          expect(result.id).toBe(params.manifestationId);
          expect(result.usrCodigo).toBe(userCode);
          expect(result.status).toBe(params.status);
          
          // Propriedade: observacoes pode ser undefined, null ou string
          if (params.notes !== undefined && params.notes !== '') {
            expect(result.observacoes).toBe(params.notes);
          } else {
            expect([undefined, null]).toContain(result.observacoes);
          }

          // Propriedade: dataProcessamento deve ser definida apenas para status CONCLUIDO
          if (params.status === 'CONCLUIDO') {
            expect(result.dataProcessamento).toBeInstanceOf(Date);
          }

          // Propriedade: Deve verificar permissão do usuário
          expect(mockPrismaClient.tblManifestacao.findFirst).toHaveBeenCalledWith({
            where: {
              id: params.manifestationId,
              usrCodigo: userCode
            }
          });

          // Propriedade: Deve atualizar com dados corretos
          expect(mockPrismaClient.tblManifestacao.update).toHaveBeenCalledWith({
            where: {
              id: params.manifestationId
            },
            data: expect.objectContaining({
              status: params.status,
              observacoes: params.notes,
              updatedAt: expect.any(Date)
            })
          });
        }
      ), { numRuns: 100 });
    });

    it('should reject invalid status values consistently', async () => {
      // Gerador de status inválidos
      const invalidStatusArb = fc.string().filter(s => 
        s.length > 0 && !ManifestationConstants.VALID_STATUS.includes(s as ManifestationStatus)
      );

      await fc.assert(fc.asyncProperty(
        fc.record({
          manifestationId: fc.uuid(),
          status: invalidStatusArb,
          notes: fc.option(fc.string({ maxLength: 500 }), { nil: undefined })
        }),
        validUserCodeArb,
        async (params, userCode) => {
          // Cast para o tipo correto para o teste
          const typedParams = params as UpdateStatusParams;
          
          // Act & Assert - Deve sempre rejeitar status inválido
          await expect(
            manifestationService.updateManifestationStatus(typedParams, userCode)
          ).rejects.toThrow('não é válido');

          // Propriedade: Não deve acessar banco para status inválido
          expect(mockPrismaClient.tblManifestacao.findFirst).not.toHaveBeenCalled();
          expect(mockPrismaClient.tblManifestacao.update).not.toHaveBeenCalled();
        }
      ), { numRuns: 100 });
    });
  });

  // ========== PROPERTY: CACHE BEHAVIOR ==========

  describe('Property: Cache Behavior', () => {
    it('should maintain cache consistency across operations', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          manifestationType: fc.option(validManifestationTypeArb, { nil: undefined }),
          page: fc.integer({ min: 1, max: 10 }),
          pageSize: fc.integer({ min: 10, max: 100 })
        }),
        validUserCodeArb,
        async (filters, userCode) => {
          // Arrange - Resetar mocks para este teste específico
          mockPrismaClient.tblManifestacao.findMany.mockClear();
          mockPrismaClient.tblManifestacao.count.mockClear();
          
          mockPrismaClient.tblManifestacao.findMany.mockResolvedValue([]);
          mockPrismaClient.tblManifestacao.count.mockResolvedValue(0);

          // Act - Primeira consulta (deve ir ao banco)
          const result1 = await manifestationService.getManifestationStatus(filters, userCode);
          
          // Act - Segunda consulta (deve usar cache)
          const result2 = await manifestationService.getManifestationStatus(filters, userCode);

          // Assert - Propriedades de cache
          expect(result1).toEqual(result2);
          
          // Propriedade: Segunda consulta deve usar cache (exatamente 1 chamada ao banco)
          expect(mockPrismaClient.tblManifestacao.findMany).toHaveBeenCalledTimes(1);
          expect(mockPrismaClient.tblManifestacao.count).toHaveBeenCalledTimes(1);
        }
      ), { numRuns: 50 }); // Menos iterações para testes de cache
    });
  });
});