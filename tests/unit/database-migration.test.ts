import knex from 'knex';
import { up as up001 } from '../../src/electron/database/migrations/001_create_timers_table';
import { up as up002 } from '../../src/electron/database/migrations/002_split_timers_table';

describe('migration 002 (separação de timers) contra SQLite real (:memory:)', () => {
  let db: ReturnType<typeof knex>;

  beforeEach(async () => {
    db = knex({
      client: 'better-sqlite3',
      connection: ':memory:',
      useNullAsDefault: true,
      pool: { min: 1, max: 1 },
    });
    await up001(db);
  });

  afterEach(async () => {
    await db.destroy();
  });

  test('executa 001 → 002, remove tabela timers e migra dados existentes', async () => {
    // Insere um timer "antigo" na tabela timers antes da migração 002
    await db('timers').insert({
      id: 5,
      title: 'Pomodoro',
      hours: 0,
      minutes: 25,
      seconds: 0,
      finish_at: '2026-11-04 18:00:00',
      created_at: '2026-11-04 17:00:00',
      updated_at: '2026-11-04 17:00:00',
    });

    await up002(db);

    // A tabela timers não existe mais
    const tables = await db
      .select('name')
      .from('sqlite_master')
      .where('type', 'table')
      .orderBy('name');
    const tableNames = tables.map((t) => (t as { name: string }).name);
    expect(tableNames).not.toContain('timers');
    expect(tableNames).toContain('timer_configurations');
    expect(tableNames).toContain('timer_executions');

    // Cada linha antiga virou 1 configuração + 1 execução FINISHED
    const configs = await db('timer_configurations').select('*');
    expect(configs).toHaveLength(1);
    expect(configs[0].title).toBe('Pomodoro');
    expect(configs[0].hours).toBe(0);
    expect(configs[0].minutes).toBe(25);
    expect(configs[0].seconds).toBe(0);

    const executions = await db('timer_executions').select('*');
    expect(executions).toHaveLength(1);
    expect(executions[0].configuration_id).toBe(configs[0].id);
    expect(executions[0].status).toBe('FINISHED');
    expect(executions[0].cancelled_at).toBeNull();
  });

  test('rejeita status inválido em timer_executions (CHECK constraint)', async () => {
    await up002(db);

    const [configId] = await db('timer_configurations').insert({
      title: 'Teste',
      hours: 0,
      minutes: 0,
      seconds: 10,
      created_at: '2026-11-04 17:00:00',
      updated_at: '2026-11-04 17:00:00',
    });

    await expect(
      db('timer_executions').insert({
        configuration_id: configId,
        finish_at: '2026-11-04 18:00:00',
        status: 'INVALIDO',
        cancelled_at: null,
        created_at: '2026-11-04 17:00:00',
        updated_at: '2026-11-04 17:00:00',
      })
    ).rejects.toThrow();
  });
});
