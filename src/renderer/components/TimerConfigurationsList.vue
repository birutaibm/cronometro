<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

interface TimerConfiguration {
  id: number;
  title: string;
  hours: number;
  minutes: number;
  seconds: number;
  created_at: string;
  updated_at: string;
}

const configurations = ref<TimerConfiguration[]>([]);
const error = ref<string | null>(null);
const loading = ref(false);

function formatTime(hours: number, minutes: number, seconds: number): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

async function loadConfigurations() {
  loading.value = true;
  try {
    configurations.value = await window.electronAPI.getConfigurations();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao carregar configurações';
    console.error('Failed to load configurations:', err);
  } finally {
    loading.value = false;
  }
}

async function startTimer(configurationId: number) {
  try {
    const { id } = await window.electronAPI.startTimer(configurationId);
    router.push(`/timer/${id}`);
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Erro ao iniciar o timer';
    console.error('Failed to start timer:', err);
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
      <v-card-title class="text-h5 text-center mb-4">Cronômetro</v-card-title>

      <v-btn color="success" block class="mb-4" @click="router.push('/new_timer_configuration')">
        + Nova configuração
      </v-btn>

      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>

      <v-list v-if="configurations.length > 0">
        <v-list-item v-for="config in configurations" :key="config.id" class="mb-2">
          <v-list-item-title class="text-h6 font-weight-bold">{{ config.title }}</v-list-item-title>
          <v-list-item-subtitle>{{
            formatTime(config.hours, config.minutes, config.seconds)
          }}</v-list-item-subtitle>
          <v-list-item-action>
            <v-btn color="primary" size="small" @click="startTimer(config.id)"> Iniciar </v-btn>
          </v-list-item-action>
        </v-list-item>
      </v-list>

      <v-alert v-else-if="!loading" type="info" variant="tonal" class="mb-4 text-center">
        Nenhuma configuração encontrada
      </v-alert>

      <v-progress-linear v-if="loading" indeterminate class="mb-4" />
    </v-card>
  </v-container>
</template>

<style scoped></style>
