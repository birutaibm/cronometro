import { setActivePinia, createPinia } from 'pinia';
import { useCounterStore } from '../../src/renderer/stores/counter';

beforeEach(() => {
  setActivePinia(createPinia());
});

test('setTime sets remainingSeconds', () => {
  const store = useCounterStore();
  store.setTime(10);
  expect(store.remainingSeconds).toBe(10);
});

test('reset sets remainingSeconds to 0', () => {
  const store = useCounterStore();
  store.setTime(10);
  store.reset();
  expect(store.remainingSeconds).toBe(0);
});

test('finish sets remainingSeconds to 0', () => {
  const store = useCounterStore();
  store.setTime(10);
  store.finish();
  expect(store.remainingSeconds).toBe(0);
});

test('formattedTime formats seconds as HH:MM:SS', () => {
  const store = useCounterStore();
  store.setTime(3661);
  expect(store.formattedTime).toBe('01:01:01');
  store.setTime(5);
  expect(store.formattedTime).toBe('00:00:05');
  store.setTime(61);
  expect(store.formattedTime).toBe('00:01:01');
});

test('formattedTime pads single digit seconds with leading zero', () => {
  const store = useCounterStore();
  store.setTime(9);
  expect(store.formattedTime).toBe('00:00:09');
});

test('setTitle sets title', () => {
  const store = useCounterStore();
  store.setTitle('Meu Cronômetro');
  expect(store.title).toBe('Meu Cronômetro');
});
