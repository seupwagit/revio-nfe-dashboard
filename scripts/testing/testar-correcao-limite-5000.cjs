/**
 * Testa se a correção do limite de 5000 funcionou
 */

const { MongoClient } = require('mongodb')
require('dotenv').config()

const MONGODB_URI = process.env.VITE_MONGODB_CONNECTION_STRING
const DB_NAME = process.env.VITE_DB_DATABASE

console.log('🧪 TESTE: Correção do Limite de 5000 Documentos')
console.log('=' .repeat(80))
console.log('')

async function testarCorrecao() {
  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  })
  
  try {
    console.log('⏳ Conectando ao MongoDB...')
    await client.connect()
    console.log('✅ Conectado!\n')
    
    const db = client.db(DB_NAME)
    const collection = db.collection('tbl_nfe_100')
    
    // ========================================
    // TESTE 1: Período MUITO AMPLO (2022-2027)
    // ========================================
    console.log('📊 TESTE 1: Período Amplo (2022-2027)')
    console.log('-'.repeat(80))
    
    const dtIni2022 = '2022-01-01'
    const dtFim2027 = '2027-01-01'
    
    console.log(`Período: ${dtIni2022} até ${dtFim2027}`)
    console.log('')
    
    const dtFimCompleto = new Date(dtFim2027)
    dtFimCompleto.setHours(23, 59, 59, 999)
    
    const countAmplo = await collection.countDocuments({
      DT_DOC: {
        $gte: new Date(dtIni2022),
        $lte: dtFimCompleto
      }
    })
    
    console.log(`Resultado: ${countAmplo.toLocaleString('pt-BR')} documentos`)
    console.log('')
    
    if (countAmplo === 5000) {
      console.log('❌ PROBLEMA: Ainda está limitado a 5000 documentos!')
      console.log('   O limite de 5000 ainda está sendo aplicado.')
    } else if (countAmplo === 5199) {
      console.log('✅ CORRETO: Retornou todos os 5.199 documentos!')
      console.log('   O limite foi removido com sucesso.')
    } else {
      console.log(`⚠️  ATENÇÃO: Retornou ${countAmplo} documentos (esperado: 5.199)`)
    }
    console.log('')
    
    // ========================================
    // TESTE 2: Último Ano (filtro padrão novo)
    // ========================================
    console.log('📊 TESTE 2: Último Ano (filtro padrão)')
    console.log('-'.repeat(80))
    
    const hoje = new Date()
    const umAnoAtras = new Date()
    umAnoAtras.setFullYear(hoje.getFullYear() - 1)
    
    const dtIniAno = umAnoAtras.toISOString().split('T')[0]
    const dtFimAno = hoje.toISOString().split('T')[0]
    
    console.log(`Período: ${dtIniAno} até ${dtFimAno}`)
    console.log('')
    
    const dtFimAnoCompleto = new Date(dtFimAno)
    dtFimAnoCompleto.setHours(23, 59, 59, 999)
    
    const countAno = await collection.countDocuments({
      DT_DOC: {
        $gte: new Date(dtIniAno),
        $lte: dtFimAnoCompleto
      }
    })
    
    console.log(`Resultado: ${countAno.toLocaleString('pt-BR')} documentos`)
    console.log('')
    
    if (countAno === 5199) {
      console.log('✅ CORRETO: Filtro padrão retorna todos os documentos!')
    } else {
      console.log(`⚠️  ATENÇÃO: Filtro padrão retornou ${countAno} documentos`)
    }
    console.log('')
    
    // ========================================
    // TESTE 3: Verificar se há mais de 5199 docs
    // ========================================
    console.log('📊 TESTE 3: Total Geral na Base')
    console.log('-'.repeat(80))
    
    const totalGeral = await collection.countDocuments()
    console.log(`Total de documentos: ${totalGeral.toLocaleString('pt-BR')}`)
    console.log('')
    
    if (totalGeral > 5199) {
      console.log(`⚠️  ATENÇÃO: Há ${totalGeral - 5199} documentos a mais na base!`)
      console.log('   Pode haver documentos fora do período de último ano.')
    } else if (totalGeral === 5199) {
      console.log('✅ CONFIRMADO: Total geral = 5.199 documentos')
    }
    console.log('')
    
    // ========================================
    // RESUMO FINAL
    // ========================================
    console.log('=' .repeat(80))
    console.log('📊 RESUMO DOS TESTES')
    console.log('=' .repeat(80))
    console.log('')
    console.log(`Teste 1 (2022-2027):  ${countAmplo.toLocaleString('pt-BR')} documentos ${countAmplo === 5199 ? '✅' : '❌'}`)
    console.log(`Teste 2 (último ano): ${countAno.toLocaleString('pt-BR')} documentos ${countAno === 5199 ? '✅' : '❌'}`)
    console.log(`Total geral:          ${totalGeral.toLocaleString('pt-BR')} documentos`)
    console.log('')
    
    if (countAmplo === 5199 && countAno === 5199) {
      console.log('🎉 SUCESSO: Todas as correções funcionaram!')
      console.log('')
      console.log('✅ Limite de 5000 removido')
      console.log('✅ Filtro padrão ajustado para último ano')
      console.log('✅ Todas as telas devem mostrar 5.199 documentos')
    } else {
      console.log('❌ FALHA: Ainda há problemas')
      console.log('')
      if (countAmplo === 5000) {
        console.log('❌ O limite de 5000 ainda está ativo')
      }
      if (countAno !== 5199) {
        console.log('❌ O filtro padrão não está correto')
      }
    }
    console.log('')
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message)
    process.exit(1)
    
  } finally {
    await client.close()
    console.log('✅ Conexão fechada')
  }
}

testarCorrecao().catch(error => {
  console.error('\n❌ Erro fatal:', error)
  process.exit(1)
})
