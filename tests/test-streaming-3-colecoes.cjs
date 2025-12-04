const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  headers: {
    'Authorization': `Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgwNTQ5MjBGOTg3QkVEN0E1OUI1ODYwQjMzRjkiLCJ4NXQiOiIyNWc2Z1JoNmdGU1NENWg3N1hwWnRZWUxNX2siLCJ0eXAiOiJhdCtqd3QifQ.eyJpc3MiOiJodHRwczovL2lkc2VydmVyLnJldmlvLmRpZ2l0YWwvIiwiZXhwIjoxNzM0NzEwNzU4LCJpYXQiOjE3MzQ2MjQzNTgsInNjb3BlIjoiYXBpMSIsImp0aSI6ImZjYTUzYzk0LTlhMjItNDk1MC1hMmQyLWQxMzIzMWJmOTAwNSIsInN1YiI6IjEiLCJvaV9wcnN0IjoiY2xpZW50IiwiY2xpZW50X2lkIjoiY2xpZW50Iiwib2lfdGtuX2lkIjoiMGQ1OTVmZjYtMDY1MS00MjZhLWI2NjQtZmY1MjVhMmE4ZDVkIn0.Yzoi4HFu6UpeqwkbdF_kWylbW7hhV_gufFXPu6R0AtV9KbUpjojpKod2WQLt6TWvxmL4BtZS6Zq2hvdL0zavhSoXvxVoNK0ARiM0K5FM6swRycXtFSe8-2EGfQYT1qNe4IHZxydadJoPv6qDHNMr8pJIAWfjAKMrAv0tiHRkAU3L_-7ccULuVzamkZfpVd_JEurWX3CpanZREMakwm0Yio6tqWLeXNus-b7ygBWyGVPqVMmHGMl54v4mbzxCEV_edj0SwdOguLYDepw-Q6UWA_HZ7qk9KonFK5DZtT6haFP0b83lD-QxLihAt31Qz_aEAllm-i3EE5rXt9lJ9Tgbxb2Zy1ZEirzB6fDNsnY4wgwiFFXI7qh7Igbc0D1qaCkAtfRTBkkkgkEeP-QI6NNMQiLfjDaTqdZ2zxPsS-WWWJ_tnaQjySV0treNeZNaUpLnTVqI5EVkbGfEKqJ1V7IYImbKYmuEOm0BOM9TXDlOKEYUgLlECLruQMnk0RW0pwOVUftt1h3UkyT8ySDMzEpQFhtoCEpXMQanqwMuntnlQoru80e0cISmh2JNzn-8lwRvzkO9V3Xwcy0AyPLYxgd5PeW82k3XMe2TQonY5vZRgDmgUm5iMr1mPIPR0_we0OOjiLDWahKqNomJUn9cj4Y5UACDC023VzNv3ewqwQxHT_U`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000
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

async function testarCollection(collection, dias) {
  const { dtIni, dtFin } = getDateRange(dias);
  
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📦 Collection: ${collection}`);
  console.log(`📅 Período: ${dias} dias (${dtIni} até ${dtFin})`);
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  
  try {
    const params = {
      host: '10.0.0.8',
      collection: collection,
      database: 'C67624577000145',
      pg: 1,
      size: 10000,
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
    
    return { collection, dias, registros, tempo, sucesso: true };
    
  } catch (error) {
    const tempo = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`❌ ERRO após ${tempo}s:`);
    console.log(`   ${error.message}`);
    return { collection, dias, registros: 0, tempo, sucesso: false };
  }
}

async function main() {
  console.log('🧪 TESTE DE STREAMING NAS 3 COLEÇÕES');
  console.log('='.repeat(60));
  console.log('Verificando que todas as coleções funcionam com streaming\n');
  
  const testes = [
    // Testar 30 dias em cada collection
    { collection: 'tbl_nfe_100', dias: 30, nome: 'NF-e' },
    { collection: 'tbl_cfe_100', dias: 30, nome: 'CF-e' },
    { collection: 'tbl_cte_100', dias: 30, nome: 'CT-e' },
    
    // Testar 60 dias em cada collection
    { collection: 'tbl_nfe_100', dias: 60, nome: 'NF-e' },
    { collection: 'tbl_cfe_100', dias: 60, nome: 'CF-e' },
    { collection: 'tbl_cte_100', dias: 60, nome: 'CT-e' },
  ];
  
  const resultados = [];
  
  for (const { collection, dias, nome } of testes) {
    const resultado = await testarCollection(collection, dias);
    resultado.nome = nome;
    resultados.push(resultado);
    
    // Pausa entre testes
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n\n' + '='.repeat(60));
  console.log('📊 RESUMO DOS RESULTADOS');
  console.log('='.repeat(60));
  console.log('\n| Collection | Período | Registros | Tempo | Status |');
  console.log('|------------|---------|-----------|-------|--------|');
  
  resultados.forEach(r => {
    const status = r.sucesso ? '✅' : '❌';
    console.log(`| ${r.nome.padEnd(10)} | ${r.dias} dias | ${String(r.registros).padEnd(9)} | ${r.tempo}s | ${status} |`);
  });
  
  console.log('\n' + '='.repeat(60));
  console.log('🔍 ANÁLISE:');
  
  const sucessos = resultados.filter(r => r.sucesso).length;
  const total = resultados.length;
  
  console.log(`✅ Sucesso: ${sucessos}/${total} testes (${((sucessos/total)*100).toFixed(0)}%)`);
  
  if (sucessos === total) {
    console.log('🎉 PERFEITO! Todas as 3 coleções funcionam com streaming!');
  } else {
    console.log('⚠️  Algumas coleções falharam. Verificar configuração.');
  }
  
  // Verificar se cada collection tem dados
  const nfe30 = resultados.find(r => r.collection === 'tbl_nfe_100' && r.dias === 30);
  const cfe30 = resultados.find(r => r.collection === 'tbl_cfe_100' && r.dias === 30);
  const cte30 = resultados.find(r => r.collection === 'tbl_cte_100' && r.dias === 30);
  
  console.log('\n📊 Dados por Collection (30 dias):');
  console.log(`   NF-e: ${nfe30?.registros || 0} registros`);
  console.log(`   CF-e: ${cfe30?.registros || 0} registros`);
  console.log(`   CT-e: ${cte30?.registros || 0} registros`);
  
  console.log('='.repeat(60));
}

main().catch(console.error);
