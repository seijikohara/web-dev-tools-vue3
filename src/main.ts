import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { createGtag } from 'vue-gtag'
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'

import 'primeflex/primeflex.css'
import 'primeicons/primeicons.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.app-dark',
      cssLayer: {
        name: 'primevue',
        order: 'tailwind-base, primevue, tailwind-utilities',
      },
    },
  },
  ripple: true,
})

// Google Analytics configuration
const gaMeasurementId = import.meta.env.VUE_APP_GA_MEASUREMENT_ID
if (gaMeasurementId) {
  const gtag = createGtag({
    tagId: gaMeasurementId,
  })
  app.use(gtag)
}

app.mount('#app')
