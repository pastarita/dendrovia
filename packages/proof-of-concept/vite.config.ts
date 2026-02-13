import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

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
