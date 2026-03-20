import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cancelAllScheduledNotificationsAsync } from '@/services/notifications';

interface SettingsState {
  userName: string;
  startOfDay: string;
  endOfDay: string;
  loggingInterval: number; // in minutes
  activityPrompts: boolean;
  missedLogReminders: boolean;
  sarvamApiKey: string;
  geminiApiKey: string;
  hasCompletedOnboarding: boolean;
  setUserName: (name: string) => void;
  setSarvamApiKey: (key: string) => void;
  setGeminiApiKey: (key: string) => void;
  setStartOfDay: (time: string) => void;
  setEndOfDay: (time: string) => void;
  setLoggingInterval: (interval: number) => void;
  toggleActivityPrompts: () => Promise<void>;
  toggleMissedLogReminders: () => Promise<void>;
  setHasCompletedOnboarding: (val: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      userName: 'You',
      startOfDay: '09:00',
      endOfDay: '21:00',
      loggingInterval: 20,
      activityPrompts: true,
      missedLogReminders: true,
      sarvamApiKey: '',
      geminiApiKey: '',
      hasCompletedOnboarding: false,
      setUserName: (userName) => set({ userName }),
      setSarvamApiKey: (sarvamApiKey) => set({ sarvamApiKey }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
      setHasCompletedOnboarding: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
      setStartOfDay: (startOfDay) => set({ startOfDay }),
      setEndOfDay: (endOfDay) => set({ endOfDay }),
      setLoggingInterval: async (loggingInterval) => {
        set({ loggingInterval });
        // If there's an active session, reschedule with the new interval
        try {
          const { useSessionStore } = await import('./sessionStore');
          const sessionState = useSessionStore.getState();
          if (sessionState.isActive) {
            await sessionState.rescheduleNextPulse();
          }
        } catch (e) {
          console.warn("Could not reschedule pulse from settings:", e);
        }
      },
      toggleActivityPrompts: async () => {
        const next = !get().activityPrompts;
        set({ activityPrompts: next });
        
        if (!next) {
          // If we disable prompts, cancel all current notifications
          await cancelAllScheduledNotificationsAsync();
        } else {
          // If we enable them, try to start/reschedule if session is active
          try {
            const { useSessionStore } = await import('./sessionStore');
            const sessionState = useSessionStore.getState();
            if (sessionState.isActive) {
              await sessionState.rescheduleNextPulse();
            }
          } catch (e) {
            console.warn("Could not reschedule pulse after enabling prompts:", e);
          }
        }
      },
      toggleMissedLogReminders: async () => {
        const next = !get().missedLogReminders;
        set({ missedLogReminders: next });
        
        // Always try to reschedule to apply the new toggle state (on or off)
        try {
          const { useSessionStore } = await import('./sessionStore');
          const sessionState = useSessionStore.getState();
          if (sessionState.isActive) {
            await sessionState.rescheduleNextPulse();
          }
        } catch (e) {
          console.warn("Could not reschedule reminders toggle:", e);
        }
      },
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
