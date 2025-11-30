import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://apinfe.revio.digital',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        followRedirects: true,
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('🔄 PROXY - Requisição interceptada:');
            console.log('  URL:', req.url);
            
            // Força os headers necessários
            if (req.headers.authorization) {
              proxyReq.setHeader('Authorization', req.headers.authorization as string);
            }
            proxyReq.setHeader('Content-Type', 'application/json');
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Accept-Encoding', 'gzip, deflate');
            proxyReq.setHeader('Accept-Language', 'pt-BR,pt;q=0.9');
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            proxyReq.setHeader('Connection', 'keep-alive');
            
            // Remove headers problemáticos do navegador
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('referer');
            proxyReq.removeHeader('sec-fetch-site');
            proxyReq.removeHeader('sec-fetch-mode');
            proxyReq.removeHeader('sec-fetch-dest');
            proxyReq.removeHeader('sec-ch-ua');
            proxyReq.removeHeader('sec-ch-ua-mobile');
            proxyReq.removeHeader('sec-ch-ua-platform');
            
            if (req.headers.authorization) {
              console.log('  ✅ Authorization:', req.headers.authorization.substring(0, 50) + '...');
            } else {
              console.log('  ⚠️ Authorization NÃO encontrado!');
            }
          });
          
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log('📥 PROXY - Resposta recebida:');
            console.log('  Status:', proxyRes.statusCode);
            console.log('  Headers:', proxyRes.headers);
          });
        }
      }
    }
  }
})
