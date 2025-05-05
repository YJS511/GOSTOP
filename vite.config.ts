import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true
      },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']  // 오프라인에서도 가능하게
      },

      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: '리액트 모바일 앱',
        short_name: 'MyApp',
        description: '설명',
        theme_color: '#000000',
        icons: [
          {
            src: '/logo.png', // public 폴더에 logo.png 파일 넣기
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
    })
  ],
})
