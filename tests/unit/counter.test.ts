import { setActivePinia, createPinia } from 'pinia';
import { useCounterStore } from '../../src/renderer/stores/counter';

type Timer = {
  id: number;
  configuration_id: number;
  finish_at: string;
  status: 'RUNNING' | 'FINISHED' | 'CANCELLED';
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  title: string;
  hours: number;
  minutes: number;
  seconds: number;
};

function mockElectronAPI(timer: Timer | null) {
  const tickCallbacks = new Array<(id: number, remainingSeconds: number) => void>();
  const finishedCallbacks = new Array<(id: number) => void>();

  const electronAPI = {
    getTimer: jest.fn().mockResolvedValue(timer),
    onTick: jest.fn((callback: (id: number, remainingSeconds: number) => void) => {
      tickCallbacks.push(callback);
      return () => {
        const idx = tickCallbacks.indexOf(callback);
        if (idx >= 0) tickCallbacks.splice(idx, 1);
      };
    }),
    onFinished: jest.fn((callback: (id: number) => void) => {
      finishedCallbacks.push(callback);
      return () => {
        const idx = finishedCallbacks.indexOf(callback);
        if (idx >= 0) finishedCallbacks.splice(idx, 1);
      };
    }),
  };

  (global as any).window = { electronAPI };

  return {
    tickCallbacks,
    finishedCallbacks,
    fireTick: (id: number, remainingSeconds: number) => {
      tickCallbacks.forEach((cb) => cb(id, remainingSeconds));
    },
    fireFinished: (id: number) => {
      finishedCallbacks.forEach((cb) => cb(id));
    },
  };
}

const mockTimer: Timer = {
  id: 1,
  configuration_id: 10,
  finish_at: '2026-11-10 12:00:00',
  status: 'RUNNING',
  cancelled_at: null,
  created_at: '2026-11-10 11:55:00',
  updated_at: '2026-11-10 11:55:00',
  title: 'Meu Cronômetro',
  hours: 1,
  minutes: 1,
  seconds: 1,
};

let currentMock: ReturnType<typeof mockElectronAPI> | null = null;

beforeEach(() => {
  setActivePinia(createPinia());
  currentMock = mockElectronAPI(mockTimer);
});

afterEach(() => {
  delete (global as any).window;
  currentMock = null;
});

test('initTimer populates store from electronAPI', async () => {
  const store = useCounterStore();
  const found = await store.initTimer(1);

  expect(found).toBe(true);
  const state = store.getTimerState(1);
  expect(state?.title).toBe('Meu Cronômetro');
  expect(state?.currentConfig).toEqual({
    title: 'Meu Cronômetro',
    hours: 1,
    minutes: 1,
    seconds: 1,
  });
  expect(state?.remainingSeconds).toBe(3661);
  expect(state?.status).toBe('RUNNING');
});

test('initTimer returns false when timer not found', async () => {
  const store = useCounterStore();
  mockElectronAPI(null);

  const found = await store.initTimer(999);

  expect(found).toBe(false);
  expect(store.getTimerState(999)).toBeUndefined();

  // Restaura o mock padrão para os próximos testes
  currentMock = mockElectronAPI(mockTimer);
});

test('onFinished callback sets timer to FINISHED and zeroes remainingSeconds', async () => {
  const store = useCounterStore();
  await store.initTimer(1);
  expect(store.getTimerState(1)?.remainingSeconds).toBe(3661);

  currentMock!.fireFinished(1);
  const state = store.getTimerState(1);
  expect(state?.remainingSeconds).toBe(0);
  expect(state?.status).toBe('FINISHED');
});

test('formattedTime formats seconds as HH:MM:SS after initTimer', async () => {
  const store = useCounterStore();
  await store.initTimer(1);
  expect(store.formattedTime(1)).toBe('01:01:01');
});

test('formattedFinishTime matches HH:MM:SS after initTimer', async () => {
  const store = useCounterStore();
  await store.initTimer(1);
  expect(store.formattedFinishTime(1)).toMatch(/^\d{2}:\d{2}:\d{2}$/);
});

test('tick updates remainingSeconds for the correct timer id', async () => {
  const store = useCounterStore();
  await store.initTimer(1);

  currentMock!.fireTick(1, 100);
  expect(store.getTimerState(1)?.remainingSeconds).toBe(100);
});

test('disposeTimer removes a specific timer from the map', async () => {
  const store = useCounterStore();
  await store.initTimer(1);
  expect(store.getTimerState(1)).toBeDefined();

  store.disposeTimer(1);
  expect(store.getTimerState(1)).toBeUndefined();
});
