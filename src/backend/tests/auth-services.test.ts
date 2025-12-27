/**
 * Testes para garantir que serviços de autenticação usem base global
 * 
 * Valida: Requisitos 1.5, 8.4
 * - AuthService sempre usa base global
 * - TokenManager sempre usa base global
 * - Rotas de login/logout usem base global
 * - Isolamento dos serviços de autenticação
 */

import { describe, test, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest'
import { authService } from '../services/AuthService'
import { tokenManager } from '../services/TokenManager'
import { databaseRouter } from '../services/DatabaseRouter'
import { userContextManager } from '../services/UserContextManager'
import { UserContext } from '../types/UserContext'
import * as fc from 'fast-check'

describe('Serviços de Autenticação - Base Global', () => {
  beforeAll(async () => {
    // Garantir que o sistema está inicializado
    console.log('[Test] Inicializando testes de autenticação...')
  })

  afterAll(async () => {
    // Limpar após os testes
    console.log('[Test] Finalizando testes de autenticação...')
  })

  beforeEach(() => {
    // Limpar contextos antes de cada teste
    userContextManager.clearAllContexts()
  })

  describe('AuthService - Uso de Base Global', () => {
    test('deve sempre usar conexão global independente do contexto', async () => {
      // Configurar contexto de usuário simulado
      const mockUserContext: UserContext = {
        usrCodigo: '123',
        usrNome: 'Usuário Teste',
        usrLogin: 'teste',
        bancoDeDados: 'cliente_teste',
        isAdmin: false,
        isAuthenticated: true
      }

      // Configurar contexto no manager
      userContextManager.setContext('test-request-1', {
        userContext: mockUserContext,
        sqlConnection: null,
        mongoConnection: null
      })

      // Spy na função getGlobalSqlConnection para verificar se é chamada
      const getGlobalSqlSpy = vi.spyOn(databaseRouter, 'getGlobalSqlConnection')

      try {
        // Tentar validar credenciais (pode falhar por não ter dados de teste, mas deve usar base global)
        await authService.validateCredentials('test', 'test')
      } catch (error) {
        // Ignorar erro de validação para este teste
      }

      // Verificar que a conexão global foi usada
      expect(getGlobalSqlSpy).toHaveBeenCalled()

      getGlobalSqlSpy.mockRestore()
    })

    test('deve usar base global para verificar permissões', async () => {
      // Configurar contexto de cliente específico
      const mockUserContext: UserContext = {
        usrCodigo: '456',
        usrNome: 'Outro Usuário',
        usrLogin: 'outro',
        bancoDeDados: 'outro_cliente',
        isAdmin: true,
        isAuthenticated: true
      }

      userContextManager.setContext('test-request-2', {
        userContext: mockUserContext,
        sqlConnection: null,
        mongoConnection: null
      })

      const getGlobalSqlSpy = vi.spyOn(databaseRouter, 'getGlobalSqlConnection')

      try {
        // Verificar permissões
        await authService.checkPermissions('456')
      } catch (error) {
        // Ignorar erro para este teste
      }

      // Verificar que a conexão global foi usada
      expect(getGlobalSqlSpy).toHaveBeenCalled()

      getGlobalSqlSpy.mockRestore()
    })

    test('deve usar base global para autenticação completa', async () => {
      // Configurar contexto de cliente específico
      const mockUserContext: UserContext = {
        usrCodigo: '789',
        usrNome: 'Terceiro Usuário',
        usrLogin: 'terceiro',
        bancoDeDados: 'terceiro_cliente',
        isAdmin: false,
        isAuthenticated: true
      }

      userContextManager.setContext('test-request-3', {
        userContext: mockUserContext,
        sqlConnection: null,
        mongoConnection: null
      })

      const getGlobalSqlSpy = vi.spyOn(databaseRouter, 'getGlobalSqlConnection')

      try {
        // Realizar autenticação completa
        await authService.authenticate('test', 'test')
      } catch (error) {
        // Ignorar erro para este teste
      }

      // Verificar que a conexão global foi usada
      expect(getGlobalSqlSpy).toHaveBeenCalled()

      getGlobalSqlSpy.mockRestore()
    })
  })

  describe('TokenManager - Independência de Contexto', () => {
    test('deve gerar tokens independente do contexto de usuário', () => {
      // Configurar contexto de cliente específico
      const mockUserContext: UserContext = {
        usrCodigo: '100',
        usrNome: 'Usuário Token',
        usrLogin: 'token_user',
        bancoDeDados: 'cliente_token',
        isAdmin: true,
        isAuthenticated: true
      }

      userContextManager.setContext('test-request-4', {
        userContext: mockUserContext,
        sqlConnection: null,
        mongoConnection: null
      })

      const userData = {
        usrCodigo: '100',
        usrNome: 'Usuário Token',
        usrLogin: 'token_user',
        bancoDeDados: 'cliente_token',
        isAdmin: true
      }

      // Gerar token
      const token = tokenManager.generateToken(userData)

      // Verificar que o token foi gerado
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      expect(token.length).toBeGreaterThan(0)
    })

    test('deve validar tokens independente do contexto de usuário', () => {
      // Configurar contexto diferente
      const mockUserContext: UserContext = {
        usrCodigo: '200',
        usrNome: 'Outro Usuário Token',
        usrLogin: 'outro_token_user',
        bancoDeDados: 'outro_cliente_token',
        isAdmin: false,
        isAuthenticated: true
      }

      userContextManager.setContext('test-request-5', {
        userContext: mockUserContext,
        sqlConnection: null,
        mongoConnection: null
      })

      const userData = {
        usrCodigo: '100',
        usrNome: 'Usuário Token',
        usrLogin: 'token_user',
        bancoDeDados: 'cliente_token',
        isAdmin: true
      }

      // Gerar e validar token
      const token = tokenManager.generateToken(userData)
      const validation = tokenManager.validateToken(token)

      // Verificar que a validação funcionou
      expect(validation.valid).toBe(true)
      expect(validation.payload).toBeDefined()
      expect(validation.payload?.usrCodigo).toBe('100')
    })

    test('deve renovar tokens independente do contexto de usuário', () => {
      // Configurar contexto de cliente específico
      const mockUserContext: UserContext = {
        usrCodigo: '300',
        usrNome: 'Usuário Renovação',
        usrLogin: 'renovacao_user',
        bancoDeDados: 'cliente_renovacao',
        isAdmin: false,
        isAuthenticated: true
      }

      userContextManager.setContext('test-request-6', {
        userContext: mockUserContext,
        sqlConnection: null,
        mongoConnection: null
      })

      const userData = {
        usrCodigo: '100',
        usrNome: 'Usuário Token',
        usrLogin: 'token_user',
        bancoDeDados: 'cliente_token',
        isAdmin: true
      }

      // Gerar token e tentar renovar
      const token = tokenManager.generateToken(userData)
      const renewedToken = tokenManager.refreshTokenIfNeeded(token)

      // Token novo não deve precisar de renovação
      expect(renewedToken).toBeNull()
    })
  })

  describe('Isolamento de Serviços de Autenticação', () => {
    test('AuthService não deve ser afetado por mudanças de contexto', async () => {
      const getGlobalSqlSpy = vi.spyOn(databaseRouter, 'getGlobalSqlConnection')

      // Primeiro contexto
      const context1: UserContext = {
        usrCodigo: '400',
        usrNome: 'Usuário 1',
        usrLogin: 'user1',
        bancoDeDados: 'cliente1',
        isAdmin: false,
        isAuthenticated: true
      }

      userContextManager.setContext('test-request-7', {
        userContext: context1,
        sqlConnection: null,
        mongoConnection: null
      })

      try {
        await authService.validateCredentials('test1', 'test1')
      } catch (error) {
        // Ignorar erro
      }

      const firstCallCount = getGlobalSqlSpy.mock.calls.length

      // Segundo contexto
      const context2: UserContext = {
        usrCodigo: '500',
        usrNome: 'Usuário 2',
        usrLogin: 'user2',
        bancoDeDados: 'cliente2',
        isAdmin: true,
        isAuthenticated: true
      }

      userContextManager.setContext('test-request-8', {
        userContext: context2,
        sqlConnection: null,
        mongoConnection: null
      })

      try {
        await authService.validateCredentials('test2', 'test2')
      } catch (error) {
        // Ignorar erro
      }

      // Verificar que a conexão global foi usada em ambos os casos
      expect(getGlobalSqlSpy.mock.calls.length).toBeGreaterThan(firstCallCount)

      getGlobalSqlSpy.mockRestore()
    })

    test('TokenManager deve funcionar sem contexto de usuário', () => {
      // Limpar todos os contextos
      userContextManager.clearAllContexts()

      const userData = {
        usrCodigo: '600',
        usrNome: 'Usuário Sem Contexto',
        usrLogin: 'sem_contexto',
        bancoDeDados: 'cliente_sem_contexto',
        isAdmin: false
      }

      // Gerar e validar token sem contexto
      const token = tokenManager.generateToken(userData)
      const validation = tokenManager.validateToken(token)

      expect(validation.valid).toBe(true)
      expect(validation.payload?.usrCodigo).toBe('600')
    })
  })

  describe('Propriedades de Correção - Serviços de Autenticação', () => {
    /**
     * Feature: user-database-routing, Property 15: Serviços de autenticação usam base global
     * Valida: Requisitos 8.4
     */
    test('property: serviços de autenticação sempre usam base global', async () => {
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
            const requestId = `test-${Date.now()}-${Math.random()}`
            
            userContextManager.setContext(requestId, {
              userContext,
              sqlConnection: null,
              mongoConnection: null
            })

            const getGlobalSqlSpy = vi.spyOn(databaseRouter, 'getGlobalSqlConnection')

            try {
              // Tentar autenticar (pode falhar, mas deve usar base global)
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
        { numRuns: 50 }
      )
    })

    /**
     * Feature: user-database-routing, Property 15: TokenManager independente de contexto
     * Valida: Requisitos 8.4
     */
    test('property: TokenManager funciona independente do contexto', () => {
      fc.assert(
        fc.property(
          fc.record({
            usrCodigo: fc.string({ minLength: 1, maxLength: 10 }),
            usrNome: fc.string({ minLength: 1, maxLength: 50 }),
            usrLogin: fc.string({ minLength: 1, maxLength: 20 }),
            bancoDeDados: fc.string({ minLength: 1, maxLength: 50 }),
            isAdmin: fc.boolean()
          }),
          fc.record({
            usrCodigo: fc.string({ minLength: 1, maxLength: 10 }),
            usrNome: fc.string({ minLength: 1, maxLength: 50 }),
            usrLogin: fc.string({ minLength: 1, maxLength: 20 }),
            bancoDeDados: fc.string({ minLength: 1, maxLength: 50 }),
            isAdmin: fc.boolean(),
            isAuthenticated: fc.constant(true)
          }),
          (userData, contextUser) => {
            // Configurar contexto diferente do usuário do token
            const requestId = `test-${Date.now()}-${Math.random()}`
            
            userContextManager.setContext(requestId, {
              userContext: contextUser,
              sqlConnection: null,
              mongoConnection: null
            })

            // Gerar token com dados diferentes do contexto
            const token = tokenManager.generateToken(userData)
            const validation = tokenManager.validateToken(token)

            // Token deve ser válido independente do contexto
            expect(validation.valid).toBe(true)
            expect(validation.payload?.usrCodigo).toBe(userData.usrCodigo)
            expect(validation.payload?.bancoDeDados).toBe(userData.bancoDeDados)

            userContextManager.clearContext(requestId)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})