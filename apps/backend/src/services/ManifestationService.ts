/**
 * ManifestationService - Serviço de Manifestação de NFe
 * 
 * Responsável por gerenciar o agendamento, consulta e atualização de status
 * das manifestações de documentos fiscais NFe
 */

// 1. Node.js built-ins
import { randomUUID } from 'crypto';

// 2. External libraries
import { PrismaClient } from '@prisma/client';

// 3. Internal packages (workspace)
import { ManifestationConstants } from '@fiscal/shared/constants/manifestation.constants';
import { ManifestationScheduleRequestDTO } from '@fiscal/shared/dto/manifestation-schedule-request.dto';
import {
    DatabaseRoutingError,
    DuplicateManifestationError,
    InvalidAccessKeyError,
    InvalidManifestationTypeError,
    ManifestationError,
    ManifestationTypeRequiredError,
    NoDocumentsSelectedError,
    QuantityLimitExceededError
} from '@fiscal/shared/errors/manifestation-error.class';
import { ManifestationRecord } from '@fiscal/shared/types/manifestation/manifestation-record.interface';
import { ManifestationScheduleResult } from '@fiscal/shared/types/manifestation/manifestation-schedule-result.interface';
import { ManifestationStatus } from '@fiscal/shared/types/manifestation/manifestation-status.type';
import { PaginatedResponse } from '@fiscal/shared/types/paginated-response.interface';

// 4. Relative imports (mesmo diretório/subdiretórios)
import { createLogger } from '../utils/logger';
import { databaseRouter } from './DatabaseRouter';

/**
 * Interface para filtros de consulta de status
 */
export interface ManifestationStatusFilters {
  /** Filtrar por tipo de manifestação */
  manifestationType?: string;
  /** Filtrar por status */
  status?: ManifestationStatus;
  /** Filtrar por data de agendamento (início) */
  startDate?: Date;
  /** Filtrar por data de agendamento (fim) */
  endDate?: Date;
  /** Filtrar por chave de acesso específica */
  chaveAcesso?: string;
  /** Página para paginação */
  page?: number;
  /** Tamanho da página */
  pageSize?: number;
}

/**
 * Interface para parâmetros de atualização de status
 */
export interface UpdateStatusParams {
  /** ID da manifestação */
  manifestationId: string;
  /** Novo status */
  status: ManifestationStatus;
  /** Observações sobre a atualização */
  notes?: string;
  /** IP de origem da requisição */
  ipAddress?: string;
}

/**
 * Serviço principal para gerenciamento de manifestações NFe
 */
export class ManifestationService {
  private readonly logger = createLogger('ManifestationService');
  private readonly cache = new Map<string, { data: any; expiry: number }>();

  constructor() {
    this.logger.info('ManifestationService inicializado');
  }

