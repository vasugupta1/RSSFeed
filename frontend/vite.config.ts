/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Read backend URL from .NET Aspire environment variables or fallback to dev port
const apiTarget = process.env.services__rssfeedwebapp__http__0 || 
                  process.env.services__rssfeedwebapp__https__0 || 
                  'http://localhost:8002';

// Read Aspire OTLP endpoint for the frontend telemetry proxy
const otlpTarget = process.env.ASPIRE_DASHBOARD_OTLP_ENDPOINT_URL || 'http://localhost:19064';

console.log('Vite dev-server API proxy target:', apiTarget);
console.log('Vite dev-server OTLP proxy target:', otlpTarget);

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
      '/otlp': {
        target: otlpTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
