const axios = require('axios');

// Configurações do .env
const config = {
  apiUrl: 'http://localhost:3000/api/WebView/Consultar',
  token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgwNTQ5MjBGOTg3QkVEN0E1OUI1ODYwQjMzRjkiLCJ4NXQiOiIyNWc2Z1JoNmdGU1NENWg3N1hwWnRZWUxNX2siLCJ0eXAiOiJhdCtqd3QifQ.eyJpc3MiOiJodHRwczovL2lkc2VydmVyLnJldmlvLmRpZ2l0YWwvIiwiZXhwIjoxNzM0NzEwNzU4LCJpYXQiOjE3MzQ2MjQzNTgsInNjb3BlIjoiYXBpMSIsImp0aSI6ImZjYTUzYzk0LTlhMjItNDk1MC1hMmQyLWQxMzIzMWJmOTAwNSIsInN1YiI6IjEiLCJvaV9wcnN0IjoiY2xpZW50IiwiY2xpZW50X2lkIjoiY2xpZW50Iiwib2lfdGtuX2lkIjoiMGQ1OTVmZjYtMDY1MS00MjZhLWI2NjQtZmY1MjVhMmE4ZDVkIn0.Yzoi4HFu6UpeqwkbdF_kWylbW7hhV_gufFXPu6R0AtV9KbUpjojpKod2WQLt6TWvxmL4BtZS6Zq2hvdL0zavhSoXvxVoNK0ARiM0K5FM6swRycXtFSe8-2EGfQYT1qNe4IHZxydadJoPv6qDHNMr8pJIAWfjAKMrAv0tiHRkAU3L_-7ccULuVzamkZfpVd_JEurWX3CpanZREMakwm0Yio6tqWLeXNus-b7ygBWyGVPqVMmHGMl54v4mbzxCEV_edj0SwdOguLYDepw-Q6UWA_HZ7qk9KonFK5DZtT6haFP0b83lD-QxLihAt31Qz_aEAllm-i3EE5rXt9lJ9Tgbxb2Zy1ZEirzB6fDNsnY4wgwiFFXI7qh7Igbc0D1qaCkAtfRTBkkkgkEeP-QI6NNMQiLfjDaTqdZ2zxPsS-WWWJ_tnaQjySV0treNeZNaUpLnTVqI5EVkbGfEKqJ1V7IYImbKYmuEOm0BOM9TXDlOKEYUgLlECLruQMnk0RW0pwOVUftt1h3UkyT8ySDMzEpQFhtoCEpXMQanqwMuntnlQoru80e0cISmh2JNzn-8lwRvzkO9V3Xwcy0AyPLYxgd5PeW82k3XMe2TQonY5vZRgDmgUm5iMr1mPIPR0_we0OOjiLDWahKqNomJUn9cj4Y5UACDC023VzNv3ewqwQxHT_U',
  host: '10.0.0.8',
  database: 'C67624577000145',
  collection: 'tbl_nfe_100'
};

async function testarNFe() {
  console.log('🔍 TESTANDO CONSUMO DA API NF-e\n');
  console.log('📋 Configuração:');
  console.log('   URL:', config.apiUrl);
  console.log('   Host:', config.host);
  console.log('   Database:', config.database);
  console.log('   Collection:', config.collection);
  console.log('   Token:', config.token.substring(0, 50) + '...\n');

  // Data de hoje e 30 dias atrás
  const hoje = new Date().toISOString().split('T')[0];
  const trintaDiasAtras = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const params = {
    host: config.host,
    database: config.database,
    collection: config.collection,
    dtIni: trintaDiasAtras,
    dtFin: hoje,
    pg: 1,
    size: 5 // Apenas 5 registros para teste
  };

  console.log('📅 Parâmetros da consulta:');
  console.log('   Data Início:', params.dtIni);
  console.log('   Data Fim:', params.dtFin);
  console.log('   Página:', params.pg);
  console.log('   Tamanho:', params.size);
  console.log('\n🚀 Fazendo requisição...\n');

  try {
    const response = await axios.get(config.apiUrl, {
      params,
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    console.log('✅ SUCESSO!\n');
    console.log('📊 Status:', response.status, response.statusText);
    console.log('📦 Tipo de resposta:', typeof response.data);
    console.log('📦 É array?', Array.isArray(response.data));
    
    if (typeof response.data === 'object' && response.data !== null) {
      console.log('📦 Chaves da resposta:', Object.keys(response.data));
    }

    console.log('\n' + '='.repeat(80));
    console.log('📄 DADOS PUROS (JSON):');
    console.log('='.repeat(80));
    console.log(JSON.stringify(response.data, null, 2));
    console.log('='.repeat(80));

    // Análise da estrutura
    console.log('\n📊 ANÁLISE DA ESTRUTURA:\n');
    
    if (Array.isArray(response.data)) {
      console.log(`   ✓ Resposta é um array com ${response.data.length} itens`);
      if (response.data.length > 0) {
        console.log('\n   📋 Campos do primeiro item:');
        console.log('   ', Object.keys(response.data[0]).join(', '));
        console.log('\n   🔍 Primeiro item completo:');
        console.log(JSON.stringify(response.data[0], null, 2));
      }
    } else if (typeof response.data === 'object') {
      console.log('   ✓ Resposta é um objeto');
      const keys = Object.keys(response.data);
      console.log(`   ✓ Chaves encontradas: ${keys.join(', ')}`);
      
      // Procura por arrays dentro do objeto
      for (const key of keys) {
        if (Array.isArray(response.data[key])) {
          console.log(`\n   📦 Array encontrado em "${key}" com ${response.data[key].length} itens`);
          if (response.data[key].length > 0) {
            console.log('   📋 Campos do primeiro item:');
            console.log('   ', Object.keys(response.data[key][0]).join(', '));
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ ERRO!\n');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Mensagem:', error.message);
    console.error('\n📄 Resposta de erro:');
    console.error(JSON.stringify(error.response?.data, null, 2));
  }
}

testarNFe();
