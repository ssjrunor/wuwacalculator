import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const apiProxyTarget = process.env.WUWA_API_PROXY_TARGET || 'http://localhost:3001';

export default defineConfig({
  plugins: [
    react({
      exclude: [/workers\/.+\.js$/],
    }),
  ],
  resolve: {
    alias: [
      { find: '@app', replacement: resolve(__dirname, 'src/application') },
      { find: '@routes', replacement: resolve(__dirname, 'src/routes') },
      { find: '@features', replacement: resolve(__dirname, 'src/features') },
      { find: '@shared', replacement: resolve(__dirname, 'src/shared') },
      { find: '@', replacement: resolve(__dirname, 'src') },
    ],
  },

  worker: {
    format: 'es',
    plugins: () => [],
  },

  server: {
    host: true,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    },
  },

  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1700,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('tesseract.js')) return 'vendor-ocr';
            if (id.includes('antd')) return 'vendor-antd';
            if (id.includes('recharts')) return 'vendor-charts';
            if (id.includes('@dnd-kit')) return 'vendor-dnd';
            if (id.includes('react-select')) return 'vendor-select';
            if (id.includes('html-to-image') || id.includes('html2canvas')) return 'vendor-image';
            if (id.includes('framer-motion') || id.includes('styled-components')) return 'vendor-animation';
            if (id.includes('@react-oauth/google') || id.includes('jwt-decode')) return 'vendor-auth';
            if (
              id.includes('react/') ||
              id.includes('react-dom/') ||
              id.includes('react-router') ||
              id.includes('scheduler')
            ) {
              return 'vendor-react';
            }
            if (id.includes('lucide-react') || id.includes('lodash')) {
              return 'vendor-ui';
            }
            return 'vendor-misc';
          }

          if (id.includes('/src/routes/content/') || id.includes('/src/features/changelog/') || id.includes('/src/features/guides/')) {
            return 'route-content';
          }
          if (id.includes('/src/features/optimizer/')) {
            return 'feature-optimizer';
          }
          if (id.includes('/src/features/suggestions/')) {
            return 'feature-suggestions';
          }
          if (id.includes('/src/features/echoes/')) {
            return 'feature-echoes';
          }
          if (id.includes('/src/data/characters/ui/')) {
            return 'data-character-ui';
          }
          if (id.includes('/src/data/weapons/ui/')) {
            return 'data-weapon-ui';
          }
          if (id.includes('/src/data/characters-mapped.json')) return 'data-characters-mapped';
          if (id.includes('/src/data/weaponDetails.json')) return 'data-weapon-details';
          if (id.includes('/src/data/enemies.json')) return 'data-enemies';
          if (id.includes('/src/data/echoes.json')) return 'data-echoes';
          if (id.includes('/src/data/weapons.json')) return 'data-weapons';
          if (id.includes('/src/data/characterStates.json')) return 'data-character-states';
          if (id.includes('/src/shared/hooks/useGoogleAuth.js') || id.includes('/src/shared/utils/googleAuth.js')) {
            return 'feature-google-auth';
          }
        },
      },
    },
  },
});
