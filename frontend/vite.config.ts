import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Read backend URL from .NET Aspire environment variables or fallback to dev port
const apiTarget = process.env.services__rssfeedwebapp__http__0 || 
                  process.env.services__rssfeedwebapp__https__0 || 
                  'http://localhost:8002';

console.log('Vite dev-server API proxy target:', apiTarget);

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
    },
  },
})
