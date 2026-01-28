
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

async function run() {
  const token = process.env.VITE_API_BEARER_TOKEN;
  const baseUrl = 'http://localhost:4001'; // Backend port
  
  const hoje = new Date();
  const trintaDiasAtras = new Date();
  trintaDiasAtras.setDate(hoje.getDate() - 30);
  
  const params = {
    collection: 'tbl_nfe_100',
    dtIni: trintaDiasAtras.toISOString().split('T')[0],
    dtFin: hoje.toISOString().split('T')[0]
  };
  
  console.log('Testing Analytics Agreggation...');
  console.log('URL:', `${baseUrl}/api/analytics/aggregate`);
  console.log('Params:', params);
  
  try {
    const response = await fetch(`${baseUrl}/api/analytics/aggregate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(params)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    
    console.log('Response Success:', data.success);
    console.log('Execution Time:', data.executionTime);
    
    if (data.data) {
      console.log('Total Notas:', data.data.stats?.totalNotas);
      console.log('Total Valor:', data.data.stats?.totalValor);
      
      if (data.data.faturamentoDiario?.length > 0) {
        console.log('Faturamento Diario Sample:', data.data.faturamentoDiario[0]);
      } else {
        console.log('Faturamento Diario is EMPTY');
      }
    } else {
      console.log('Data object is MISSING in response');
    }
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

run();
