/**
 * TokenManager - Gerenciador de Tokens JWT
 * 
 * Responsável por gerar e validar tokens JWT para autenticação
 */

import jwt from 'jsonwebtoken'
import { UserData } from './AuthService'

export interface TokenPayload {
  usrCodigo: string
  usrNome: string
  usrLogin: string
  bancoDeDados: string
  isAdmin: boolean
  empresa?: string
  cnpj?: string
  iat: number
  exp: number
}

export interface TokenValidationResult {
  valid: boolean
  payload?: TokenPayload
  error?: string
  errorCode?: string
}

export class TokenManager {
  private readonly secretKey: string
  private readonly expiresIn: string

  constructor() {
    // Usar chave secreta do ambiente ou uma padrão para desenvolvimento
    this.secretKey = process.env.JWT_SECRET || 'revio-auth-secret-key-2024'
    this.expiresIn = process.env.JWT_EXPIRES_IN || '24h'
  }

  /**
   * Gera token JWT com dados do usuário
   */
  generateToken(user: UserData): string {
    try {
      const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
        usrCodigo: user.usrCodigo,
        usrNome: user.usrNome,
        usrLogin: user.usrLogin,
        bancoDeDados: user.bancoDeDados,
        isAdmin: user.isAdmin,
        empresa: user.empresa,
        cnpj: user.cnpj
      }

      const token = jwt.sign(
        payload, 
        this.secretKey,
        {
          expiresIn: this.expiresIn,
          issuer: 'revio-auth',
          audience: 'revio-app'
        } as jwt.SignOptions
      )

      return token

    } catch (error) {
      console.error('Erro ao gerar token:', error)
      throw new Error('Erro ao gerar token de autenticação')
    }
  }

  /**
   * Valida token JWT e retorna payload
   */
  validateToken(token: string): TokenValidationResult {
    try {
      // Remover prefixo "Bearer " se presente
      const cleanToken = token.replace(/^Bearer\s+/, '')

      const payload = jwt.verify(cleanToken, this.secretKey, {
        issuer: 'revio-auth',
        audience: 'revio-app'
      }) as TokenPayload

      return {
        valid: true,
        payload
      }

    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return {
          valid: false,
          error: 'Token expirado',
          errorCode: 'TOKEN_EXPIRED'
        }
      }

      if (error instanceof jwt.JsonWebTokenError) {
        return {
          valid: false,
          error: 'Token inválido',
          errorCode: 'INVALID_TOKEN'
        }
      }

      console.error('Erro ao validar token:', error)
      return {
        valid: false,
        error: 'Erro ao validar token',
        errorCode: 'VALIDATION_ERROR'
      }
    }
  }

  /**
   * Extrai payload do token sem validar (para debug)
   */
  decodeToken(token: string): any {
    try {
      const cleanToken = token.replace(/^Bearer\s+/, '')
      return jwt.decode(cleanToken)
    } catch (error) {
      console.error('Erro ao decodificar token:', error)
      return null
    }
  }

  /**
   * Verifica se token está próximo do vencimento (menos de 1 hora)
   */
  isTokenNearExpiry(token: string): boolean {
    try {
      const payload = this.decodeToken(token) as TokenPayload
      if (!payload || !payload.exp) {
        return true
      }

      const currentTime = Math.floor(Date.now() / 1000)
      const timeUntilExpiry = payload.exp - currentTime
      
      // Retorna true se restam menos de 1 hora (3600 segundos)
      return timeUntilExpiry < 3600

    } catch (error) {
      return true
    }
  }

  /**
   * Renova token se estiver próximo do vencimento
   */
  refreshTokenIfNeeded(token: string): string | null {
    try {
      const validation = this.validateToken(token)
      if (!validation.valid || !validation.payload) {
        return null
      }

      if (this.isTokenNearExpiry(token)) {
        const userData: UserData = {
          usrCodigo: validation.payload.usrCodigo,
          usrNome: validation.payload.usrNome,
          usrLogin: validation.payload.usrLogin,
          bancoDeDados: validation.payload.bancoDeDados,
          isAdmin: validation.payload.isAdmin,
          empresa: validation.payload.empresa,
          cnpj: validation.payload.cnpj
        }

        return this.generateToken(userData)
      }

      return null

    } catch (error) {
      console.error('Erro ao renovar token:', error)
      return null
    }
  }
}

// Singleton instance
export const tokenManager = new TokenManager()