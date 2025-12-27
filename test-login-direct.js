/**
 * Teste direto de login com credenciais conhecidas
 */

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4001';

async function testLogin() {
  console.log('🔍 Testando login direto...\n');

  // Credenciais que sabemos que funcionam
  const credentials = [
    { username: '03205493000518', password: '123456' },
    { username: '03205493000860', password: '123456' },
    { username: '03205493001247', password: '123456' }
  ];

  for (const cred of credentials) {
    console.log(`🔐 Testando login: ${cred.username}/${cred.password}`);
    
    try {
      const response = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cred)
      });

      const data = await response.json();
      
      console.log(`📊 Status: ${response.status}`);
      console.log(`📋 Resposta:`, JSON.stringify(data, null, 2));
      
      if (response.ok) {
        console.log('✅ LOGIN FUNCIONOU!');
        break;
      } else {
        console.log('❌ Login falhou');
      }
      
    } catch (error) {
      console.error('❌ Erro na requisição:', error.message);
    }
    
    console.log('');
  }
}

testLogin();