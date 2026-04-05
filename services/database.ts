import * as SQLite from "expo-sqlite";

export type LogMood = "focused" | "neutral" | "exhausted" | "deep_work";

export interface LogEntry {
  id: string;
  timestamp: string;
  activity: string;
  mood: LogMood;
  productivity: number;
  audioUri: string | null;
  environment?: string;
  tags?: string; // Stored as a serialized JSON array
  remarks?: string;
  duration?: number;
  groupName?: string;
}

const DB_NAME = "the25.db";

let _dbInstance: SQLite.SQLiteDatabase | null = null;

async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!_dbInstance) {
    _dbInstance = await SQLite.openDatabaseAsync(DB_NAME, { useNewConnection: true });
  }
  return _dbInstance;
}

export const initDB = async () => {
  const db = await getDB();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY NOT NULL,
      timestamp TEXT NOT NULL,
      activity TEXT NOT NULL,
      mood TEXT NOT NULL,
      productivity INTEGER NOT NULL,
      audioUri TEXT,
      environment TEXT,
      tags TEXT,
      remarks TEXT
    );
  `);

  // Safe migrations using try/catch
  try {
    await db.execAsync("ALTER TABLE logs ADD COLUMN environment TEXT");
  } catch {
    // Column already exists, ignore
  }
  try {
    await db.execAsync("ALTER TABLE logs ADD COLUMN tags TEXT");
  } catch {
    // Column already exists, ignore
  }
  try {
    await db.execAsync("ALTER TABLE logs ADD COLUMN remarks TEXT");
  } catch {
    // Column already exists, ignore
  }
  try {
    await db.execAsync("ALTER TABLE logs ADD COLUMN duration INTEGER");
  } catch {}
  try {
    await db.execAsync("ALTER TABLE logs ADD COLUMN groupName TEXT");
  } catch {}

  return db;
};

export const saveLog = async (log: LogEntry) => {
  const db = await getDB();
  const statement = await db.prepareAsync(
    "INSERT INTO logs (id, timestamp, activity, mood, productivity, audioUri, environment, tags, remarks, duration, groupName) VALUES ($id, $timestamp, $activity, $mood, $productivity, $audio, $env, $tags, $remarks, $duration, $groupName)"
  );
  try {
    await statement.executeAsync({
      $id: log.id,
      $timestamp: log.timestamp,
      $activity: log.activity,
      $mood: log.mood,
      $productivity: log.productivity,
      $audio: log.audioUri ?? "",
      $env: log.environment ?? "",
      $tags: log.tags ?? "",
      $remarks: log.remarks ?? "",
      $duration: log.duration ?? null,
      $groupName: log.groupName ?? ""
    });
  } finally {
    await statement.finalizeAsync();
  }
};

export const getAllLogs = async (): Promise<LogEntry[]> => {
  const db = await getDB();
  const allRows = await db.getAllAsync<LogEntry>(
    "SELECT * FROM logs ORDER BY timestamp DESC",
  );
  return allRows;
};

export const deleteAllLogs = async () => {
  const db = await getDB();
  await db.runAsync("DELETE FROM logs");
};

export const mergeLogsFromBackup = async (backupDbName: string) => {
  const db = await getDB();
  const backupDb = await SQLite.openDatabaseAsync(backupDbName, { useNewConnection: true });
  
  try {
    const backupLogs = await backupDb.getAllAsync<LogEntry>("SELECT * FROM logs");
    const statement = await db.prepareAsync(
      "INSERT OR IGNORE INTO logs (id, timestamp, activity, mood, productivity, audioUri, environment, tags, remarks, duration, groupName) VALUES ($id, $timestamp, $activity, $mood, $productivity, $audio, $env, $tags, $remarks, $duration, $groupName)"
    );
    try {
      for (const log of backupLogs) {
        await statement.executeAsync({
          $id: log.id,
          $timestamp: log.timestamp,
          $activity: log.activity,
          $mood: log.mood,
          $productivity: log.productivity,
          $audio: log.audioUri ?? "",
          $env: log.environment ?? "",
          $tags: log.tags ?? "",
          $remarks: log.remarks ?? "",
          $duration: log.duration ?? null,
          $groupName: log.groupName ?? ""
        });
      }
    } finally {
      await statement.finalizeAsync();
    }
  } catch (err) {
    console.error("Failed to merge backup DB", err);
    throw err;
  }
};
