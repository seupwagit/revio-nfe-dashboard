/**
 * MongoDB Connection (Mongoose)
 * 
 * Gerencia conexão com MongoDB usando Mongoose
 * Usa VITE_MONGODB_CONNECTION_STRING do .env
 */

import mongoose from 'mongoose'

export async function connectMongoDB(): Promise<void> {
  try {
    console.log('📊 Conectando ao MongoDB (Mongoose)...')
    
    const MONGODB_URI = process.env.VITE_MONGODB_CONNECTION_STRING?.trim()
    const DB_NAME = process.env.VITE_DB_DATABASE?.trim()
    
    if (!MONGODB_URI || MONGODB_URI.length === 0) {
      throw new Error('VITE_MONGODB_CONNECTION_STRING não configurado no .env')
    }
    
    // Ocultar senha no log
    const uriSafe = MONGODB_URI.replace(/\/\/.*:.*@/, '//***:***@')
    console.log('   URI:', uriSafe)
    console.log('   Database:', DB_NAME)
    
    // Conectar com Mongoose
    await mongoose.connect(MONGODB_URI, {
      dbName: DB_NAME,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    })
    
    console.log('✅ MongoDB conectado com sucesso!')
    console.log('   Status:', mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado')
    
    // Listar collections
    const collections = await mongoose.connection.db.listCollections().toArray()
    console.log(`   Collections: ${collections.length} encontradas`)
    
  } catch (error: any) {
    console.error('❌ Erro ao conectar MongoDB:', error.message)
    
    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 MongoDB não está acessível. Verifique:')
      console.error('   1. MongoDB está rodando?')
      console.error('   2. Firewall liberado?')
      console.error('   3. IP/Porta corretos?')
    } else if (error.message.includes('Authentication failed')) {
      console.error('💡 Credenciais incorretas. Verifique:')
      console.error('   1. Usuário e senha no .env')
      console.error('   2. authSource correto')
    }
    
    throw error
  }
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
