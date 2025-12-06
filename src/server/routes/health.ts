/**
 * Health Check Routes
 * 
 * Endpoints para verificar status do servidor e conexões
 */

import { Router } from 'express'
import { mongoose } from '../database/mongodb'
// import { prisma } from '../database/prisma'

const router = Router()

// Health check geral
router.get('/', async (_req, res) => {
  try {
    const mongoState = mongoose.connection.readyState
    const mongoStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    }
    
    const health: any = {
      status: mongoState === 1 ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      mongodb: {
        state: mongoStates[mongoState as keyof typeof mongoStates] || 'unknown',
        stateCode: mongoState,
        host: process.env.VITE_DB_HOST,
        database: process.env.VITE_DB_DATABASE || mongoose.connection.db?.databaseName || 'N/A'
      },
      server: {
        uptime: process.uptime(),
        memory: {
          rss: process.memoryUsage().rss,
          heapUsed: process.memoryUsage().heapUsed,
          heapTotal: process.memoryUsage().heapTotal
        },
        nodeVersion: process.version,
        platform: process.platform
      }
    }
    
    // Teste de conectividade real
    if (mongoState === 1 && mongoose.connection.db) {
      try {
        const pingStart = Date.now()
        await mongoose.connection.db.admin().ping()
        const pingDuration = Date.now() - pingStart
        
        health.mongodb.ping = 'success'
        health.mongodb.pingTime = `${pingDuration}ms`
        
        // Contar collections
        const collections = await mongoose.connection.db.listCollections().toArray()
        health.mongodb.collections = collections.length
        
        console.log('✅ Health check: MongoDB OK')
      } catch (error: any) {
        health.mongodb.ping = 'failed'
        health.mongodb.pingError = error.message
        health.status = 'error'
        
        console.error('❌ Health check: MongoDB ping falhou:', error.message)
        console.error('📋 Detalhes:', {
          name: error.name,
          code: error.code,
          timestamp: new Date().toISOString()
        })
      }
    } else {
      console.warn('⚠️ Health check: MongoDB não conectado (state:', mongoState, ')')
      console.warn('   Estados possíveis: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting')
    }
    
    const statusCode = health.status === 'ok' ? 200 : 503
    res.status(statusCode).json(health)
  } catch (error: any) {
    console.error('❌ Erro no health check:', error.message)
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    })
  }
})

// Testar conexão MongoDB
router.get('/mongodb', async (_req, res) => {
  try {
    const mongoState = mongoose.connection.readyState
    const isConnected = mongoState === 1
    
    console.log('🔍 Health check MongoDB detalhado')
    console.log('   Estado:', mongoState, isConnected ? '(conectado)' : '(não conectado)')
    
    if (!isConnected) {
      console.error('❌ MongoDB não está conectado')
      console.error('   ReadyState:', mongoState)
      console.error('   Host:', process.env.VITE_DB_HOST)
      
      return res.status(503).json({
        status: 'error',
        message: 'MongoDB não conectado',
        readyState: mongoState,
        host: process.env.VITE_DB_HOST,
        database: process.env.VITE_DB_DATABASE
      })
    }
    
    if (!mongoose.connection.db) {
      throw new Error('MongoDB database não disponível')
    }
    
    // Testar ping
    const pingStart = Date.now()
    await mongoose.connection.db.admin().ping()
    const pingDuration = Date.now() - pingStart
    
    // Testar query
    const collections = await mongoose.connection.db.listCollections().toArray()
    
    console.log('✅ MongoDB health check OK')
    console.log('   Ping:', `${pingDuration}ms`)
    console.log('   Collections:', collections.length)
    
    res.json({
      status: 'ok',
      database: mongoose.connection.db.databaseName,
      host: process.env.VITE_DB_HOST,
      ping: `${pingDuration}ms`,
      collections: collections.length,
      collectionNames: collections.map(c => c.name)
    })
  } catch (error: any) {
    console.error('❌ Erro no health check MongoDB:', error.message)
    console.error('📋 Detalhes:', {
      name: error.name,
      code: error.code,
      timestamp: new Date().toISOString()
    })
    
    res.status(500).json({
      status: 'error',
      message: error.message,
      errorType: error.name,
      errorCode: error.code
    })
  }
})

// Testar conexão Prisma
router.get('/prisma', async (_req, res) => {
  res.status(503).json({
    status: 'disabled',
    message: 'Prisma temporariamente desabilitado'
  })
})

export default router
