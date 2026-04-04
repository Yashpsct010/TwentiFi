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
  geminiApiKey: string;
  hasCompletedOnboarding: boolean;
  theme: 'light' | 'dark';
  customTags: string[];
  setUserName: (name: string) => void;
  setGeminiApiKey: (key: string) => void;
  setStartOfDay: (time: string) => void;
  setEndOfDay: (time: string) => void;
  setLoggingInterval: (interval: number) => void;
  toggleActivityPrompts: () => Promise<void>;
  toggleMissedLogReminders: () => Promise<void>;
  setHasCompletedOnboarding: (val: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addCustomTag: (tag: string) => void;
  removeCustomTag: (tag: string) => void;
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
      geminiApiKey: '',
      hasCompletedOnboarding: false,
      theme: 'light',
      customTags: [],
      setUserName: (userName) => set({ userName }),
      setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
      setHasCompletedOnboarding: (hasCompletedOnboarding) => set({ hasCompletedOnboarding }),
      setTheme: (theme) => set({ theme }),
      setStartOfDay: (startOfDay) => set({ startOfDay }),
      setEndOfDay: (endOfDay) => set({ endOfDay }),
      addCustomTag: (tag) => set((state) => {
        if (state.customTags.length >= 5 || state.customTags.includes(tag.trim())) return state;
        return { customTags: [...state.customTags, tag.trim()] };
      }),
      removeCustomTag: (tag) => set((state) => ({
        customTags: state.customTags.filter((t) => t !== tag)
      })),
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
