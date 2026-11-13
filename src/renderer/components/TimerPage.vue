<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useCounterStore } from '../stores/counter';
import TimerCard from './TimerCard.vue';

const router = useRouter();
const store = useCounterStore();

function restart(id: number) {
  const state = store.getTimerState(id);
  if (!state?.currentConfig) return;

  window.electronAPI
    .restartTimer(id)
    .then(({ id: newId }) => {
      store.disposeTimer(id);
      store.initTimer(newId);
    })
    .catch((err) => {
      console.error('Failed to restart timer:', err);
    });
}

async function openConfigurePage(id: number) {
  const state = store.getTimerState(id);
  if (!state?.currentConfig) {
    router.push({ name: 'new-timer-configuration' });
    return;
  }

  try {
    await window.electronAPI.cancelTimer(id);
  } catch (err) {
    console.error('Failed to cancel timer before opening configure page:', err);
  }

  store.disposeTimer(id);
  router.push({
    name: 'new-timer-configuration',
    query: {
      title: state.currentConfig.title,
      hours: String(state.currentConfig.hours),
      minutes: String(state.currentConfig.minutes),
      seconds: String(state.currentConfig.seconds),
    },
  });
}

async function cancelTimer(id: number) {
  try {
    await window.electronAPI.cancelTimer(id);
    store.disposeTimer(id);
  } catch (err) {
    console.error('Failed to cancel timer:', err);
  }
}
</script>

<template>
  <v-container
    fluid
    class="d-flex align-center justify-center"
    style="min-height: 100vh; background: #f0f2f5"
  >
    <v-card max-width="500" width="100%" class="pa-4" elevation="4">
      <v-card-title class="text-h5 text-center mb-4">Timers Ativos</v-card-title>

      <v-btn color="success" block class="mb-4" @click="router.push('/new_timer_configuration')">
        + Novo timer
      </v-btn>

      <v-list v-if="store.timers.size > 0">
        <v-list-item v-for="state of store.timers.values()" :key="state.id" class="mb-2">
          <template #default>
            <TimerCard
              :title="state.title"
              :time="store.formattedTime(state.id)"
              :finish-time="store.formattedFinishTime(state.id)"
              :status="state.status"
              :on-configure="() => openConfigurePage(state.id)"
              :on-restart="() => restart(state.id)"
              :on-cancel="() => cancelTimer(state.id)"
            />
          </template>
        </v-list-item>
      </v-list>

      <v-alert v-else type="info" variant="tonal" class="mb-4 text-center">
        Nenhum timer em execução
      </v-alert>
    </v-card>
  </v-container>
</template>

<style scoped></style>
