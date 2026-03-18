import * as SQLite from "expo-sqlite";

export type LogMood = "focused" | "neutral" | "exhausted" | "deep_work";

export interface LogEntry {
  id: string;
  timestamp: string;
  activity: string;
  mood: LogMood;
  productivity: number;
  audioUri: string | null;
}

const DB_NAME = "the25.db";

// Singleton: reuse a single database connection for the entire app lifecycle
let _db: SQLite.SQLiteDatabase | null = null;

async function getDB(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync(DB_NAME);
  }
  return _db;
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
      audioUri TEXT
    );
  `);

  return db;
};

export const saveLog = async (log: LogEntry) => {
  const db = await getDB();
  await db.runAsync(
    "INSERT INTO logs (id, timestamp, activity, mood, productivity, audioUri) VALUES (?, ?, ?, ?, ?, ?)",
    log.id,
    log.timestamp,
    log.activity,
    log.mood,
    log.productivity,
    log.audioUri
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
