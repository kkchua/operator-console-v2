import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://192.168.0.200:8200',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'node',
  },
})
