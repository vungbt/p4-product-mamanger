import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', 'i18next', 'react-i18next'],
    alias: [
      {
        find: '@p4/ui/locales',
        replacement: path.resolve(__dirname, '../../libs/ui/locales/index.ts'),
      },
      {
        find: '@p4/api-client',
        replacement: path.resolve(__dirname, '../../libs/api-client/src/index.tsx'),
      },
      {
        find: '@p4/shared',
        replacement: path.resolve(__dirname, '../../libs/shared/src/index.ts'),
      },
      {
        find: '@p4/auth',
        replacement: path.resolve(__dirname, '../../libs/auth/src/index.ts'),
      },
      {
        find: '@p4/ui/theme',
        replacement: path.resolve(__dirname, '../../libs/ui/theme'),
      },
      {
        find: '@p4/ui',
        replacement: path.resolve(__dirname, '../../libs/ui/index.ts'),
      },
      {
        find: '@',
        replacement: path.resolve(__dirname, 'src'),
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
