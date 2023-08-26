import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import VueGtag from 'vue-gtag'
import PrimeVue from 'primevue/config'

import 'primeflex/primeflex.css'
import 'primevue/resources/themes/saga-blue/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.use(PrimeVue, { ripple: true, inputStyle: 'outlined' })

const gaMeasurementId = import.meta.env.VUE_APP_GA_MEASUREMENT_ID
if (gaMeasurementId) {
  app.use(
    VueGtag,
    {
      pageTrackerScreenviewEnabled: true,
      config: {
        id: gaMeasurementId,
      },
    },
    router,
  )
}

app.mount('#app')
