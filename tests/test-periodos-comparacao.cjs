const axios = require('axios');
require('dotenv').config();

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Authorization': `Bearer ${process.env.VITE_API_BEARER_TOKEN}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 120000
});

function getDateRange(days) {
  const fim = new Date();
  const inicio = new Date();
  inicio.setDate(inicio.getDate() - days);
  
  return {
    dtIni: inicio.toISOString().split('T')[0],
    dtFin: fim.toISOString().split('T')[0]
  };
}

async function testarPeriodo(dias, pageSize) {
  const { dtIni, dtFin } = getDateRange(dias);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📅 Testando: ${dias} dias (${dtIni} até ${dtFin})`);
  console.log(`📦 PageSize: ${pageSize}`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    let page = 1;
    let totalRegistros = 0;
    let temMais = true;
    
    while (temMais) {
      const params = {
        host: '10.0.0.8',
        collection: 'tbl_nfe_100',
        database: 'C67624577000145',
        pg: page,
        size: pageSize,
        dtIni,
        dtFin
      };
      
      console.log(`\n📄 Página ${page}...`);
      const response = await api.get('/WebView/Consultar', { params });
      
      const registros = response.data?.lista?.length || 0;
      totalRegistros += registros;
      
      console.log(`   ✅ ${registros} registros`);
      
      if (registros < pageSize) {
        temMais = false;
      } else {
        page++;
      }
      
      // Limite de segurança
      if (page > 20) {
        console.log('   ⚠️ Limite de 20 páginas atingido');
        break;
      }
    }
    
    const tempo = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`\n✅ SUCESSO:`);
    console.log(`   📊 Total: ${totalRegistros} registros`);
    console.log(`   ⏱️  Tempo: ${tempo}s`);
    console.log(`   🚀 Velocidade: ${(totalRegistros / tempo).toFixed(0)} reg/s`);
    
    return { dias, totalRegistros, tempo, sucesso: true };
    
  } catch (error) {
    const tempo = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n❌ ERRO após ${tempo}s:`);
    console.log(`   ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    }
    return { dias, totalRegistros: 0, tempo, sucesso: false, erro: error.message };
  }
}

async function main() {
  console.log('🧪 TESTE DE PERÍODOS - COMPARAÇÃO');
  console.log('='.repeat(60));
  
  const periodos = [
    { dias: 30, pageSize: 500 },
    { dias: 60, pageSize: 500 },
    { dias: 90, pageSize: 500 },
    { dias: 365, pageSize: 500 }
  ];
  
  const resultados = [];
  
  for (const { dias, pageSize } of periodos) {
    const resultado = await testarPeriodo(dias, pageSize);
    resultados.push(resultado);
    
    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS RESULTADOS');
  console.log('='.repeat(60));
  console.log('\n| Período | Registros | Tempo | Velocidade | Status |');
  console.log('|---------|-----------|-------|------------|--------|');
  
  resultados.forEach(r => {
    const velocidade = r.sucesso ? `${(r.totalRegistros / r.tempo).toFixed(0)} reg/s` : '-';
    const status = r.sucesso ? '✅' : '❌';
    console.log(`| ${r.dias} dias | ${r.totalRegistros} | ${r.tempo}s | ${velocidade} | ${status} |`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 ANÁLISE:');
  
  // Verifica se 60 e 90 dias têm diferença
  const r30 = resultados.find(r => r.dias === 30);
  const r60 = resultados.find(r => r.dias === 60);
  const r90 = resultados.find(r => r.dias === 90);
  const r365 = resultados.find(r => r.dias === 365);
  
  if (r60 && r90 && r60.totalRegistros === r90.totalRegistros) {
    console.log('⚠️  PROBLEMA: 60 e 90 dias retornam o MESMO número de registros!');
    console.log(`   Ambos: ${r60.totalRegistros} registros`);
  } else if (r60 && r90) {
    console.log('✅ OK: 60 e 90 dias retornam números diferentes');
    console.log(`   60 dias: ${r60.totalRegistros} registros`);
    console.log(`   90 dias: ${r90.totalRegistros} registros`);
  }
  
  if (r365 && r365.sucesso) {
    console.log(`\n✅ 1 ano funciona: ${r365.totalRegistros} registros em ${r365.tempo}s`);
  } else if (r365) {
    console.log(`\n❌ 1 ano FALHOU: ${r365.erro}`);
  }
  
  console.log('='.repeat(60));
}

main().catch(console.error);
