import { createRouter, createWebHashHistory } from 'vue-router';
import TimerConfigurationsList from '../components/TimerConfigurationsList.vue';
import TimeInput from '../components/TimeInput.vue';
import TimerPage from '../components/TimerPage.vue';

const routes = [
  { path: '/', component: TimerConfigurationsList, name: 'timer-configurations-list' },
  {
    path: '/new_timer_configuration',
    component: TimeInput,
    name: 'new-timer-configuration',
  },
  { path: '/timer', component: TimerPage, name: 'timer' },
];

export const BASE_URL = '/';
export const router = createRouter({
  history: createWebHashHistory(BASE_URL),
  routes,
});
