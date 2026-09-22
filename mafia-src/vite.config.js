import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Игра собирается прямо в статический сайт «Билим Арена».
// base: './' — чтобы работало и на GitHub Pages в подпапке, и локально.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: '../games/mafia',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1600,
  }
})
