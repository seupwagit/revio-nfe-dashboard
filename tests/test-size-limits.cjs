const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: {
    'Authorization': `Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgwNTQ5MjBGOTg3QkVEN0E1OUI1ODYwQjMzRjkiLCJ4NXQiOiIyNWc2Z1JoNmdGU1NENWg3N1hwWnRZWUxNX2siLCJ0eXAiOiJhdCtqd3QifQ.eyJpc3MiOiJodHRwczovL2lkc2VydmVyLnJldmlvLmRpZ2l0YWwvIiwiZXhwIjoxNzM0NzEwNzU4LCJpYXQiOjE3MzQ2MjQzNTgsInNjb3BlIjoiYXBpMSIsImp0aSI6ImZjYTUzYzk0LTlhMjItNDk1MC1hMmQyLWQxMzIzMWJmOTAwNSIsInN1YiI6IjEiLCJvaV9wcnN0IjoiY2xpZW50IiwiY2xpZW50X2lkIjoiY2xpZW50Iiwib2lfdGtuX2lkIjoiMGQ1OTVmZjYtMDY1MS00MjZhLWI2NjQtZmY1MjVhMmE4ZDVkIn0.Yzoi4HFu6UpeqwkbdF_kWylbW7hhV_gufFXPu6R0AtV9KbUpjojpKod2WQLt6TWvxmL4BtZS6Zq2hvdL0zavhSoXvxVoNK0ARiM0K5FM6swRycXtFSe8-2EGfQYT1qNe4IHZxydadJoPv6qDHNMr8pJIAWfjAKMrAv0tiHRkAU3L_-7ccULuVzamkZfpVd_JEurWX3CpanZREMakwm0Yio6tqWLeXNus-b7ygBWyGVPqVMmHGMl54v4mbzxCEV_edj0SwdOguLYDepw-Q6UWA_HZ7qk9KonFK5DZtT6haFP0b83lD-QxLihAt31Qz_aEAllm-i3EE5rXt9lJ9Tgbxb2Zy1ZEirzB6fDNsnY4wgwiFFXI7qh7Igbc0D1qaCkAtfRTBkkkgkEeP-QI6NNMQiLfjDaTqdZ2zxPsS-WWWJ_tnaQjySV0treNeZNaUpLnTVqI5EVkbGfEKqJ1V7IYImbKYmuEOm0BOM9TXDlOKEYUgLlECLruQMnk0RW0pwOVUftt1h3UkyT8ySDMzEpQFhtoCEpXMQanqwMuntnlQoru80e0cISmh2JNzn-8lwRvzkO9V3Xwcy0AyPLYxgd5PeW82k3XMe2TQonY5vZRgDmgUm5iMr1mPIPR0_we0OOjiLDWahKqNomJUn9cj4Y5UACDC023VzNv3ewqwQxHT_U`,
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

async function testarSize(size, dias) {
  const { dtIni, dtFin } = getDateRange(dias);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 Testando Size: ${size} | Período: ${dias} dias`);
  console.log(`📅 ${dtIni} até ${dtFin}`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    const params = {
      host: '10.0.0.8',
      collection: 'tbl_nfe_100',
      database: 'C67624577000145',
      pg: 1,
      size: size,
      dtIni,
      dtFin
    };
    
    const response = await api.get('/WebView/Consultar', { params });
    const registros = response.data?.lista?.length || 0;
    const tempo = ((Date.now() - startTime) / 1000).toFixed(2);
    
    console.log(`✅ SUCESSO:`);
    console.log(`   📊 Registros: ${registros}`);
    console.log(`   ⏱️  Tempo: ${tempo}s`);
    console.log(`   🚀 Velocidade: ${(registros / tempo).toFixed(0)} reg/s`);
    
    return { size, dias, registros, tempo, sucesso: true };
    
  } catch (error) {
    const tempo = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ ERRO após ${tempo}s:`);
    console.log(`   ${error.message}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    }
    return { size, dias, registros: 0, tempo, sucesso: false, erro: error.message };
  }
}

async function main() {
  console.log('🧪 TESTE DE LIMITES DE SIZE');
  console.log('='.repeat(60));
  
  const testes = [
    // Testar diferentes sizes com 30 dias (sabemos que funciona)
    { size: 500, dias: 30 },
    { size: 1000, dias: 30 },
    { size: 2000, dias: 30 },
    { size: 5000, dias: 30 },
    { size: 10000, dias: 30 },
    { size: 20000, dias: 30 },
    
    // Depois testar o size máximo com 60 dias
    { size: 10000, dias: 60 },
    
    // E finalmente com 90 dias
    { size: 10000, dias: 90 },
  ];
  
  const resultados = [];
  
  for (const { size, dias } of testes) {
    const resultado = await testarSize(size, dias);
    resultados.push(resultado);
    
    // Continuar mesmo se falhar para ver todos os resultados
    
    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS RESULTADOS');
  console.log('='.repeat(60));
  console.log('\n| Size | Período | Registros | Tempo | Status |');
  console.log('|------|---------|-----------|-------|--------|');
  
  resultados.forEach(r => {
    const status = r.sucesso ? '✅' : '❌';
    console.log(`| ${r.size} | ${r.dias} dias | ${r.registros} | ${r.tempo}s | ${status} |`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 CONCLUSÃO:');
  
  const maxSucesso = resultados.filter(r => r.sucesso).sort((a, b) => b.size - a.size)[0];
  if (maxSucesso) {
    console.log(`✅ Máximo size funcional: ${maxSucesso.size}`);
    console.log(`   Com ${maxSucesso.dias} dias: ${maxSucesso.registros} registros em ${maxSucesso.tempo}s`);
  }
  
  console.log('='.repeat(60));
}

main().catch(console.error);
