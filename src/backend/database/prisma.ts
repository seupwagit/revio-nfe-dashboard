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
    console.log('[Prisma] 🔗 Iniciando conexão com SQL Server...')
    console.log('[Prisma]    DATABASE_URL definida:', !!process.env.DATABASE_URL)
    
    if (process.env.DATABASE_URL) {
      // Mascarar senha na URL para log
      const maskedUrl = process.env.DATABASE_URL.replace(/password=([^;]+)/, 'password=***')
      console.log('[Prisma]    URL (mascarada):', maskedUrl)
    }
    
    if (!prisma) {
      console.log('[Prisma] 🏗️ Criando nova instância do PrismaClient...')
      
      // Para Prisma 7, usar adapter ou configuração específica
      prisma = new PrismaClient({
        log: ['error', 'warn'],
        errorFormat: 'pretty'
      })
      
      console.log('[Prisma] 🔌 Testando conexão...')
      
      // Testar conexão
      await prisma.$connect()
      
      console.log('[Prisma] ✅ SQL Server conectado via Prisma')
      
      // Teste adicional - executar query simples
      try {
        await prisma.$queryRaw`SELECT 1 as test`
        console.log('[Prisma] ✅ Query de teste executada com sucesso')
      } catch (queryError) {
        console.warn('[Prisma] ⚠️ Query de teste falhou:', queryError)
      }
      
    } else {
      console.log('[Prisma] ♻️ Reutilizando conexão existente')
    }
  } catch (error) {
    console.error('[Prisma] ❌ Erro ao conectar SQL Server:', error)
    console.error('[Prisma]    Tipo do erro:', error instanceof Error ? error.constructor.name : typeof error)
    console.error('[Prisma]    Mensagem:', error instanceof Error ? error.message : String(error))
    console.error('[Prisma]    Stack:', error instanceof Error ? error.stack : 'N/A')
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
  console.log('[Prisma] 🔍 Solicitação de cliente Prisma...')
  console.log('[Prisma]    Cliente disponível:', !!prisma)
  
  if (!prisma) {
    console.warn('[Prisma] ⚠️ Cliente Prisma não inicializado')
  }
  
  return prisma
}

export { prisma }
