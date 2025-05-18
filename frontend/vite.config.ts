// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import wasm from 'vite-plugin-wasm'

export default defineConfig({
  plugins: [react(), wasm()],
  optimizeDeps: {
    exclude: ['@rust-parser/pkg'] // Your future Rust WASM package
  }
})