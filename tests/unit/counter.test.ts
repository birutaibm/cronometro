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
  const tickCallbacks = new Array<(remainingSeconds: number) => void>();
  const finishedCallbacks = new Array<() => void>();

  const electronAPI = {
    getTimer: jest.fn().mockResolvedValue(timer),
    onTick: jest.fn((callback: (remainingSeconds: number) => void) => {
      tickCallbacks.push(callback);
      return () => {
        const idx = tickCallbacks.indexOf(callback);
        if (idx >= 0) tickCallbacks.splice(idx, 1);
      };
    }),
    onFinished: jest.fn((callback: () => void) => {
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
    fireTick: (remainingSeconds: number) => {
      tickCallbacks.forEach((cb) => cb(remainingSeconds));
    },
    fireFinished: () => {
      finishedCallbacks.forEach((cb) => cb());
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
  expect(store.title).toBe('Meu Cronômetro');
  expect(store.currentConfig).toEqual({
    title: 'Meu Cronômetro',
    hours: 1,
    minutes: 1,
    seconds: 1,
  });
  expect(store.remainingSeconds).toBe(3661);
});

test('initTimer returns false when timer not found', async () => {
  const store = useCounterStore();
  mockElectronAPI(null);

  const found = await store.initTimer(999);

  expect(found).toBe(false);
  expect(store.title).toBe('');
  expect(store.currentConfig).toBeNull();

  // Restaura o mock padrão para os próximos testes
  currentMock = mockElectronAPI(mockTimer);
});

test('reset sets remainingSeconds to 0', async () => {
  const store = useCounterStore();
  await store.initTimer(1);
  expect(store.remainingSeconds).toBe(3661);

  store.reset();
  expect(store.remainingSeconds).toBe(0);
});

test('finish sets remainingSeconds to 0', async () => {
  const store = useCounterStore();
  await store.initTimer(1);
  expect(store.remainingSeconds).toBe(3661);

  store.finish();
  expect(store.remainingSeconds).toBe(0);
});

test('onFinished callback triggers finish()', async () => {
  const store = useCounterStore();
  await store.initTimer(1);
  expect(store.remainingSeconds).toBe(3661);

  currentMock!.fireFinished();
  expect(store.remainingSeconds).toBe(0);
});

test('formattedTime formats seconds as HH:MM:SS after initTimer', async () => {
  const store = useCounterStore();
  await store.initTimer(1);
  expect(store.formattedTime).toBe('01:01:01');
});

test('formattedFinishTime matches HH:MM:SS after initTimer', async () => {
  const store = useCounterStore();
  await store.initTimer(1);
  expect(store.formattedFinishTime).toMatch(/^\d{2}:\d{2}:\d{2}$/);
});
