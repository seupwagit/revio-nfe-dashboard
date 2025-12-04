const https = require('https');

const TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgwNTQ5MjBGOTg3QkVEN0E1OUI1ODYwQjMzRjkiLCJ4NXQiOiIyNWc2Z1JoNmdGU1NENWg3N1hwWnRZWUxNX2siLCJ0eXAiOiJhdCtqd3QifQ.eyJpc3MiOiJodHRwczovL2lkc2VydmVyLnJldmlvLmRpZ2l0YWwvIiwiZXhwIjoxNzM0NzEwNzU4LCJpYXQiOjE3MzQ2MjQzNTgsInNjb3BlIjoiYXBpMSIsImp0aSI6ImZjYTUzYzk0LTlhMjItNDk1MC1hMmQyLWQxMzIzMWJmOTAwNSIsInN1YiI6IjEiLCJvaV9wcnN0IjoiY2xpZW50IiwiY2xpZW50X2lkIjoiY2xpZW50Iiwib2lfdGtuX2lkIjoiMGQ1OTVmZjYtMDY1MS00MjZhLWI2NjQtZmY1MjVhMmE4ZDVkIn0.Yzoi4HFu6UpeqwkbdF_kWylbW7hhV_gufFXPu6R0AtV9KbUpjojpKod2WQLt6TWvxmL4BtZS6Zq2hvdL0zavhSoXvxVoNK0ARiM0K5FM6swRycXtFSe8-2EGfQYT1qNe4IHZxydadJoPv6qDHNMr8pJIAWfjAKMrAv0tiHRkAU3L_-7ccULuVzamkZfpVd_JEurWX3CpanZREMakwm0Yio6tqWLeXNus-b7ygBWyGVPqVMmHGMl54v4mbzxCEV_edj0SwdOguLYDepw-Q6UWA_HZ7qk9KonFK5DZtT6haFP0b83lD-QxLihAt31Qz_aEAllm-i3EE5rXt9lJ9Tgbxb2Zy1ZEirzB6fDNsnY4wgwiFFXI7qh7Igbc0D1qaCkAtfRTBkkkgkEeP-QI6NNMQiLfjDaTqdZ2zxPsS-WWWJ_tnaQjySV0treNeZNaUpLnTVqI5EVkbGfEKqJ1V7IYImbKYmuEOm0BOM9TXDlOKEYUgLlECLruQMnk0RW0pwOVUftt1h3UkyT8ySDMzEpQFhtoCEpXMQanqwMuntnlQoru80e0cISmh2JNzn-8lwRvzkO9V3Xwcy0AyPLYxgd5PeW82k3XMe2TQonY5vZRgDmgUm5iMr1mPIPR0_we0OOjiLDWahKqNomJUn9cj4Y5UACDC023VzNv3ewqwQxHT_U';

function calcularPeriodo(meses) {
  const hoje = new Date();
  const dataInicio = new Date(hoje);
  dataInicio.setMonth(dataInicio.getMonth() - meses);
  
  return {
    dataInicio: dataInicio.toISOString().split('T')[0],
    dataFim: hoje.toISOString().split('T')[0]
  };
}

function calcularPeriodoDias(dias) {
  const hoje = new Date();
  const dataInicio = new Date(hoje);
  dataInicio.setDate(dataInicio.getDate() - dias);
  
  return {
    dataInicio: dataInicio.toISOString().split('T')[0],
    dataFim: hoje.toISOString().split('T')[0]
  };
}

async function buscarDados(dataInicio, dataFim, descricao) {
  return new Promise((resolve, reject) => {
    const url = `https://api.revio.digital/api/C67624577000145/tbl_nfe_100?dataInicio=${dataInicio}&dataFim=${dataFim}&page=1&size=20000`;
    
    console.log(`\n🔍 ${descricao}`);
    console.log(`   Período: ${dataInicio} até ${dataFim}`);
    console.log(`   URL: ${url}`);
    
    const options = {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Accept': 'application/json'
      }
    };

    const startTime = Date.now();
    
    https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const tempo = Date.now() - startTime;
        
        try {
          const json = JSON.parse(data);
          const total = json.data?.length || 0;
          
          console.log(`   ✅ Registros: ${total.toLocaleString('pt-BR')}`);
          console.log(`   ⏱️  Tempo: ${tempo}ms`);
          
          resolve({ total, tempo, descricao, dataInicio, dataFim });
        } catch (e) {
          console.log(`   ❌ Erro ao parsear JSON: ${e.message}`);
          reject(e);
        }
      });
    }).on('error', (e) => {
      console.log(`   ❌ Erro na requisição: ${e.message}`);
      reject(e);
    });
  });
}

