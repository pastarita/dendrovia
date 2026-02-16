import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3021,
    open: false,
  },
  resolve: {
    alias: {
      '@dendrovia/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      external: ['path', 'fs', 'url', 'node:path', 'node:fs', 'node:url', 'node:fs/promises', 'pino', 'pino-pretty'],
      output: {
        manualChunks: {
          three: ['three'],
          r3f: ['@react-three/fiber', '@react-three/drei'],
          postprocessing: ['@react-three/postprocessing'],
        },
      },
    },
  },
});
