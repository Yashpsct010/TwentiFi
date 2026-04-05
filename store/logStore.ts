import { create } from 'zustand';
import { saveLog, getAllLogs, deleteAllLogs, LogEntry } from '@/services/database';
import * as FileSystem from 'expo-file-system';

interface LogState {
  logs: LogEntry[];
  addLog: (activity: string, mood: LogEntry['mood'], productivity: number, audioUri?: string | null, environment?: string, tags?: string[], remarks?: string, groupName?: string) => Promise<void>;
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
// We need to import useSettingsStore implicitly inside addLog since it's a store
  addLog: async (activity, mood, productivity, audioUri, environment, tags, remarks, groupName) => {
    // Dynamically retrieve the current duration setting instead of passing it around
    const { useSettingsStore } = await import('@/store/settingsStore');
    const currentDuration = useSettingsStore.getState().loggingInterval;

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
      duration: currentDuration,
      groupName,
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
