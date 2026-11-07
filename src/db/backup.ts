import { db as defaultDb, type FitDB } from './db';

export const BACKUP_APP = 'hashan-fit';
export const BACKUP_VERSION = 1;
const TABLES = ['settings', 'days', 'weighIns', 'workouts', 'adjustments'] as const;
type TableName = (typeof TABLES)[number];

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  tables: Record<TableName, unknown[]>;
}

export class BackupError extends Error {}

export async function exportBackup(db: FitDB = defaultDb, now = new Date()): Promise<BackupFile> {
  const tables = {} as BackupFile['tables'];
  for (const t of TABLES) tables[t] = await db.table(t).toArray();
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: now.toISOString(), tables };
}

/** Checks a parsed file and returns it typed, or throws BackupError with a plain message. */
export function validateBackup(data: unknown): BackupFile {
  if (typeof data !== 'object' || data === null) throw new BackupError('This file is not a Hashan Fit backup.');
  const f = data as Partial<BackupFile>;
  if (f.app !== BACKUP_APP) throw new BackupError('This file is not a Hashan Fit backup.');
  if (f.version !== BACKUP_VERSION) throw new BackupError(`This backup is version ${String(f.version)}, but this app reads version ${BACKUP_VERSION}.`);
  if (typeof f.tables !== 'object' || f.tables === null) throw new BackupError('The backup file is damaged (no data found).');
  for (const t of TABLES) {
    if (!Array.isArray((f.tables as Record<string, unknown>)[t])) throw new BackupError(`The backup file is damaged (missing ${t}).`);
  }
  return f as BackupFile;
}

export function backupCounts(f: BackupFile): Record<TableName, number> {
  return Object.fromEntries(TABLES.map((t) => [t, f.tables[t].length])) as Record<TableName, number>;
}

/** Replaces all data with the backup. Nothing changes if validation fails. */
export async function importBackup(data: unknown, db: FitDB = defaultDb): Promise<Record<TableName, number>> {
  const f = validateBackup(data);
  await db.transaction('rw', TABLES.map((t) => db.table(t)), async () => {
    for (const t of TABLES) {
      await db.table(t).clear();
      await db.table(t).bulkPut(f.tables[t]);
    }
  });
  return backupCounts(f);
}

export function backupFileName(now = new Date()): string {
  return `hashan-fit-backup-${now.toISOString().slice(0, 10)}.json`;
}
