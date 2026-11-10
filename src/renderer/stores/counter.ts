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

  let cleanupTick: (() => void) | null = null;
  let cleanupFinished: (() => void) | null = null;

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

  async function initTimer(id: number): Promise<boolean> {
    const timer = await window.electronAPI.getTimer(id);
    if (!timer) {
      return false;
    }

    const totalSeconds = timer.hours * 3600 + timer.minutes * 60 + timer.seconds;
    title.value = timer.title;
    // finish_at vem em UTC do banco; interpreta como UTC para exibir no horário local
    finishTime.value = new Date(timer.finish_at.replace(' ', 'T') + 'Z').getTime();
    remainingSeconds.value = totalSeconds;
    currentConfig.value = {
      title: timer.title,
      hours: timer.hours,
      minutes: timer.minutes,
      seconds: timer.seconds,
    };

    cleanupTick = window.electronAPI.onTick((remaining) => {
      remainingSeconds.value = remaining;
    });

    cleanupFinished = window.electronAPI.onFinished(() => {
      finish();
    });

    return true;
  }

  function disposeTimer() {
    if (cleanupTick) {
      cleanupTick();
      cleanupTick = null;
    }
    if (cleanupFinished) {
      cleanupFinished();
      cleanupFinished = null;
    }
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
    initTimer,
    disposeTimer,
    reset,
    finish,
  };
});
