import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('@mui') || id.includes('lucide-react') || id.includes('framer-motion') || id.includes('@headlessui')) {
              return 'ui-vendor';
            }
            if (id.includes('date-fns') || id.includes('papaparse') || id.includes('recharts') || id.includes('xlsx')) {
              return 'utils-vendor';
            }
            return 'vendor';
          }
        }
      }
    },
    // Increase warning limit slightly since vendor chunks might still be large
    chunkSizeWarningLimit: 1000,
  }
});
