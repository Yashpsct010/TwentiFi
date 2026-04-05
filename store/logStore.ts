import { create } from 'zustand';
import { saveLog, getAllLogs, deleteAllLogs, LogEntry } from '@/services/database';
import * as FileSystem from 'expo-file-system';

interface LogState {
  logs: LogEntry[];
  addLog: (activity: string, mood: LogEntry['mood'], productivity: number, audioUri?: string | null, environment?: string, tags?: string[], remarks?: string) => Promise<void>;
  clearLogs: () => Promise<void>;
  loadLogs: () => Promise<void>;
}

export const useLogStore = create<LogState>((set) => ({
  logs: [],
  loadLogs: async () => {
    try {
      const logs = await getAllLogs();
      set({ logs });
    } catch (error) {
      console.error('Failed to load logs:', error);
    }
  },
  addLog: async (activity, mood, productivity, audioUri, environment, tags, remarks) => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      activity,
      mood,
      productivity,
      audioUri: audioUri || null,
      environment,
      tags: tags ? JSON.stringify(tags) : undefined,
      remarks,
    };

    try {
      await saveLog(newLog);
      set((state) => ({
        logs: [newLog, ...state.logs],
      }));
    } catch (error) {
      console.error('Failed to save log:', error);
      throw error;
    }
  },
  clearLogs: async () => {
    try {
      await deleteAllLogs();
      try {
        const dir = `${FileSystem.documentDirectory}twentifi-audio/`;
        await FileSystem.deleteAsync(dir, { idempotent: true });
      } catch (e) {
        console.warn('Failed to clean audio directory during purge:', e);
      }
      set({ logs: [] });
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  },
}));
