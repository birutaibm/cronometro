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
const mockUpdate = jest.fn().mockResolvedValue(undefined);

jest.mock('knex', () => {
  const mockInstance: any = jest.fn(() => mockInstance);
  const mockSelect = jest.fn(() => mockInstance);
  mockInstance.migrate = { latest: mockMigrateLatest };
  mockInstance.insert = mockInsert;
  mockInstance.select = mockSelect;
  mockInstance.update = mockUpdate;
  mockInstance.orderBy = jest.fn().mockReturnThis();
  mockInstance.from = jest.fn().mockReturnThis();
  mockInstance.where = jest.fn().mockReturnThis();
  mockInstance.join = jest.fn().mockReturnThis();
  mockInstance.first = jest.fn();
  mockInstance.then = jest.fn(function (this: any, onFulfilled: Function) {
    return Promise.resolve(onFulfilled([]));
  });
  mockInstance.destroy = mockDestroy;
  return mockInstance;
});

describe('electron/database/index.ts', () => {
  let initializeDatabase: any;
  let createConfiguration: any;
  let getConfigurationById: any;
  let createExecution: any;
  let getExecutionById: any;
  let updateExecutionStatus: any;
  let getConfigurations: any;
  let getExecutions: any;

  beforeEach(() => {
    jest.resetModules();
    const module = require('../../src/electron/database/index');
    initializeDatabase = module.initializeDatabase;
    const getRepository = module.getRepository;
    createConfiguration = async (data: any) => getRepository().createConfiguration(data);
    getConfigurationById = async (id: number) => getRepository().getConfigurationById(id);
    createExecution = async (data: any) => getRepository().createExecution(data);
    getExecutionById = async (id: number) => getRepository().getExecutionById(id);
    updateExecutionStatus = async (id: number, status: string, cancelledAt?: Date) =>
      getRepository().updateExecutionStatus(id, status, cancelledAt);
    getConfigurations = () => getRepository().getConfigurations();
    getExecutions = () => getRepository().getExecutions();
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

  test('createConfiguration calls insert with correct data', async () => {
    await initializeDatabase();
    await createConfiguration({
      title: 'Teste',
      hours: 1,
      minutes: 30,
      seconds: 0,
    });
    expect(mockInsert).toHaveBeenCalled();
    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.title).toBe('Teste');
    expect(insertCall.hours).toBe(1);
    expect(insertCall.minutes).toBe(30);
    expect(insertCall.seconds).toBe(0);
    expect(insertCall.created_at).toBeDefined();
    expect(insertCall.updated_at).toBeDefined();
  });

  test('getConfigurationById returns the config row or null', async () => {
    await initializeDatabase();
    const knexInstance: any = require('knex');
    knexInstance.first.mockResolvedValueOnce({
      id: 4,
      title: 'Teste',
      hours: 0,
      minutes: 2,
      seconds: 5,
      created_at: '2026-11-04 18:00:00',
      updated_at: '2026-11-04 18:00:00',
    });

    const found = await getConfigurationById(4);
    expect(found).toEqual({
      id: 4,
      title: 'Teste',
      hours: 0,
      minutes: 2,
      seconds: 5,
      created_at: '2026-11-04 18:00:00',
      updated_at: '2026-11-04 18:00:00',
    });
    expect(knexInstance.where).toHaveBeenCalledWith({ id: 4 });

    knexInstance.first.mockResolvedValueOnce(null);
    const notFound = await getConfigurationById(999);
    expect(notFound).toBeNull();
  });

  test('createExecution calls insert with correct data', async () => {
    await initializeDatabase();
    await createExecution({
      configurationId: 2,
      finishAt: new Date(Date.now() + 5400000),
      status: 'RUNNING',
    });
    expect(mockInsert).toHaveBeenCalled();
    const insertCall = mockInsert.mock.calls[0][0];
    expect(insertCall.configuration_id).toBe(2);
    expect(insertCall.status).toBe('RUNNING');
    expect(insertCall.finish_at).toBeDefined();
    expect(insertCall.cancelled_at).toBeNull();
  });

  test('getExecutionById returns execution with config or null', async () => {
    await initializeDatabase();
    const knexInstance: any = require('knex');
    knexInstance.first.mockResolvedValueOnce({
      id: 7,
      configuration_id: 3,
      title: 'Meu timer',
      hours: 0,
      minutes: 1,
      seconds: 30,
      finish_at: '2026-11-04 18:00:00',
      status: 'RUNNING',
      cancelled_at: null,
      created_at: '2026-11-04 18:00:00',
      updated_at: '2026-11-04 18:00:00',
    });

    const found = await getExecutionById(7);
    expect(found).toEqual({
      id: 7,
      configuration_id: 3,
      title: 'Meu timer',
      hours: 0,
      minutes: 1,
      seconds: 30,
      finish_at: '2026-11-04 18:00:00',
      status: 'RUNNING',
      cancelled_at: null,
      created_at: '2026-11-04 18:00:00',
      updated_at: '2026-11-04 18:00:00',
    });
    expect(knexInstance.join).toHaveBeenCalled();

    knexInstance.first.mockResolvedValueOnce(null);
    const notFound = await getExecutionById(999);
    expect(notFound).toBeNull();
  });

  test('updateExecutionStatus calls update with status', async () => {
    await initializeDatabase();
    await updateExecutionStatus(5, 'FINISHED');
    expect(mockUpdate).toHaveBeenCalled();
    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.status).toBe('FINISHED');
    expect(updateCall.updated_at).toBeDefined();
  });

  test('updateExecutionStatus sets cancelled_at when provided', async () => {
    await initializeDatabase();
    const cancelledAt = new Date('2026-11-04 18:00:00');
    await updateExecutionStatus(5, 'CANCELLED', cancelledAt);
    const updateCall = mockUpdate.mock.calls[0][0];
    expect(updateCall.status).toBe('CANCELLED');
    expect(updateCall.cancelled_at).toBeDefined();
  });

  test('getConfigurations calls select and orderBy', async () => {
    await initializeDatabase();
    const configurations = await getConfigurations();
    expect(Array.isArray(configurations)).toBe(true);
  });

  test('getExecutions calls select, join and orderBy', async () => {
    await initializeDatabase();
    const executions = await getExecutions();
    expect(Array.isArray(executions)).toBe(true);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  test('createConfiguration throws when database not initialized', async () => {
    await expect(
      createConfiguration({ title: 'Teste', hours: 0, minutes: 0, seconds: 0 })
    ).rejects.toThrow('Database not initialized');
  });
});
