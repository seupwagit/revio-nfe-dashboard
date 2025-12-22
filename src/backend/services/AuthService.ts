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
      const prisma = databaseRouter.getGlobalSqlConnection()
      
      if (!prisma) {
        throw new Error('Conexão com banco de dados não disponível')
      }
      
      // Buscar usuário pelo login
      const user = await prisma.frUsuario.findUnique({
        where: {
          usrLogin: username
        }
      })

      if (!user) {
        return {
          success: false,
          error: 'Usuário não encontrado',
          errorCode: 'USER_NOT_FOUND'
        }
      }

      // Verificar se usuário está ativo (não desativado)
      if (user.ativo !== 1) {
        return {
          success: false,
          error: 'Usuário inativo',
          errorCode: 'USER_INACTIVE'
        }
      }

      // Verificar senha usando o mesmo algoritmo do .NET
      if (!user.usrSenha) {
        return {
          success: false,
          error: 'Usuário sem senha configurada',
          errorCode: 'NO_PASSWORD'
        }
      }

      const expectedHash = this.generatePasswordHash(user.usrCodigo, password)
      if (user.usrSenha !== expectedHash) {
        return {
          success: false,
          error: 'Senha incorreta',
          errorCode: 'INVALID_PASSWORD'
        }
      }

      return {
        success: true,
        user: {
          usrCodigo: user.usrCodigo,
          usrNome: user.usrNome,
          usrLogin: user.usrLogin,
          bancoDeDados: user.bancoDeDados || '',
          isAdmin: user.usrAdministrador === 'S',
          empresa: user.empresa || undefined,
          cnpj: user.cnpj || undefined
        }
      }

    } catch (error) {
      console.error('Erro ao validar credenciais:', error)
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
      // 1. Validar credenciais
      const credentialsResult = await this.validateCredentials(username, password)
      if (!credentialsResult.success || !credentialsResult.user) {
        return credentialsResult
      }

      // 2. Verificar status da base de dados
      const databaseStatus = await this.checkDatabaseStatus(credentialsResult.user.usrCodigo)
      if (!databaseStatus.ready) {
        return {
          success: false,
          error: databaseStatus.error || 'Base de dados não está pronta',
          errorCode: 'DATABASE_NOT_READY'
        }
      }

      // 3. Verificar permissões
      const permissions = await this.checkPermissions(credentialsResult.user.usrCodigo)
      if (!permissions.hasAccess) {
        return {
          success: false,
          error: permissions.error || 'Usuário sem permissões de acesso',
          errorCode: 'NO_PERMISSIONS'
        }
      }

      // Atualizar dados do usuário com permissões
      const userData: UserData = {
        ...credentialsResult.user,
        isAdmin: permissions.isAdmin
      }

      return {
        success: true,
        user: userData
      }

    } catch (error) {
      console.error('Erro na autenticação:', error)
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