/**
 * Backoffice Server
 * 
 * Servidor Node.js que conecta ao MongoDB (Mongoose) e SQL Server (Prisma)
 * Expõe APIs REST para o frontend
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { connectMongoDB, disconnectMongoDB } from './database/mongodb'
// import { connectPrisma, disconnectPrisma } from './database/prisma'
import analyticsRoutes from './routes/analytics'
import documentsRoutes from './routes/documents'
import healthRoutes from './routes/health'

// Carregar variáveis de ambiente
dotenv.config()

const app = express()

// Middlewares
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:5173',
    'https://nf-dashboard-homologacao.sistemasflow.com.br'
  ],
  credentials: true
}))
app.use(express.json())

// Rotas
app.use('/api/health', healthRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/documents', documentsRoutes)

// Porta
const PORT = process.env.BACKOFFICE_PORT || 3001

// Iniciar servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando Backoffice Server...')
    console.log('')
    
    // Conectar ao MongoDB
    await connectMongoDB()
    
    // Conectar ao Prisma (SQL Server) - DESABILITADO TEMPORARIAMENTE
    // await connectPrisma()
    
    // Iniciar servidor HTTP
    app.listen(PORT, () => {
      console.log('')
      console.log('✅ Backoffice Server rodando!')
      console.log(`   URL: http://localhost:${PORT}`)
      console.log(`   Health: http://localhost:${PORT}/api/health`)
      console.log(`   Analytics: http://localhost:${PORT}/api/analytics`)
      console.log(`   Documents: http://localhost:${PORT}/api/documents`)
      console.log('')
    })
    
  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n⏹️  Encerrando Backoffice Server...')
  
  await disconnectMongoDB()
  // await disconnectPrisma()
  
  console.log('✅ Servidor encerrado com sucesso')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await disconnectMongoDB()
  // await disconnectPrisma()
  process.exit(0)
})

// Iniciar
startServer()
