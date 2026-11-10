import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useCounterStore = defineStore('counter', () => {
  const remainingSeconds = ref(0);
  const title = ref('');
  const finishTime = ref(0);
  const currentConfig = ref<{
    title: string;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const formattedTime = computed(() => {
    const hrs = Math.floor(remainingSeconds.value / 3600);
    const mins = Math.floor((remainingSeconds.value % 3600) / 60);
    const secs = remainingSeconds.value % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  });

  const formattedFinishTime = computed(() => {
    if (!finishTime.value) return '';
    return new Date(finishTime.value).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  });

  function setTime(seconds: number) {
    remainingSeconds.value = seconds;
  }

  function setTitle(value: string) {
    title.value = value;
  }

  function setFinishTime(value: number) {
    finishTime.value = value;
  }

  function setCurrentConfig(
    config: {
      title: string;
      hours: number;
      minutes: number;
      seconds: number;
    } | null
  ) {
    currentConfig.value = config;
  }

  function reset() {
    remainingSeconds.value = 0;
  }

  function finish() {
    remainingSeconds.value = 0;
  }

  return {
    remainingSeconds,
    title,
    finishTime,
    currentConfig,
    formattedTime,
    formattedFinishTime,
    setTime,
    setTitle,
    setCurrentConfig,
    reset,
    setFinishTime,
    finish,
  };
});
