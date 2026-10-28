import { app } from 'electron';
import knex from 'knex';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DatabaseRepository } from './database-repository';
import { FileSystem } from './file-system';

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const fileSystem = new FileSystem(app.getPath('userData'));
let dbInstance: ReturnType<typeof knex> | null = null;
let repository: DatabaseRepository | null = null;

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function logError(message: string): void {
  const logFile = path.join(fileSystem.getLogsDirectory(), `${getToday()}.log`);
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
  const sourceDb = fileSystem.getDatabasePath();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  fileSystem.createBackup(sourceDb, `${timestamp}.sqlite`);
}

export async function initializeDatabase(): Promise<void> {
  const dbPath = fileSystem.getDatabasePath();
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

export function getRepository(): DatabaseRepository {
  if (!repository) {
    if (!dbInstance) {
      throw new Error('Database not initialized');
    }
    repository = new DatabaseRepository(dbInstance);
  }
  return repository;
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
