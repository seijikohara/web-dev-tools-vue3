import { createApp, type Component } from 'vue'
import { createPinia } from 'pinia'

import AppComponent from './App.vue'
import router from './router'

const App = AppComponent as Component

import { createGtag } from 'vue-gtag'
import PrimeVue from 'primevue/config'
import ToastService from 'primevue/toastservice'
import Tooltip from 'primevue/tooltip'
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

app.use(ToastService)
app.directive('tooltip', Tooltip)

// Google Analytics configuration
const gaMeasurementId = import.meta.env.VUE_APP_GA_MEASUREMENT_ID
if (gaMeasurementId) {
  const gtag = createGtag({
    tagId: gaMeasurementId,
  })
  app.use(gtag)
}

app.mount('#app')
