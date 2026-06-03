import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: false,
    // Playwright specs live under e2e/ and must not be picked up by Vitest.
    exclude: ['e2e/**', 'node_modules/**', 'dist/**'],
  },
});
