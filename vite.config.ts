import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
//import path from 'path'

/// <reference types="vitest" />

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const port = parseInt(env.VITE_PORT || '3000', 10);
  
  return {
    plugins: [react()],
    publicDir: 'public',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        output: {
          // Configuração específica para Web Workers
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.worker.js')) {
              return 'workers/[name]-[hash][extname]'
            }
            return 'assets/[name]-[hash][extname]'
          }
        }
      }
    },
    worker: {
      format: 'es',
      plugins: () => [react()]
    },
    resolve: {
      // alias: {
      //   '@': path.resolve(__dirname, './src/frontend'),
      // },
    },
    server: {
      // Configuração CORS - Aceita requisições de todas as origens
      cors: {
        origin: '*', // Permite todas as origens
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: 204
      },
      // Configuração adicional do servidor
      host: true, // Permite acesso de qualquer IP (0.0.0.0) - Required for Coolify
      port, // Read from VITE_PORT environment variable with fallback to 3000
      strictPort: false,
    proxy: {
      '/api': {
        target: env.VITE_API_BASE_URL,
        changeOrigin: true,
        secure: true,
       // rewrite: (path) => path.replace(/^\/api/, '/api'),
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
    },
    preview: {
      port, // Use same port for preview server
      host: true, // Required for Coolify
    },
    test: {
      globals: true,
      environment: 'node',
    }
  };
});
