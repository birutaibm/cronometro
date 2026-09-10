<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useCounterStore } from '../stores/counter'

const router = useRouter()
const route = useRoute()
const store = useCounterStore()

let cleanupTick: (() => void) | null = null
let cleanupFinished: (() => void) | null = null

const seconds = computed(() => store.remainingSeconds)
const formattedTime = computed(() => store.formattedTime)
const isRunning = computed(() => store.isRunning)

onMounted(() => {
  const paramsSeconds = route.params.seconds
    ? parseInt(route.params.seconds as string)
    : store.totalSeconds
  if (paramsSeconds > 0) {
    store.setTime(paramsSeconds)
  }

  cleanupTick = window.electronAPI.onTick((remainingSeconds: number) => {
    store.remainingSeconds = remainingSeconds
  })

  cleanupFinished = window.electronAPI.onFinished(() => {
    store.finish()
  })
})

onBeforeUnmount(() => {
  if (cleanupTick) cleanupTick()
  if (cleanupFinished) cleanupFinished()
})
</script>

<template>
  <div class="container">
    <div class="card">
      <h2>Cronômetro</h2>

      <p class="time-label">{{ formattedTime }}</p>

      <button @click="router.push('/')" class="btn-configure">
        Configurar
      </button>

      <button @click="router.push('/')" class="btn-restart" style="margin-top: 0.5rem">
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
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 360px;
  text-align: center;
  position: relative;
}

.time-label {
  font-size: 2.5rem;
  font-weight: 300;
  margin: 1rem 0;
  color: #2c3e50;
}

.btn-configure {
  width: 100%;
  padding: 0.8rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin: 1rem 0;
  transition: background 0.2s;
}

.btn-configure:hover {
  background: #2980b9;
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