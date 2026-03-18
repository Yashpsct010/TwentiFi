import {
  cancelAllScheduledNotificationsAsync,
  requestPermissions,
  scheduleLoggingNotification,
  scheduleReminderNotification,
} from "@/services/notifications";
import { useSettingsStore } from "@/store/settingsStore";
import { generateConsolidatedNotifications } from "@/services/gemini";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SessionState {
  isActive: boolean;
  startTime: number | null;
  endTime: number | null;
  goals: { id: string; text: string; completed: boolean }[];
  startSession: (goals: string[]) => Promise<void>;
  endSession: () => Promise<void>;
  toggleGoal: (id: string) => void;
  rescheduleNextPulse: () => Promise<void>;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      isActive: false,
      startTime: null,
      endTime: null,
      goals: [],
      startSession: async (goals) => {
        set({
          isActive: true,
          startTime: Date.now(),
          endTime: null,
          goals: goals.map((g) => ({
            id: Math.random().toString(36).substr(2, 9),
            text: g,
            completed: false,
          })),
        });
        
        // Schedule first pulse & reminder
        await get().rescheduleNextPulse();
      },
      rescheduleNextPulse: async () => {
        try {
          const granted = await requestPermissions();
          if (!granted) return;

          const { loggingInterval, geminiApiKey, missedLogReminders } = useSettingsStore.getState();
          
          // Cancel previous triggers to avoid overlap
          await cancelAllScheduledNotificationsAsync();

          let logPrompt;
          let reminderPrompt;

          if (geminiApiKey) {
            try {
              const notifications = await generateConsolidatedNotifications(geminiApiKey);
              logPrompt = notifications.log_prompt;
              reminderPrompt = notifications.reminder;
            } catch (e) {
              console.warn("AI notification generation failed, using fallbacks", e);
            }
          }

          // Schedule the pulse
          await scheduleLoggingNotification(loggingInterval, logPrompt);

          // Schedule follow-up reminder if enabled (pulse interval + 5 mins)
          if (missedLogReminders) {
            await scheduleReminderNotification(loggingInterval + 5, reminderPrompt);
          }
        } catch (error) {
          console.warn("Rescheduling notifications failed:", error);
        }
      },
      endSession: async () => {
        await cancelAllScheduledNotificationsAsync();
        set({ isActive: false, startTime: null, endTime: null, goals: [] });
      },
      toggleGoal: (id) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, completed: !g.completed } : g,
          ),
        })),
    }),
    {
      name: "session-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
