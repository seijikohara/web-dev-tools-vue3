import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  envPrefix: 'VUE_APP_',
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/scss/index.scss" as *;`,
      },
    },
  },
  build: {
    manifest: true,
    target: 'esnext',
  },
  optimizeDeps: {
    include: ['ace-builds/src-noconflict/ace', 'vue3-ace-editor'],
  },
})
