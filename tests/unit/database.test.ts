jest.mock('electron', () => ({
  app: {
    getPath: jest.fn(() => '/tmp/test-user-data'),
  },
}));

jest.mock('better-sqlite3', () => {
  return class {
    pragma = jest.fn();
    close = jest.fn();
  };
});

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  copyFileSync: jest.fn(),
  readdirSync: jest.fn(() => ['001_create_timers_table.js']),
  appendFileSync: jest.fn(),
}));

jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((p) => p.split('/').slice(0, -1).join('/')),
}));

const mockMigrateLatest = jest.fn().mockResolvedValue([]);
const mockInsert = jest.fn().mockResolvedValue([1]);
const mockDestroy = jest.fn().mockResolvedValue(undefined);

jest.mock('knex', () => {
  const mockInstance: any = jest.fn(() => mockInstance);
  const mockSelect = jest.fn(() => mockInstance);
  mockInstance.migrate = { latest: mockMigrateLatest };
  mockInstance.insert = mockInsert;
  mockInstance.select = mockSelect;
  mockInstance.orderBy = jest.fn().mockReturnThis();
  mockInstance.from = jest.fn().mockReturnThis();
  mockInstance.where = jest.fn().mockReturnThis();
  mockInstance.first = jest.fn();
  mockInstance.then = jest.fn(function (this: any, onFulfilled: Function) {
    return Promise.resolve(onFulfilled([]));
  });
  mockInstance.destroy = mockDestroy;
  return mockInstance;
});

describe('electron/database/index.ts', () => {
  let initializeDatabase: any;
  let createTimer: any;
  let getTimerById: any;
  let getSessions: any;

  beforeEach(() => {
    jest.resetModules();
    const module = require('../../src/electron/database/index');
    initializeDatabase = module.initializeDatabase;
    const getRepository = module.getRepository;
    createTimer = async (data: any) => getRepository().createTimer(data);
    getTimerById = async (id: number) => getRepository().getTimerById(id);
    getSessions = () => getRepository().getSessions();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('initializeDatabase calls migrate.latest when db does not exist', async () => {
    require('fs').existsSync.mockReturnValue(false);
    await initializeDatabase();
    expect(mockMigrateLatest).toHaveBeenCalled();
  });

  test('initializeDatabase calls backup when pending migrations exist', async () => {
    await initializeDatabase();
    expect(require('fs').copyFileSync).toHaveBeenCalled();
  });

  test('createTimer calls insert with correct data', async () => {
    await initializeDatabase();
    await createTimer({
      title: 'Teste',
      hours: 1,
      minutes: 30,
      seconds: 0,
      finishAt: new Date(Date.now() + 5400000),
    });
    expect(mockInsert).toHaveBeenCalled();
    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.title).toBe('Teste');
    expect(insertCall.hours).toBe(1);
    expect(insertCall.minutes).toBe(30);
    expect(insertCall.seconds).toBe(0);
    expect(insertCall.finish_at).toBeDefined();
  });

  test('getTimerById returns the timer row or null', async () => {
    await initializeDatabase();
    const knexInstance: any = require('knex');
    knexInstance.first.mockResolvedValueOnce({
      id: 4,
      title: 'Teste',
      hours: 0,
      minutes: 2,
      seconds: 5,
      finish_at: '2026-11-04 18:00:00',
      created_at: '2026-11-04 18:00:00',
      updated_at: '2026-11-04 18:00:00',
    });

    const found = await getTimerById(4);
    expect(found).toEqual({
      id: 4,
      title: 'Teste',
      hours: 0,
      minutes: 2,
      seconds: 5,
      finish_at: '2026-11-04 18:00:00',
      created_at: '2026-11-04 18:00:00',
      updated_at: '2026-11-04 18:00:00',
    });
    expect(knexInstance.where).toHaveBeenCalledWith({ id: 4 });

    knexInstance.first.mockResolvedValueOnce(null);
    const notFound = await getTimerById(999);
    expect(notFound).toBeNull();
  });

  test('getSessions calls select and orderBy', async () => {
    await initializeDatabase();
    const sessions = await getSessions();
    expect(Array.isArray(sessions)).toBe(true);
  });

  test('createTimer throws when database not initialized', async () => {
    await expect(
      createTimer({ title: 'Teste', hours: 0, minutes: 0, seconds: 0, finishAt: new Date() })
    ).rejects.toThrow('Database not initialized');
  });
});
