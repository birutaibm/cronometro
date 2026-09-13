import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { RouterLink, RouterView } from 'vue-router';

import App from './App.vue';
import { router } from './router';

const app = createApp(App);

app.use(createPinia());
app.use(router);
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
