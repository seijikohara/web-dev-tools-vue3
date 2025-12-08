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
    // Vite 7 default: baseline-widely-available (Chrome 107+, Edge 107+, Firefox 104+, Safari 16+)
    target: 'baseline-widely-available',
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          primevue: ['primevue', '@primeuix/themes'],
          codemirror: ['codemirror', 'vue-codemirror6', '@codemirror/view', '@codemirror/state'],
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
