import vue from '@vitejs/plugin-vue';

export default {
  plugins: [vue()],
  base: './',
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
};
