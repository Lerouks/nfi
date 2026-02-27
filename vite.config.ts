import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    // Cibler les navigateurs modernes (réduit la taille du bundle)
    target: 'es2018',
    // Seuil d'avertissement pour les chunks volumineux (kB)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Séparer les dépendances lourdes en chunks distincts pour un meilleur cache
        manualChunks: {
          // Framework React
          'vendor-react': ['react', 'react-dom', 'react-router'],
          // Sanity CMS client
          'vendor-sanity': ['@sanity/client'],
          // Supabase
          'vendor-supabase': ['@supabase/supabase-js'],
          // Graphiques Recharts
          'vendor-recharts': ['recharts'],
        },
      },
    },
  },
})
