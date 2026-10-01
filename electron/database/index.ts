import { app } from 'electron';
import knex from 'knex';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

let dbInstance: ReturnType<typeof knex> | null = null;

function getDataDirectory(): string {
  return path.join(app.getPath('userData'), 'database');
}

function getDatabasePath(): string {
  return path.join(getDataDirectory(), 'database.sqlite');
}

function getBackupDirectory(): string {
  return path.join(getDataDirectory(), 'backup');
}

function getLogsDirectory(): string {
  return path.join(getDataDirectory(), 'logs');
}

function ensureDirectories(): void {
  const dirs = [getDataDirectory(), getBackupDirectory(), getLogsDirectory()];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function logError(message: string): void {
  const logFile = path.join(getLogsDirectory(), `${getToday()}.log`);
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`, 'utf-8');
}

async function getCompletedMigrationNames(
  instance: ReturnType<typeof knex>
): Promise<Array<{ name: string }>> {
  try {
    return await instance.select('name').from('knex_migrations');
  } catch {
    return [];
  }
}

function getMigrationFiles(): string[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => (f.endsWith('.ts') && !f.endsWith('.d.ts')) || f.endsWith('.js'));
}

async function hasPendingMigrations(instance: ReturnType<typeof knex>): Promise<boolean> {
  const completed = await getCompletedMigrationNames(instance);
  const completedNames = completed.map((c) => c.name);
  const migrationFiles = getMigrationFiles();
  return migrationFiles.some((f) => !completedNames.includes(f));
}

async function backupDatabase(): Promise<void> {
  const sourceDb = getDatabasePath();
  const backupDir = getBackupDirectory();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `${timestamp}.sqlite`);
  fs.copyFileSync(sourceDb, backupFile);
}

export async function initializeDatabase(): Promise<void> {
  ensureDirectories();

  const dbPath = getDatabasePath();
  const dbExists = fs.existsSync(dbPath);

  const sqliteInstance = new Database(dbPath);
  sqliteInstance.pragma('journal_mode = WAL');
  sqliteInstance.close();

  const instance = knex({
    client: 'better-sqlite3',
    connection: dbPath,
    useNullAsDefault: true,
    pool: { min: 1, max: 1 },
    migrations: { extension: 'js' },
  });

  try {
    if (!dbExists) {
      await instance.migrate.latest({ directory: MIGRATIONS_DIR });
      dbInstance = instance;
      return;
    }

    const pending = await hasPendingMigrations(instance);
    if (pending) {
      await backupDatabase();
      try {
        await instance.migrate.latest({ directory: MIGRATIONS_DIR });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logError(`Migration failed: ${errorMessage}`);
        dbInstance = null;
        throw new Error(`Database migration failed: ${errorMessage}`, { cause: err });
      }
    }

    dbInstance = instance;
  } catch (err) {
    await instance.destroy();
    throw err;
  }
}

export async function createSession(data: {
  title: string;
  hours: number;
  minutes: number;
  seconds: number;
  finishAt: Date;
}): Promise<{ id: number }> {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }

  const { title, hours, minutes, seconds, finishAt } = data;
  const finishAtStr = finishAt.toISOString();

  const [id] = await dbInstance('sessions').insert({
    title,
    hours,
    minutes,
    seconds,
    finish_at: finishAtStr,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return { id: Number(id) };
}

export async function getSessions(): Promise<Array<Record<string, unknown>>> {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }

  return dbInstance('sessions').select('*').orderBy('created_at', 'desc');
}

export function getKnex(): ReturnType<typeof knex> {
  if (!dbInstance) {
    throw new Error('Database not initialized');
  }
  return dbInstance;
}

export function isDatabaseInitialized(): boolean {
  return dbInstance !== null;
}
