/// <reference types="vitest/config" />
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, type ProxyOptions } from 'vite';

// Where `npm run dev` / `npm run preview` send /api and /files (the API itself; in production nginx does this).
const apiUrl = process.env.API_URL ?? 'http://localhost:8080';
const proxy: Record<string, ProxyOptions> = {
  '/api': { target: apiUrl, changeOrigin: true, rewrite: (path) => path.replace(/^\/api/, '') },
  '/files': { target: apiUrl, changeOrigin: true },
};

export default defineConfig({
  plugins: [react()],
  build: {
    // MapLibre alone is ~1 MB; it is a lazy chunk loaded only by the map pages.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      input: {
        app: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin/index.html'),
      },
    },
  },
  server: { port: 5173, proxy },
  preview: { port: 4173, proxy },
  test: { environment: 'jsdom', include: ['src/**/*.test.{ts,tsx}'] },
});
