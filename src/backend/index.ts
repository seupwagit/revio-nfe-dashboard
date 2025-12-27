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
import mongoose from 'mongoose'
import { fileURLToPath } from 'url'
import { connectMongoDB, disconnectMongoDB } from './database/mongodb'
import { connectPrisma, disconnectPrisma, getPrismaClient } from './database/prisma'
import { resilienceInitializer } from './services/ResilienceInitializer'

// Obter __dirname em módulos ES
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import analyticsRoutes from './routes/analytics'
import documentsRoutes from './routes/documents'
import healthRoutes from './routes/health'
import authRoutes from './routes/auth'
import downloadsRoutes from './routes/downloads'
import resilienceRoutes from './routes/resilience'
import ErrorHandler from './middleware/ErrorHandler'
import { userContextMiddleware, UserContextMiddleware } from './middleware/UserContextMiddleware'

// Carregar variáveis de ambiente
dotenv.config()

const app = express()

// Middleware de logging de requisições
app.use((req, res, next) => {
  const start = Date.now()
  const timestamp = new Date().toISOString()
  
  // Logs com prefixo [API] para facilitar busca no Coolify
  console.log(`[API] 📥 ${timestamp} ${req.method} ${req.path}`)
  if (Object.keys(req.query).length > 0) {
    console.log(`[API]    📋 Query:`, JSON.stringify(req.query))
  }
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`[API]    📦 Body:`, JSON.stringify(req.body))
  }
  
  // Interceptar resposta para logar resultado
  const originalSend = res.send
  res.send = function(data: any) {
    const duration = Date.now() - start
    const status = res.statusCode
    const statusIcon = status >= 400 ? '❌' : status >= 300 ? '⚠️' : '✅'
    
    console.log(`[API] 📤 ${statusIcon} ${req.method} ${req.path} - ${status} (${duration}ms)`)
    
    if (status >= 400) {
      try {
        const errorData = typeof data === 'string' ? JSON.parse(data) : data
        console.error(`[API] ❌ 🔍 Erro:`, errorData.error || errorData.message)
        if (errorData.errorType) {
          console.error(`[API] ❌    📋 Tipo:`, errorData.errorType)
        }
        if (errorData.errorCode) {
          console.error(`[API] ❌    🔢 Código:`, errorData.errorCode)
        }
      } catch (e) {
        console.error(`[API] ❌ 🔍 Erro:`, data)
      }
    }
    
    return originalSend.call(this, data)
  }
  
  next()
})

// Middlewares CORS e JSON
// Configuração dinâmica de CORS baseada em variáveis de ambiente
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:5173',
  'https://nf-dashboard-homologacao.sistemasflow.com.br'
]

// Adicionar origem do Coolify se definida
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL)
}

// Adicionar origem personalizada se definida
if (process.env.CORS_ORIGIN) {
  allowedOrigins.push(process.env.CORS_ORIGIN)
}

console.log('[CORS] Origens permitidas:', allowedOrigins)

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}))
app.use(express.json())

// ============================================
// IMPORTANTE: Rotas da API DEVEM vir ANTES dos arquivos estáticos
// ============================================

// Middleware para garantir Content-Type JSON em todas as rotas /api/*
app.use('/api/*', (_req, res, next) => {
  res.setHeader('Content-Type', 'application/json')
  next()
})

// Endpoint de debug de variáveis de ambiente
app.get('/api/debug/env', (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.json({
    VITE_DB_HOST: process.env.VITE_DB_HOST || 'NÃO DEFINIDO',
    VITE_DB_DATABASE: process.env.VITE_DB_DATABASE || 'NÃO DEFINIDO',
    VITE_MONGODB_CONNECTION_STRING: process.env.VITE_MONGODB_CONNECTION_STRING ? 'DEFINIDO' : 'NÃO DEFINIDO',
    BACKOFFICE_PORT: process.env.BACKOFFICE_PORT || '3000',
    NODE_ENV: process.env.NODE_ENV || 'development'
  })
})

