/**
 * Testes unitários para ManifestationService
 * 
 * Testa funcionalidades de agendamento, consulta e atualização de status
 * das manifestações de documentos fiscais NFe
 */

// 1. Node.js built-ins
import { randomUUID } from 'crypto';

// 2. External libraries
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

// 3. Internal packages (workspace)
import { ManifestationConstants } from '@fiscal/shared/constants/manifestation.constants';
import { ManifestationScheduleRequestDTO } from '@fiscal/shared/dto/manifestation-schedule-request.dto';
import {
    DatabaseRoutingError,
    DuplicateManifestationError,
    InvalidAccessKeyError,
    InvalidManifestationTypeError,
    ManifestationTypeRequiredError,
    NoDocumentsSelectedError,
    QuantityLimitExceededError
} from '@fiscal/shared/errors/manifestation-error.class';
import { ManifestationStatus } from '@fiscal/shared/types/manifestation/manifestation-status.type';

// 4. Relative imports
import { databaseRouter } from '../DatabaseRouter';
import { ManifestationService, ManifestationStatusFilters, UpdateStatusParams } from '../ManifestationService';

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

describe('ManifestationService', () => {
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

  describe('scheduleManifestations', () => {
    const validRequest: ManifestationScheduleRequestDTO = {
      manifestationType: 'CIENCIA',
      chaves: ['12345678901234567890123456789012345678901234']
    };
    const userCode = 'TEST_USER';
    const ipAddress = '192.168.1.1';

    it('deve agendar manifestações com sucesso quando dados são válidos', async () => {
      // Arrange
      mockPrismaClient.tblTipoManifestacao.findFirst.mockResolvedValue({
        codigo: 'CIENCIA',
        ativo: true
      } as any);
      
      mockPrismaClient.tblManifestacao.findMany.mockResolvedValue([]);
      mockPrismaClient.tblManifestacao.createMany.mockResolvedValue({ count: 1 });

      // Act
      const result = await manifestationService.scheduleManifestations(
        validRequest,
        userCode,
        ipAddress
      );

      // Assert
      expect(result).toEqual({
        manifestationId: expect.any(String),
        totalChaves: 1,
        duplicatesSkipped: 0,
        scheduledCount: 1
      });

      expect(mockPrismaClient.tblTipoManifestacao.findFirst).toHaveBeenCalledWith({
        where: {
          codigo: 'CIENCIA',
          ativo: true
        }
      });

      expect(mockPrismaClient.tblManifestacao.findMany).toHaveBeenCalledWith({
        where: {
          chaveAcesso: { in: validRequest.chaves },
          tipoManifestacao: 'CIENCIA',
          usrCodigo: userCode,
          status: { in: ['AGENDADO', 'PROCESSANDO'] }
        },
        select: {
          chaveAcesso: true
        }
      });

      expect(mockPrismaClient.tblManifestacao.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            usrCodigo: userCode,
            tipoManifestacao: 'CIENCIA',
            chaveAcesso: validRequest.chaves[0],
            status: ManifestationConstants.STATUS.AGENDADO,
            dataAgendamento: expect.any(Date),
            ipOrigem: ipAddress,
            createdAt: expect.any(Date),
            updatedAt: expect.any(Date)
          })
        ])
      });
    });

    it('deve lançar ManifestationTypeRequiredError quando tipo não é fornecido', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, manifestationType: '' };

      // Act & Assert
      await expect(
        manifestationService.scheduleManifestations(invalidRequest, userCode, ipAddress)
      ).rejects.toThrow(ManifestationTypeRequiredError);
    });

    it('deve lançar NoDocumentsSelectedError quando nenhuma chave é fornecida', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, chaves: [] };

      // Act & Assert
      await expect(
        manifestationService.scheduleManifestations(invalidRequest, userCode, ipAddress)
      ).rejects.toThrow(NoDocumentsSelectedError);
    });

    it('deve lançar InvalidAccessKeyError quando chave tem formato inválido', async () => {
      // Arrange
      const invalidRequest = { ...validRequest, chaves: ['123'] }; // Chave muito curta

      // Act & Assert
      await expect(
        manifestationService.scheduleManifestations(invalidRequest, userCode, ipAddress)
      ).rejects.toThrow(InvalidAccessKeyError);
    });

    it('deve lançar QuantityLimitExceededError quando excede limite de documentos', async () => {
      // Arrange
      const tooManyKeys = Array(1001).fill('12345678901234567890123456789012345678901234');
      const invalidRequest = { ...validRequest, chaves: tooManyKeys };

      // Act & Assert
      await expect(
        manifestationService.scheduleManifestations(invalidRequest, userCode, ipAddress)
      ).rejects.toThrow(QuantityLimitExceededError);
    });

    it('deve lançar InvalidManifestationTypeError quando tipo não existe', async () => {
      // Arrange
      mockPrismaClient.tblTipoManifestacao.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        manifestationService.scheduleManifestations(validRequest, userCode, ipAddress)
      ).rejects.toThrow(InvalidManifestationTypeError);
    });

    it('deve lançar DuplicateManifestationError quando todas as chaves são duplicatas', async () => {
      // Arrange
      mockPrismaClient.tblTipoManifestacao.findFirst.mockResolvedValue({
        codigo: 'CIENCIA',
        ativo: true
      } as any);
      
      mockPrismaClient.tblManifestacao.findMany.mockResolvedValue([
        { chaveAcesso: validRequest.chaves[0] }
      ] as any);

      // Act & Assert
      await expect(
        manifestationService.scheduleManifestations(validRequest, userCode, ipAddress)
      ).rejects.toThrow(DuplicateManifestationError);
    });

    it('deve ignorar duplicatas e agendar apenas chaves únicas', async () => {
      // Arrange
      const requestWithDuplicates = {
        ...validRequest,
        chaves: [
          '12345678901234567890123456789012345678901234', // Duplicata
          '98765432109876543210987654321098765432109876'  // Única
        ]
      };

      mockPrismaClient.tblTipoManifestacao.findFirst.mockResolvedValue({
        codigo: 'CIENCIA',
        ativo: true
      } as any);
      
      mockPrismaClient.tblManifestacao.findMany.mockResolvedValue([
        { chaveAcesso: requestWithDuplicates.chaves[0] }
      ] as any);
      
      mockPrismaClient.tblManifestacao.createMany.mockResolvedValue({ count: 1 });

      // Act
      const result = await manifestationService.scheduleManifestations(
        requestWithDuplicates,
        userCode,
        ipAddress
      );

      // Assert
      expect(result).toEqual({
        manifestationId: expect.any(String),
        totalChaves: 2,
        duplicatesSkipped: 1,
        scheduledCount: 1
      });

      expect(mockPrismaClient.tblManifestacao.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            chaveAcesso: requestWithDuplicates.chaves[1] // Apenas a chave única
          })
        ])
      });
    });

    it('deve lançar erro genérico quando há erro de banco de dados', async () => {
      // Arrange
      mockDatabaseRouter.getTransparentSqlConnection.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(
        manifestationService.scheduleManifestations(validRequest, userCode, ipAddress)
      ).rejects.toThrow('Erro interno do sistema');
    });
  });

  describe('getManifestationStatus', () => {
    const userCode = 'TEST_USER';
    const mockRecord = {
      id: randomUUID(),
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

    it('deve retornar manifestações com paginação quando filtros são válidos', async () => {
      // Arrange
      const filters: ManifestationStatusFilters = {
        page: 1,
        pageSize: 10
      };

      mockPrismaClient.tblManifestacao.findMany.mockResolvedValue([mockRecord]);
      mockPrismaClient.tblManifestacao.count.mockResolvedValue(1);

      // Act
      const result = await manifestationService.getManifestationStatus(filters, userCode);

      // Assert
      expect(result).toEqual({
        data: expect.arrayContaining([
          expect.objectContaining({
            id: mockRecord.id,
            usrCodigo: userCode,
            tipoManifestacao: 'CIENCIA',
            chaveAcesso: mockRecord.chaveAcesso,
            status: 'AGENDADO'
          })
        ]),
        pagination: {
          page: 1,
          pageSize: 10,
          totalCount: 1,
          totalPages: 1
        }
      });

      expect(mockPrismaClient.tblManifestacao.findMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          usrCodigo: userCode
        }),
        orderBy: { dataAgendamento: 'desc' },
        skip: 0,
        take: 10
      });

      expect(mockPrismaClient.tblManifestacao.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          usrCodigo: userCode
        })
      });
    });

    it('deve aplicar filtros corretamente na consulta', async () => {
      // Arrange
      const filters: ManifestationStatusFilters = {
        manifestationType: 'CIENCIA',
        status: 'AGENDADO' as ManifestationStatus,
        chaveAcesso: '12345',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        page: 1,
        pageSize: 10
      };

      mockPrismaClient.tblManifestacao.findMany.mockResolvedValue([]);
      mockPrismaClient.tblManifestacao.count.mockResolvedValue(0);

      // Act
      await manifestationService.getManifestationStatus(filters, userCode);

      // Assert
      expect(mockPrismaClient.tblManifestacao.findMany).toHaveBeenCalledWith({
        where: {
          usrCodigo: userCode,
          tipoManifestacao: 'CIENCIA',
          status: 'AGENDADO',
          chaveAcesso: {
            contains: '12345'
          },
          dataAgendamento: {
            gte: filters.startDate,
            lte: filters.endDate
          }
        },
        orderBy: { dataAgendamento: 'desc' },
        skip: 0,
        take: 10
      });
    });

    it('deve normalizar filtros de paginação corretamente', async () => {
      // Arrange
      const filters: ManifestationStatusFilters = {
        page: -1, // Inválido
        pageSize: 2000 // Excede limite
      };

      mockPrismaClient.tblManifestacao.findMany.mockResolvedValue([]);
      mockPrismaClient.tblManifestacao.count.mockResolvedValue(0);

      // Act
      await manifestationService.getManifestationStatus(filters, userCode);

      // Assert
      expect(mockPrismaClient.tblManifestacao.findMany).toHaveBeenCalledWith({
        where: expect.any(Object),
        orderBy: { dataAgendamento: 'desc' },
        skip: 0, // page normalizada para 1
        take: ManifestationConstants.PAGINATION.MAX_PAGE_SIZE // pageSize limitado
      });
    });

    it('deve lançar erro genérico quando há erro de banco de dados', async () => {
      // Arrange
      const filters: ManifestationStatusFilters = {};
      mockDatabaseRouter.getTransparentSqlConnection.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(
        manifestationService.getManifestationStatus(filters, userCode)
      ).rejects.toThrow('Erro interno do sistema');
    });
  });

  describe('updateManifestationStatus', () => {
    const userCode = 'TEST_USER';
    const manifestationId = randomUUID();
    const mockExistingRecord = {
      id: manifestationId,
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

    it('deve atualizar status com sucesso quando dados são válidos', async () => {
      // Arrange
      const params: UpdateStatusParams = {
        manifestationId,
        status: 'CONCLUIDO' as ManifestationStatus,
        notes: 'Processamento concluído',
        ipAddress: '192.168.1.1'
      };

      const updatedRecord = {
        ...mockExistingRecord,
        status: 'CONCLUIDO',
        dataProcessamento: new Date(),
        observacoes: 'Processamento concluído',
        updatedAt: new Date()
      };

      mockPrismaClient.tblManifestacao.findFirst.mockResolvedValue(mockExistingRecord);
      mockPrismaClient.tblManifestacao.update.mockResolvedValue(updatedRecord);

      // Act
      const result = await manifestationService.updateManifestationStatus(params, userCode);

      // Assert
      expect(result).toEqual(
        expect.objectContaining({
          id: manifestationId,
          status: 'CONCLUIDO',
          observacoes: 'Processamento concluído'
        })
      );

      expect(mockPrismaClient.tblManifestacao.findFirst).toHaveBeenCalledWith({
        where: {
          id: manifestationId,
          usrCodigo: userCode
        }
      });

      expect(mockPrismaClient.tblManifestacao.update).toHaveBeenCalledWith({
        where: {
          id: manifestationId
        },
        data: {
          status: 'CONCLUIDO',
          dataProcessamento: expect.any(Date),
          observacoes: 'Processamento concluído',
          updatedAt: expect.any(Date)
        }
      });
    });

    it('deve lançar erro quando status é inválido', async () => {
      // Arrange
      const params: UpdateStatusParams = {
        manifestationId,
        status: 'INVALID_STATUS' as ManifestationStatus
      };

      // Act & Assert
      await expect(
        manifestationService.updateManifestationStatus(params, userCode)
      ).rejects.toThrow('Status \'INVALID_STATUS\' não é válido');
    });

    it('deve lançar erro quando manifestação não existe', async () => {
      // Arrange
      const params: UpdateStatusParams = {
        manifestationId,
        status: 'CONCLUIDO' as ManifestationStatus
      };

      mockPrismaClient.tblManifestacao.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        manifestationService.updateManifestationStatus(params, userCode)
      ).rejects.toThrow('Manifestação não encontrada ou você não possui permissão para atualizá-la');
    });

    it('deve definir dataProcessamento quando status é CONCLUIDO', async () => {
      // Arrange
      const params: UpdateStatusParams = {
        manifestationId,
        status: 'CONCLUIDO' as ManifestationStatus
      };

      mockPrismaClient.tblManifestacao.findFirst.mockResolvedValue(mockExistingRecord);
      mockPrismaClient.tblManifestacao.update.mockResolvedValue({
        ...mockExistingRecord,
        status: 'CONCLUIDO',
        dataProcessamento: new Date()
      });

      // Act
      await manifestationService.updateManifestationStatus(params, userCode);

      // Assert
      expect(mockPrismaClient.tblManifestacao.update).toHaveBeenCalledWith({
        where: {
          id: manifestationId
        },
        data: expect.objectContaining({
          status: 'CONCLUIDO',
          dataProcessamento: expect.any(Date)
        })
      });
    });

    it('deve lançar erro genérico quando há erro de banco de dados', async () => {
      // Arrange
      const params: UpdateStatusParams = {
        manifestationId,
        status: 'CONCLUIDO' as ManifestationStatus
      };

      mockDatabaseRouter.getTransparentSqlConnection.mockRejectedValue(
        new Error('Database connection failed')
      );

      // Act & Assert
      await expect(
        manifestationService.updateManifestationStatus(params, userCode)
      ).rejects.toThrow('Erro interno do sistema');
    });
  });

  describe('Cache Management', () => {
    const userCode = 'TEST_USER';

    it('deve usar cache para consultas repetidas', async () => {
      // Arrange
      const filters: ManifestationStatusFilters = { page: 1, pageSize: 10 };
      const mockResult = {
        data: [],
        pagination: { page: 1, pageSize: 10, totalCount: 0, totalPages: 0 }
      };

      mockPrismaClient.tblManifestacao.findMany.mockResolvedValue([]);
      mockPrismaClient.tblManifestacao.count.mockResolvedValue(0);

      // Act - Primeira consulta
      const result1 = await manifestationService.getManifestationStatus(filters, userCode);
      
      // Act - Segunda consulta (deve usar cache)
      const result2 = await manifestationService.getManifestationStatus(filters, userCode);

      // Assert
      expect(result1).toEqual(mockResult);
      expect(result2).toEqual(mockResult);
      
      // Banco deve ser chamado apenas uma vez
      expect(mockPrismaClient.tblManifestacao.findMany).toHaveBeenCalledTimes(1);
      expect(mockPrismaClient.tblManifestacao.count).toHaveBeenCalledTimes(1);
    });

    it('deve limpar cache relacionado após atualização de status', async () => {
      // Arrange
      const manifestationId = randomUUID();
      const params: UpdateStatusParams = {
        manifestationId,
        status: 'CONCLUIDO' as ManifestationStatus
      };

      const mockExistingRecord = {
        id: manifestationId,
        usrCodigo: userCode,
        status: 'AGENDADO'
      };

      mockPrismaClient.tblManifestacao.findFirst.mockResolvedValue(mockExistingRecord as any);
      mockPrismaClient.tblManifestacao.update.mockResolvedValue({
        ...mockExistingRecord,
        status: 'CONCLUIDO'
      } as any);

      // Primeiro, popular o cache
      const filters: ManifestationStatusFilters = { page: 1, pageSize: 10 };
      mockPrismaClient.tblManifestacao.findMany.mockResolvedValue([]);
      mockPrismaClient.tblManifestacao.count.mockResolvedValue(0);
      
      await manifestationService.getManifestationStatus(filters, userCode);

      // Act - Atualizar status (deve limpar cache)
      await manifestationService.updateManifestationStatus(params, userCode);

      // Act - Nova consulta (deve ir ao banco novamente)
      await manifestationService.getManifestationStatus(filters, userCode);

      // Assert
      expect(mockPrismaClient.tblManifestacao.findMany).toHaveBeenCalledTimes(2);
      expect(mockPrismaClient.tblManifestacao.count).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    const userCode = 'TEST_USER';

    it('deve tratar erros de banco de dados corretamente', async () => {
      // Arrange
      const validRequest: ManifestationScheduleRequestDTO = {
        manifestationType: 'CIENCIA',
        chaves: ['12345678901234567890123456789012345678901234']
      };

      mockPrismaClient.tblTipoManifestacao.findFirst.mockRejectedValue(
        new Error('Database error')
      );

      // Act & Assert
      await expect(
        manifestationService.scheduleManifestations(validRequest, userCode)
      ).rejects.toThrow(DatabaseRoutingError);
    });

    it('deve propagar erros conhecidos sem modificação', async () => {
      // Arrange
      const invalidRequest: ManifestationScheduleRequestDTO = {
        manifestationType: '',
        chaves: ['12345678901234567890123456789012345678901234']
      };

      // Act & Assert
      await expect(
        manifestationService.scheduleManifestations(invalidRequest, userCode)
      ).rejects.toThrow(ManifestationTypeRequiredError);
    });
  });
});