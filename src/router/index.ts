import { createRouter, createWebHashHistory } from 'vue-router';
import TimeInput from '../components/TimeInput.vue';
import TimerPage from '../components/TimerPage.vue';

const routes = [
  { path: '/', component: TimeInput, name: 'time-input' },
  { path: '/timer/:seconds?', component: TimerPage, name: 'timer' },
];

export const BASE_URL = '/';
export const router = createRouter({
  history: createWebHashHistory(BASE_URL),
  routes,
});
