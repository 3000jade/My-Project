import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
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
      '@gsap/react',
      'lenis',
      'lenis/react',
      '@mantine/core',
      '@mantine/hooks',
      '@mantine/carousel',
      '@tabler/icons-react',
      '@tanstack/react-virtual',
    ],
  },
})
