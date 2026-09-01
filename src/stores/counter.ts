import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const remainingSeconds = ref(0)
  const isRunning = ref(false)
  const totalSeconds = ref(0)

  const formattedTime = computed(() => {
    const mins = Math.floor(remainingSeconds.value / 60)
    const secs = remainingSeconds.value % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  })

  const setTotalSeconds = (seconds: number) => {
    totalSeconds.value = seconds
    remainingSeconds.value = seconds
    isRunning.value = false
  }

  const start = () => {
    isRunning.value = true
  }

  const stop = () => {
    isRunning.value = false
    remainingSeconds.value = totalSeconds.value
  }

  const decrement = () => {
    if (remainingSeconds.value > 0) {
      remainingSeconds.value--
    }
  }

  const getRemainingSeconds = computed(() => remainingSeconds.value)

  return {
    remainingSeconds,
    isRunning,
    totalSeconds,
    formattedTime,
    setTotalSeconds,
    start,
    stop,
    decrement,
    getRemainingSeconds,
  }
})