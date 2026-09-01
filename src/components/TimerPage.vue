<script setup lang="ts">
import { defineComponent, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useStore } from '../stores/counter'

const router = useRouter()
const route = useRoute()
const store = useStore()

let timerInterval: any = null
const seconds = computed(() => store.getRemainingSeconds)
const formattedTime = computed(() => {
  const mins = Math.floor(seconds.value / 60)
  const secs = seconds.value % 60
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
})

const isRunning = computed(() => store.isRunning)

onMounted(() => {
  store.setTotalSeconds(parseInt(route.params.seconds as string) || 0)
  store.start()
  
  timerInterval = setInterval(() => {
    store.decrement()
    if (store.getRemainingSeconds <= 0) {
      store.stop()
      clearInterval(timerInterval!)
      timerInterval = null
      // Notify main process that countdown finished
      window.electronAPI.startCountdown(store.getRemainingSeconds)
    }
  }, 1000)
})

onBeforeUnmount(() => {
  if (timerInterval) {
    clearInterval(timerInterval)
  }
  store.stop()
})
</script>

<template>
  <div class="container">
    <div class="card">
      <h2>Cronômetro</h2>
      
      <p class="time-label">{{ formattedTime }}</p>
      
      <button 
        @click="isRunning ? store.stop() : store.start()" 
        class="btn-toggle"
        :class="{ 'running': isRunning }"
      >
        {{ isRunning ? 'Pausar' : 'Continuar' }}
      </button>
      
      <button 
        @click="router.push('/')" 
        class="btn-restart"
        style="margin-top: 1rem"
      >
        Reiniciar
      </button>
    </div>
  </div>
</template>

<style scoped>
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: #f0f2f5;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 360px;
  text-align: center;
  position: relative;
}

.time-label {
  font-size: 3.5rem;
  font-weight: 300;
  margin: 1rem 0;
  color: #2c3e50;
}

.btn-toggle {
  width: 100%;
  padding: 0.8rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin: 1rem 0;
  transition: background 0.2s;
}

.btn-toggle.running {
  background: #e74c3c;
  color: white;
}

.btn-toggle:not(.running) {
  background: #3498db;
  color: white;
}

.btn-restart {
  width: 100%;
  padding: 0.6rem;
  background: #95a5a6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
}
</style>