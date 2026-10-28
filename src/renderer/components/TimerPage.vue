<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCounterStore } from '../stores/counter';

const router = useRouter();
const route = useRoute();
const store = useCounterStore();
const title = computed(() => store.title);
const formattedTime = computed(() => store.formattedTime);
const formattedFinishTime = computed(() => store.formattedFinishTime);

function restart() {
  store.reset();
  window.electronAPI.startTimer(0, 0, store.totalSeconds, store.title);
  store.setRunning(true);
}

let cleanupTick: (() => void) | null = null;
let cleanupFinished: (() => void) | null = null;

onMounted(() => {
  const paramsSeconds = route.params.seconds
    ? parseInt(route.params.seconds as string)
    : store.totalSeconds;
  if (paramsSeconds > 0) {
    store.setTime(paramsSeconds);
  }

  cleanupTick = window.electronAPI.onTick((data) => {
    store.remainingSeconds = data.remainingSeconds;
    store.setFinishTime(data.finishTime);
  });

  cleanupFinished = window.electronAPI.onFinished(() => {
    store.finish();
  });
});

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

      <v-btn color="primary" block class="mb-2" @click="router.push('/')"> Configurar </v-btn>

      <v-btn color="secondary" block @click="restart"> Reiniciar </v-btn>
    </v-card>
  </v-container>
</template>

<style scoped></style>
