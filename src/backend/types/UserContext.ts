/**
 * UserContext - Tipos e interfaces para contexto de usuário
 * 
 * Define as interfaces para gerenciamento de contexto de usuário
 * e roteamento automático de bases de dados
 */

import { PrismaClient } from '@prisma/client'
import mongoose from 'mongoose'

/**
 * Contexto do usuário autenticado
 */
export interface UserContext {
  usrCodigo: string
  usrNome: string
  bancoDeDados: string
  isAdmin: boolean
  isAuthenticated: boolean
}

/**
 * Contexto de base de dados para uma requisição
 */
export interface DatabaseContext {
  userContext: UserContext | null
  sqlConnection: PrismaClient | null
  mongoConnection: mongoose.Connection | null
}

/**
 * Contexto armazenado com metadados
 */
export interface StoredContext {
  requestId: string
  userContext: UserContext
  createdAt: Date
  lastAccessed: Date
  sqlConnection?: PrismaClient
  mongoConnection?: mongoose.Connection
}

/**
 * Métricas de contexto
 */
export interface ContextMetrics {
  activeContexts: number
  totalContextsCreated: number
  averageLifetime: number
  memoryUsage: number
}

/**
 * Tipos de erro de contexto
 */
export type ContextErrorType = 
  | 'CONTEXT_NOT_FOUND'
  | 'DATABASE_UNAVAILABLE'
  | 'CONNECTION_FAILED'
  | 'CONTEXT_CORRUPTED'
  | 'INVALID_DATABASE'
  | 'MULTIPLE_CONTEXTS'
  | 'CONTEXT_LEAK'
  | 'CONTEXT_SWITCH_FAILED'

/**
 * Erro de contexto
 */
export class ContextError extends Error {
  constructor(
    public type: ContextErrorType,
    message: string,
    public requestId?: string,
    public userId?: string,
    public database?: string
  ) {
    super(message)
    this.name = 'ContextError'
  }
}