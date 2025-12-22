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
    if (!prisma) {
      // Para Prisma 7, usar adapter ou configuração específica
      prisma = new PrismaClient({
        log: ['error', 'warn'],
        errorFormat: 'pretty'
      })
      
      // Testar conexão
      await prisma.$connect()
      console.log('✅ SQL Server conectado via Prisma')
    }
  } catch (error) {
    console.error('❌ Erro ao conectar SQL Server:', error)
    throw error
  }
}

export async function disconnectPrisma(): Promise<void> {
  try {
    if (prisma) {
      await prisma.$disconnect()
      prisma = null
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
