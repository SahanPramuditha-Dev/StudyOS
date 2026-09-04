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
            if (id.includes('jspdf') || id.includes('pdfjs-dist') || id.includes('react-pdf')) {
              return 'pdf-vendor';
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'charts-vendor';
            }
            if (id.includes('xlsx') || id.includes('papaparse') || id.includes('jszip')) {
              return 'office-vendor';
            }
            if (id.includes('react-player') || id.includes('youtube-transcript')) {
              return 'player-vendor';
            }
            if (id.includes('@mui') || id.includes('lucide-react') || id.includes('framer-motion') || id.includes('@headlessui') || id.includes('@dnd-kit')) {
              return 'ui-vendor';
            }
            if (id.includes('firebase')) {
              return 'firebase-vendor';
            }
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom') || id.includes('@tanstack')) {
              return 'react-vendor';
            }
            if (id.includes('date-fns') || id.includes('nanoid') || id.includes('clsx') || id.includes('tailwind-merge')) {
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
