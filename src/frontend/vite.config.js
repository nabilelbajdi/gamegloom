import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        // Route each node_modules dependency to a named vendor chunk.
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (id.includes('react-router')) return 'react-router'
          if (
            id.includes('/react/') ||
            id.includes('/react-dom/') ||
            id.includes('/scheduler/')
          ) return 'react'
          if (id.includes('framer-motion')) return 'framer-motion'
          if (id.includes('lucide-react') || id.includes('@fortawesome')) return 'icons'
          if (id.includes('react-slick') || id.includes('slick-carousel')) return 'carousel'
          if (id.includes('@sentry')) return 'sentry'
          return 'vendor'
        },
      },
    },
  },
})
