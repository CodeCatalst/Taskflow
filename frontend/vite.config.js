import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isDevelopment = mode === 'development';
  
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['logo.png', 'icons/*.png'],
        injectRegister: 'auto',
        strategies: 'generateSW',
        manifest: {
          name: 'TaskFlow - Task Management System',
          short_name: 'TaskFlow',
          description: 'A comprehensive, role-based task management system for teams',
          theme_color: '#667eea',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/icons/pwa-64x64.png',
              sizes: '64x64',
              type: 'image/png'
            },
            {
              src: '/icons/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: '/icons/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: '/icons/apple-touch-icon-180x180.png',
              sizes: '180x180',
              type: 'image/png'
            },
            {
              src: '/icons/maskable-icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3 MB
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\./i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 5 * 60 // 5 minutes
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'image-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
                }
              }
            },
            {
              urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'font-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module'
        }
      })
    ],
    server: {
      host: '0.0.0.0',
      port: 3000,
      hmr: isDevelopment ? {
        protocol: 'ws',
        host: 'localhost',
        port: 3000,
      } : false,
      proxy: isDevelopment ? {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
        }
      } : undefined
    },
    build: {
      outDir: 'dist',
      sourcemap: isDevelopment,
      minify: !isDevelopment,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'chart-vendor': ['recharts'],
          }
        }
      }
    },
    preview: {
      port: 3000,
      host: true
    }
  };
});