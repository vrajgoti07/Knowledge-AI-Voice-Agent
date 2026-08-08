import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@':          path.resolve(__dirname, './src'),
      '@assets':    path.resolve(__dirname, './src/assets'),
      '@components':path.resolve(__dirname, './src/components'),
      '@layouts':   path.resolve(__dirname, './src/layouts'),
      '@pages':     path.resolve(__dirname, './src/pages'),
      '@hooks':     path.resolve(__dirname, './src/hooks'),
      '@store':     path.resolve(__dirname, './src/store'),
      '@context':   path.resolve(__dirname, './src/context'),
      '@services':  path.resolve(__dirname, './src/services'),
      '@utils':     path.resolve(__dirname, './src/utils'),
      '@types':     path.resolve(__dirname, './src/types'),
      '@routes':    path.resolve(__dirname, './src/routes'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@styles':    path.resolve(__dirname, './src/styles'),
      '@animations':path.resolve(__dirname, './src/animations'),
      '@providers': path.resolve(__dirname, './src/providers'),
      '@features':  path.resolve(__dirname, './src/features'),
    },
  },
  server: {
    port: 5173,
    host: true,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor'
            }
            if (id.includes('framer-motion') || id.includes('lucide-react') || id.includes('recharts')) {
              return 'ui-vendor'
            }
            if (id.includes('@radix-ui')) {
              return 'radix-vendor'
            }
            return 'vendor'
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'recharts'],
  },
})
