/**
 * Prisma Connection (SQL Server)
 * 
 * Gerencia conexão com SQL Server usando Prisma
 * Usado para configurações e metadados
 */

import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient | null = null

export async function connectPrisma(): Promise<void> {
  try {
    console.log('🗄️  Conectando ao SQL Server (Prisma)...')
    
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️  DATABASE_URL não configurado - Prisma desabilitado')
      return
    }
    
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    })
    
    // Testar conexão
    await prisma.$connect()
    
    console.log('✅ SQL Server conectado com sucesso!')
    
  } catch (error: any) {
    console.error('❌ Erro ao conectar SQL Server:', error.message)
    console.warn('⚠️  Continuando sem Prisma (apenas MongoDB)')
    prisma = null
  }
}

export async function disconnectPrisma(): Promise<void> {
  try {
    if (prisma) {
      await prisma.$disconnect()
      console.log('✅ SQL Server desconectado')
    }
  } catch (error) {
    console.error('❌ Erro ao desconectar SQL Server:', error)
  }
}

export function getPrismaClient(): PrismaClient | null {
  return prisma
}

export { prisma }
