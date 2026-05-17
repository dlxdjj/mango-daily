import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages 部署用：仓库名应该叫 mango-daily
// 本地开发时 base 自动是 /
const isProd = process.env.NODE_ENV === 'production';
const BASE = process.env.VITE_BASE_PATH || (isProd ? '/mango-daily/' : '/');

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'manifest.webmanifest'],
      manifest: {
        name: '今天发什么',
        short_name: '今天发什么',
        description: '芒狗 mango 的小红书日更助手',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        background_color: '#FFF7D6',
        theme_color: '#F8D76E',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        // 接口走 network-first，静态资源 cache-first
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/uploads/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'uploads-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }
            }
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false
  }
});
