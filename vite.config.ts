import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { pwaPlugin } from './scripts/pwa-plugin.ts';

export default defineConfig({
  base: '/drink-rate-a56/',
  build: { outDir: 'build' },
  plugins: [react(), tailwindcss(), pwaPlugin()],
});
