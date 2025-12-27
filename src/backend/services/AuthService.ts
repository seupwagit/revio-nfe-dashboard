/**
 * AuthService - Serviço de Autenticação
 * 
 * Responsável por validar credenciais, verificar status da base de dados
 * e verificar permissões do usuário
 */

import crypto from 'crypto'
import { databaseRouter } from './DatabaseRouter'

export interface UserData {
  usrCodigo: string
  usrNome: string
  usrLogin: string
  bancoDeDados: string
  isAdmin: boolean
  empresa?: string
  cnpj?: string
}

export interface AuthValidationResult {
  success: boolean
  user?: UserData
  error?: string
  errorCode?: string
}

export class AuthService {
  /**
   * Gera hash MD5 compatível com o sistema .NET
   * Formato: MD5(USR_CODIGO + senha)
   */
  private generatePasswordHash(usrCodigo: string, senha: string): string {
    const paraHash = usrCodigo + senha
    return crypto.createHash('md5').update(paraHash, 'utf8').digest('hex')
  }

  /**
   * Valida credenciais do usuário na tabela fr_usuario
   */
  async validateCredentials(username: string, password: string): Promise<AuthValidationResult> {
    try {
      console.log('[AuthService] 🔍 Validando credenciais na base de dados')
      console.log('[AuthService]    Username:', username)
      
      const prisma = databaseRouter.getGlobalSqlConnection()
      
      if (!prisma) {
        console.error('[AuthService] ❌ Conexão com banco de dados não disponível')
        throw new Error('Conexão com banco de dados não disponível')
      }
      
      console.log('[AuthService] ✅ Conexão Prisma obtida')
      
      // Buscar usuário pelo login
      console.log('[AuthService] 🔍 Buscando usuário na tabela fr_usuario...')
      const user = await prisma.frUsuario.findUnique({
        where: {
          usrLogin: username
        }
      })

      console.log('[AuthService] 📊 Resultado da busca:', {
        found: !!user,
        usrCodigo: user?.usrCodigo,
        usrNome: user?.usrNome,
        ativo: user?.ativo,
        hasSenha: !!user?.usrSenha,
        bancoDeDados: user?.bancoDeDados
      })

      if (!user) {
        console.log('[AuthService] ❌ Usuário não encontrado')
        return {
          success: false,
          error: 'Usuário não encontrado',
          errorCode: 'USER_NOT_FOUND'
        }
      }

      // Verificar se usuário está ativo (não desativado)
      if (user.ativo !== 1) {
        console.log('[AuthService] ❌ Usuário inativo:', user.ativo)
        return {
          success: false,
          error: 'Usuário inativo',
          errorCode: 'USER_INACTIVE'
        }
      }

      console.log('[AuthService] ✅ Usuário ativo')

      // Verificar senha usando o mesmo algoritmo do .NET
      if (!user.usrSenha) {
        console.log('[AuthService] ❌ Usuário sem senha configurada')
        return {
          success: false,
          error: 'Usuário sem senha configurada',
          errorCode: 'NO_PASSWORD'
        }
      }

      console.log('[AuthService] 🔐 Validando senha...')
      const expectedHash = this.generatePasswordHash(user.usrCodigo, password)
      
      console.log('[AuthService] 📊 Hash comparison:', {
        expectedLength: expectedHash.length,
        storedLength: user.usrSenha.length,
        match: user.usrSenha === expectedHash
      })

      if (user.usrSenha !== expectedHash) {
        console.log('[AuthService] ❌ Senha incorreta')
        return {
          success: false,
          error: 'Senha incorreta',
          errorCode: 'INVALID_PASSWORD'
        }
      }

      console.log('[AuthService] ✅ Senha correta')

      const userData = {
        usrCodigo: user.usrCodigo,
        usrNome: user.usrNome,
        usrLogin: user.usrLogin,
        bancoDeDados: user.bancoDeDados || '',
        isAdmin: user.usrAdministrador === 'S',
        empresa: user.empresa || undefined,
        cnpj: user.cnpj || undefined
      }

      console.log('[AuthService] 🎉 Credenciais validadas com sucesso')

      return {
        success: true,
        user: userData
      }

    } catch (error) {
      console.error('[AuthService] 💥 Erro crítico ao validar credenciais:', error)
      console.error('[AuthService]    Stack:', error instanceof Error ? error.stack : 'N/A')
      return {
        success: false,
        error: 'Erro interno do servidor',
        errorCode: 'INTERNAL_ERROR'
      }
    }
  }

  /**
   * Verifica se a base de dados do cliente está pronta (status = 2)
   */
  async checkDatabaseStatus(usrCodigo: string): Promise<{ ready: boolean; error?: string }> {
    try {
      // Para implementação futura: verificar status da base de dados
      // Por enquanto, assumir que está sempre pronta
      return { ready: true }

    } catch (error) {
      console.error('Erro ao verificar status da base de dados:', error)
      return {
        ready: false,
        error: 'Erro ao verificar status da base de dados'
      }
    }
  }

