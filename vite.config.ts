import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  base: 'Nomadly_travel-Itinerary_generator-API-',
  
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});

