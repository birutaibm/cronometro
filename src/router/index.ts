import { createRouter, createWebHistory } from 'vue-router'
import TimeInput from '../components/TimeInput.vue'
import TimerPage from '../components/TimerPage.vue'

const routes = [
  { path: '/', component: TimeInput, name: 'time-input' },
  { path: '/timer', component: TimerPage, name: 'timer' },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})