  /**
   * Verifica permissões do usuário na tabela fr_usuario_sistema
   */
  async checkPermissions(usrCodigo: string): Promise<{ hasAccess: boolean; isAdmin: boolean; error?: string }> {
    try {
      const prisma = databaseRouter.getGlobalSqlConnection()
      
      if (!prisma) {
        // Usar dados de teste como fallback
        return await this.checkPermissionsWithMock(usrCodigo)
      }
      
      // Buscar permissões do usuário (usando SIS_CODIGO = 'SPE' para o sistema)
      const permissions = await prisma.frUsuarioSistema.findFirst({
        where: {
          usrCodigo: usrCodigo,
          sisCodigo: 'SPE' // Código do sistema atual
        }
      })

      if (!permissions) {
        return {
          hasAccess: false,
          isAdmin: false,
          error: 'Usuário sem permissões configuradas'
        }
      }

      // Verificar se tem acesso externo
      if (permissions.ussAcessoExterno !== 'S') {
        return {
          hasAccess: false,
          isAdmin: false,
          error: 'Usuário sem permissão de acesso externo'
        }
      }

      // Verificar se pode acessar
      if (permissions.ussAcessar !== 'S') {
        return {
          hasAccess: false,
          isAdmin: false,
          error: 'Usuário sem permissão de acesso'
        }
      }

      return {
        hasAccess: true,
        isAdmin: permissions.ussAdministrador === 'S'
      }

    } catch (error) {
      console.error('Erro ao verificar permissões:', error)
      return {
        hasAccess: false,
        isAdmin: false,
        error: 'Erro ao verificar permissões'
      }
    }
  }

  /**
   * Verifica permissões usando dados de teste (fallback)
   */
  private async checkPermissionsWithMock(usrCodigo: string): Promise<{ hasAccess: boolean; isAdmin: boolean; error?: string }> {
    // Para o usuário de teste, sempre permitir acesso
    if (usrCodigo === '1') {
      return {
        hasAccess: true,
        isAdmin: true
      }
    }

    return {
      hasAccess: false,
      isAdmin: false,
      error: 'Usuário sem permissões configuradas'
    }
  }

  /**
   * Realiza autenticação completa (credenciais + status + permissões)
   */
  async authenticate(username: string, password: string): Promise<AuthValidationResult> {
    try {
      console.log('[AuthService] 🔐 Iniciando autenticação completa')
      console.log('[AuthService]    Usuário:', username)
      console.log('[AuthService]    Senha fornecida:', password ? 'SIM' : 'NÃO')

      // 1. Validar credenciais
      console.log('[AuthService] 1️⃣ Validando credenciais...')
      const credentialsResult = await this.validateCredentials(username, password)
      
      console.log('[AuthService] 📊 Resultado validação credenciais:', {
        success: credentialsResult.success,
        hasUser: !!credentialsResult.user,
        error: credentialsResult.error,
        errorCode: credentialsResult.errorCode
      })

      if (!credentialsResult.success || !credentialsResult.user) {
        console.log('[AuthService] ❌ Falha na validação de credenciais')
        return credentialsResult
      }

      console.log('[AuthService] ✅ Credenciais válidas para usuário:', credentialsResult.user.usrNome)

      // 2. Verificar status da base de dados
      console.log('[AuthService] 2️⃣ Verificando status da base de dados...')
      const databaseStatus = await this.checkDatabaseStatus(credentialsResult.user.usrCodigo)
      
      console.log('[AuthService] 📊 Status da base:', {
        ready: databaseStatus.ready,
        error: databaseStatus.error
      })

      if (!databaseStatus.ready) {
        console.log('[AuthService] ❌ Base de dados não está pronta')
        return {
          success: false,
          error: databaseStatus.error || 'Base de dados não está pronta',
          errorCode: 'DATABASE_NOT_READY'
        }
      }

      console.log('[AuthService] ✅ Base de dados pronta')

      // 3. Verificar permissões
      console.log('[AuthService] 3️⃣ Verificando permissões...')
      const permissions = await this.checkPermissions(credentialsResult.user.usrCodigo)
      
      console.log('[AuthService] 📊 Permissões:', {
        hasAccess: permissions.hasAccess,
        isAdmin: permissions.isAdmin,
        error: permissions.error
      })

      if (!permissions.hasAccess) {
        console.log('[AuthService] ❌ Usuário sem permissões de acesso')
        return {
          success: false,
          error: permissions.error || 'Usuário sem permissões de acesso',
          errorCode: 'NO_PERMISSIONS'
        }
      }

      console.log('[AuthService] ✅ Permissões validadas')

      // Atualizar dados do usuário com permissões
      const userData: UserData = {
        ...credentialsResult.user,
        isAdmin: permissions.isAdmin
      }

      console.log('[AuthService] 🎉 Autenticação completa bem-sucedida')
      console.log('[AuthService]    Usuário final:', {
        usrCodigo: userData.usrCodigo,
        usrNome: userData.usrNome,
        bancoDeDados: userData.bancoDeDados,
        isAdmin: userData.isAdmin
      })

      return {
        success: true,
        user: userData
      }

    } catch (error) {
      console.error('[AuthService] 💥 Erro crítico na autenticação:', error)
      console.error('[AuthService]    Stack:', error instanceof Error ? error.stack : 'N/A')
      return {
        success: false,
        error: 'Erro interno do servidor',
        errorCode: 'INTERNAL_ERROR'
      }
    }
  }
}

// Singleton instance
export const authService = new AuthService()