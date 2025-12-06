/**
 * Backoffice Server
 * 
 * Servidor Node.js que conecta ao MongoDB (Mongoose) e SQL Server (Prisma)
 * Expõe APIs REST para o frontend
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { connectMongoDB, disconnectMongoDB } from './database/mongodb'

// Obter __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// import { connectPrisma, disconnectPrisma } from './database/prisma'
import analyticsRoutes from './routes/analytics'
import documentsRoutes from './routes/documents'
import healthRoutes from './routes/health'

// Carregar variáveis de ambiente
dotenv.config()

const app = express()

// Middleware de logging de requisições
app.use((req, res, next) => {
  const start = Date.now()
  const timestamp = new Date().toISOString()
  
  console.log(`📥 ${timestamp} ${req.method} ${req.path}`)
  if (Object.keys(req.query).length > 0) {
    console.log('   📋 Query:', JSON.stringify(req.query))
  }
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('   📦 Body:', JSON.stringify(req.body))
  }
  
  // Interceptar resposta para logar resultado
  const originalSend = res.send
  res.send = function(data: any) {
    const duration = Date.now() - start
    const status = res.statusCode
    const statusIcon = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅'
    
    console.log(`📤 ${statusIcon} ${req.method} ${req.path} - ${status} (${duration}ms)`)
    
    if (status >= 400) {
      try {
        const errorData = typeof data === 'string' ? JSON.parse(data) : data
        console.error('   🔍 Erro:', errorData.error || errorData.message)
        if (errorData.errorType) {
          console.error('   📋 Tipo:', errorData.errorType)
        }
        if (errorData.errorCode) {
          console.error('   🔢 Código:', errorData.errorCode)
        }
      } catch (e) {
        console.error('   🔍 Erro:', data)
      }
    }
    
    return originalSend.call(this, data)
  }
  
  next()
})

// Middlewares CORS e JSON
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

// Servir arquivos estáticos do frontend (quando em modo fullstack)
if (process.env.SERVE_FRONTEND === 'true') {
  const distPath = path.join(__dirname, '../../dist')
  
  console.log('📁 Servindo frontend estático de:', distPath)
  app.use(express.static(distPath))
}

// Endpoint de debug de variáveis de ambiente
app.get('/api/debug/env', (_req, res) => {
  res.json({
    VITE_DB_HOST: process.env.VITE_DB_HOST || 'NÃO DEFINIDO',
    VITE_DB_DATABASE: process.env.VITE_DB_DATABASE || 'NÃO DEFINIDO',
    VITE_MONGODB_CONNECTION_STRING: process.env.VITE_MONGODB_CONNECTION_STRING ? 'DEFINIDO' : 'NÃO DEFINIDO',
    BACKOFFICE_PORT: process.env.BACKOFFICE_PORT || '3000',
    NODE_ENV: process.env.NODE_ENV || 'development'
  })
})

// Rotas da API
app.use('/api/health', healthRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api/documents', documentsRoutes)

// SPA fallback - todas as rotas não-API retornam index.html (deve vir por último)
if (process.env.SERVE_FRONTEND === 'true') {
  app.get('*', (_req, res) => {
    const distPath = path.join(__dirname, '../../dist')
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// Porta
const PORT = process.env.BACKOFFICE_PORT || 3000

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
