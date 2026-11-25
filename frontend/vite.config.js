import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if ((id.includes('leaflet') && !id.includes('geoman')) || id.includes('@googlemaps')) return 'vendor-maps';
          if (id.includes('framer-motion')) return 'vendor-motion';
        },
      },
    },
  },
  plugins: [
    tailwindcss(),
    react(),
  ],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react-router-dom',
      'framer-motion',
      'lenis',
      'lenis/react',
      '@tabler/icons-react',
      '@tanstack/react-virtual',
      '@base-ui/react/popover',
      'cmdk',
    ],
  },
  test: {
    root: __dirname,
    environment: 'jsdom',
    pool: 'vmThreads',
    globals: true,
    setupFiles: './tests/setup.js',
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
  },
})
