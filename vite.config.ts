import { defineConfig, type Plugin } from 'vite'
import path from 'path'
import fs from 'fs'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// ─── Plugin : résolution des imports figma:asset/* ───────────────────────────
// Figma Make utilise le schéma `figma:asset/HASH.ext` pour les assets importés
// depuis Figma. Ce plugin les résout vers `public/assets/figma/HASH.ext`
// (fichiers à placer manuellement lors du premier déploiement).
// Si le fichier est absent, un PNG transparent 1×1 est utilisé en fallback
// pour ne pas bloquer le build.
// ─────────────────────────────────────────────────────────────────────────────
const FALLBACK_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJ' +
  'AAAAC0lEQVQI12NgAAIABQAABjE+ibYAAAAASUVORK5CYII=';

function figmaAssetPlugin(): Plugin {
  return {
    name: 'vite-plugin-figma-asset',
    enforce: 'pre',

    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) return '\0' + id;
    },

    load(id: string) {
      if (!id.startsWith('\0figma:asset/')) return;

      const filename = id.replace('\0figma:asset/', '');
      // Cherche d'abord public/assets/figma/<filename>
      const diskPath = path.resolve(__dirname, 'public', 'assets', 'figma', filename);

      if (fs.existsSync(diskPath)) {
        // Fichier trouvé → URL publique servie statiquement
        return `export default "/assets/figma/${filename}"`;
      }

      // Fallback silencieux (PNG transparent)
      console.warn(
        `[figma-asset] ⚠️  Asset non trouvé : ${filename}\n` +
        `  → Placez le fichier dans public/assets/figma/${filename}`,
      );
      return `export default "${FALLBACK_PNG}"`;
    },
  };
}

// ─── Configuration Vite ───────────────────────────────────────────────────────
export default defineConfig({
  base: "/nfi/",
  plugins: [
    react(),
    tailwindcss(),
    figmaAssetPlugin(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Types de fichiers importables en tant qu'asset brut
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // Base URL — "/" pour un domaine racine (nfireport.com)
  // À changer en "/nom-du-repo/" si le site est hébergé sur un sous-chemin GitHub Pages
  base: '/',

  build: {
    outDir: 'dist',
    // Sourcemaps désactivés en production (performance + sécurité)
    sourcemap: false,
    // Augmente légèrement le seuil d'alerte de taille de chunk
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        // Code-splitting manuel pour optimiser le chargement initial
        manualChunks(id: string) {
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router')
          ) {
            return 'react-vendor';
          }
          if (
            id.includes('node_modules/recharts') ||
            id.includes('node_modules/d3-')  ||
            id.includes('node_modules/victory-')
          ) {
            return 'charts';
          }
          if (id.includes('node_modules/@radix-ui/')) {
            return 'radix-ui';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          if (
            id.includes('node_modules/@clerk/') ||
            id.includes('node_modules/@supabase/')
          ) {
            return 'services';
          }
        },
      },
    },
  },

  // Serveur de dev local
  server: {
    port: 5173,
    open: true,
  },

  // Serveur de preview (post-build)
  preview: {
    port: 4173,
    open: true,
  },
})