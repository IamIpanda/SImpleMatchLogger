import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [preact(), wasm(), topLevelAwait()],
  base: "./",
  server: {
    proxy: {
      "/deck": "http://localhost:8081",
      "/match": "http://localhost:8081",
      "/databases": "http://atlas.iami/sml",
      "^/.*\.cdb$": "http://atlas.iami/sml",
      "/pics": "https://cdn.233.momobako.com/ygopro/"
    }
  },
  optimizeDeps: {
    exclude: ["cdb-transformer-wasm", "@sqlite.org/sqlite-wasm"]
  }
})