async function testarConsistencia() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🧪 TESTE DE CONSISTÊNCIA DE PERÍODOS - GRID NF-e');
  console.log('═══════════════════════════════════════════════════════════');
  
  try {
    // Teste 1: 3 meses
    const periodo3m = calcularPeriodo(3);
    const resultado3m = await buscarDados(periodo3m.dataInicio, periodo3m.dataFim, '📅 ÚLTIMOS 3 MESES');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 2: 90 dias
    const periodo90d = calcularPeriodoDias(90);
    const resultado90d = await buscarDados(periodo90d.dataInicio, periodo90d.dataFim, '📅 ÚLTIMOS 90 DIAS');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Teste 3: 1 ano
    const periodo1a = calcularPeriodo(12);
    const resultado1a = await buscarDados(periodo1a.dataInicio, periodo1a.dataFim, '📅 ÚLTIMO ANO (12 MESES)');
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('📊 ANÁLISE DE CONSISTÊNCIA');
    console.log('═══════════════════════════════════════════════════════════');
    
    console.log(`\n3 Meses:  ${resultado3m.total.toLocaleString('pt-BR')} registros`);
    console.log(`90 Dias:  ${resultado90d.total.toLocaleString('pt-BR')} registros`);
    console.log(`1 Ano:    ${resultado1a.total.toLocaleString('pt-BR')} registros`);
    
    console.log('\n🔍 VALIDAÇÕES:');
    
    // Validação 1: 90 dias vs 3 meses (devem ser similares)
    const diff90d3m = Math.abs(resultado90d.total - resultado3m.total);
    const percDiff90d3m = (diff90d3m / resultado3m.total * 100).toFixed(2);
    
    if (diff90d3m < 100) {
      console.log(`✅ 90 dias ≈ 3 meses (diferença: ${diff90d3m} registros, ${percDiff90d3m}%)`);
    } else {
      console.log(`⚠️  90 dias vs 3 meses: diferença de ${diff90d3m} registros (${percDiff90d3m}%)`);
    }
    
    // Validação 2: 1 ano DEVE ter MAIS dados que 3 meses
    if (resultado1a.total > resultado3m.total) {
      const aumento = resultado1a.total - resultado3m.total;
      const percAumento = ((aumento / resultado3m.total) * 100).toFixed(2);
      console.log(`✅ 1 ano > 3 meses (+${aumento.toLocaleString('pt-BR')} registros, +${percAumento}%)`);
    } else {
      console.log(`❌ ERRO: 1 ano (${resultado1a.total}) NÃO É MAIOR que 3 meses (${resultado3m.total})!`);
    }
    
    // Validação 3: 1 ano DEVE ter MAIS dados que 90 dias
    if (resultado1a.total > resultado90d.total) {
      const aumento = resultado1a.total - resultado90d.total;
      const percAumento = ((aumento / resultado90d.total) * 100).toFixed(2);
      console.log(`✅ 1 ano > 90 dias (+${aumento.toLocaleString('pt-BR')} registros, +${percAumento}%)`);
    } else {
      console.log(`❌ ERRO: 1 ano (${resultado1a.total}) NÃO É MAIOR que 90 dias (${resultado90d.total})!`);
    }
    
    // Validação 4: Proporção esperada
    const proporcaoEsperada = 4; // 12 meses / 3 meses = 4x
    const proporcaoReal = resultado1a.total / resultado3m.total;
    
    console.log(`\n📈 PROPORÇÃO:`);
    console.log(`   Esperada: ~${proporcaoEsperada}x (12 meses / 3 meses)`);
    console.log(`   Real: ${proporcaoReal.toFixed(2)}x`);
    
    if (proporcaoReal >= 2) {
      console.log(`   ✅ Proporção razoável (>= 2x)`);
    } else {
      console.log(`   ⚠️  Proporção baixa (< 2x) - pode indicar problema`);
    }
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('🎯 CONCLUSÃO');
    console.log('═══════════════════════════════════════════════════════════');
    
    const todosOk = 
      resultado1a.total > resultado3m.total &&
      resultado1a.total > resultado90d.total &&
      proporcaoReal >= 2;
    
    if (todosOk) {
      console.log('✅ CONSISTÊNCIA OK - Dados estão corretos!');
    } else {
      console.log('❌ INCONSISTÊNCIA DETECTADA - Verificar implementação!');
    }
    
  } catch (error) {
    console.error('\n❌ Erro no teste:', error.message);
  }
}

testarConsistencia();
