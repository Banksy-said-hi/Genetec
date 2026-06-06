import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Split big, rarely-changing vendor libs into their own cacheable chunks
        // so app-code edits don't bust the vendor cache.
        manualChunks(id) {
          if (id.includes('/node_modules/react') || id.includes('/node_modules/scheduler')) return 'react';
          if (id.includes('/node_modules/@mui/') || id.includes('/node_modules/@emotion/')) return 'mui';
          if (id.includes('/node_modules/@tanstack/')) return 'query';
        },
      },
    },
  },
})
