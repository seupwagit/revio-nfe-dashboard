const axios = require('axios');

const config = {
  apiUrl: 'http://localhost:3001/api/WebView/ContadorConsulta',
  token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgwNTQ5MjBGOTg3QkVEN0E1OUI1ODYwQjMzRjkiLCJ4NXQiOiIyNWc2Z1JoNmdGU1NENWg3N1hwWnRZWUxNX2siLCJ0eXAiOiJhdCtqd3QifQ.eyJpc3MiOiJodHRwczovL2lkc2VydmVyLnJldmlvLmRpZ2l0YWwvIiwiZXhwIjoxNzM0NzEwNzU4LCJpYXQiOjE3MzQ2MjQzNTgsInNjb3BlIjoiYXBpMSIsImp0aSI6ImZjYTUzYzk0LTlhMjItNDk1MC1hMmQyLWQxMzIzMWJmOTAwNSIsInN1YiI6IjEiLCJvaV9wcnN0IjoiY2xpZW50IiwiY2xpZW50X2lkIjoiY2xpZW50Iiwib2lfdGtuX2lkIjoiMGQ1OTVmZjYtMDY1MS00MjZhLWI2NjQtZmY1MjVhMmE4ZDVkIn0.Yzoi4HFu6UpeqwkbdF_kWylbW7hhV_gufFXPu6R0AtV9KbUpjojpKod2WQLt6TWvxmL4BtZS6Zq2hvdL0zavhSoXvxVoNK0ARiM0K5FM6swRycXtFSe8-2EGfQYT1qNe4IHZxydadJoPv6qDHNMr8pJIAWfjAKMrAv0tiHRkAU3L_-7ccULuVzamkZfpVd_JEurWX3CpanZREMakwm0Yio6tqWLeXNus-b7ygBWyGVPqVMmHGMl54v4mbzxCEV_edj0SwdOguLYDepw-Q6UWA_HZ7qk9KonFK5DZtT6haFP0b83lD-QxLihAt31Qz_aEAllm-i3EE5rXt9lJ9Tgbxb2Zy1ZEirzB6fDNsnY4wgwiFFXI7qh7Igbc0D1qaCkAtfRTBkkkgkEeP-QI6NNMQiLfjDaTqdZ2zxPsS-WWWJ_tnaQjySV0treNeZNaUpLnTVqI5EVkbGfEKqJ1V7IYImbKYmuEOm0BOM9TXDlOKEYUgLlECLruQMnk0RW0pwOVUftt1h3UkyT8ySDMzEpQFhtoCEpXMQanqwMuntnlQoru80e0cISmh2JNzn-8lwRvzkO9V3Xwcy0AyPLYxgd5PeW82k3XMe2TQonY5vZRgDmgUm5iMr1mPIPR0_we0OOjiLDWahKqNomJUn9cj4Y5UACDC023VzNv3ewqwQxHT_U',
  host: '10.0.0.8',
  database: 'C67624577000145'
};

async function contarRegistros() {
  console.log('📊 CONTANDO REGISTROS NA COLLECTION NF-e\n');
  console.log('='.repeat(60));

  // Período amplo - últimos 2 anos
  const hoje = new Date();
  const doisAnosAtras = new Date();
  doisAnosAtras.setFullYear(hoje.getFullYear() - 2);

  const dtFin = hoje.toISOString().split('T')[0];
  const dtIni = doisAnosAtras.toISOString().split('T')[0];

  const params = {
    host: config.host,
    database: config.database,
    collection: 'tbl_nfe_100',
    dtIni: dtIni,
    dtFin: dtFin
  };

  console.log(`📅 Período consultado: ${dtIni} até ${dtFin}`);
  console.log(`🗄️  Database: ${config.database}`);
  console.log(`📦 Collection: tbl_nfe_100`);
  console.log('='.repeat(60));

  try {
    const response = await axios.get(config.apiUrl, {
      params,
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('\n✅ RESULTADO:\n');
    
    // Tenta diferentes estruturas de resposta
    const total = response.data?.total || 
                  response.data?.count || 
                  response.data?.totalRegistros || 
                  response.data?.quantidade ||
                  (typeof response.data === 'number' ? response.data : 0);
    
    console.log(`📊 Total de NF-e: ${total.toLocaleString('pt-BR')} registros`);
    console.log('\n' + '='.repeat(60));
    
    // Estatísticas adicionais
    if (total > 0) {
      const mesesPeriodo = 24; // 2 anos
      const mediaMensal = Math.round(total / mesesPeriodo);
      const mediaDiaria = Math.round(total / (mesesPeriodo * 30));
      
      console.log('\n📈 ESTATÍSTICAS:');
      console.log(`   Média mensal: ~${mediaMensal.toLocaleString('pt-BR')} NF-e/mês`);
      console.log(`   Média diária: ~${mediaDiaria.toLocaleString('pt-BR')} NF-e/dia`);
    }
    
    console.log('\n💡 OBSERVAÇÃO:');
    console.log('   Este é o total de registros nos últimos 2 anos.');
    console.log('   Para ver o total histórico completo, seria necessário');
    console.log('   consultar sem filtro de data (se a API permitir).');
    
  } catch (error) {
    console.error('\n❌ ERRO AO CONTAR REGISTROS:\n');
    console.error(`Status: ${error.response?.status || 'N/A'}`);
    console.error(`Mensagem: ${error.message}`);
    
    if (error.response?.data) {
      console.error('Dados do erro:', error.response.data);
    }
  }
}

contarRegistros();
