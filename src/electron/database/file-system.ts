import path from 'path';
import fs from 'fs';

class FileSystem {
  private readonly rootDir: string;

  constructor(rootDir: string) {
    this.rootDir = rootDir;
  }

  getDataDirectory(): string {
    const dir = path.join(this.rootDir, 'database');
    this.ensureDirectoryExists(dir);
    return dir;
  }

  getDatabasePath(): string {
    return path.join(this.getDataDirectory(), 'database.sqlite');
  }

  getBackupDirectory(): string {
    const dir = path.join(this.getDataDirectory(), 'backup');
    this.ensureDirectoryExists(dir);
    return dir;
  }

  getLogsDirectory(): string {
    const dir = path.join(this.getDataDirectory(), 'logs');
    this.ensureDirectoryExists(dir);
    return dir;
  }

  private ensureDirectoryExists(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  createBackup(sourcePath: string, backupFileName: string): void {
    const backupDir = this.getBackupDirectory();
    const backupFile = path.join(backupDir, backupFileName);
    fs.copyFileSync(sourcePath, backupFile);
  }
}

export { FileSystem };
