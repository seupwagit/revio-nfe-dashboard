/**
 * Script de teste para debug da autenticação
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4001';

async function testAuth() {
  console.log('🔍 Testando autenticação...\n');

  // 1. Testar endpoint de debug de ambiente
  console.log('1️⃣ Testando /api/debug/env...');
  try {
    const envResponse = await fetch(`${BASE_URL}/api/debug/env`);
    const envData = await envResponse.json();
    console.log('✅ Variáveis de ambiente:', JSON.stringify(envData, null, 2));
  } catch (error) {
    console.error('❌ Erro ao testar env:', error.message);
  }

  console.log('\n');

  // 2. Testar endpoint de debug de database
  console.log('2️⃣ Testando /api/debug/database...');
  try {
    const dbResponse = await fetch(`${BASE_URL}/api/debug/database`);
    const dbData = await dbResponse.json();
    console.log('✅ Status das conexões:', JSON.stringify(dbData, null, 2));
  } catch (error) {
    console.error('❌ Erro ao testar database:', error.message);
  }

  console.log('\n');

  // 3. Testar endpoint de debug de auth com credenciais de teste
  console.log('3️⃣ Testando /api/debug/auth...');
  const testCredentials = [
    { username: 'admin', password: 'admin' },
    { username: 'test', password: 'test' },
    { username: '1', password: '1' },
    { username: 'usuario', password: '123456' }
  ];

  for (const cred of testCredentials) {
    try {
      console.log(`   🔐 Testando: ${cred.username}/${cred.password}`);
      const authResponse = await fetch(`${BASE_URL}/api/debug/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cred)
      });
      
      const authData = await authResponse.json();
      console.log(`   📊 Resultado:`, JSON.stringify(authData, null, 2));
      
      // Se encontrou usuário, testar login real
      if (authData.steps && authData.steps.some(s => s.status === 'encontrado')) {
        console.log(`   🎯 Usuário encontrado! Testando login real...`);
        
        const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cred)
        });
        
        const loginData = await loginResponse.json();
        console.log(`   🔑 Login real (${loginResponse.status}):`, JSON.stringify(loginData, null, 2));
      }
      
    } catch (error) {
      console.error(`   ❌ Erro ao testar ${cred.username}:`, error.message);
    }
    console.log('');
  }
}

// Executar teste
testAuth().catch(console.error);