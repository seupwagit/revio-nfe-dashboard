/**
 * Prisma Connection (SQL Server)
 * 
 * Gerencia conexão com SQL Server usando Prisma
 * Usado para configurações e metadados
 */

// import { PrismaClient } from '@prisma/client'

let prisma: any = null

export async function connectPrisma(): Promise<void> {
  console.warn('⚠️  Prisma desabilitado - usando apenas MongoDB')
  prisma = null
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

export function getPrismaClient(): any {
  return prisma
}

export { prisma }
