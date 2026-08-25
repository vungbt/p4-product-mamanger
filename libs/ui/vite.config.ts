import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Only used to run Storybook for @p4/ui. apps/web has its own vite.config.ts + build pipeline.
export default defineConfig({
  plugins: [react()],
});
