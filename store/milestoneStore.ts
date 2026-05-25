import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MilestoneType = 'habit' | 'target';
export type TaskStatus = 'pending' | 'completed' | 'carried';

export interface MilestoneTask {
  id: string;
  text: string;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

export interface Milestone {
  id: string;
  title: string;
  type: MilestoneType;
  description?: string;
  deadline?: string;       // ISO date string — only for 'target' type
  isCompleted: boolean;
  createdAt: string;
  tasks: MilestoneTask[];
  sessionCount: number;    // total sessions done for this milestone
}

interface MilestoneState {
  milestones: Milestone[];
  lastHabitResetDate: string | null;

  // Milestone CRUD
  addMilestone: (
    title: string,
    type: MilestoneType,
    description?: string,
    deadline?: string,
  ) => string; // returns new milestone id
  deleteMilestone: (id: string) => void;
  completeMilestone: (id: string) => void;
  reopenMilestone: (id: string) => void;

  // Task CRUD
  addTask: (milestoneId: string, text: string) => void;
  deleteTask: (milestoneId: string, taskId: string) => void;
  updateTask: (milestoneId: string, taskId: string, text: string) => void;
  replaceAllTasks: (milestoneId: string, texts: string[]) => void;

  // Session lifecycle
  finalizeSession: (milestoneId: string, completedTaskIds: string[]) => void;

  // Habit daily reset
  resetHabitsIfNewDay: () => void;
}

const todayStr = () => new Date().toISOString().split('T')[0];
const genId = () => Math.random().toString(36).substr(2, 9);

export const useMilestoneStore = create<MilestoneState>()(
  persist(
    (set, get) => ({
      milestones: [],
      lastHabitResetDate: null,

      addMilestone: (title, type, description, deadline) => {
        const id = genId();
        set((state) => ({
          milestones: [
            ...state.milestones,
            {
              id,
              title,
              type,
              description,
              deadline,
              isCompleted: false,
              createdAt: new Date().toISOString(),
              tasks: [],
              sessionCount: 0,
            },
          ],
        }));
        return id;
      },

      deleteMilestone: (id) =>
        set((state) => ({
          milestones: state.milestones.filter((m) => m.id !== id),
        })),

      completeMilestone: (id) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === id ? { ...m, isCompleted: true } : m,
          ),
        })),

      reopenMilestone: (id) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === id ? { ...m, isCompleted: false } : m,
          ),
        })),

      addTask: (milestoneId, text) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === milestoneId
              ? {
                  ...m,
                  tasks: [
                    ...m.tasks,
                    {
                      id: genId(),
                      text,
                      status: 'pending' as TaskStatus,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                }
              : m,
          ),
        })),

      deleteTask: (milestoneId, taskId) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === milestoneId
              ? { ...m, tasks: m.tasks.filter((t) => t.id !== taskId) }
              : m,
          ),
        })),

      updateTask: (milestoneId, taskId, text) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === milestoneId
              ? {
                  ...m,
                  tasks: m.tasks.map((t) =>
                    t.id === taskId ? { ...t, text } : t,
                  ),
                }
              : m,
          ),
        })),

      replaceAllTasks: (milestoneId, texts) =>
        set((state) => ({
          milestones: state.milestones.map((m) =>
            m.id === milestoneId
              ? {
                  ...m,
                  tasks: texts.map((text) => ({
                    id: genId(),
                    text,
                    status: 'pending' as TaskStatus,
                    createdAt: new Date().toISOString(),
                  })),
                }
              : m,
          ),
        })),

      /**
       * Called when a session ends.
       * - completedTaskIds → status: 'completed'
       * - All other pending/carried tasks → status: 'carried' (roll over)
       * - Already completed tasks stay completed.
       */
      finalizeSession: (milestoneId, completedTaskIds) =>
        set((state) => ({
          milestones: state.milestones.map((m) => {
            if (m.id !== milestoneId) return m;
            return {
              ...m,
              sessionCount: m.sessionCount + 1,
              tasks: m.tasks.map((t) => {
                if (completedTaskIds.includes(t.id)) {
                  return { ...t, status: 'completed', completedAt: new Date().toISOString() };
                }
                if (t.status === 'pending' || t.status === 'carried') {
                  return { ...t, status: 'carried' };
                }
                return t; // already completed — leave it
              }),
            };
          }),
        })),

      /**
       * Resets all habit milestone tasks to 'pending' once per calendar day.
       * Call this on app launch (in _layout.tsx).
       */
      resetHabitsIfNewDay: () => {
        const today = todayStr();
        const { lastHabitResetDate, milestones } = get();
        if (lastHabitResetDate === today) return; // already done today

        set({
          lastHabitResetDate: today,
          milestones: milestones.map((m) => {
            if (m.type !== 'habit' || m.isCompleted) return m;
            return {
              ...m,
              tasks: m.tasks.map((t) => ({
                ...t,
                status: 'pending' as TaskStatus,
                completedAt: undefined,
              })),
            };
          }),
        });
      },
    }),
    {
      name: 'milestone-storage',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
