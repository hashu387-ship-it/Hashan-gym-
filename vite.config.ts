/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/apple-touch-icon.png', 'work-days.ics', 'ramadan.ics'],
      manifest: {
        name: 'Hashan Fit',
        short_name: 'Hashan Fit',
        description: '3-month fat-loss plan, workouts with how-to demos, and Fitbit Air tracking.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0d1012',
        theme_color: '#0e7c5f',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
        globIgnores: ['demos/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /\.ics$/],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/demos/'),
            handler: 'CacheFirst',
            options: { cacheName: 'demos', expiration: { maxEntries: 200 } },
          },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'api/**/*.test.ts'],
  },
});
