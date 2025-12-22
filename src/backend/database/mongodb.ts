/**
 * MongoDB Connection (Mongoose)
 * 
 * Gerencia conexão com MongoDB usando Mongoose
 * Usa VITE_MONGODB_CONNECTION_STRING do .env
 */

import mongoose from 'mongoose'

export async function connectMongoDB(): Promise<void> {
  try {
    console.log('[MONGODB] 📊 Conectando ao MongoDB (Mongoose)...')
    console.log('[MONGODB]    Timestamp:', new Date().toISOString())
    
    const MONGODB_URI = process.env.VITE_MONGODB_CONNECTION_STRING?.trim()
    const DB_NAME = process.env.VITE_DB_DATABASE?.trim()
    const DB_HOST = process.env.VITE_DB_HOST?.trim()
    
    if (!MONGODB_URI || MONGODB_URI.length === 0) {
      console.error('❌ ERRO CRÍTICO: VITE_MONGODB_CONNECTION_STRING não configurado')
      console.error('📋 Variáveis de ambiente disponíveis:')
      console.error('   VITE_DB_HOST:', DB_HOST || '❌ NÃO DEFINIDO')
      console.error('   VITE_DB_DATABASE:', DB_NAME || '❌ NÃO DEFINIDO')
      console.error('   VITE_MONGODB_CONNECTION_STRING:', MONGODB_URI ? '✅ DEFINIDO' : '❌ NÃO DEFINIDO')
      throw new Error('VITE_MONGODB_CONNECTION_STRING não configurado no .env')
    }
    
    // Ocultar senha no log
    const uriSafe = MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@')
    console.log('   URI:', uriSafe)
    console.log('   Database:', DB_NAME)
    console.log('   Host:', DB_HOST)
    
    // Conectar com Mongoose
    console.log('🔌 Tentando estabelecer conexão...')
    const startTime = Date.now()
    
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    })
    
    const endTime = Date.now()
    const connectionTime = endTime - startTime
    
    console.log('[MONGODB] ✅ MongoDB conectado com sucesso!')
    console.log('[MONGODB]    Status:', mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado')
    console.log('[MONGODB]    Tempo de conexão:', `${connectionTime}ms`)
    console.log('[MONGODB]    ReadyState:', mongoose.connection.readyState)
    
    // Listar collections
    if (mongoose.connection.db) {
      const collections = await mongoose.connection.db.listCollections().toArray()
      console.log(`[MONGODB]    Collections: ${collections.length} encontradas`)
      collections.forEach(col => {
        console.log(`[MONGODB]      - ${col.name}`)
      })
    }
    
    // Configurar event listeners para monitorar conexão
    setupConnectionMonitoring()
    
  } catch (error: any) {
    console.error('[MONGODB] ❌ ERRO CRÍTICO: Falha ao conectar MongoDB')
    console.error('[MONGODB]    Timestamp:', new Date().toISOString())
    console.error('[MONGODB] 📋 Detalhes do erro de conexão:', {
      name: error.name,
      code: error.code,
      codeName: error.codeName,
      message: error.message
    })
    
    // Diagnóstico detalhado por tipo de erro
    if (error.name === 'MongoNetworkError' || error.code === 'ECONNREFUSED') {
      console.error('🔌 ERRO DE REDE:')
      console.error('   ❌ MongoDB não está acessível')
      console.error('   📍 Host configurado:', process.env.VITE_DB_HOST || 'NÃO DEFINIDO')
      console.error('   🔍 Verificações necessárias:')
      console.error('      1. MongoDB está rodando?')
      console.error('      2. Host/IP está correto?')
      console.error('      3. Porta 27017 está aberta?')
      console.error('      4. Firewall permite conexão?')
      console.error('      5. Rede entre containers funciona?')
    } else if (error.name === 'MongoServerSelectionError') {
      console.error('🎯 ERRO DE SELEÇÃO DE SERVIDOR:')
      console.error('   ❌ Não foi possível encontrar servidor MongoDB')
      console.error('   📍 Connection String:', process.env.VITE_MONGODB_CONNECTION_STRING?.replace(/\/\/.*:.*@/, '//***:***@'))
      console.error('   🔍 Possíveis causas:')
      console.error('      1. Host incorreto na connection string')
      console.error('      2. MongoDB não está rodando')
      console.error('      3. Porta incorreta (padrão: 27017)')
      console.error('      4. Timeout de conexão')
    } else if (error.name === 'MongoServerError' && error.code === 18) {
      console.error('🔐 ERRO DE AUTENTICAÇÃO:')
      console.error('   ❌ Credenciais inválidas')
      console.error('   👤 Usuário/senha incorretos')
      console.error('   🔍 Verificações necessárias:')
      console.error('      1. Usuário existe no MongoDB?')
      console.error('      2. Senha está correta?')
      console.error('      3. authSource está correto?')
      console.error('      4. Usuário tem permissão no database?')
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🌐 ERRO DE DNS:')
      console.error('   ❌ Host não foi encontrado')
      console.error('   📍 Host:', process.env.VITE_DB_HOST)
      console.error('   🔍 Verificações:')
      console.error('      1. Host/IP está correto?')
      console.error('      2. DNS resolve o hostname?')
      console.error('      3. Usar IP em vez de hostname?')
    } else if (error.message.includes('ETIMEDOUT')) {
      console.error('⏱️ TIMEOUT DE CONEXÃO:')
      console.error('   ❌ Tempo limite excedido')
      console.error('   🔍 Verificações:')
      console.error('      1. MongoDB está respondendo?')
      console.error('      2. Rede está lenta?')
      console.error('      3. Firewall bloqueando?')
    }
    
    console.error('🔧 VARIÁVEIS DE AMBIENTE:')
    console.error('   VITE_DB_HOST:', process.env.VITE_DB_HOST || '❌ NÃO DEFINIDO')
    console.error('   VITE_DB_DATABASE:', process.env.VITE_DB_DATABASE || '❌ NÃO DEFINIDO')
    console.error('   VITE_MONGODB_CONNECTION_STRING:', process.env.VITE_MONGODB_CONNECTION_STRING ? '✅ DEFINIDO' : '❌ NÃO DEFINIDO')
    
    console.error('💡 PRÓXIMOS PASSOS:')
    console.error('   1. Verifique se MongoDB está rodando')
    console.error('   2. Teste conectividade: ping', process.env.VITE_DB_HOST)
    console.error('   3. Verifique variáveis de ambiente no Coolify')
    console.error('   4. Consulte logs do MongoDB')
    
    throw error
  }
}

