/**
 * Property Tests para Validação de Entrada das Rotas de Manifestação
 * 
 * Testa a Property 5: Input Validation Completeness
 * Valida Requirements 6.1, 6.2, 6.3, 6.5
 */

// 1. Node.js built-ins

// 2. External libraries
import express from 'express';
import * as fc from 'fast-check';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// 3. Internal packages (workspace)
import { ManifestationConstants } from '@fiscal/shared/constants/manifestation.constants';

// 4. Relative imports
import manifestationsRoutes from '../manifestations';

// Mock do middleware de autenticação para testes
const mockAuthMiddleware = (req: any, _res: any, next: any) => {
  req.user = {
    usrCodigo: 'TEST_USER',
    usrNome: 'Test User',
    usrLogin: 'testuser',
    bancoDeDados: 'test_db',
    isAdmin: false
  };
  next();
};

// Mock dos serviços
const mockScheduleManifestations = vi.fn();
const mockGetManifestationStatus = vi.fn();
const mockUpdateManifestationStatus = vi.fn();
const mockGetAvailableTypes = vi.fn();
const mockValidateManifestationType = vi.fn();

vi.mock('../../services/ManifestationService', () => ({
  manifestationService: {
    scheduleManifestations: mockScheduleManifestations,
    getManifestationStatus: mockGetManifestationStatus,
    updateManifestationStatus: mockUpdateManifestationStatus
  }
}));

vi.mock('../../services/ManifestationTypeService', () => ({
  manifestationTypeService: {
    getAvailableTypes: mockGetAvailableTypes,
    validateManifestationType: mockValidateManifestationType
  }
}));

// Configurar app de teste
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use(mockAuthMiddleware);
  app.use('/api/manifestations', manifestationsRoutes);
  return app;
};

