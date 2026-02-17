import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3020,
    open: false,
  },
  resolve: {
    alias: {
      '@dendrovia/shared': '/Users/Patmac/denroot/packages/shared/src/index.ts',
    },
  },
});
