/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves project sites from a sub-path: /<repo>/.
// The deploy workflow sets BASE_PATH="/<repo>/" automatically (from the repo
// name) so assets, manifest and the service worker all resolve correctly with
// no manual edits. Locally it defaults to '/'.
const base = process.env.BASE_PATH || '/'

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'fonts/PlaywriteNZGuides-Regular.ttf',
        'fonts/Intro.ttf',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: '毛毡排字助手',
        short_name: '排字助手',
        description: '导入产品图片，添加宠物名字，全屏预览后下载或分享高清图片。完全本地运行。',
        lang: 'zh-CN',
        theme_color: '#F5F1E8',
        background_color: '#F5F1E8',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,ttf,woff2}'],
        // The built-in font is ~380KB; keep the default 2MiB cap which covers it.
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
})
