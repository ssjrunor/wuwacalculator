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
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
