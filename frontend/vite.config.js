import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  css: {
    transformer: 'lightningcss',
    lightningcss: {
      targets: {
        chrome: 80 << 16,
        safari: 14 << 16,
        firefox: 80 << 16,
        edge: 80 << 16
      }
    }
  },
  build: {
    cssMinify: 'lightningcss'
  }
})
