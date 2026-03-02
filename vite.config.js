import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const apiProxyTarget = process.env.WUWA_API_PROXY_TARGET || 'http://localhost:3001';
const isNodeModulePackage = (id, pkg) =>
  id.includes(`/node_modules/${pkg}/`) || id.includes(`\\node_modules\\${pkg}\\`);

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
            if (isNodeModulePackage(id, 'tesseract.js')) return 'vendor-ocr';
            if (isNodeModulePackage(id, 'antd')) return 'vendor-antd';
            if (isNodeModulePackage(id, 'recharts')) return 'vendor-charts';
            if (id.includes('/node_modules/@dnd-kit/') || id.includes('\\node_modules\\@dnd-kit\\')) return 'vendor-dnd';
            if (isNodeModulePackage(id, 'react-select')) return 'vendor-select';
            if (isNodeModulePackage(id, 'html-to-image') || isNodeModulePackage(id, 'html2canvas')) return 'vendor-image';
            if (isNodeModulePackage(id, 'framer-motion') || isNodeModulePackage(id, 'styled-components')) return 'vendor-animation';
            if (isNodeModulePackage(id, '@react-oauth/google') || isNodeModulePackage(id, 'jwt-decode')) return 'vendor-auth';
            if (
              isNodeModulePackage(id, 'react') ||
              isNodeModulePackage(id, 'react-dom') ||
              isNodeModulePackage(id, 'scheduler')
            ) {
              return 'vendor-react';
            }
            if (
              isNodeModulePackage(id, 'react-router') ||
              isNodeModulePackage(id, 'react-router-dom') ||
              isNodeModulePackage(id, '@remix-run/router')
            ) {
              return 'vendor-router';
            }
            if (isNodeModulePackage(id, 'lucide-react') || isNodeModulePackage(id, 'lodash')) {
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
