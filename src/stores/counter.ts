import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCounterStore = defineStore('counter', () => {
  const remainingSeconds = ref(0)
  const isRunning = ref(false)
  const totalSeconds = ref(0)
  const title = ref('')

  const formattedTime = computed(() => {
    const hrs = Math.floor(remainingSeconds.value / 3600)
    const mins = Math.floor((remainingSeconds.value % 3600) / 60)
    const secs = remainingSeconds.value % 60
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })

  function setTime(seconds: number) {
    totalSeconds.value = seconds
    remainingSeconds.value = seconds
    isRunning.value = false
  }

  function setTitle(value: string) {
    title.value = value
  }

  function setRunning(value: boolean) {
    isRunning.value = value
  }

  function reset() {
    remainingSeconds.value = totalSeconds.value
    isRunning.value = false
  }

  function finish() {
    remainingSeconds.value = 0
    isRunning.value = false
  }

  return {
    remainingSeconds,
    isRunning,
    totalSeconds,
    title,
    formattedTime,
    setTime,
    setTitle,
    setRunning,
    reset,
    finish,
  }
})