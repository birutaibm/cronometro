<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCounterStore } from '../stores/counter';

const router = useRouter();
const route = useRoute();
const store = useCounterStore();
const title = computed(() => store.title);
const formattedTime = computed(() => store.formattedTime);
const formattedFinishTime = computed(() => store.formattedFinishTime);
const currentConfig = computed(() => store.currentConfig);

function restart() {
  store.reset();
  const id = Number(route.params.id);
  window.electronAPI
    .restartTimer(id)
    .then(({ id: newId }) => {
      router.push(`/timer/${newId}`);
    })
    .catch((err) => {
      console.error('Failed to restart timer:', err);
    });
}

let cleanupTick: (() => void) | null = null;
let cleanupFinished: (() => void) | null = null;

function loadTimer(id: number) {
  window.electronAPI
    .getTimer(id)
    .then((timer) => {
      if (!timer) {
        router.push('/');
        return;
      }
      const totalSeconds = timer.hours * 3600 + timer.minutes * 60 + timer.seconds;
      store.setTitle(timer.title);
      // finish_at vem em UTC do banco; interpreta como UTC para exibir no horário local
      store.setFinishTime(new Date(timer.finish_at.replace(' ', 'T') + 'Z').getTime());
      store.setTime(totalSeconds);
      store.remainingSeconds = totalSeconds;
      store.setCurrentConfig({
        title: timer.title,
        hours: timer.hours,
        minutes: timer.minutes,
        seconds: timer.seconds,
      });
    })
    .catch((err) => {
      console.error('Failed to load timer:', err);
      router.push('/');
    });
}

async function openConfigurePage() {
  const executionId = Number(route.params.id);
  if (!isNaN(executionId)) {
    try {
      await window.electronAPI.cancelTimer(executionId);
    } catch (err) {
      console.error('Failed to cancel current timer before opening configure page:', err);
    }
  }

  if (!currentConfig.value) {
    router.push({ name: 'new-timer-configuration' });
    return;
  }
  router.push({
    name: 'new-timer-configuration',
    query: {
      title: currentConfig.value.title,
      hours: String(currentConfig.value.hours),
      minutes: String(currentConfig.value.minutes),
      seconds: String(currentConfig.value.seconds),
    },
  });
}

onMounted(() => {
  const id = Number(route.params.id);
  loadTimer(id);

  cleanupTick = window.electronAPI.onTick((remainingSeconds) => {
    store.remainingSeconds = remainingSeconds;
  });

  cleanupFinished = window.electronAPI.onFinished(() => {
    store.finish();
  });
});

// O Vue Router reutiliza o mesmo componente quando apenas o parâmetro :id muda,
// então onMounted não é disparado novamente. Recarrega ao trocar de id.
watch(
  () => route.params.id,
  (newId) => {
    loadTimer(Number(newId));
  }
);

onBeforeUnmount(() => {
  if (cleanupTick) cleanupTick();
  if (cleanupFinished) cleanupFinished();
});
</script>

<template>
  <v-container
    fluid
    class="d-flex align-center justify-center"
    style="min-height: 100vh; background: #f0f2f5"
  >
    <v-card max-width="360" width="100%" class="pa-6" elevation="4">
      <v-card-title class="text-h5 text-center mb-2">{{ title || 'Cronômetro' }}</v-card-title>

      <v-card-text class="text-center">
        <div class="time-label text-h2 font-weight-light mb-2">{{ formattedTime }}</div>
        <div class="text-caption text-medium-emphasis">Zera às {{ formattedFinishTime }}</div>
      </v-card-text>

      <v-btn color="primary" block class="mb-2" @click="openConfigurePage"> Configurar </v-btn>

      <v-btn color="secondary" block @click="restart"> Reiniciar </v-btn>
    </v-card>
  </v-container>
</template>

<style scoped></style>
