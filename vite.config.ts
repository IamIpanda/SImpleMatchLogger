import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact()],
  base: "./",
  server: {
    proxy: {
      "/deck": "http://localhost:8080",
      "/match": "http://localhost:8080"
    }
  }
})
