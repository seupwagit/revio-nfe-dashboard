const axios = require('axios');

async function benchmark() {
  console.log('🏁 BENCHMARK: Comparando PageSizes\n');
  console.log('='.repeat(60));

  const hoje = new Date();
  const inicio = new Date();
  inicio.setDate(hoje.getDate() - 30); // 30 dias

  const pageSizes = [1000, 5000, 10000, 20000];
  const results = [];

  for (const size of pageSizes) {
    console.log(`\n📦 Testando PageSize: ${size.toLocaleString()}`);
    console.log('-'.repeat(40));

    const startTime = Date.now();
    let totalRegistros = 0;
    let paginas = 0;

    try {
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const pageStart = Date.now();
        
        const response = await axios.get('http://localhost:3000/api/WebView/Consultar', {
          params: {
            host: '10.0.0.8',
            database: 'C67624577000145',
            collection: 'tbl_nfe_100',
            dtIni: inicio.toISOString().split('T')[0],
            dtFim: hoje.toISOString().split('T')[0],
            pg: page,
            size: size
          },
          headers: {
            'Authorization': 'Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6IkRCOTgzQTgxMTg3QTgwNTQ5MjBGOTg3QkVEN0E1OUI1ODYwQjMzRjkiLCJ4NXQiOiIyNWc2Z1JoNmdGU1NENWg3N1hwWnRZWUxNX2siLCJ0eXAiOiJhdCtqd3QifQ.eyJpc3MiOiJodHRwczovL2lkc2VydmVyLnJldmlvLmRpZ2l0YWwvIiwiZXhwIjoxNzM0NzEwNzU4LCJpYXQiOjE3MzQ2MjQzNTgsInNjb3BlIjoiYXBpMSIsImp0aSI6ImZjYTUzYzk0LTlhMjItNDk1MC1hMmQyLWQxMzIzMWJmOTAwNSIsInN1YiI6IjEiLCJvaV9wcnN0IjoiY2xpZW50IiwiY2xpZW50X2lkIjoiY2xpZW50Iiwib2lfdGtuX2lkIjoiMGQ1OTVmZjYtMDY1MS00MjZhLWI2NjQtZmY1MjVhMmE4ZDVkIn0.Yzoi4HFu6UpeqwkbdF_kWylbW7hhV_gufFXPu6R0AtV9KbUpjojpKod2WQLt6TWvxmL4BtZS6Zq2hvdL0zavhSoXvxVoNK0ARiM0K5FM6swRycXtFSe8-2EGfQYT1qNe4IHZxydadJoPv6qDHNMr8pJIAWfjAKMrAv0tiHRkAU3L_-7ccULuVzamkZfpVd_JEurWX3CpanZREMakwm0Yio6tqWLeXNus-b7ygBWyGVPqVMmHGMl54v4mbzxCEV_edj0SwdOguLYDepw-Q6UWA_HZ7qk9KonFK5DZtT6haFP0b83lD-QxLihAt31Qz_aEAllm-i3EE5rXt9lJ9Tgbxb2Zy1ZEirzB6fDNsnY4wgwiFFXI7qh7Igbc0D1qaCkAtfRTBkkkgkEeP-QI6NNMQiLfjDaTqdZ2zxPsS-WWWJ_tnaQjySV0treNeZNaUpLnTVqI5EVkbGfEKqJ1V7IYImbKYmuEOm0BOM9TXDlOKEYUgLlECLruQMnk0RW0pwOVUftt1h3UkyT8ySDMzEpQFhtoCEpXMQanqwMuntnlQoru80e0cISmh2JNzn-8lwRvzkO9V3Xwcy0AyPLYxgd5PeW82k3XMe2TQonY5vZRgDmgUm5iMr1mPIPR0_we0OOjiLDWahKqNomJUn9cj4Y5UACDC023VzNv3ewqwQxHT_U'
          },
          timeout: 30000
        });

        const pageTime = ((Date.now() - pageStart) / 1000).toFixed(2);
        const lista = response.data?.lista || [];
        
        console.log(`  Página ${page}: ${lista.length} registros em ${pageTime}s`);
        
        totalRegistros += lista.length;
        paginas++;

        if (lista.length < size) {
          hasMore = false;
        } else {
          page++;
        }
      }

      const endTime = Date.now();
      const tempoTotal = ((endTime - startTime) / 1000).toFixed(2);
      const registrosPorSegundo = (totalRegistros / parseFloat(tempoTotal)).toFixed(0);

      results.push({
        pageSize: size,
        tempo: parseFloat(tempoTotal),
        registros: totalRegistros,
        paginas: paginas,
        velocidade: parseInt(registrosPorSegundo)
      });

      console.log(`\n✅ Resultado:`);
      console.log(`   Total: ${totalRegistros} registros`);
      console.log(`   Páginas: ${paginas}`);
      console.log(`   Tempo: ${tempoTotal}s`);
      console.log(`   Velocidade: ${registrosPorSegundo} registros/s`);

    } catch (error) {
      console.log(`❌ Erro:`, error.message);
    }
  }

  // Comparação final
  console.log('\n' + '='.repeat(60));
  console.log('📊 COMPARAÇÃO FINAL\n');
  
  results.sort((a, b) => a.tempo - b.tempo);
  
  results.forEach((r, i) => {
    const emoji = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
    console.log(`${emoji} PageSize ${r.pageSize.toLocaleString().padEnd(6)} | ${r.tempo.toFixed(2)}s | ${r.paginas} páginas | ${r.velocidade} reg/s`);
  });

  console.log('\n💡 CONCLUSÃO:');
  const melhor = results[0];
  const pior = results[results.length - 1];
  const diferenca = ((pior.tempo - melhor.tempo) / melhor.tempo * 100).toFixed(0);
  console.log(`   Melhor: ${melhor.pageSize.toLocaleString()} (${melhor.tempo}s)`);
  console.log(`   Pior: ${pior.pageSize.toLocaleString()} (${pior.tempo}s)`);
  console.log(`   Diferença: ${diferenca}% mais lento`);
}

benchmark();
