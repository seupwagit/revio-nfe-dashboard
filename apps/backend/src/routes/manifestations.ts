/**
 * Manifestation Routes - Rotas de Manifestação de NFe
 * 
 * Rotas para agendamento, consulta de tipos e status de manifestações
 */

// 1. Node.js built-ins
import { randomUUID } from 'crypto';

// 2. External libraries
import { Response, Router } from 'express';
import { z } from 'zod';

// 3. Internal packages (workspace)
import { ManifestationConstants } from '@fiscal/shared/constants/manifestation.constants';
import { ManifestationScheduleRequestSchema } from '@fiscal/shared/schemas/manifestation-schedule-request.schema';
import { ManifestationStatusQuerySchema } from '@fiscal/shared/schemas/manifestation-status-query.schema';

// 4. Relative imports (mesmo diretório/subdiretórios)
import { AuthenticatedRequest } from '../middleware/AuthMiddleware';
import { manifestationService } from '../services/ManifestationService';
import { manifestationTypeService } from '../services/ManifestationTypeService';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger('ManifestationRoutes');

/**
 * POST /api/manifestations/schedule
 * Agenda manifestações para documentos selecionados
 */
router.post('/schedule', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = randomUUID();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  try {
    logger.info('Requisição de agendamento de manifestação recebida', {
      requestId,
      userCode: req.user?.usrCodigo,
      ip,
      bodyKeys: Object.keys(req.body)
    });

    // Verificar autenticação
    if (!req.user) {
      logger.warn('Tentativa de acesso sem autenticação', { requestId, ip });
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Validar dados da requisição usando Zod
    let validatedData;
    try {
      validatedData = ManifestationScheduleRequestSchema.parse(req.body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Dados de entrada inválidos', {
          requestId,
          userCode: req.user.usrCodigo,
          errors: error.issues
        });

        return res.status(400).json({
          success: false,
          error: 'Dados de entrada inválidos',
          code: 'VALIDATION_ERROR',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      throw error;
    }

    logger.debug('Dados validados com sucesso', {
      requestId,
      userCode: req.user.usrCodigo,
      manifestationType: validatedData.manifestationType,
      chavesCount: validatedData.chaves.length
    });

    // Agendar manifestações usando o serviço
    const result = await manifestationService.scheduleManifestations(
      validatedData,
      req.user.usrCodigo,
      ip
    );

    const duration = Date.now() - startTime;
    logger.info('Agendamento de manifestações concluído', {
      requestId,
      userCode: req.user.usrCodigo,
      result,
      duration: `${duration}ms`
    });

    return res.status(201).json({
      success: true,
      data: result,
      message: `${result.scheduledCount} manifestações agendadas com sucesso`
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Erro no agendamento de manifestações', {
      requestId,
      userCode: req.user?.usrCodigo,
      error: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`
    });

    // Tratar erros específicos de manifestação
    if (error instanceof Error && error.name.includes('Manifestation')) {
      const statusCode = (error as any).statusCode || 400;
      const errorCode = (error as any).errorCode || 'MANIFESTATION_ERROR';

      return res.status(statusCode).json({
        success: false,
        error: error.message,
        code: errorCode
      });
    }

    // Erro genérico
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/manifestations/types
 * Obtém tipos de manifestação disponíveis para o usuário
 */
router.get('/types', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = randomUUID();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  try {
    logger.info('Requisição de tipos de manifestação recebida', {
      requestId,
      userCode: req.user?.usrCodigo,
      ip
    });

    // Verificar autenticação
    if (!req.user) {
      logger.warn('Tentativa de acesso sem autenticação', { requestId, ip });
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Obter tipos disponíveis usando o serviço
    const result = await manifestationTypeService.getAvailableTypes(req.user.usrCodigo);

    const duration = Date.now() - startTime;

    if (!result.success) {
      logger.error('Erro ao obter tipos de manifestação', {
        requestId,
        userCode: req.user.usrCodigo,
        error: result.error,
        errorCode: result.errorCode,
        duration: `${duration}ms`
      });

      const statusCode = result.errorCode === ManifestationConstants.ERROR_CODES.DATABASE_ROUTING_ERROR ? 503 : 500;

      return res.status(statusCode).json({
        success: false,
        error: result.error || 'Erro ao carregar tipos de manifestação',
        code: result.errorCode || 'SYSTEM_ERROR'
      });
    }

    logger.info('Tipos de manifestação obtidos com sucesso', {
      requestId,
      userCode: req.user.usrCodigo,
      typesCount: result.data?.length || 0,
      duration: `${duration}ms`
    });

    return res.json({
      success: true,
      data: result.data || []
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Erro interno ao obter tipos de manifestação', {
      requestId,
      userCode: req.user?.usrCodigo,
      error: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`
    });

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/manifestations/status
 * Consulta status de manifestações com filtros e paginação
 */
router.get('/status', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = randomUUID();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  try {
    logger.info('Requisição de status de manifestações recebida', {
      requestId,
      userCode: req.user?.usrCodigo,
      ip,
      queryParams: req.query
    });

    // Verificar autenticação
    if (!req.user) {
      logger.warn('Tentativa de acesso sem autenticação', { requestId, ip });
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Preparar dados para validação
    const queryData = {
      ...req.query,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined
    };

    // Validar parâmetros de consulta usando Zod
    let validatedQuery;
    try {
      validatedQuery = ManifestationStatusQuerySchema.parse(queryData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Parâmetros de consulta inválidos', {
          requestId,
          userCode: req.user.usrCodigo,
          errors: error.issues
        });

        return res.status(400).json({
          success: false,
          error: 'Parâmetros de consulta inválidos',
          code: 'VALIDATION_ERROR',
          details: error.issues.map((err: any) => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
      throw error;
    }

    // Converter datas string para Date objects se fornecidas
    const filters = {
      manifestationType: validatedQuery.manifestationType,
      status: validatedQuery.status,
      startDate: validatedQuery.dateFrom ? new Date(validatedQuery.dateFrom) : undefined,
      endDate: validatedQuery.dateTo ? new Date(validatedQuery.dateTo) : undefined,
      page: validatedQuery.page,
      pageSize: validatedQuery.pageSize
    };

    logger.debug('Filtros processados', {
      requestId,
      userCode: req.user.usrCodigo,
      filters
    });

    // Consultar status usando o serviço
    const result = await manifestationService.getManifestationStatus(
      filters,
      req.user.usrCodigo
    );

    const duration = Date.now() - startTime;
    logger.info('Consulta de status concluída', {
      requestId,
      userCode: req.user.usrCodigo,
      totalRecords: result.data?.length || 0,
      totalCount: result.pagination?.totalCount || 0,
      duration: `${duration}ms`
    });

    return res.json({
      success: true,
      data: result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Erro na consulta de status de manifestações', {
      requestId,
      userCode: req.user?.usrCodigo,
      error: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`
    });

    // Tratar erros específicos de manifestação
    if (error instanceof Error && error.name.includes('Manifestation')) {
      const statusCode = (error as any).statusCode || 400;
      const errorCode = (error as any).errorCode || 'MANIFESTATION_ERROR';

      return res.status(statusCode).json({
        success: false,
        error: error.message,
        code: errorCode
      });
    }

    // Erro genérico
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * PUT /api/manifestations/:id/status
 * Atualiza status de uma manifestação específica
 */
router.put('/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = randomUUID();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  try {
    const manifestationId = req.params.id;

    logger.info('Requisição de atualização de status recebida', {
      requestId,
      userCode: req.user?.usrCodigo,
      manifestationId,
      ip,
      bodyKeys: Object.keys(req.body)
    });

    // Verificar autenticação
    if (!req.user) {
      logger.warn('Tentativa de acesso sem autenticação', { requestId, ip });
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Validar ID da manifestação
    if (!manifestationId || manifestationId.trim() === '') {
      logger.warn('ID de manifestação inválido', {
        requestId,
        userCode: req.user.usrCodigo,
        manifestationId
      });

      return res.status(400).json({
        success: false,
        error: 'ID da manifestação é obrigatório',
        code: 'INVALID_MANIFESTATION_ID'
      });
    }

    // Validar dados da requisição
    const { status, notes } = req.body;

    if (!status || typeof status !== 'string') {
      logger.warn('Status inválido fornecido', {
        requestId,
        userCode: req.user.usrCodigo,
        manifestationId,
        providedStatus: status
      });

      return res.status(400).json({
        success: false,
        error: 'Status é obrigatório e deve ser uma string',
        code: 'INVALID_STATUS'
      });
    }

    // Validar se o status é válido
    if (!ManifestationConstants.VALID_STATUS.includes(status as any)) {
      logger.warn('Status não permitido', {
        requestId,
        userCode: req.user.usrCodigo,
        manifestationId,
        providedStatus: status,
        validStatuses: ManifestationConstants.VALID_STATUS
      });

      return res.status(400).json({
        success: false,
        error: `Status '${status}' não é válido. Status válidos: ${ManifestationConstants.VALID_STATUS.join(', ')}`,
        code: 'INVALID_STATUS_VALUE'
      });
    }

    // Preparar parâmetros para atualização
    const updateParams = {
      manifestationId,
      status: status as any,
      notes: notes && typeof notes === 'string' ? notes.trim() : undefined,
      ipAddress: ip
    };

    logger.debug('Parâmetros de atualização preparados', {
      requestId,
      userCode: req.user.usrCodigo,
      updateParams
    });

    // Atualizar status usando o serviço
    const result = await manifestationService.updateManifestationStatus(
      updateParams,
      req.user.usrCodigo
    );

    const duration = Date.now() - startTime;
    logger.info('Status de manifestação atualizado com sucesso', {
      requestId,
      userCode: req.user.usrCodigo,
      manifestationId,
      newStatus: status,
      duration: `${duration}ms`
    });

    return res.json({
      success: true,
      data: result,
      message: 'Status da manifestação atualizado com sucesso'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Erro na atualização de status de manifestação', {
      requestId,
      userCode: req.user?.usrCodigo,
      manifestationId: req.params.id,
      error: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`
    });

    // Tratar erros específicos de manifestação
    if (error instanceof Error && error.name.includes('Manifestation')) {
      const statusCode = (error as any).statusCode || 400;
      const errorCode = (error as any).errorCode || 'MANIFESTATION_ERROR';

      return res.status(statusCode).json({
        success: false,
        error: error.message,
        code: errorCode
      });
    }

    // Erro genérico
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /api/manifestations/validate-type/:typeId
 * Valida se um tipo de manifestação é válido para o usuário
 */
router.get('/validate-type/:typeId', async (req: AuthenticatedRequest, res: Response) => {
  const startTime = Date.now();
  const requestId = randomUUID();
  const ip = req.ip || req.connection.remoteAddress || 'unknown';

  try {
    const typeId = req.params.typeId;

    logger.info('Requisição de validação de tipo recebida', {
      requestId,
      userCode: req.user?.usrCodigo,
      typeId,
      ip
    });

    // Verificar autenticação
    if (!req.user) {
      logger.warn('Tentativa de acesso sem autenticação', { requestId, ip });
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
        code: 'NOT_AUTHENTICATED'
      });
    }

    // Validar tipo usando o serviço
    const result = await manifestationTypeService.validateManifestationType(
      typeId,
      req.user.usrCodigo
    );

    const duration = Date.now() - startTime;

    if (!result.success) {
      logger.error('Erro na validação de tipo', {
        requestId,
        userCode: req.user.usrCodigo,
        typeId,
        error: result.error,
        errorCode: result.errorCode,
        duration: `${duration}ms`
      });

      const statusCode = result.errorCode === ManifestationConstants.ERROR_CODES.MANIFESTATION_TYPE_INVALID ? 400 : 500;

      return res.status(statusCode).json({
        success: false,
        error: result.error || 'Erro na validação do tipo',
        code: result.errorCode || 'VALIDATION_ERROR'
      });
    }

    logger.info('Validação de tipo concluída', {
      requestId,
      userCode: req.user.usrCodigo,
      typeId,
      isValid: result.data,
      duration: `${duration}ms`
    });

    return res.json({
      success: true,
      data: {
        typeId,
        isValid: result.data,
        message: result.data ? 'Tipo de manifestação válido' : 'Tipo de manifestação inválido'
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Erro interno na validação de tipo', {
      requestId,
      userCode: req.user?.usrCodigo,
      typeId: req.params.typeId,
      error: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`
    });

    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

export default router;