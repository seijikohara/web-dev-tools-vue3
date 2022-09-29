import { createApp } from "vue";
import { createPinia } from "pinia";
import VueGtag from "vue-gtag-next";
import App from "./App.vue";
import router from "./router";

import "@/assets/scss/layout.scss";

import PrimeVue from "primevue/config";

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.use(PrimeVue, { ripple: true, inputStyle: "outlined" });

const gaMeasurementId = process.env.VUE_APP_GA_MEASUREMENT_ID;
if (gaMeasurementId) {
  app.use(VueGtag, {
    property: {
      id: gaMeasurementId,
    },
  });
}

app.mount("#app");
