const axios = require('axios');

const config = {
  apiUrl: 'http://localhost:3000/api/WebView/Consultar',
  token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgwNTQ5MjBGOTg3QkVEN0E1OUI1ODYwQjMzRjkiLCJ4NXQiOiIyNWc2Z1JoNmdGU1NENWg3N1hwWnRZWUxNX2siLCJ0eXAiOiJhdCtqd3QifQ.eyJpc3MiOiJodHRwczovL2lkc2VydmVyLnJldmlvLmRpZ2l0YWwvIiwiZXhwIjoxNzM0NzEwNzU4LCJpYXQiOjE3MzQ2MjQzNTgsInNjb3BlIjoiYXBpMSIsImp0aSI6ImZjYTUzYzk0LTlhMjItNDk1MC1hMmQyLWQxMzIzMWJmOTAwNSIsInN1YiI6IjEiLCJvaV9wcnN0IjoiY2xpZW50IiwiY2xpZW50X2lkIjoiY2xpZW50Iiwib2lfdGtuX2lkIjoiMGQ1OTVmZjYtMDY1MS00MjZhLWI2NjQtZmY1MjVhMmE4ZDVkIn0.Yzoi4HFu6UpeqwkbdF_kWylbW7hhV_gufFXPu6R0AtV9KbUpjojpKod2WQLt6TWvxmL4BtZS6Zq2hvdL0zavhSoXvxVoNK0ARiM0K5FM6swRycXtFSe8-2EGfQYT1qNe4IHZxydadJoPv6qDHNMr8pJIAWfjAKMrAv0tiHRkAU3L_-7ccULuVzamkZfpVd_JEurWX3CpanZREMakwm0Yio6tqWLeXNus-b7ygBWyGVPqVMmHGMl54v4mbzxCEV_edj0SwdOguLYDepw-Q6UWA_HZ7qk9KonFK5DZtT6haFP0b83lD-QxLihAt31Qz_aEAllm-i3EE5rXt9lJ9Tgbxb2Zy1ZEirzB6fDNsnY4wgwiFFXI7qh7Igbc0D1qaCkAtfRTBkkkgkEeP-QI6NNMQiLfjDaTqdZ2zxPsS-WWWJ_tnaQjySV0treNeZNaUpLnTVqI5EVkbGfEKqJ1V7IYImbKYmuEOm0BOM9TXDlOKEYUgLlECLruQMnk0RW0pwOVUftt1h3UkyT8ySDMzEpQFhtoCEpXMQanqwMuntnlQoru80e0cISmh2JNzn-8lwRvzkO9V3Xwcy0AyPLYxgd5PeW82k3XMe2TQonY5vZRgDmgUm5iMr1mPIPR0_we0OOjiLDWahKqNomJUn9cj4Y5UACDC023VzNv3ewqwQxHT_U',
  host: '10.0.0.8',
  database: 'C67624577000145'
};

async function contarRegistros() {
  console.log('📊 ESTIMANDO TOTAL DE REGISTROS NA COLLECTION NF-e\n');
  console.log('='.repeat(60));

  // Diferentes períodos para testar
  const periodos = [
    { nome: 'Último mês', meses: 1 },
    { nome: 'Últimos 3 meses', meses: 3 },
    { nome: 'Últimos 6 meses', meses: 6 },
    { nome: 'Último ano', meses: 12 }
  ];

  for (const periodo of periodos) {
    const hoje = new Date();
    const dataInicio = new Date();
    dataInicio.setMonth(hoje.getMonth() - periodo.meses);

    const dtFin = hoje.toISOString().split('T')[0];
    const dtIni = dataInicio.toISOString().split('T')[0];

    const params = {
      host: config.host,
      database: config.database,
      collection: 'tbl_nfe_100',
      dtIni: dtIni,
      dtFin: dtFin,
      pg: 1,
      size: 500 // Máximo por página
    };

    try {
      const response = await axios.get(config.apiUrl, {
        params,
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const lista = response.data?.lista || [];
      const total = lista.length;

      console.log(`\n📅 ${periodo.nome} (${dtIni} até ${dtFin})`);
      console.log(`   Registros retornados: ${total}`);
      
      if (total === 500) {
        console.log(`   ⚠️  Limite de 500 atingido - há mais registros!`);
      }

    } catch (error) {
      console.error(`\n❌ Erro no período ${periodo.nome}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('\n💡 OBSERVAÇÕES:');
  console.log('   • A API retorna no máximo 500 registros por página');
  console.log('   • Se um período retorna 500, há mais registros');
  console.log('   • Para contar o total exato, seria necessário paginar');
  console.log('   • Ou usar o endpoint de contador (se disponível)');
}

contarRegistros();
