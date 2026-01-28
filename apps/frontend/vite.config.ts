import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@fiscal/shared': path.resolve(__dirname, '../../packages/shared/src'),
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: parseInt(process.env.VITE_PORT || '4000'), // Use environment variable with fallback
    host: true,
    proxy: {
      '/api': {
        target: `http://localhost:${process.env.BACKOFFICE_PORT || '4001'}`, // Use environment variable with fallback
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['@fiscal/shared'],
  },
})