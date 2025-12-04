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
router.get('/', async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    const prismaStatus = 'disabled' // prisma ? 'connected' : 'not_configured'
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      databases: {
        mongodb: {
          status: mongoStatus,
          database: mongoose.connection.db?.databaseName || 'N/A'
        },
        sqlserver: {
          status: prismaStatus
        }
      },
      environment: {
        nodeVersion: process.version,
        platform: process.platform
      }
    })
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

// Testar conexão MongoDB
router.get('/mongodb', async (req, res) => {
  try {
    const isConnected = mongoose.connection.readyState === 1
    
    if (!isConnected) {
      return res.status(503).json({
        status: 'error',
        message: 'MongoDB não conectado'
      })
    }
    
    // Testar query
    const collections = await mongoose.connection.db.listCollections().toArray()
    
    res.json({
      status: 'ok',
      database: mongoose.connection.db.databaseName,
      collections: collections.length,
      collectionNames: collections.map(c => c.name).slice(0, 10)
    })
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    })
  }
})

// Testar conexão Prisma
router.get('/prisma', async (req, res) => {
  res.status(503).json({
    status: 'disabled',
    message: 'Prisma temporariamente desabilitado'
  })
})

export default router
