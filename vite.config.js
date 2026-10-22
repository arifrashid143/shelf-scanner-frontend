import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { apiApp } from './server/api.js'

function backendApiPlugin() {
  return {
    name: 'shelf-scanner-backend-api',
    configureServer(server) {
      server.middlewares.use('/api', apiApp)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    backendApiPlugin(),
  ],
})
