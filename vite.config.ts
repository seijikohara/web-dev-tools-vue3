import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      script: {
        defineModel: true,
        propsDestructure: true,
      },
    }),
  ],
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
    // Vite 7 default: baseline-widely-available (Chrome 107+, Edge 107+, Firefox 104+, Safari 16+)
    target: 'baseline-widely-available',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          primevue: ['primevue', '@primeuix/themes'],
          'ace-editor': ['ace-builds', 'vue3-ace-editor'],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['ace-builds/src-noconflict/ace', 'vue3-ace-editor'],
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
})