  /**
   * Agenda manifestações para múltiplas chaves de acesso
   * Implementa prevenção de duplicatas e validações obrigatórias
   */
  async scheduleManifestations(
    request: ManifestationScheduleRequestDTO,
    userCode: string,
    ipAddress?: string
  ): Promise<ManifestationScheduleResult> {
    const startTime = Date.now();
    const requestId = randomUUID();

    this.logger.info('Iniciando agendamento de manifestações', {
      requestId,
      userCode,
      manifestationType: request.manifestationType,
      totalChaves: request.chaves.length,
      ipAddress
    });

    try {
      // Validações obrigatórias
      this.validateScheduleRequest(request);

      // Obter conexão SQL com roteamento de usuário
      const sqlConnection = await databaseRouter.getTransparentSqlConnection();
      
      // Validar tipo de manifestação
      await this.validateManifestationType(sqlConnection, request.manifestationType);

      // Verificar duplicatas existentes
      const duplicates = await this.checkExistingManifestations(
        sqlConnection,
        request.chaves,
        request.manifestationType,
        userCode
      );

      // Filtrar chaves que não são duplicatas
      const uniqueKeys = request.chaves.filter(chave => !duplicates.includes(chave));
      
      if (uniqueKeys.length === 0) {
        throw new DuplicateManifestationError(duplicates.length, requestId);
      }

      // Criar registros de manifestação
      const manifestationId = randomUUID();
      const scheduledCount = await this.createManifestationRecords(
        sqlConnection,
        manifestationId,
        uniqueKeys,
        request.manifestationType,
        userCode,
        ipAddress
      );

      const result: ManifestationScheduleResult = {
        manifestationId,
        totalChaves: request.chaves.length,
        duplicatesSkipped: duplicates.length,
        scheduledCount
      };

      const duration = Date.now() - startTime;
      this.logger.info('Agendamento de manifestações concluído com sucesso', {
        requestId,
        userCode,
        result,
        duration: `${duration}ms`
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro no agendamento de manifestações', {
        requestId,
        userCode,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // Re-throw erros conhecidos
      if (error instanceof ManifestationError) {
        throw error;
      }

      // Tratar erros de banco de dados
      if (error instanceof Error && error.message.includes('database')) {
        throw new DatabaseRoutingError(requestId);
      }

      // Erro genérico
      throw new ManifestationError(
        ManifestationConstants.ERROR_MESSAGES[ManifestationConstants.ERROR_CODES.SYSTEM_ERROR],
        ManifestationConstants.ERROR_CODES.SYSTEM_ERROR,
        500,
        requestId
      );
    }
  }

  /**
   * Consulta status de manifestações com filtros e paginação
   */
  async getManifestationStatus(
    filters: ManifestationStatusFilters,
    userCode: string
  ): Promise<PaginatedResponse<ManifestationRecord>> {
    const startTime = Date.now();
    const requestId = randomUUID();

    this.logger.info('Consultando status de manifestações', {
      requestId,
      userCode,
      filters
    });

    try {
      // Validar e normalizar filtros
      const normalizedFilters = this.normalizeStatusFilters(filters);

      // Verificar cache
      const cacheKey = this.buildCacheKey('status', userCode, normalizedFilters);
      const cachedResult = this.getFromCache<PaginatedResponse<ManifestationRecord>>(cacheKey);
      
      if (cachedResult) {
        this.logger.debug('Resultado obtido do cache', { requestId, cacheKey });
        return cachedResult;
      }

      // Obter conexão SQL com roteamento de usuário
      const sqlConnection = await databaseRouter.getTransparentSqlConnection();

      // Construir query com filtros
      const whereClause = this.buildWhereClause(normalizedFilters, userCode);
      const orderBy = { dataAgendamento: 'desc' as const };

      // Executar consulta paginada
      const [records, totalCount] = await Promise.all([
        sqlConnection.tblManifestacao.findMany({
          where: whereClause,
          orderBy,
          skip: (normalizedFilters.page - 1) * normalizedFilters.pageSize,
          take: normalizedFilters.pageSize
        }),
        sqlConnection.tblManifestacao.count({
          where: whereClause
        })
      ]);

      // Mapear registros para interface
      const manifestationRecords: ManifestationRecord[] = records.map((record: any) => ({
        id: record.id,
        usrCodigo: record.usrCodigo,
        tipoManifestacao: record.tipoManifestacao,
        chaveAcesso: record.chaveAcesso,
        status: record.status as ManifestationStatus,
        dataAgendamento: record.dataAgendamento,
        dataProcessamento: record.dataProcessamento || undefined,
        ipOrigem: record.ipOrigem || undefined,
        observacoes: record.observacoes || undefined,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt
      }));

      const result: PaginatedResponse<ManifestationRecord> = {
        data: manifestationRecords,
        pagination: {
          page: normalizedFilters.page,
          pageSize: normalizedFilters.pageSize,
          totalCount,
          totalPages: Math.ceil(totalCount / normalizedFilters.pageSize)
        }
      };

      // Armazenar no cache
      this.setCache(cacheKey, result, ManifestationConstants.CACHE.MANIFESTATION_STATUS_TTL);

      const duration = Date.now() - startTime;
      this.logger.info('Consulta de status concluída com sucesso', {
        requestId,
        userCode,
        totalRecords: manifestationRecords.length,
        totalCount,
        duration: `${duration}ms`
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro na consulta de status de manifestações', {
        requestId,
        userCode,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // Re-throw erros conhecidos
      if (error instanceof ManifestationError) {
        throw error;
      }

      // Tratar erros de banco de dados
      if (error instanceof Error && error.message.includes('database')) {
        throw new DatabaseRoutingError(requestId);
      }

      // Erro genérico
      throw new ManifestationError(
        ManifestationConstants.ERROR_MESSAGES[ManifestationConstants.ERROR_CODES.SYSTEM_ERROR],
        ManifestationConstants.ERROR_CODES.SYSTEM_ERROR,
        500,
        requestId
      );
    }
  }

  /**
   * Atualiza status de uma manifestação específica
   */
  async updateManifestationStatus(
    params: UpdateStatusParams,
    userCode: string
  ): Promise<ManifestationRecord> {
    const startTime = Date.now();
    const requestId = randomUUID();

    this.logger.info('Atualizando status de manifestação', {
      requestId,
      userCode,
      manifestationId: params.manifestationId,
      newStatus: params.status,
      ipAddress: params.ipAddress
    });

    try {
      // Validar status
      this.validateStatus(params.status);

      // Obter conexão SQL com roteamento de usuário
      const sqlConnection = await databaseRouter.getTransparentSqlConnection();

      // Verificar se manifestação existe e pertence ao usuário
      const existingRecord = await sqlConnection.tblManifestacao.findFirst({
        where: {
          id: params.manifestationId,
          usrCodigo: userCode
        }
      });

      if (!existingRecord) {
        throw new ManifestationError(
          'Manifestação não encontrada ou você não possui permissão para atualizá-la.',
          'MANIFESTATION_NOT_FOUND',
          404,
          requestId
        );
      }

      // Atualizar registro
      const updatedRecord = await sqlConnection.tblManifestacao.update({
        where: {
          id: params.manifestationId
        },
        data: {
          status: params.status,
          dataProcessamento: params.status === 'CONCLUIDO' ? new Date() : undefined,
          observacoes: params.notes,
          updatedAt: new Date()
        }
      });

      // Mapear para interface
      const result: ManifestationRecord = {
        id: updatedRecord.id,
        usrCodigo: updatedRecord.usrCodigo,
        tipoManifestacao: updatedRecord.tipoManifestacao,
        chaveAcesso: updatedRecord.chaveAcesso,
        status: updatedRecord.status as ManifestationStatus,
        dataAgendamento: updatedRecord.dataAgendamento,
        dataProcessamento: updatedRecord.dataProcessamento || undefined,
        ipOrigem: updatedRecord.ipOrigem || undefined,
        observacoes: updatedRecord.observacoes || undefined,
        createdAt: updatedRecord.createdAt,
        updatedAt: updatedRecord.updatedAt
      };

      // Limpar cache relacionado
      this.clearRelatedCache(userCode);

      const duration = Date.now() - startTime;
      this.logger.info('Status de manifestação atualizado com sucesso', {
        requestId,
        userCode,
        manifestationId: params.manifestationId,
        oldStatus: existingRecord.status,
        newStatus: params.status,
        duration: `${duration}ms`
      });

      return result;

    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error('Erro na atualização de status de manifestação', {
        requestId,
        userCode,
        manifestationId: params.manifestationId,
        error: error instanceof Error ? error.message : String(error),
        duration: `${duration}ms`
      });

      // Re-throw erros conhecidos
      if (error instanceof ManifestationError) {
        throw error;
      }

      // Tratar erros de banco de dados
      if (error instanceof Error && error.message.includes('database')) {
        throw new DatabaseRoutingError(requestId);
      }

      // Erro genérico
      throw new ManifestationError(
        ManifestationConstants.ERROR_MESSAGES[ManifestationConstants.ERROR_CODES.SYSTEM_ERROR],
        ManifestationConstants.ERROR_CODES.SYSTEM_ERROR,
        500,
        requestId
      );
    }
  }

  // ========== MÉTODOS PRIVADOS DE VALIDAÇÃO ==========

  /**
   * Valida requisição de agendamento
   */
  private validateScheduleRequest(request: ManifestationScheduleRequestDTO): void {
    // Validar tipo de manifestação
    if (!request.manifestationType || request.manifestationType.trim() === '') {
      throw new ManifestationTypeRequiredError();
    }

    // Validar chaves de acesso
    if (!request.chaves || request.chaves.length === 0) {
      throw new NoDocumentsSelectedError();
    }

    // Validar limite de quantidade
    if (request.chaves.length > ManifestationConstants.LIMITS.MAX_DOCUMENTS_PER_OPERATION) {
      throw new QuantityLimitExceededError(
        request.chaves.length,
        ManifestationConstants.LIMITS.MAX_DOCUMENTS_PER_OPERATION
      );
    }

    // Validar formato das chaves de acesso
    const invalidKeys = request.chaves.filter(chave => 
      !ManifestationConstants.REGEX.ACCESS_KEY.test(chave)
    );

    if (invalidKeys.length > 0) {
      throw new InvalidAccessKeyError(invalidKeys);
    }
  }

  /**
   * Valida se o tipo de manifestação existe
   */
  private async validateManifestationType(
    sqlConnection: PrismaClient,
    manifestationType: string
  ): Promise<void> {
    try {
      // Tentar usar a API fluente do Prisma (schema novo)
      const typeExists = await sqlConnection.tblTipoManifestacao.findFirst({
        where: {
          codigo: manifestationType,
          ativo: true
        }
      });

      if (!typeExists) {
        throw new InvalidManifestationTypeError(manifestationType);
      }
    } catch (error) {
      if (error instanceof InvalidManifestationTypeError) {
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Se falhar por schema dessincronizado, tentar validação legada via query bruta
      if (errorMessage.includes('207') || errorMessage.includes('column') || errorMessage.includes('invalid')) {
        this.logger.warn('Validando tipo de manifestação via schema legado', { manifestationType });
        
        try {
          // No schema legado, validamos se o ID existe na tbl_tipo_manifestacao
          const legacyTypes: any[] = await sqlConnection.$queryRaw`
            SELECT id FROM tbl_tipo_manifestacao WHERE id = ${manifestationType} 
            OR CAST(id AS VARCHAR) = ${manifestationType}
          `;
          
          if (!legacyTypes || legacyTypes.length === 0) {
            throw new InvalidManifestationTypeError(manifestationType);
          }
          return; // Válido no schema legado
        } catch (legacyError) {
          if (legacyError instanceof InvalidManifestationTypeError) throw legacyError;
          this.logger.error('Falha também na validação legada de tipo', { error: legacyError });
        }
      }
      
      this.logger.error('Erro ao validar tipo de manifestação', {
        manifestationType,
        error: errorMessage
      });
      
      throw new DatabaseRoutingError();
    }
  }

  /**
   * Valida status de manifestação
   */
  private validateStatus(status: ManifestationStatus): void {
    if (!ManifestationConstants.VALID_STATUS.includes(status)) {
      throw new ManifestationError(
        `Status '${status}' não é válido. Status válidos: ${ManifestationConstants.VALID_STATUS.join(', ')}`,
        'INVALID_STATUS',
        400
      );
    }
  }

  // ========== MÉTODOS PRIVADOS DE BANCO DE DADOS ==========

  /**
   * Verifica manifestações existentes para evitar duplicatas
   */
  private async checkExistingManifestations(
    sqlConnection: PrismaClient,
    chaves: string[],
    manifestationType: string,
    userCode: string
  ): Promise<string[]> {
    try {
      // Tentar usar a API fluente do Prisma (schema novo)
      const existingRecords = await sqlConnection.tblManifestacao.findMany({
        where: {
          chaveAcesso: { in: chaves },
          tipoManifestacao: manifestationType,
          usrCodigo: userCode,
          status: { in: ['AGENDADO', 'PROCESSANDO'] }
        },
        select: {
          chaveAcesso: true
        }
      });

      return existingRecords.map(record => record.chaveAcesso);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Se falhar por schema dessincronizado, tentar consulta legada via query bruta
      if (errorMessage.includes('207') || errorMessage.includes('column') || errorMessage.includes('invalid')) {
        this.logger.warn('Verificando duplicatas via schema legado', { totalChaves: chaves.length });

        try {
          // Schema legado: chv (varchar), tipo (int), status (int)
          // Status legado: 1 = Agendado, 2 = Processando? Assumimos 1 e 2.
          const legacyType = parseInt(manifestationType) || 1;
          
          const results: any[] = await sqlConnection.$queryRaw`
            SELECT chv as chaveAcesso 
            FROM tbl_manifestacao 
            WHERE chv IN (${chaves.join(',')})
            AND tipo = ${legacyType}
            AND status IN (1, 2)
          `;

          return results.map(r => r.chaveAcesso);
        } catch (legacyError) {
          this.logger.error('Falha também na verificação legada de duplicatas', { error: legacyError });
          throw new DatabaseRoutingError();
        }
      }

      this.logger.error('Erro ao verificar manifestações existentes', {
        error: errorMessage
      });
      throw new DatabaseRoutingError();
    }
  }

  /**
   * Cria registros de manifestação no banco
   */
  private async createManifestationRecords(
    sqlConnection: PrismaClient,
    manifestationId: string,
    chaves: string[],
    manifestationType: string,
    userCode: string,
    ipAddress?: string
  ): Promise<number> {
    try {
      const now = new Date();
      
      const records = chaves.map(chave => ({
        id: randomUUID(),
        usrCodigo: userCode,
        tipoManifestacao: manifestationType,
        chaveAcesso: chave,
        status: ManifestationConstants.STATUS.AGENDADO,
        dataAgendamento: now,
        ipOrigem: ipAddress,
        createdAt: now,
        updatedAt: now
      }));

      await sqlConnection.tblManifestacao.createMany({
        data: records
      });

      return records.length;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Se falhar por schema dessincronizado (coluna inválida), tentar fallback legado
      if (errorMessage.includes('207') || errorMessage.includes('column') || errorMessage.includes('invalid')) {
        this.logger.warn('Tabela tbl_manifestacao parece estar no formato legado, tentando fallback', {
          manifestationId,
          totalRecords: chaves.length
        });

        try {
          // Fallback SQL para tabela legada: dthr (datetime), status (int), chv (varchar), tipo (int)
          // Mapeamos manifestationType (string) para int se possível ou usamos o ID original
          const now = new Date();
          const legacyStatus = 1; // 1 = Agendado no sistema legado
          const legacyType = parseInt(manifestationType) || 1;

          for (const chave of chaves) {
            await sqlConnection.$executeRaw`
              INSERT INTO tbl_manifestacao (dthr, status, chv, tipo)
              VALUES (${now}, ${legacyStatus}, ${chave}, ${legacyType})
            `;
          }
          
          return chaves.length;
        } catch (legacyError) {
          this.logger.error('Falha também no fallback legado para tbl_manifestacao', {
            error: legacyError instanceof Error ? legacyError.message : String(legacyError)
          });
          throw new DatabaseRoutingError();
        }
      }

      this.logger.error('Erro ao criar registros de manifestação', {
        manifestationId,
        totalRecords: chaves.length,
        error: errorMessage
      });
      throw new DatabaseRoutingError();
    }
  }

  // ========== MÉTODOS PRIVADOS DE FILTROS E CONSULTAS ==========

  /**
   * Normaliza filtros de consulta de status
   */
  private normalizeStatusFilters(filters: ManifestationStatusFilters): Required<ManifestationStatusFilters> {
    return {
      manifestationType: filters.manifestationType || '',
      status: filters.status || undefined as any,
      startDate: filters.startDate || undefined as any,
      endDate: filters.endDate || undefined as any,
      chaveAcesso: filters.chaveAcesso || '',
      page: Math.max(1, filters.page || ManifestationConstants.PAGINATION.DEFAULT_PAGE),
      pageSize: Math.min(
        ManifestationConstants.PAGINATION.MAX_PAGE_SIZE,
        Math.max(
          ManifestationConstants.PAGINATION.MIN_PAGE_SIZE,
          filters.pageSize || ManifestationConstants.PAGINATION.DEFAULT_PAGE_SIZE
        )
      )
    };
  }

  /**
   * Constrói cláusula WHERE para consultas
   */
  private buildWhereClause(filters: Required<ManifestationStatusFilters>, userCode: string): any {
    const where: any = {
      usrCodigo: userCode
    };

    if (filters.manifestationType) {
      where.tipoManifestacao = filters.manifestationType;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.chaveAcesso) {
      where.chaveAcesso = {
        contains: filters.chaveAcesso
      };
    }

    if (filters.startDate || filters.endDate) {
      where.dataAgendamento = {};
      
      if (filters.startDate) {
        where.dataAgendamento.gte = filters.startDate;
      }
      
      if (filters.endDate) {
        where.dataAgendamento.lte = filters.endDate;
      }
    }

    return where;
  }

  // ========== MÉTODOS PRIVADOS DE CACHE ==========

  /**
   * Constrói chave de cache
   */
  private buildCacheKey(operation: string, userCode: string, filters?: any): string {
    const baseKey = `${ManifestationConstants.CACHE.STATUS_CACHE_KEY}_${operation}_${userCode}`;
    
    if (filters) {
      const filterHash = Buffer.from(JSON.stringify(filters)).toString('base64');
      return `${baseKey}_${filterHash}`;
    }
    
    return baseKey;
  }

  /**
   * Obtém item do cache
   */
  private getFromCache<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item || Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  /**
   * Armazena item no cache
   */
  private setCache(key: string, data: any, ttlMs: number): void {
    // Limitar tamanho do cache
    if (this.cache.size >= 1000) {
      this.cleanupCache();
    }

    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    });
  }

  /**
   * Limpa cache relacionado a um usuário
   */
  private clearRelatedCache(userCode: string): void {
    const keysToDelete: string[] = [];
    
    for (const [key] of this.cache) {
      if (key.includes(userCode)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    this.logger.debug('Cache limpo para usuário', {
      userCode,
      keysCleared: keysToDelete.length
    });
  }

  /**
   * Limpa itens expirados do cache
   */
  private cleanupCache(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, item] of this.cache) {
      if (now > item.expiry) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
    
    this.logger.debug('Limpeza de cache executada', {
      keysRemoved: keysToDelete.length,
      remainingKeys: this.cache.size
    });
  }

  /**
   * Cleanup - limpar recursos
   */
  async cleanup(): Promise<void> {
    this.cache.clear();
    this.logger.info('ManifestationService cleanup concluído');
  }
}

// Singleton instance
export const manifestationService = new ManifestationService();