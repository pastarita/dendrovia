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
      '@dendrovia/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
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
