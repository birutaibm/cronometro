import { setActivePinia, createPinia } from 'pinia';
import { useCounterStore } from '../../src/stores/counter';

beforeEach(() => {
  setActivePinia(createPinia());
});

test('setTime sets totalSeconds, remainingSeconds and isRunning to false', () => {
  const store = useCounterStore();
  store.setTime(10);
  expect(store.totalSeconds).toBe(10);
  expect(store.remainingSeconds).toBe(10);
  expect(store.isRunning).toBe(false);
});

test('setRunning sets isRunning', () => {
  const store = useCounterStore();
  store.setRunning(true);
  expect(store.isRunning).toBe(true);
  store.setRunning(false);
  expect(store.isRunning).toBe(false);
});

test('reset sets remainingSeconds to totalSeconds and isRunning to false', () => {
  const store = useCounterStore();
  store.setTime(10);
  store.setRunning(true);
  store.reset();
  expect(store.remainingSeconds).toBe(10);
  expect(store.isRunning).toBe(false);
});

test('finish sets remainingSeconds to 0 and isRunning to false', () => {
  const store = useCounterStore();
  store.setTime(10);
  store.setRunning(true);
  store.finish();
  expect(store.remainingSeconds).toBe(0);
  expect(store.isRunning).toBe(false);
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
