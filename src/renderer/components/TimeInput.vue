<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useCounterStore } from '../stores/counter';

const router = useRouter();
const store = useCounterStore();
const hours = ref(0);
const minutes = ref(25);
const seconds = ref(0);
const title = ref('');
const error = ref<string | null>(null);

function startCountdown() {
  const totalSeconds = hours.value * 3600 + minutes.value * 60 + seconds.value;
  if (totalSeconds <= 0) {
    error.value = 'Por favor, insira um tempo maior que 0';
    return;
  }
  error.value = null;
  store.setTime(totalSeconds);
  store.setTitle(title.value);
  router.push('/timer');
  window.electronAPI.startTimer(hours.value, minutes.value, seconds.value, title.value);
}
</script>

<template>
  <v-container
    fluid
    class="d-flex align-center justify-center"
    style="min-height: 100vh; background: #f0f2f5"
  >
    <v-card max-width="360" width="100%" class="pa-6" elevation="4">
      <v-card-title class="text-h4 text-center mb-4">Cronômetro</v-card-title>

      <v-text-field
        v-model="title"
        label="Título"
        placeholder="Nome do cronômetro"
        variant="outlined"
        class="mb-3"
      ></v-text-field>

      <v-text-field
        v-model.number="hours"
        label="Horas"
        type="number"
        min="0"
        placeholder="0"
        variant="outlined"
        class="mb-3"
      ></v-text-field>

      <v-text-field
        v-model.number="minutes"
        label="Minutos"
        type="number"
        min="0"
        placeholder="25"
        variant="outlined"
        class="mb-3"
      ></v-text-field>

      <v-text-field
        v-model.number="seconds"
        label="Segundos"
        type="number"
        min="0"
        placeholder="0"
        variant="outlined"
        class="mb-3"
      ></v-text-field>

      <v-alert v-if="error" type="error" variant="tonal" class="mb-3">{{ error }}</v-alert>

      <v-btn color="success" block class="mt-2" @click="startCountdown"> Iniciar </v-btn>
    </v-card>
  </v-container>
</template>

<style scoped></style>
