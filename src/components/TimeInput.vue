<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCounterStore } from '../stores/counter'

const router = useRouter()
const store = useCounterStore()
const hours = ref(0)
const minutes = ref(25)
const seconds = ref(0)
const title = ref('')
const error = ref<string | null>(null)

function startCountdown() {
  const totalSeconds = hours.value * 3600 + minutes.value * 60 + seconds.value
  if (totalSeconds <= 0) {
    error.value = 'Por favor, insira um tempo maior que 0'
    return
  }
  error.value = null
  store.setTime(totalSeconds)
  store.setTitle(title.value)
  router.push('/timer')
  window.electronAPI.startTimer(totalSeconds, title.value)
}
</script>

<template>
  <div class="container">
    <h1>Cronômetro</h1>

    <div class="card">
      <label style="display: block; margin-bottom: 0.8rem;">
        <span>Título:</span>
        <input
          type="text"
          v-model="title"
          class="input"
          placeholder="Nome do cronômetro"
        />
      </label>
      <label style="display: block; margin-bottom: 0.8rem;">
        <span>Horas:</span>
        <input
          type="number"
          v-model="hours"
          min="0"
          class="input"
          placeholder="0"
        />
      </label>
      <label style="display: block; margin-bottom: 0.8rem;">
        <span>Minutos:</span>
        <input
          type="number"
          v-model="minutes"
          min="0"
          class="input"
          placeholder="25"
        />
      </label>
      <label style="display: block; margin-bottom: 0.8rem;">
        <span>Segundos:</span>
        <input
          type="number"
          v-model="seconds"
          min="0"
          class="input"
          placeholder="0"
        />
      </label>

      <p v-if="error" class="error">{{ error }}</p>

      <button @click="startCountdown" class="btn-start">
        Iniciar
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
}

.input {
  width: 100%;
  padding: 0.8rem;
  margin: 0.5rem 0;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
}

.btn-start {
  width: 100%;
  padding: 0.8rem;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: background 0.2s;
}

.btn-start:hover {
  background: #36a46f;
}

.error {
  color: #e74c3c;
  margin: 0.5rem 0;
  font-size: 0.875rem;
}
</style>