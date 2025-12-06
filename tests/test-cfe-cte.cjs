const axios = require('axios');

const config = {
  apiUrl: 'http://localhost:3000/api/WebView/Consultar',
  token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgwNTQ5MjBGOTg3QkVEN0E1OUI1ODYwQjMzRjkiLCJ4NXQiOiIyNWc2Z1JoNmdGU1NENWg3N1hwWnRZWUxNX2siLCJ0eXAiOiJhdCtqd3QifQ.eyJpc3MiOiJodHRwczovL2lkc2VydmVyLnJldmlvLmRpZ2l0YWwvIiwiZXhwIjoxNzM0NzEwNzU4LCJpYXQiOjE3MzQ2MjQzNTgsInNjb3BlIjoiYXBpMSIsImp0aSI6ImZjYTUzYzk0LTlhMjItNDk1MC1hMmQyLWQxMzIzMWJmOTAwNSIsInN1YiI6IjEiLCJvaV9wcnN0IjoiY2xpZW50IiwiY2xpZW50X2lkIjoiY2xpZW50Iiwib2lfdGtuX2lkIjoiMGQ1OTVmZjYtMDY1MS00MjZhLWI2NjQtZmY1MjVhMmE4ZDVkIn0.Yzoi4HFu6UpeqwkbdF_kWylbW7hhV_gufFXPu6R0AtV9KbUpjojpKod2WQLt6TWvxmL4BtZS6Zq2hvdL0zavhSoXvxVoNK0ARiM0K5FM6swRycXtFSe8-2EGfQYT1qNe4IHZxydadJoPv6qDHNMr8pJIAWfjAKMrAv0tiHRkAU3L_-7ccULuVzamkZfpVd_JEurWX3CpanZREMakwm0Yio6tqWLeXNus-b7ygBWyGVPqVMmHGMl54v4mbzxCEV_edj0SwdOguLYDepw-Q6UWA_HZ7qk9KonFK5DZtT6haFP0b83lD-QxLihAt31Qz_aEAllm-i3EE5rXt9lJ9Tgbxb2Zy1ZEirzB6fDNsnY4wgwiFFXI7qh7Igbc0D1qaCkAtfRTBkkkgkEeP-QI6NNMQiLfjDaTqdZ2zxPsS-WWWJ_tnaQjySV0treNeZNaUpLnTVqI5EVkbGfEKqJ1V7IYImbKYmuEOm0BOM9TXDlOKEYUgLlECLruQMnk0RW0pwOVUftt1h3UkyT8ySDMzEpQFhtoCEpXMQanqwMuntnlQoru80e0cISmh2JNzn-8lwRvzkO9V3Xwcy0AyPLYxgd5PeW82k3XMe2TQonY5vZRgDmgUm5iMr1mPIPR0_we0OOjiLDWahKqNomJUn9cj4Y5UACDC023VzNv3ewqwQxHT_U',
  host: '10.0.0.8',
  database: 'C67624577000145'
};

async function testarCollection(collection, nome) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🔍 TESTANDO ${nome} (${collection})`);
  console.log('='.repeat(80));

  const hoje = new Date().toISOString().split('T')[0];
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const params = {
    host: config.host,
    database: config.database,
    collection: collection,
    dtIni: trintaDiasAtras,
    dtFin: hoje,
    pg: 1,
    size: 2
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

    console.log(`✅ Status: ${response.status}`);
    
    const lista = response.data?.lista || [];
    console.log(`📦 Total de registros: ${lista.length}`);
    
    if (lista.length > 0) {
      console.log('\n📋 CAMPOS DO PRIMEIRO REGISTRO:');
      console.log(Object.keys(lista[0]).join(', '));
      
      console.log('\n📄 PRIMEIRO REGISTRO COMPLETO:');
      console.log(JSON.stringify(lista[0], null, 2));
    } else {
      console.log('⚠️ Nenhum registro encontrado');
    }

  } catch (error) {
    console.error(`❌ Erro: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Dados:`, error.response.data);
    }
  }
}

async function testarTodas() {
  await testarCollection('tbl_nfe_100', 'NF-e');
  await testarCollection('tbl_cfe_100', 'CF-e');
  await testarCollection('tbl_cte_100', 'CT-e');
}

testarTodas();
