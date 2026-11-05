import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    dedupe: ['react', 'react-dom', 'i18next', 'react-i18next'],
    alias: [
      {
        find: '@p4/api-client',
        replacement: path.resolve(import.meta.dirname, '../../libs/api-client/src/index.tsx'),
      },
      {
        find: '@p4/shared',
        replacement: path.resolve(import.meta.dirname, '../../libs/shared/src/index.ts'),
      },
      {
        find: '@p4/auth',
        replacement: path.resolve(import.meta.dirname, '../../libs/auth/src/index.ts'),
      },
      {
        find: '@',
        replacement: path.resolve(import.meta.dirname, 'src'),
      },
    ],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
