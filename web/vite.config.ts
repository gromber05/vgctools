/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    // En desarrollo, /api va al backend de FastAPI (backend/, puerto 8000).
    proxy: { '/api': 'http://127.0.0.1:8000' },
  },
  test: {
    include: ['src/**/*.test.ts'],
  },
});
