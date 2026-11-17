<script setup lang="ts">
interface TimerProps {
  title: string;
  time: string;
  finishTime: string;
  status?: 'RUNNING' | 'FINISHED' | 'CANCELLED';
  onConfigure: () => void;
  onRestart: () => void;
  onCancel?: () => void;
}

defineProps<TimerProps>();
</script>

<template>
  <v-card width="340" class="pa-6 elevation-4">
    <v-card-title class="text-h5 text-center mb-2">{{ title }}</v-card-title>

    <v-card-text class="text-center">
      <div class="time-label text-h2 font-weight-light mb-2">{{ time }}</div>
      <div class="text-caption text-medium-emphasis">Zera às {{ finishTime }}</div>
    </v-card-text>

    <v-btn color="primary" block class="mb-2" @click="onConfigure"> Configurar </v-btn>

    <v-btn color="secondary" block class="mb-2" @click="onRestart"> Reiniciar </v-btn>

    <v-btn v-if="status === 'RUNNING'" color="error" block @click="onCancel"> Cancelar </v-btn>
  </v-card>
</template>

<style scoped></style>
