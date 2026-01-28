/**
 * Testes para rotas de autenticação - Base Global
 * 
 * Valida: Requisitos 1.5, 8.4
 * - Rotas de login/logout usem base global
 * - Isolamento das rotas de autenticação
 */

import * as fc from 'fast-check'
import { afterAll, beforeAll, beforeEach, describe, expect, test, vi } from 'vitest'
import { authService } from '../../../services/AuthService'
import { databaseRouter } from '../../../services/DatabaseRouter'
import { tokenManager } from '../../../services/TokenManager'
import { userContextManager } from '../../../services/UserContextManager'
import { UserContext } from '../../../types/UserContext'

describe('Rotas de Autenticação - Base Global', () => {
  beforeAll(async () => {
    console.log('[Test] Inicializando testes de rotas de autenticação...')
  })

  afterAll(async () => {
    console.log('[Test] Finalizando testes de rotas de autenticação...')
  })

  beforeEach(() => {
    // Limpar contextos antes de cada teste
    userContextManager.clearAllContexts()
  })

  describe('Lógica de Login - Base Global', () => {
    test('deve usar base global para autenticação independente do contexto', async () => {
      // Configurar contexto de cliente específico
      const mockUserContext: UserContext = {
        usrCodigo: '999',
        usrNome: 'Usuário Contexto',
        usrLogin: 'contexto',
        bancoDeDados: 'cliente_contexto',
        isAdmin: false,
        isAuthenticated: true
      }

      userContextManager.setContext('existing-context', {
        userContext: mockUserContext,
        sqlConnection: null,
        mongoConnection: null
      })

      const getGlobalSqlSpy = vi.spyOn(databaseRouter, 'getGlobalSqlConnection')

      try {
        // Simular lógica de login (como feito nas rotas)
        await authService.authenticate('test', 'test')
      } catch (error) {
        // Ignorar erro de autenticação para este teste
      }

      // Verificar que a conexão global foi usada
      expect(getGlobalSqlSpy).toHaveBeenCalled()

      getGlobalSqlSpy.mockRestore()
    })

    test('deve usar base global para validação de credenciais', async () => {
      const getGlobalSqlSpy = vi.spyOn(databaseRouter, 'getGlobalSqlConnection')

      try {
        // Simular validação de credenciais (como feito nas rotas)
        await authService.validateCredentials('test', 'test')
      } catch (error) {
        // Ignorar erro para este teste
      }

      // Verificar que a conexão global foi usada
      expect(getGlobalSqlSpy).toHaveBeenCalled()

      getGlobalSqlSpy.mockRestore()
    })
  })

  describe('Lógica de Verificação de Token - Base Global', () => {
    test('deve verificar tokens independente do contexto', () => {
      // Configurar contexto de cliente específico
      const mockUserContext: UserContext = {
        usrCodigo: '888',
        usrNome: 'Usuário Verify',
        usrLogin: 'verify',
        bancoDeDados: 'cliente_verify',
        isAdmin: true,
        isAuthenticated: true
      }

      userContextManager.setContext('verify-context', {
        userContext: mockUserContext,
        sqlConnection: null,
        mongoConnection: null
      })

      // Simular verificação de token (como feito nas rotas)
      const validation = tokenManager.validateToken('invalid-token')

      expect(validation.valid).toBe(false)
      expect(validation.errorCode).toBe('INVALID_TOKEN')
    })

    test('deve processar tokens válidos independente do contexto', () => {
      // Configurar contexto de cliente específico
      const mockUserContext: UserContext = {
        usrCodigo: '777',
        usrNome: 'Usuário Token',
        usrLogin: 'token',
        bancoDeDados: 'cliente_token',
        isAdmin: false,
        isAuthenticated: true
      }

      userContextManager.setContext('token-context', {
        userContext: mockUserContext,
        sqlConnection: null,
        mongoConnection: null
      })

      const userData = {
        usrCodigo: '123',
        usrNome: 'Usuário Teste',
        usrLogin: 'teste',
        bancoDeDados: 'cliente_teste',
        isAdmin: true
      }

      // Gerar e verificar token (como feito nas rotas)
      const token = tokenManager.generateToken(userData)
      const validation = tokenManager.validateToken(token)

      expect(validation.valid).toBe(true)
      expect(validation.payload?.usrCodigo).toBe('123')
    })
  })

  describe('Lógica de Renovação de Token - Base Global', () => {
    test('deve renovar tokens independente do contexto', () => {
      // Configurar contexto de cliente específico
      const mockUserContext: UserContext = {
        usrCodigo: '666',
        usrNome: 'Usuário Refresh',
        usrLogin: 'refresh',
        bancoDeDados: 'cliente_refresh',
        isAdmin: false,
        isAuthenticated: true
      }

      userContextManager.setContext('refresh-context', {
        userContext: mockUserContext,
        sqlConnection: null,
        mongoConnection: null
      })

      const userData = {
        usrCodigo: '456',
        usrNome: 'Usuário Renovação',
        usrLogin: 'renovacao',
        bancoDeDados: 'cliente_renovacao',
        isAdmin: false
      }

      // Simular renovação de token (como feito nas rotas)
      const token = tokenManager.generateToken(userData)
      const renewedToken = tokenManager.refreshTokenIfNeeded(token)

      // Token novo não deve precisar de renovação
      expect(renewedToken).toBeNull()
    })
  })

  describe('Isolamento de Lógica de Autenticação', () => {
    test('lógica de autenticação não deve ser afetada por contextos de usuário', async () => {
      const getGlobalSqlSpy = vi.spyOn(databaseRouter, 'getGlobalSqlConnection')

      // Configurar múltiplos contextos
      const contexts = [
        {
          id: 'context-1',
          user: {
            usrCodigo: '100',
            usrNome: 'Usuário 1',
            usrLogin: 'user1',
            bancoDeDados: 'cliente1',
            isAdmin: false,
            isAuthenticated: true
          }
        },
        {
          id: 'context-2',
          user: {
            usrCodigo: '200',
            usrNome: 'Usuário 2',
            usrLogin: 'user2',
            bancoDeDados: 'cliente2',
            isAdmin: true,
            isAuthenticated: true
          }
        }
      ]

      for (const context of contexts) {
        userContextManager.setContext(context.id, {
          userContext: context.user,
          sqlConnection: null,
          mongoConnection: null
        })

        try {
          // Simular autenticação com cada contexto ativo
          await authService.authenticate('test', 'test')
        } catch (error) {
          // Ignorar erro para este teste
        }
      }

      // Verificar que a conexão global foi usada
      expect(getGlobalSqlSpy).toHaveBeenCalled()

      getGlobalSqlSpy.mockRestore()
    })
  })

  describe('Propriedades de Correção - Lógica de Autenticação', () => {
    /**
     * Feature: user-database-routing, Property 15: Lógica de autenticação usa base global
     * Valida: Requisitos 8.4
     */
    test('property: lógica de autenticação sempre usa base global', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            usrCodigo: fc.string({ minLength: 1, maxLength: 10 }),
            usrNome: fc.string({ minLength: 1, maxLength: 50 }),
            usrLogin: fc.string({ minLength: 1, maxLength: 20 }),
            bancoDeDados: fc.string({ minLength: 1, maxLength: 50 }),
            isAdmin: fc.boolean(),
            isAuthenticated: fc.constant(true)
          }),
          fc.string({ minLength: 1, maxLength: 20 }),
          fc.string({ minLength: 1, maxLength: 20 }),
          async (userContext, username, password) => {
            // Configurar contexto de cliente específico
            const requestId = `test-route-${Date.now()}-${Math.random()}`
            
            userContextManager.setContext(requestId, {
              userContext,
              sqlConnection: null,
              mongoConnection: null
            })

            const getGlobalSqlSpy = vi.spyOn(databaseRouter, 'getGlobalSqlConnection')

            try {
              // Simular lógica de autenticação das rotas
              await authService.authenticate(username, password)
            } catch (error) {
              // Ignorar erro de autenticação para este teste
            }

            // Verificar que a conexão global foi usada
            expect(getGlobalSqlSpy).toHaveBeenCalled()
            
            getGlobalSqlSpy.mockRestore()
            userContextManager.clearContext(requestId)
          }
        ),
        { numRuns: 30 }
      )
    })

    /**
     * Feature: user-database-routing, Property 15: Verificação de token independente de contexto
     * Valida: Requisitos 8.4
     */
    test('property: verificação de token independente de contexto', () => {
      fc.assert(
        fc.property(
          fc.record({
            usrCodigo: fc.string({ minLength: 1, maxLength: 10 }),
            usrNome: fc.string({ minLength: 1, maxLength: 50 }),
            usrLogin: fc.string({ minLength: 1, maxLength: 20 }),
            bancoDeDados: fc.string({ minLength: 1, maxLength: 50 }),
            isAdmin: fc.boolean(),
            isAuthenticated: fc.constant(true)
          }),
          fc.record({
            usrCodigo: fc.string({ minLength: 1, maxLength: 10 }),
            usrNome: fc.string({ minLength: 1, maxLength: 50 }),
            usrLogin: fc.string({ minLength: 1, maxLength: 20 }),
            bancoDeDados: fc.string({ minLength: 1, maxLength: 50 }),
            isAdmin: fc.boolean()
          }),
          (contextUser, tokenUser) => {
            // Configurar contexto de cliente específico
            const requestId = `test-verify-${Date.now()}-${Math.random()}`
            
            userContextManager.setContext(requestId, {
              userContext: contextUser,
              sqlConnection: null,
              mongoConnection: null
            })

            // Gerar token com dados diferentes do contexto
            const token = tokenManager.generateToken(tokenUser)
            
            // Simular verificação de token (como feito nas rotas)
            const validation = tokenManager.validateToken(token)

            // Token deve ser válido independente do contexto
            expect(validation.valid).toBe(true)
            expect(validation.payload?.usrCodigo).toBe(tokenUser.usrCodigo)

            userContextManager.clearContext(requestId)
          }
        ),
        { numRuns: 50 }
      )
    })
  })
})