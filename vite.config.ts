import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue({
      script: {
        // Vue 3.5+ defaults: defineModel and propsDestructure are stable
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
        // Vite 7: modern-compiler is now the default (legacy API removed)
        additionalData: `@use "@/assets/scss/index.scss" as *;`,
      },
    },
  },
  build: {
    manifest: true,
    // Vite 8 default: baseline-widely-available (Chrome 111+, Edge 111+, Firefox 114+, Safari 16.4+)
    target: 'baseline-widely-available',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rolldownOptions: {
      output: {
        // Vite 8: object form of manualChunks was removed. Use codeSplitting.groups instead.
        codeSplitting: {
          groups: [
            { test: /node_modules\/(vue|vue-router|pinia)\//, name: 'vendor' },
            { test: /node_modules\/(primevue|@primeuix\/themes)\//, name: 'primevue' },
            {
              test: /node_modules\/(codemirror|vue-codemirror6|@codemirror\/view|@codemirror\/state)\//,
              name: 'codemirror',
            },
          ],
        },
      },
    },
  },
  optimizeDeps: {
    include: ['codemirror', 'vue-codemirror6'],
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
})
