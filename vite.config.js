import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
console.log(">>> VITE CONFIG LOADED");
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://dbapi.ptit.edu.vn',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
