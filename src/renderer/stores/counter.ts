import { defineStore } from 'pinia';
import { ref, reactive } from 'vue';

interface TimerState {
  id: number;
  title: string;
  remainingSeconds: number;
  finishTime: number;
  status: 'RUNNING' | 'FINISHED' | 'CANCELLED';
  currentConfig: {
    title: string;
    hours: number;
    minutes: number;
    seconds: number;
  } | null;
}

export const useCounterStore = defineStore('counter', () => {
  const timers = ref<Map<number, TimerState>>(new Map());

  let cleanupTick: (() => void) | null = null;
  let cleanupFinished: (() => void) | null = null;

  const pad = (n: number) => String(n).padStart(2, '0');

  function formattedTime(id: number): string {
    const state = timers.value.get(id);
    if (!state) return '00:00:00';
    const hrs = Math.floor(state.remainingSeconds / 3600);
    const mins = Math.floor((state.remainingSeconds % 3600) / 60);
    const secs = state.remainingSeconds % 60;
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }

  function formattedFinishTime(id: number): string {
    const state = timers.value.get(id);
    if (!state || !state.finishTime) return '';
    return new Date(state.finishTime).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function getTimerState(id: number): TimerState | undefined {
    return timers.value.get(id);
  }

  function ensureListeners() {
    if (cleanupTick) return;

    cleanupTick = window.electronAPI.onTick((id, remaining) => {
      const state = timers.value.get(id);
      if (state) state.remainingSeconds = remaining;
    });

    cleanupFinished = window.electronAPI.onFinished((id) => {
      const state = timers.value.get(id);
      if (!state) return;
      state.remainingSeconds = 0;
      state.status = 'FINISHED';
    });
  }

  function removeListeners() {
    if (cleanupTick) {
      cleanupTick();
      cleanupTick = null;
    }
    if (cleanupFinished) {
      cleanupFinished();
      cleanupFinished = null;
    }
  }

  async function initTimer(id: number): Promise<boolean> {
    const timer = await window.electronAPI.getTimer(id);
    if (!timer) {
      return false;
    }

    const totalSeconds = timer.hours * 3600 + timer.minutes * 60 + timer.seconds;
    timers.value.set(
      id,
      reactive({
        id,
        title: timer.title,
        remainingSeconds: totalSeconds,
        finishTime: new Date(timer.finish_at.replace(' ', 'T') + 'Z').getTime(),
        status: 'RUNNING',
        currentConfig: {
          title: timer.title,
          hours: timer.hours,
          minutes: timer.minutes,
          seconds: timer.seconds,
        },
      })
    );

    ensureListeners();
    return true;
  }

  function disposeTimer(id: number) {
    timers.value.delete(id);
    if (timers.value.size === 0) {
      removeListeners();
    }
  }

  return {
    timers,
    formattedTime,
    formattedFinishTime,
    getTimerState,
    initTimer,
    disposeTimer,
  };
});
