import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { pwaPlugin } from './scripts/pwa-plugin.ts';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig(({ mode }) => ({
  base: mode === 'android' ? '/' : '/drink-rate-a56/',
  build: { outDir: mode === 'android' ? 'build-android' : 'build' },
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  plugins: [react(), tailwindcss(), ...(mode === 'android' ? [] : [pwaPlugin()])],
}));
