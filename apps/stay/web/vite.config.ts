import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const STAY_API_URL = process.env.STAY_API_PROXY_TARGET ?? 'http://localhost:3011';

// Same-origin `/api` keeps the Better Auth HttpOnly cookie on the web host (dev and preview).
const proxy = {
  '/api': {
    target: STAY_API_URL,
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom', 'i18next', 'react-i18next', '@tanstack/react-query'],
    alias: [{ find: '@', replacement: path.resolve(import.meta.dirname, 'src') }],
  },
  build: {
    rolldownOptions: {
      output: {
        // Long-lived vendor chunks keep the entry small and cache across releases.
        codeSplitting: {
          groups: [
            {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
            },
            { name: 'query', test: /[\\/]node_modules[\\/]@tanstack[\\/]/ },
            { name: 'i18n', test: /[\\/]node_modules[\\/](i18next|react-i18next)[\\/]/ },
            {
              name: 'auth',
              test: /[\\/]node_modules[\\/](better-auth|@better-auth|better-call)[\\/]/,
            },
          ],
        },
      },
    },
  },
  server: { port: 5174, strictPort: true, proxy },
  preview: { port: 5174, strictPort: true, proxy },
});
