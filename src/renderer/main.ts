import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { RouterLink, RouterView } from 'vue-router';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';

import App from './App.vue';
import { router } from './router';
import 'vuetify/styles';

const app = createApp(App);
const vuetify = createVuetify({ components, directives });

app.use(createPinia());
app.use(router);
app.use(vuetify);
app.component('RouterLink', RouterLink);
app.component('RouterView', RouterView);

app.mount('#app');
declare global {
  interface Window {
    __router?: typeof router;
  }
}
if (typeof window !== 'undefined') {
  window.__router = router;
}
