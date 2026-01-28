/**
 * Test Login API
 * 
 * Simple script to test the login API endpoint
 */

const API_BASE_URL = 'http://localhost:4001';

async function testLogin() {
  console.log('🔐 Testing Login API...');
  console.log('======================');
  
  const credentials = {
    username: 'divino@grupochama.com.br',
    password: '123456789'
  };
  
  try {
    console.log('📡 Making request to:', `${API_BASE_URL}/api/auth/login`);
    console.log('📋 Credentials:', { username: credentials.username, password: '[HIDDEN]' });
    
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });
    
    console.log('📊 Response Status:', response.status);
    console.log('📊 Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login Success!');
      console.log('📋 Response Structure:', {
        success: data.success,
        hasData: !!data.data,
        hasToken: !!(data.data && data.data.token),
        hasUser: !!(data.data && data.data.user),
        userFields: data.data && data.data.user ? Object.keys(data.data.user) : []
      });
      
      if (data.data && data.data.user) {
        console.log('👤 User Info:', {
          usrCodigo: data.data.user.usrCodigo,
          usrNome: data.data.user.usrNome,
          usrLogin: data.data.user.usrLogin,
          bancoDeDados: data.data.user.bancoDeDados,
          isAdmin: data.data.user.isAdmin
        });
      }
    } else {
      console.log('❌ Login Failed!');
      console.log('📋 Error Response:', data);
    }
    
  } catch (error) {
    console.error('💥 Request Error:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Connection refused - is the backend running on port 4001?');
      console.error('💡 Try: pnpm --filter @fiscal/backend dev');
    }
  }
}

// Run the test
testLogin();