// Endpoint de debug de conexões de banco
app.get('/api/debug/database', async (_req, res) => {
  res.setHeader('Content-Type', 'application/json')
  
  const debug = {
    timestamp: new Date().toISOString(),
    environment: {
      DATABASE_URL: process.env.DATABASE_URL ? 'DEFINIDO' : 'NÃO DEFINIDO',
      VITE_DB_SERVER: process.env.VITE_DB_SERVER || 'NÃO DEFINIDO',
      VITE_DB_USER: process.env.VITE_DB_USER || 'NÃO DEFINIDO',
      VITE_DB_PASSWORD: process.env.VITE_DB_PASSWORD ? 'DEFINIDO' : 'NÃO DEFINIDO',
      VITE_MONGODB_CONNECTION_STRING: process.env.VITE_MONGODB_CONNECTION_STRING ? 'DEFINIDO' : 'NÃO DEFINIDO'
    },
    connections: {
      prisma: null as any,
      mongodb: null as any
    }
  }
  
  // Testar conexão Prisma
  try {
    const prismaClient = getPrismaClient()
    if (prismaClient) {
      await prismaClient.$queryRaw`SELECT 1 as test`
      debug.connections.prisma = { status: 'CONECTADO', error: null }
    } else {
      debug.connections.prisma = { status: 'NÃO INICIALIZADO', error: 'Cliente Prisma não disponível' }
    }
  } catch (error) {
    debug.connections.prisma = { 
      status: 'ERRO', 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
  
  // Testar conexão MongoDB
  try {
    if (mongoose.connection.readyState === 1) {
      if (mongoose.connection.db) {
        await mongoose.connection.db.admin().ping()
        debug.connections.mongodb = { status: 'CONECTADO', error: null }
      } else {
        debug.connections.mongodb = { status: 'ERRO', error: 'Database object não disponível' }
      }
    } else {
      debug.connections.mongodb = { 
        status: 'DESCONECTADO', 
        error: `ReadyState: ${mongoose.connection.readyState}` 
      }
    }
  } catch (error) {
    debug.connections.mongodb = { 
      status: 'ERRO', 
      error: error instanceof Error ? error.message : String(error) 
    }
  }
  
  res.json(debug)
})

// Endpoint de debug de autenticação
app.post('/api/debug/auth', async (req, res) => {
  res.setHeader('Content-Type', 'application/json')
  
  const { username, password } = req.body
  
  if (!username || !password) {
    return res.status(400).json({
      error: 'Username e password são obrigatórios para teste'
    })
  }
  
  const debug = {
    timestamp: new Date().toISOString(),
    input: {
      username,
      passwordProvided: !!password
    },
    steps: [] as any[]
  }
  
  try {
    // Testar conexão Prisma
    debug.steps.push({ step: 'prisma_connection', status: 'iniciando' })
    const prismaClient = getPrismaClient()
    
    if (!prismaClient) {
      debug.steps.push({ step: 'prisma_connection', status: 'erro', error: 'Cliente não disponível' })
      return res.json(debug)
    }
    
    debug.steps.push({ step: 'prisma_connection', status: 'sucesso' })
    
    // Testar busca de usuário
    debug.steps.push({ step: 'user_lookup', status: 'iniciando' })
    const user = await prismaClient.frUsuario.findUnique({
      where: { usrLogin: username }
    })
    
    if (!user) {
      debug.steps.push({ step: 'user_lookup', status: 'não_encontrado' })
      return res.json(debug)
    }
    
    debug.steps.push({ 
      step: 'user_lookup', 
      status: 'encontrado',
      data: {
        usrCodigo: user.usrCodigo,
        usrNome: user.usrNome,
        ativo: user.ativo,
        hasSenha: !!user.usrSenha
      }
    })
    
    // Testar validação de senha
    debug.steps.push({ step: 'password_validation', status: 'iniciando' })
    const authService = (await import('./services/AuthService')).authService
    const expectedHash = (authService as any).generatePasswordHash(user.usrCodigo, password)
    
    debug.steps.push({ 
      step: 'password_validation', 
      status: user.usrSenha === expectedHash ? 'sucesso' : 'falha',
      data: {
        expectedHashLength: expectedHash.length,
        storedHashLength: user.usrSenha?.length || 0,
        match: user.usrSenha === expectedHash
      }
    })
    
  } catch (error) {
    debug.steps.push({ 
      step: 'erro_geral', 
      status: 'erro', 
      error: error instanceof Error ? error.message : String(error) 
    })
  }
  
  res.json(debug)
})

// Rotas da API (DEVEM vir ANTES do express.static)
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)

// Rotas protegidas com UserContextMiddleware para roteamento automático
app.use('/api/downloads', userContextMiddleware, downloadsRoutes)
app.use('/api/analytics', userContextMiddleware, analyticsRoutes)
app.use('/api/documents', userContextMiddleware, documentsRoutes)
app.use('/api/resilience', userContextMiddleware, resilienceRoutes)

// ============================================
// Servir arquivos estáticos do frontend (DEPOIS das rotas da API)
// ============================================
if (process.env.SERVE_FRONTEND === 'true') {
  const distPath = path.join(__dirname, '../../dist')
  
  console.log('📁 Servindo frontend estático de:', distPath)
  app.use(express.static(distPath))
}

// SPA fallback - todas as rotas não-API retornam index.html (deve vir por último)
if (process.env.SERVE_FRONTEND === 'true') {
  app.get('*', (_req, res) => {
    const distPath = path.join(__dirname, '../../dist')
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

// Middleware de tratamento de erros (deve vir por último)
app.use(ErrorHandler.notFound)
app.use(UserContextMiddleware.handleContextError)
app.use(ErrorHandler.handleError)

// Porta
const PORT = process.env.BACKOFFICE_PORT || 3000

// Iniciar servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando Backoffice Server...')
    console.log('')
    
    // Conectar ao MongoDB
    await connectMongoDB()
    
    // Conectar ao Prisma (SQL Server) - opcional para testes
    try {
      await connectPrisma()
      console.log('✅ Prisma conectado com sucesso')
    } catch (error) {
      console.warn('⚠️  Prisma não conectado - funcionalidades de download não estarão disponíveis')
      console.warn('   Erro:', error instanceof Error ? error.message : error)
    }
    
    // Inicializar sistema de resilência
    try {
      await resilienceInitializer.initialize()
      console.log('✅ Sistema de resilência inicializado')
    } catch (error) {
      console.warn('⚠️  Sistema de resilência não inicializado completamente')
      console.warn('   Erro:', error instanceof Error ? error.message : error)
    }
    
    // Iniciar servidor HTTP
    app.listen(PORT, () => {
      console.log('')
      console.log('✅ Backoffice Server rodando!')
      console.log(`   URL: http://localhost:${PORT}`)
      console.log(`   Health: http://localhost:${PORT}/api/health`)
      console.log(`   Auth: http://localhost:${PORT}/api/auth`)
      console.log(`   Downloads: http://localhost:${PORT}/api/downloads`)
      console.log(`   Analytics: http://localhost:${PORT}/api/analytics`)
      console.log(`   Documents: http://localhost:${PORT}/api/documents`)
      console.log(`   Resilience: http://localhost:${PORT}/api/resilience`)
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
  await disconnectPrisma()
  
  console.log('✅ Servidor encerrado com sucesso')
  process.exit(0)
})

process.on('SIGTERM', async () => {
  await disconnectMongoDB()
  await disconnectPrisma()
  process.exit(0)
})

// Iniciar
startServer()
