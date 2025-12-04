/**
 * Servidor de Agregação via API Revio
 * 
 * Como o MongoDB não está acessível diretamente,
 * vamos fazer agregações usando a API existente
 * mas processando no servidor para otimizar
 */

const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()
app.use(cors())
app.use(express.json())

// Configuração
const API_BASE_URL = 'https://apinfe.revio.digital/api'
const TOKEN = process.env.BEARER_TOKEN || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgwNTQ5MjBGOTg3QkVEN0E1OUI1ODYwQjMzRjkiLCJ4NXQiOiIyNWc2Z1JoNmdGU1NENWg3N1hwWnRZWUxNX2siLCJ0eXAiOiJhdCtqd3QifQ.eyJpc3MiOiJodHRwczovL2lkc2VydmVyLnJldmlvLmRpZ2l0YWwvIiwiZXhwIjoxNzM0NzEwNzU4LCJpYXQiOjE3MzQ2MjQzNTgsInNjb3BlIjoiYXBpMSIsImp0aSI6ImZjYTUzYzk0LTlhMjItNDk1MC1hMmQyLWQxMzIzMWJmOTAwNSIsInN1YiI6IjEiLCJvaV9wcnN0IjoiY2xpZW50IiwiY2xpZW50X2lkIjoiY2xpZW50Iiwib2lfdGtuX2lkIjoiMGQ1OTVmZjYtMDY1MS00MjZhLWI2NjQtZmY1MjVhMmE4ZDVkIn0.Yzoi4HFu6UpeqwkbdF_kWylbW7hhV_gufFXPu6R0AtV9KbUpjojpKod2WQLt6TWvxmL4BtZS6Zq2hvdL0zavhSoXvxVoNK0ARiM0K5FM6swRycXtFSe8-2EGfQYT1qNe4IHZxydadJoPv6qDHNMr8pJIAWfjAKMrAv0tiHRkAU3L_-7ccULuVzamkZfpVd_JEurWX3CpanZREMakwm0Yio6tqWLeXNus-b7ygBWyGVPqVMmHGMl54v4mbzxCEV_edj0SwdOguLYDepw-Q6UWA_HZ7qk9KonFK5DZtT6haFP0b83lD-QxLihAt31Qz_aEAllm-i3EE5rXt9lJ9Tgbxb2Zy1ZEirzB6fDNsnY4wgwiFFXI7qh7Igbc0D1qaCkAtfRTBkkkgkEeP-QI6NNMQiLfjDaTqdZ2zxPsS-WWWJ_tnaQjySV0treNeZNaUpLnTVqI5EVkbGfEKqJ1V7IYImbKYmuEOm0BOM9TXDlOKEYUgLlECLruQMnk0RW0pwOVUftt1h3UkyT8ySDMzEpQFhtoCEpXMQanqwMuntnlQoru80e0cISmh2JNzn-8lwRvzkO9V3Xwcy0AyPLYxgd5PeW82k3XMe2TQonY5vZRgDmgUm5iMr1mPIPR0_we0OOjiLDWahKqNomJUn9cj4Y5UACDC023VzNv3ewqwQxHT_U'

// Buscar todos os registros com paginação
async function buscarTodosRegistros(params) {
  let page = 1
  let todosRegistros = []
  let temMais = true

  console.log('🔄 Buscando todos os registros...')

  while (temMais) {
    try {
      const response = await axios.get(`${API_BASE_URL}/WebView/Consultar`, {
        params: { ...params, pg: page, size: 500 },
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json'
        }
      })

      const lista = response.data?.lista || []
      console.log(`  Página ${page}: ${lista.length} registros`)
      
      todosRegistros = [...todosRegistros, ...lista]

      if (lista.length < 500) {
        temMais = false
      } else {
        page++
      }
    } catch (error) {
      console.error(`❌ Erro na página ${page}:`, error.message)
      temMais = false
    }
  }

  console.log(`✅ Total carregado: ${todosRegistros.length} registros`)
  return todosRegistros
}