// Monitorar eventos de conexão
function setupConnectionMonitoring() {
  mongoose.connection.on('connected', () => {
    console.log('🔗 Mongoose conectado ao MongoDB')
    console.log('   📊 Estado da conexão: CONECTADO')
    console.log('   🕐 Timestamp:', new Date().toISOString())
  })

  mongoose.connection.on('error', (err) => {
    console.error('❌ ERRO na conexão Mongoose:', err.message)
    console.error('📋 Detalhes do erro de conexão:', {
      name: err.name,
      code: err.code,
      timestamp: new Date().toISOString()
    })
    
    if (err.name === 'MongoNetworkError') {
      console.error('🔌 Erro de rede detectado:')
      console.error('   - Conexão com MongoDB foi perdida')
      console.error('   - Mongoose tentará reconectar automaticamente')
      console.error('   - Verifique estabilidade da rede')
    }
  })

  mongoose.connection.on('disconnected', () => {
    console.log('🔌 Mongoose desconectado do MongoDB')
    console.log('   📊 Estado da conexão: DESCONECTADO')
    console.log('   🕐 Timestamp:', new Date().toISOString())
    console.log('   🔄 Mongoose tentará reconectar automaticamente')
  })

  mongoose.connection.on('reconnected', () => {
    console.log('🔄 Mongoose reconectado ao MongoDB')
    console.log('   📊 Estado da conexão: RECONECTADO')
    console.log('   🕐 Timestamp:', new Date().toISOString())
  })

  mongoose.connection.on('close', () => {
    console.log('🚪 Conexão MongoDB fechada')
    console.log('   📊 Estado da conexão: FECHADO')
    console.log('   🕐 Timestamp:', new Date().toISOString())
  })
}

export async function disconnectMongoDB(): Promise<void> {
  try {
    await mongoose.disconnect()
    console.log('✅ MongoDB desconectado')
  } catch (error) {
    console.error('❌ Erro ao desconectar MongoDB:', error)
  }
}

export function getMongoConnection() {
  return mongoose.connection
}

export { mongoose }
