import {
  cancelAllScheduledNotificationsAsync,
  requestPermissions,
  scheduleLoggingNotification,
  scheduleReminderNotification,
} from "@/services/notifications";
import { useSettingsStore } from "@/store/settingsStore";
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
  addGoal: (text: string) => void;
  deleteGoal: (id: string) => void;
  replaceGoalWithMultiple: (id: string, newTexts: string[]) => void;
  reorderGoals: (newGoals: { id: string; text: string; completed: boolean }[]) => void;
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

          const { loggingInterval, missedLogReminders } = useSettingsStore.getState();
          
          // Cancel previous triggers to avoid overlap
          await cancelAllScheduledNotificationsAsync();

          // Schedule the pulse with randomized local text (undefined uses fallback)
          await scheduleLoggingNotification(loggingInterval, undefined);

          // Schedule follow-up reminder if enabled (pulse interval + 5 mins)
          if (missedLogReminders) {
            await scheduleReminderNotification(loggingInterval + 5, undefined);
          }
        } catch (error) {
          console.warn("Rescheduling notifications failed:", error);
        }
      },
      endSession: async () => {
        // Always reset state regardless of notification errors
        try {
          await cancelAllScheduledNotificationsAsync();
        } catch (e) {
          console.warn('Could not cancel notifications on session end:', e);
        } finally {
          set({ isActive: false, startTime: null, endTime: null, goals: [] });
        }
      },
      toggleGoal: (id) =>
        set((state) => ({
          goals: state.goals.map((g) =>
            g.id === id ? { ...g, completed: !g.completed } : g,
          ),
        })),
      addGoal: (text) =>
        set((state) => ({
          goals: [
            ...state.goals,
            { id: Math.random().toString(36).substr(2, 9), text, completed: false },
          ],
        })),
      deleteGoal: (id) =>
        set((state) => ({
          goals: state.goals.filter((g) => g.id !== id),
        })),
      replaceGoalWithMultiple: (id, newTexts) =>
        set((state) => {
          const index = state.goals.findIndex((g) => g.id === id);
          if (index === -1) return state;
          const newGoals = [...state.goals];
          const insertedGoals = newTexts.map((text) => ({
            id: Math.random().toString(36).substr(2, 9),
            text,
            completed: false,
          }));
          newGoals.splice(index, 1, ...insertedGoals);
          return { goals: newGoals };
        }),
      reorderGoals: (newGoals) => set({ goals: newGoals }),
    }),
    {
      name: "session-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
