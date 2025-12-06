#!/usr/bin/env node

/**
 * Script de Validação de Deploy
 * 
 * Valida configurações antes de fazer deploy no Coolify
 */

import { readFileSync, existsSync } from 'fs'
import { MongoClient } from 'mongodb'

// Cores para output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('')
  log('='.repeat(60), 'cyan')
  log(`  ${title}`, 'cyan')
  log('='.repeat(60), 'cyan')
  console.log('')
}

function logCheck(message, status) {
  const icon = status ? '✅' : '❌'
  const color = status ? 'green' : 'red'
  log(`${icon} ${message}`, color)
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

// Carregar variáveis de ambiente
function loadEnv() {
  const envFile = '.env'
  
  if (!existsSync(envFile)) {
    log('❌ Arquivo .env não encontrado!', 'red')
    log('   Crie um arquivo .env baseado em .env.example', 'yellow')
    process.exit(1)
  }
  
  const envContent = readFileSync(envFile, 'utf-8')
  const env = {}
  
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      env[key] = value
    }
  })
  
  return env
}

// Validar variáveis essenciais
function validateEssentialVars(env) {
  logSection('Validando Variáveis Essenciais')
  
  const essential = [
    'VITE_MONGODB_CONNECTION_STRING',
    'VITE_API_BASE_URL',
    'VITE_DB_HOST',
    'VITE_DB_DATABASE'
  ]
  
  let allValid = true
  
  essential.forEach(key => {
    const exists = env[key] && env[key].length > 0
    logCheck(`${key}`, exists)
    if (!exists) allValid = false
  })
  
  // Warnings para opcionais importantes
  if (!env.VITE_API_BEARER_TOKEN) {
    logWarning('VITE_API_BEARER_TOKEN não configurado (algumas funcionalidades podem não funcionar)')
  }
  
  return allValid
}

// Validar MongoDB
async function validateMongoDB(env) {
  logSection('Validando Conexão MongoDB')
  
  const connectionString = env.VITE_MONGODB_CONNECTION_STRING
  
  if (!connectionString) {
    logCheck('Connection string configurada', false)
    return false
  }
  
  logCheck('Connection string configurada', true)
  logInfo('Testando conexão...')
  
  try {
    const client = new MongoClient(connectionString, {
      serverSelectionTimeoutMS: 5000
    })
    
    await client.connect()
    logCheck('Conexão estabelecida', true)
    
    const db = client.db(env.VITE_DB_DATABASE)
    const collections = await db.listCollections().toArray()
    
    logCheck(`Database "${env.VITE_DB_DATABASE}" acessível`, true)
    logInfo(`${collections.length} collections encontradas`)
    
    // Verificar collection padrão
    const defaultCollection = env.VITE_DB_COLLECTION || 'tbl_nfe_100'
    const collectionExists = collections.some(c => c.name === defaultCollection)
    
    logCheck(`Collection "${defaultCollection}" existe`, collectionExists)
    
    if (collectionExists) {
      const count = await db.collection(defaultCollection).countDocuments()
      logInfo(`${count} documentos na collection`)
    }
    
    await client.close()
    return true
    
  } catch (error) {
    logCheck('Conexão estabelecida', false)
    log(`   Erro: ${error.message}`, 'red')
    return false
  }
}

// Validar estrutura de arquivos
function validateFileStructure() {
  logSection('Validando Estrutura de Arquivos')
  
  const requiredFiles = [
    'package.json',
    'Dockerfile.fullstack',
    'docker-compose.yml',
    'start-fullstack.sh',
    'src/server/index.ts',
    'src/main.tsx'
  ]
  
  let allExist = true
  
  requiredFiles.forEach(file => {
    const exists = existsSync(file)
    logCheck(file, exists)
    if (!exists) allExist = false
  })
  
  return allExist
}