// Processar agregações
function processarAgregacoes(registros) {
  const faturamentoPorDia = {}
  const emitentes = {}
  const tiposOperacao = {}
  const statusNotas = {}
  const evolucaoMensal = {}
  let totalValor = 0
  let maiorNota = 0
  let menorNota = Infinity

  registros.forEach(item => {
    const valor = item.VL_DOC || 0
    totalValor += valor
    
    if (valor > maiorNota) maiorNota = valor
    if (valor > 0 && valor < menorNota) menorNota = valor

    // Faturamento por dia
    const data = item.DT_DOC?.split('T')[0] || 'Sem data'
    if (!faturamentoPorDia[data]) {
      faturamentoPorDia[data] = { data, valor: 0, quantidade: 0 }
    }
    faturamentoPorDia[data].valor += valor
    faturamentoPorDia[data].quantidade += 1

    // Emitentes
    const nome = item.NOME_EMIT || 'Sem nome'
    if (!emitentes[nome]) {
      emitentes[nome] = { nome, valor: 0, quantidade: 0 }
    }
    emitentes[nome].valor += valor
    emitentes[nome].quantidade += 1

    // Tipos
    const tipo = item.IND_OPER === '1' ? 'Saída' : item.IND_OPER === '0' ? 'Entrada' : 'Outros'
    if (!tiposOperacao[tipo]) {
      tiposOperacao[tipo] = { name: tipo, value: 0, quantidade: 0 }
    }
    tiposOperacao[tipo].value += valor
    tiposOperacao[tipo].quantidade += 1

    // Status
    const status = item.PROTOCOLADA === 'Sim' ? 'Protocolada' : 'Não Protocolada'
    if (!statusNotas[status]) {
      statusNotas[status] = { name: status, value: 0 }
    }
    statusNotas[status].value += 1

    // Evolução mensal
    try {
      const dataObj = new Date(item.DT_DOC)
      if (!isNaN(dataObj.getTime())) {
        const mes = `${dataObj.getFullYear()}-${String(dataObj.getMonth() + 1).padStart(2, '0')}`
        if (!evolucaoMensal[mes]) {
          evolucaoMensal[mes] = { mes, valor: 0, quantidade: 0 }
        }
        evolucaoMensal[mes].valor += valor
        evolucaoMensal[mes].quantidade += 1
      }
    } catch (e) {}
  })

  return {
    faturamentoDiario: Object.values(faturamentoPorDia).sort((a, b) => a.data.localeCompare(b.data)).slice(-30),
    topEmitentes: Object.values(emitentes).sort((a, b) => b.valor - a.valor).slice(0, 10),
    distribuicaoTipos: Object.values(tiposOperacao),
    distribuicaoStatus: Object.values(statusNotas),
    evolucao: Object.values(evolucaoMensal).sort((a, b) => a.mes.localeCompare(b.mes)),
    stats: {
      totalNotas: registros.length,
      totalValor,
      mediaValor: totalValor / registros.length,
      maiorNota,
      menorNota: menorNota === Infinity ? 0 : menorNota
    }
  }
}

// Endpoint de agregação
app.post('/api/aggregate/analytics', async (req, res) => {
  try {
    const { collection, dtIni, dtFin, cnpjEmit, cnpjDest } = req.body
    
    console.log('📊 Agregação solicitada:', { collection, dtIni, dtFin })
    const startTime = Date.now()

    // Buscar todos os registros
    const registros = await buscarTodosRegistros({
      host: '10.0.0.8',
      database: 'C67624577000145',
      collection,
      dtIni,
      dtFin,
      cnpjEmit,
      cnpjDest
    })

    // Processar agregações
    const dados = processarAgregacoes(registros)
    
    const endTime = Date.now()
    console.log(`✅ Agregação concluída em ${endTime - startTime}ms`)

    res.json({
      success: true,
      data: dados,
      executionTime: endTime - startTime
    })
  } catch (error) {
    console.error('❌ Erro:', error.message)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'API-AGGREGATION',
    message: 'Servidor de agregação via API Revio'
  })
})

const PORT = 3002
app.listen(PORT, () => {
  console.log('🚀 Servidor de agregação rodando na porta', PORT)
  console.log('   Health: http://localhost:' + PORT + '/health')
  console.log('   Endpoint: POST http://localhost:' + PORT + '/api/aggregate/analytics')
  console.log('⚡ Modo: Agregação via API Revio (otimizado)')
})
