<script setup lang="ts">
import { computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useCounterStore } from '../stores/counter';
import TimerCard from './TimerCard.vue';

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

function cancelTimer() {
  const id = Number(route.params.id);
  window.electronAPI.cancelTimer(id).catch((err) => console.error('Failed to cancel timer:', err));
  store.disposeTimer();
}

onMounted(async () => {
  const id = Number(route.params.id);
  const found = await store.initTimer(id);
  if (!found) {
    router.push('/');
  }
});

// O Vue Router reutiliza o mesmo componente quando apenas o parâmetro :id muda,
// então onMounted não é disparado novamente. Recarrega ao trocar de id.
watch(
  () => route.params.id,
  async (newId) => {
    const found = await store.initTimer(Number(newId));
    if (!found) {
      router.push('/');
    }
  }
);

onBeforeUnmount(() => {
  store.disposeTimer();
});
</script>

<template>
  <v-container
    fluid
    class="d-flex align-center justify-center"
    style="min-height: 100vh; background: #f0f2f5"
  >
    <TimerCard
      :title="title || 'Cronômetro'"
      :time="formattedTime"
      :finish-time="formattedFinishTime"
      status="RUNNING"
      :on-configure="openConfigurePage"
      :on-restart="restart"
      :on-cancel="cancelTimer"
    />
  </v-container>
</template>

<style scoped></style>
