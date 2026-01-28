// Root vite config - redirects to frontend app
// This file exists for compatibility but the actual config is in apps/frontend/vite.config.ts

import { defineConfig } from 'vite'

export default defineConfig({
  // This config is mainly for legacy compatibility
  // The actual frontend development should use:
  // cd apps/frontend && npm run dev
  
  // Or use the monorepo scripts:
  // npm run dev:frontend
  
  build: {
    outDir: 'dist-legacy',
    emptyOutDir: true
  },
  
  server: {
    port: 3000,
    host: true
  }
})