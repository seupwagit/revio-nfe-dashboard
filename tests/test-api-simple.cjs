const axios = require('axios');

async function testarAPI() {
  console.log('🔍 Testando API...\n');

  const hoje = new Date();
  const inicio = new Date();
  inicio.setDate(hoje.getDate() - 30);

  const params = {
    host: '10.0.0.8',
    database: 'C67624577000145',
    collection: 'tbl_nfe_100',
    dtIni: inicio.toISOString().split('T')[0],
    dtFin: hoje.toISOString().split('T')[0],
    pg: 1,
    size: 5
  };

  console.log('📅 Período:', params.dtIni, 'até', params.dtFin);
  console.log('📄 Buscando 5 registros...\n');

  try {
    const response = await axios.get('http://localhost:3000/api/WebView/Consultar', { 
      params,
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgwNTQ5MjBGOTg3QkVEN0E1OUI1ODYwQjMzRjkiLCJ4NXQiOiIyNWc2Z1JoNmdGU1NENWg3N1hwWnRZWUxNX2siLCJ0eXAiOiJhdCtqd3QifQ.eyJpc3MiOiJodHRwczovL2lkc2VydmVyLnJldmlvLmRpZ2l0YWwvIiwiZXhwIjoxNzM0NzEwNzU4LCJpYXQiOjE3MzQ2MjQzNTgsInNjb3BlIjoiYXBpMSIsImp0aSI6ImZjYTUzYzk0LTlhMjItNDk1MC1hMmQyLWQxMzIzMWJmOTAwNSIsInN1YiI6IjEiLCJvaV9wcnN0IjoiY2xpZW50IiwiY2xpZW50X2lkIjoiY2xpZW50Iiwib2lfdGtuX2lkIjoiMGQ1OTVmZjYtMDY1MS00MjZhLWI2NjQtZmY1MjVhMmE4ZDVkIn0.Yzoi4HFu6UpeqwkbdF_kWylbW7hhV_gufFXPu6R0AtV9KbUpjojpKod2WQLt6TWvxmL4BtZS6Zq2hvdL0zavhSoXvxVoNK0ARiM0K5FM6swRycXtFSe8-2EGfQYT1qNe4IHZxydadJoPv6qDHNMr8pJIAWfjAKMrAv0tiHRkAU3L_-7ccULuVzamkZfpVd_JEurWX3CpanZREMakwm0Yio6tqWLeXNus-b7ygBWyGVPqVMmHGMl54v4mbzxCEV_edj0SwdOguLYDepw-Q6UWA_HZ7qk9KonFK5DZtT6haFP0b83lD-QxLihAt31Qz_aEAllm-i3EE5rXt9lJ9Tgbxb2Zy1ZEirzB6fDNsnY4wgwiFFXI7qh7Igbc0D1qaCkAtfRTBkkkgkEeP-QI6NNMQiLfjDaTqdZ2zxPsS-WWWJ_tnaQjySV0treNeZNaUpLnTVqI5EVkbGfEKqJ1V7IYImbKYmuEOm0BOM9TXDlOKEYUgLlECLruQMnk0RW0pwOVUftt1h3UkyT8ySDMzEpQFhtoCEpXMQanqwMuntnlQoru80e0cISmh2JNzn-8lwRvzkO9V3Xwcy0AyPLYxgd5PeW82k3XMe2TQonY5vZRgDmgUm5iMr1mPIPR0_we0OOjiLDWahKqNomJUn9cj4Y5UACDC023VzNv3ewqwQxHT_U'
      }
    });

    console.log('✅ Status:', response.status);
    console.log('📊 Dados recebidos:', response.data);
    
    const lista = response.data?.lista || [];
    console.log('\n📋 Total de registros:', lista.length);
    
    if (lista.length > 0) {
      console.log('\n🔍 Primeiro registro:');
      const primeiro = lista[0];
      console.log('  - NUMERO:', primeiro.NUMERO);
      console.log('  - VL_DOC:', primeiro.VL_DOC);
      console.log('  - DT_DOC:', primeiro.DT_DOC);
      console.log('  - EMIT_XNOME:', primeiro.EMIT_XNOME);
      console.log('  - IND_OPER:', primeiro.IND_OPER);
      console.log('  - PROTOCOLADA:', primeiro.PROTOCOLADA);
      console.log('\n✅ Campos corretos para agregação!');
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testarAPI();
