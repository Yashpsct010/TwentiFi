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
}

const DB_NAME = "the25.db";

async function getDB(): Promise<SQLite.SQLiteDatabase> {
  return await SQLite.openDatabaseAsync(DB_NAME);
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

  return db;
};

export const saveLog = async (log: LogEntry) => {
  const db = await getDB();
  await db.runAsync(
    "INSERT INTO logs (id, timestamp, activity, mood, productivity, audioUri, environment, tags, remarks) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    log.id,
    log.timestamp,
    log.activity,
    log.mood,
    log.productivity,
    log.audioUri,
    log.environment || null,
    log.tags || null,
    log.remarks || null
  );
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
