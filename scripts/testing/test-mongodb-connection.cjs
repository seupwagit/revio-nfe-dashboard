/**
 * Teste de Conexão MongoDB
 * Testa diferentes configurações para encontrar o problema
 */

const { MongoClient } = require('mongodb')
require('dotenv').config()

const MONGODB_URI = process.env.VITE_MONGODB_CONNECTION_STRING
const DB_NAME = process.env.VITE_DB_DATABASE

console.log('🔍 TESTE DE CONEXÃO MONGODB')
console.log('=' .repeat(60))
console.log('')

// Teste 1: Verificar variáveis de ambiente
console.log('📋 TESTE 1: Variáveis de Ambiente')
console.log('-'.repeat(60))
console.log('VITE_MONGODB_CONNECTION_STRING:', MONGODB_URI ? '✅ Configurado' : '❌ NÃO configurado')
console.log('VITE_DB_DATABASE:', DB_NAME ? '✅ Configurado' : '❌ NÃO configurado')
console.log('')

if (!MONGODB_URI) {
  console.error('❌ ERRO: VITE_MONGODB_CONNECTION_STRING não está configurado no .env')
  process.exit(1)
}

// Teste 2: Parse da connection string
console.log('🔗 TESTE 2: Parse da Connection String')
console.log('-'.repeat(60))
try {
  const url = new URL(MONGODB_URI.replace('mongodb://', 'http://'))
  console.log('Host:', url.hostname)
  console.log('Porta:', url.port || '27017')
  console.log('Username:', url.username || 'não especificado')
  console.log('Password:', url.password ? '***' : 'não especificado')
  
  const params = new URLSearchParams(url.search)
  console.log('authMechanism:', params.get('authMechanism') || 'padrão')
  console.log('authSource:', params.get('authSource') || 'admin')
  console.log('directConnection:', params.get('directConnection') || 'false')
  console.log('')
} catch (error) {
  console.error('❌ Erro ao fazer parse:', error.message)
  console.log('')
}

// Teste 3: Tentar conexão básica
console.log('🔌 TESTE 3: Conexão Básica (5s timeout)')
console.log('-'.repeat(60))

async function testConnection(uri, options, testName) {
  console.log(`\n📝 ${testName}`)
  console.log('URI:', uri.replace(/\/\/.*:.*@/, '//***:***@'))
  console.log('Options:', JSON.stringify(options, null, 2))
  
  const client = new MongoClient(uri, options)
  
  try {
    console.log('⏳ Conectando...')
    await client.connect()
    console.log('✅ CONECTADO!')
    
    // Testar acesso ao database
    const db = client.db(DB_NAME)
    console.log('✅ Database acessível:', DB_NAME)
    
    // Listar collections
    const collections = await db.listCollections().toArray()
    console.log('✅ Collections encontradas:', collections.length)
    collections.slice(0, 5).forEach(c => console.log('   -', c.name))
    
    await client.close()
    console.log('✅ Conexão fechada com sucesso')
    return true
    
  } catch (error) {
    console.error('❌ ERRO:', error.message)
    console.error('Código:', error.code)
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Servidor não está aceitando conexões')
    } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 Timeout - servidor não respondeu')
    } else if (error.message.includes('Authentication failed')) {
      console.error('💡 Credenciais incorretas')
    }
    
    try {
      await client.close()
    } catch {}
    
    return false
  }
}

async function runTests() {
  console.log('Iniciando testes...\n')
  
  // Teste 3.1: Configuração do .env
  const success1 = await testConnection(
    MONGODB_URI,
    {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    },
    'Teste 3.1: Configuração do .env'
  )
  
  if (success1) {
    console.log('\n🎉 SUCESSO! A configuração do .env está correta!')
    process.exit(0)
  }
  
  // Teste 3.2: Sem authSource
  const uriSemAuthSource = MONGODB_URI.replace(/authSource=[^&]+&?/, '')
  const success2 = await testConnection(
    uriSemAuthSource,
    {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    },
    'Teste 3.2: Sem authSource'
  )
  
  if (success2) {
    console.log('\n💡 SOLUÇÃO: Remova authSource da connection string')
    process.exit(0)
  }
  
  // Teste 3.3: Sem directConnection
  const uriSemDirect = MONGODB_URI.replace(/directConnection=[^&]+&?/, '')
  const success3 = await testConnection(
    uriSemDirect,
    {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    },
    'Teste 3.3: Sem directConnection'
  )
  
  if (success3) {
    console.log('\n💡 SOLUÇÃO: Remova directConnection da connection string')
    process.exit(0)
  }
  
  // Teste 3.4: Apenas host:port/database
  const match = MONGODB_URI.match(/mongodb:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/)
  if (match) {
    const [, user, pass, host, port] = match
    const uriSimples = `mongodb://${user}:${pass}@${host}:${port}/${DB_NAME}`
    
    const success4 = await testConnection(
      uriSimples,
      {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      },
      'Teste 3.4: Connection String Simples'
    )
    
    if (success4) {
      console.log('\n💡 SOLUÇÃO: Use connection string simples:')
      console.log(`VITE_MONGODB_CONNECTION_STRING=${uriSimples}`)
      process.exit(0)
    }
  }
  
  // Teste 3.5: Com authSource=admin
  const match2 = MONGODB_URI.match(/mongodb:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/)
  if (match2) {
    const [, user, pass, host, port] = match2
    const uriComAuthSource = `mongodb://${user}:${pass}@${host}:${port}/${DB_NAME}?authSource=admin`
    
    const success5 = await testConnection(
      uriComAuthSource,
      {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
      },
      'Teste 3.5: Com authSource=admin'
    )
    
    if (success5) {
      console.log('\n💡 SOLUÇÃO: Use connection string com authSource:')
      console.log(`VITE_MONGODB_CONNECTION_STRING=${uriComAuthSource}`)
      process.exit(0)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('❌ NENHUM TESTE FUNCIONOU')
  console.log('='.repeat(60))
  console.log('\n💡 Possíveis causas:')
  console.log('1. MongoDB não está rodando em 10.0.0.8:27017')
  console.log('2. Firewall bloqueando a porta 27017')
  console.log('3. Credenciais incorretas')
  console.log('4. MongoDB configurado para aceitar apenas localhost')
  console.log('\n💡 Próximos passos:')
  console.log('1. Verifique se MongoDB está rodando:')
  console.log('   ssh user@10.0.0.8 "sudo systemctl status mongod"')
  console.log('2. Teste conexão local no servidor:')
  console.log('   ssh user@10.0.0.8 "mongosh"')
  console.log('3. Verifique configuração do MongoDB:')
  console.log('   ssh user@10.0.0.8 "cat /etc/mongod.conf | grep bindIp"')
}

runTests().catch(error => {
  console.error('\n❌ Erro fatal:', error)
  process.exit(1)
})