// Validar package.json
function validatePackageJson() {
  logSection('Validando package.json')
  
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))
    
    logCheck('package.json válido', true)
    
    // Verificar scripts essenciais
    const requiredScripts = ['build', 'preview', 'backend']
    let allScriptsExist = true
    
    requiredScripts.forEach(script => {
      const exists = pkg.scripts && pkg.scripts[script]
      logCheck(`Script "${script}"`, exists)
      if (!exists) allScriptsExist = false
    })
    
    // Verificar dependências essenciais
    const requiredDeps = ['react', 'express', 'mongodb', 'mongoose']
    let allDepsExist = true
    
    requiredDeps.forEach(dep => {
      const exists = pkg.dependencies && pkg.dependencies[dep]
      logCheck(`Dependência "${dep}"`, exists)
      if (!exists) allDepsExist = false
    })
    
    return allScriptsExist && allDepsExist
    
  } catch (error) {
    logCheck('package.json válido', false)
    log(`   Erro: ${error.message}`, 'red')
    return false
  }
}

// Validar configuração de portas
function validatePorts(env) {
  logSection('Validando Configuração de Portas')
  
  const frontendPort = env.PORT || env.VITE_PORT || '3000'
  const backendPort = env.BACKOFFICE_PORT || '3001'
  
  logInfo(`Frontend: ${frontendPort}`)
  logInfo(`Backend: ${backendPort}`)
  
  if (frontendPort === backendPort) {
    logCheck('Portas diferentes', false)
    log('   Frontend e Backend não podem usar a mesma porta!', 'red')
    return false
  }
  
  logCheck('Portas diferentes', true)
  return true
}

// Main
async function main() {
  log('', 'reset')
  log('╔════════════════════════════════════════════════════════╗', 'cyan')
  log('║                                                        ║', 'cyan')
  log('║        🚀 Validação de Deploy - SpedRevio            ║', 'cyan')
  log('║                                                        ║', 'cyan')
  log('╚════════════════════════════════════════════════════════╝', 'cyan')
  log('', 'reset')
  
  const env = loadEnv()
  
  const results = {
    essentialVars: false,
    mongodb: false,
    fileStructure: false,
    packageJson: false,
    ports: false
  }
  
  // Executar validações
  results.essentialVars = validateEssentialVars(env)
  results.fileStructure = validateFileStructure()
  results.packageJson = validatePackageJson()
  results.ports = validatePorts(env)
  results.mongodb = await validateMongoDB(env)
  
  // Resumo
  logSection('Resumo da Validação')
  
  const checks = [
    ['Variáveis Essenciais', results.essentialVars],
    ['Estrutura de Arquivos', results.fileStructure],
    ['package.json', results.packageJson],
    ['Configuração de Portas', results.ports],
    ['Conexão MongoDB', results.mongodb]
  ]
  
  checks.forEach(([name, status]) => {
    logCheck(name, status)
  })
  
  console.log('')
  
  const allPassed = Object.values(results).every(r => r === true)
  
  if (allPassed) {
    log('╔════════════════════════════════════════════════════════╗', 'green')
    log('║                                                        ║', 'green')
    log('║        ✅ Todas as validações passaram!               ║', 'green')
    log('║        Pronto para deploy no Coolify! 🚀              ║', 'green')
    log('║                                                        ║', 'green')
    log('╚════════════════════════════════════════════════════════╝', 'green')
    console.log('')
    logInfo('Próximos passos:')
    logInfo('1. Commit e push para o repositório')
    logInfo('2. Configure o Coolify com as mesmas variáveis do .env')
    logInfo('3. Selecione Dockerfile.fullstack')
    logInfo('4. Deploy!')
    console.log('')
    process.exit(0)
  } else {
    log('╔════════════════════════════════════════════════════════╗', 'red')
    log('║                                                        ║', 'red')
    log('║        ❌ Algumas validações falharam!                ║', 'red')
    log('║        Corrija os problemas antes de fazer deploy     ║', 'red')
    log('║                                                        ║', 'red')
    log('╚════════════════════════════════════════════════════════╝', 'red')
    console.log('')
    logWarning('Corrija os problemas acima e execute novamente')
    console.log('')
    process.exit(1)
  }
}

// Executar
main().catch(error => {
  log('', 'reset')
  log('❌ Erro fatal:', 'red')
  log(error.message, 'red')
  console.log('')
  process.exit(1)
})
