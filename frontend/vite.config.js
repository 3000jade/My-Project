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
          if (id.includes('leaflet') || id.includes('@geoman-io') || id.includes('@googlemaps')) return 'vendor-maps';
          if (id.includes('@mantine')) return 'vendor-mantine';
          if (id.includes('framer-motion') || id.includes('gsap')) return 'vendor-motion';
          if (id.includes('quill')) return 'vendor-editor';
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
      'gsap',
      'lenis',
      'lenis/react',
      '@mantine/core',
      '@tabler/icons-react',
      '@tanstack/react-virtual',
    ],
  },
  test: {
    root: __dirname,
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      '../test files/frontend/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
    ],
  },
})
