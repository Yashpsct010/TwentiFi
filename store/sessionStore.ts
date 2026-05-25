import {
  cancelNotification,
  requestPermissions,
  schedulePulseNotification,
  scheduleForgotTimerReminder,
} from "@/services/notifications";
import { useSettingsStore } from "@/store/settingsStore";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SessionState {
  isActive: boolean;
  startTime: number | null;
  endTime: number | null;
  activeMilestoneId: string | null;
  pulseNotificationId: string | null;
  forgotTimerNotificationId: string | null;
  goals: { id: string; text: string; completed: boolean }[];
  startSession: (goals: string[], milestoneId?: string) => Promise<void>;
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
      activeMilestoneId: null,
      goals: [],
      startSession: async (goals, milestoneId) => {
        set({
          isActive: true,
          startTime: Date.now(),
          endTime: null,
          activeMilestoneId: milestoneId ?? null,
          pulseNotificationId: null,
          forgotTimerNotificationId: null,
          goals: goals.map((g) => ({
            id: Math.random().toString(36).substr(2, 9),
            text: g,
            completed: false,
          })),
        });
        
        const granted = await requestPermissions();
        if (granted) {
          const forgotId = await scheduleForgotTimerReminder();
          set({ forgotTimerNotificationId: forgotId });
        }
        
        // Schedule first pulse & reminder
        await get().rescheduleNextPulse();
      },
      rescheduleNextPulse: async () => {
        try {
          const granted = await requestPermissions();
          if (!granted) return;

          const { loggingInterval } = useSettingsStore.getState();
          
          const state = get();
          await cancelNotification(state.pulseNotificationId);

          const pulseId = await schedulePulseNotification(loggingInterval);
          set({ pulseNotificationId: pulseId });
        } catch (error) {
          console.warn("Rescheduling notifications failed:", error);
        }
      },
      endSession: async () => {
        try {
          const state = get();
          await cancelNotification(state.pulseNotificationId);
          await cancelNotification(state.forgotTimerNotificationId);
        } catch (e) {
          console.warn('Could not cancel notifications on session end:', e);
        } finally {
          set({
            isActive: false,
            startTime: null,
            endTime: null,
            activeMilestoneId: null,
            pulseNotificationId: null,
            forgotTimerNotificationId: null,
            goals: []
          });
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