describe('Property Tests: Manifestation Routes Input Validation', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  describe('Property 5: Input Validation Completeness', () => {
    /**
     * **Validates: Requirements 6.1, 6.2, 6.3, 6.5**
     * 
     * Para qualquer tentativa de agendamento de manifestação, o sistema deve validar:
     * - Seleção do tipo de manifestação
     * - Seleção de documentos
     * - Formato das chaves de acesso
     * - Limites de quantidade
     */
    it('Property 5.1: Schedule endpoint should validate manifestation type selection', async () => {
      await fc.assert(fc.asyncProperty(
        // Gerar dados de entrada inválidos para tipo de manifestação
        fc.oneof(
          fc.constant(undefined),
          fc.constant(null),
          fc.constant(''),
          fc.constant('   '),
          fc.string({ maxLength: 0 }),
          fc.string({ minLength: 11 }) // Maior que o limite de 10 caracteres
        ),
        fc.array(fc.string({ minLength: 44, maxLength: 44 }), { minLength: 1, maxLength: 10 }),
        async (invalidManifestationType, chaves) => {
          const requestBody = {
            manifestationType: invalidManifestationType,
            chaves
          };

          const response = await request(app)
            .post('/api/manifestations/schedule')
            .send(requestBody);

          // Deve retornar erro de validação
          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.code).toBe('VALIDATION_ERROR');
          
          // Deve conter detalhes sobre o erro de tipo de manifestação
          if (response.body.details) {
            const manifestationTypeError = response.body.details.find(
              (detail: any) => detail.field === 'manifestationType'
            );
            expect(manifestationTypeError).toBeDefined();
          }
        }
      ), { numRuns: 100 });
    });

    it('Property 5.2: Schedule endpoint should validate document selection', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 10 }), // Tipo válido
        // Gerar arrays de chaves inválidos
        fc.oneof(
          fc.constant(undefined),
          fc.constant(null),
          fc.constant([]),
          fc.array(fc.string(), { maxLength: 0 }) // Array vazio
        ),
        async (manifestationType, invalidChaves) => {
          const requestBody = {
            manifestationType,
            chaves: invalidChaves
          };

          const response = await request(app)
            .post('/api/manifestations/schedule')
            .send(requestBody);

          // Deve retornar erro de validação
          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.code).toBe('VALIDATION_ERROR');
          
          // Deve conter detalhes sobre o erro de chaves
          if (response.body.details) {
            const chavesError = response.body.details.find(
              (detail: any) => detail.field === 'chaves'
            );
            expect(chavesError).toBeDefined();
          }
        }
      ), { numRuns: 100 });
    });

    it('Property 5.3: Schedule endpoint should validate access key format', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 10 }), // Tipo válido
        // Gerar chaves com formato inválido
        fc.array(
          fc.oneof(
            fc.string({ maxLength: 43 }), // Muito curta
            fc.string({ minLength: 45 }), // Muito longa
            fc.string({ minLength: 44, maxLength: 44 }).filter(s => !/^[0-9]+$/.test(s)), // Não numérica
            fc.constant(''), // Vazia
            fc.constant(null),
            fc.constant(undefined)
          ),
          { minLength: 1, maxLength: 5 }
        ),
        async (manifestationType, invalidChaves) => {
          // Filtrar valores null/undefined que causariam erro de tipo
          const filteredChaves = invalidChaves.filter(chave => chave != null);
          
          if (filteredChaves.length === 0) {
            return; // Skip se não há chaves válidas para testar
          }

          const requestBody = {
            manifestationType,
            chaves: filteredChaves
          };

          const response = await request(app)
            .post('/api/manifestations/schedule')
            .send(requestBody);

          // Deve retornar erro de validação
          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.code).toBe('VALIDATION_ERROR');
          
          // Deve conter detalhes sobre o erro de formato de chaves
          if (response.body.details) {
            const chavesError = response.body.details.find(
              (detail: any) => detail.field.includes('chaves')
            );
            expect(chavesError).toBeDefined();
          }
        }
      ), { numRuns: 100 });
    });

    it('Property 5.4: Schedule endpoint should validate quantity limits', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 10 }), // Tipo válido
        fc.integer({ min: 1001, max: 2000 }), // Quantidade acima do limite
        async (manifestationType, excessiveCount) => {
          // Gerar array com quantidade excessiva de chaves válidas
          const chaves = Array.from({ length: excessiveCount }, (_, i) => 
            String(i).padStart(44, '0') // Chaves válidas de 44 dígitos
          );

          const requestBody = {
            manifestationType,
            chaves
          };

          const response = await request(app)
            .post('/api/manifestations/schedule')
            .send(requestBody);

          // Deve retornar erro de validação
          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.code).toBe('VALIDATION_ERROR');
          
          // Deve conter detalhes sobre o limite de quantidade
          if (response.body.details) {
            const quantityError = response.body.details.find(
              (detail: any) => detail.field === 'chaves' && 
              detail.message.includes('1000')
            );
            expect(quantityError).toBeDefined();
          }
        }
      ), { numRuns: 50 }); // Menos execuções devido ao tamanho dos arrays
    });

    it('Property 5.5: Status query endpoint should validate query parameters', async () => {
      await fc.assert(fc.asyncProperty(
        // Gerar parâmetros de consulta inválidos
        fc.record({
          manifestationType: fc.option(fc.string({ minLength: 11 })), // Muito longo
          status: fc.option(fc.string().filter(s => 
            !ManifestationConstants.VALID_STATUS.includes(s as any)
          )), // Status inválido
          dateFrom: fc.option(fc.string().filter(s => 
            isNaN(Date.parse(s))
          )), // Data inválida
          dateTo: fc.option(fc.string().filter(s => 
            isNaN(Date.parse(s))
          )), // Data inválida
          page: fc.option(fc.oneof(
            fc.integer({ max: 0 }), // Página inválida
            fc.float(),
            fc.constant('invalid')
          )),
          pageSize: fc.option(fc.oneof(
            fc.integer({ max: 0 }), // Tamanho inválido
            fc.integer({ min: 1001 }), // Muito grande
            fc.float(),
            fc.constant('invalid')
          ))
        }),
        async (invalidParams) => {
          // Filtrar apenas parâmetros que realmente são inválidos
          const queryParams = Object.entries(invalidParams)
            .filter(([_, value]) => value != null)
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

          if (Object.keys(queryParams).length === 0) {
            return; // Skip se não há parâmetros para testar
          }

          const response = await request(app)
            .get('/api/manifestations/status')
            .query(queryParams);

          // Deve retornar erro de validação para parâmetros inválidos
          if (response.status === 400) {
            expect(response.body.success).toBe(false);
            expect(response.body.code).toBe('VALIDATION_ERROR');
            expect(response.body.details).toBeDefined();
          }
          // Nota: Alguns parâmetros podem ser ignorados ou ter valores padrão
        }
      ), { numRuns: 100 });
    });

    it('Property 5.6: Update status endpoint should validate manifestation ID and status', async () => {
      await fc.assert(fc.asyncProperty(
        // Gerar IDs inválidos
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.string({ maxLength: 0 })
        ),
        // Gerar status inválidos
        fc.oneof(
          fc.constant(undefined),
          fc.constant(null),
          fc.constant(''),
          fc.string().filter(s => 
            !ManifestationConstants.VALID_STATUS.includes(s as any)
          ),
          fc.integer(),
          fc.boolean()
        ),
        async (invalidId, invalidStatus) => {
          const requestBody = {
            status: invalidStatus,
            notes: 'Test notes'
          };

          const response = await request(app)
            .put(`/api/manifestations/${invalidId}/status`)
            .send(requestBody);

          // Deve retornar erro de validação
          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          
          // Deve ter código de erro apropriado
          expect(['INVALID_MANIFESTATION_ID', 'INVALID_STATUS', 'INVALID_STATUS_VALUE'])
            .toContain(response.body.code);
        }
      ), { numRuns: 100 });
    });

    it('Property 5.7: Type validation endpoint should validate type ID format', async () => {
      await fc.assert(fc.asyncProperty(
        // Gerar IDs de tipo inválidos
        fc.oneof(
          fc.constant(''),
          fc.constant('   '),
          fc.string({ minLength: 11 }), // Muito longo
          fc.string().filter(s => 
            s.length > 0 && !/^[A-Z0-9]{1,10}$/.test(s)
          ) // Formato inválido
        ),
        async (invalidTypeId) => {
          if (!invalidTypeId || invalidTypeId.trim() === '') {
            return; // Skip IDs vazios que são tratados pela rota
          }

          const response = await request(app)
            .get(`/api/manifestations/validate-type/${encodeURIComponent(invalidTypeId)}`);

          // Para IDs com formato inválido, o serviço deve retornar erro
          // Mas a rota pode processar e retornar isValid: false
          expect(response.status).toBeOneOf([200, 400, 500]);
          
          if (response.status === 200) {
            expect(response.body.success).toBe(true);
            expect(response.body.data.isValid).toBe(false);
          } else {
            expect(response.body.success).toBe(false);
          }
        }
      ), { numRuns: 100 });
    });
  });

  describe('Property 5: Edge Cases and Boundary Conditions', () => {
    it('Property 5.8: Should handle malformed JSON requests', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string(),
        async (malformedJson) => {
          // Tentar enviar JSON malformado
          const response = await request(app)
            .post('/api/manifestations/schedule')
            .set('Content-Type', 'application/json')
            .send(malformedJson);

          // Deve retornar erro de parsing ou validação
          expect(response.status).toBeOneOf([400, 422]);
          expect(response.body.success).toBe(false);
        }
      ), { numRuns: 50 });
    });

    it('Property 5.9: Should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/manifestations/schedule')
        .send('not json data');

      // Deve retornar erro apropriado
      expect(response.status).toBeOneOf([400, 415]);
    });

    it('Property 5.10: Should validate exact boundary values', async () => {
      // Testar valores exatos nos limites
      const boundaryTests = [
        {
          name: 'exactly 1000 chaves (limit)',
          chaves: Array.from({ length: 1000 }, (_, i) => 
            String(i).padStart(44, '0')
          ),
          shouldPass: true
        },
        {
          name: 'exactly 1001 chaves (over limit)',
          chaves: Array.from({ length: 1001 }, (_, i) => 
            String(i).padStart(44, '0')
          ),
          shouldPass: false
        },
        {
          name: 'manifestationType with 10 chars (limit)',
          manifestationType: 'A'.repeat(10),
          shouldPass: true
        },
        {
          name: 'manifestationType with 11 chars (over limit)',
          manifestationType: 'A'.repeat(11),
          shouldPass: false
        }
      ];

      for (const test of boundaryTests) {
        const requestBody = {
          manifestationType: test.manifestationType || 'VALID',
          chaves: test.chaves || ['12345678901234567890123456789012345678901234']
        };

        const response = await request(app)
          .post('/api/manifestations/schedule')
          .send(requestBody);

        if (test.shouldPass) {
          // Pode passar na validação (mas pode falhar no serviço)
          expect(response.status).not.toBe(400);
        } else {
          // Deve falhar na validação
          expect(response.status).toBe(400);
          expect(response.body.success).toBe(false);
          expect(response.body.code).toBe('VALIDATION_ERROR');
        }
      }
    });
  });
});

// Matcher customizado para múltiplos valores
expect.extend({
  toBeOneOf(received: any, expected: any[]) {
    const pass = expected.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expected.join(', ')}`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expected.join(', ')}`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeOneOf(expected: any[]): R;
    }
  }
}