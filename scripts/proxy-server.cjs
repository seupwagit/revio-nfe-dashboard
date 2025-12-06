// Servidor proxy simples que funciona
const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.url.startsWith('/api/')) {
    const targetUrl = 'https://apinfe.revio.digital' + req.url;
    console.log('🔄 Proxy:', req.method, targetUrl);
    
    const options = {
      method: req.method,
      headers: {
        'Authorization': req.headers.authorization || '',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    console.log('📤 Headers:', options.headers);

    https.get(targetUrl, options, (apiRes) => {
      console.log('✅ Status:', apiRes.statusCode);
      
      res.writeHead(apiRes.statusCode, {
        'Content-Type': apiRes.headers['content-type'] || 'application/json',
        'Access-Control-Allow-Origin': '*'
      });

      apiRes.pipe(res);
    }).on('error', (err) => {
      console.error('❌ Erro:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Proxy server rodando em http://localhost:${PORT}`);
  console.log(`   Use: http://localhost:${PORT}/api/WebView/Consultar?...`);
});
