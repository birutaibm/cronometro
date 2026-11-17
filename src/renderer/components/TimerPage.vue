<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useCounterStore } from '../stores/counter';
import TimerCard from './TimerCard.vue';

const router = useRouter();
const store = useCounterStore();

interface TimerConfiguration {
  id: number;
  title: string;
  hours: number;
  minutes: number;
  seconds: number;
}

const configurations = ref<TimerConfiguration[]>([]);
const selectedConfigurationId = ref<number | null>(null);
const configurationsError = ref<string | null>(null);
const loadingConfigurations = ref(false);

async function loadConfigurations() {
  loadingConfigurations.value = true;
  try {
    configurations.value = await window.electronAPI.getConfigurations();
  } catch (err) {
    configurationsError.value = err instanceof Error ? err.message : 'Erro ao carregar configurações';
    console.error('Failed to load configurations:', err);
  } finally {
    loadingConfigurations.value = false;
  }
}

async function startFromConfiguration() {
  const configurationId = selectedConfigurationId.value;
  if (!configurationId) return;

  try {
    const { id } = await window.electronAPI.startTimer(configurationId);
    await store.initTimer(id);
    selectedConfigurationId.value = null;
    configurationsError.value = null;
  } catch (err) {
    configurationsError.value = err instanceof Error ? err.message : 'Erro ao iniciar o timer';
    console.error('Failed to start timer from configuration:', err);
  }
}

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

onMounted(() => {
  loadConfigurations();
});
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

      <v-alert v-if="configurationsError" type="error" variant="tonal" class="mb-4">{{ configurationsError }}</v-alert>

      <v-select
        v-if="configurations.length > 0"
        v-model="selectedConfigurationId"
        :items="configurations"
        item-title="title"
        item-value="id"
        label="Iniciar configuração existente"
        outlined
        class="mb-4"
      />
      <v-btn
        v-if="configurations.length > 0"
        color="primary"
        block
        class="mb-4"
        :disabled="!selectedConfigurationId"
        @click="startFromConfiguration"
      >
        Iniciar timer selecionado
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
