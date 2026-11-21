import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  cancelNotification,
  scheduleScheduleItemReminder,
} from "@/services/notifications";

export type ScheduleCategory = "habit" | "target" | "focus";

export interface ScheduleItem {
  id: string;
  title: string;
  startTime: string; // "HH:MM" 24h
  endTime: string; // "HH:MM" 24h
  durationMinutes: number;
  category: ScheduleCategory;
  milestoneId?: string;
  isCompleted: boolean;
  isPinned?: boolean;
  notificationId?: string;
}

// ── Time Utility Functions ──────────────────────────────────────────────────

export const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const getTomorrowDateString = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const timeToMinutes = (time: string): number => {
  if (!time || !time.includes(":")) return 0;
  const [hoursStr, minutesStr] = time.split(":");
  const hours = parseInt(hoursStr, 10) || 0;
  const minutes = parseInt(minutesStr, 10) || 0;
  return hours * 60 + minutes;
};

export const minutesToTime = (totalMinutes: number): string => {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const addMinutesToTime = (time: string, deltaMinutes: number): string => {
  const currentMinutes = timeToMinutes(time);
  return minutesToTime(currentMinutes + deltaMinutes);
};

export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  return addMinutesToTime(startTime, durationMinutes);
};

export const formatTimeDisplay = (time: string): string => {
  if (!time || !time.includes(":")) return time;
  const [hoursStr, minutesStr] = time.split(":");
  let hours = parseInt(hoursStr, 10) || 0;
  const minutes = minutesStr.padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutes} ${ampm}`;
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
};

/**
 * Automatically cascades schedule items sequentially.
 * The first item keeps its startTime (or uses baseStartTime if provided).
 * Subsequent items start right when the previous item ends.
 */
export const cascadeScheduleItems = (
  items: ScheduleItem[],
  baseStartTime?: string
): ScheduleItem[] => {
  if (items.length === 0) return [];

  let currentStartMinutes = baseStartTime
    ? timeToMinutes(baseStartTime)
    : timeToMinutes(items[0].startTime);

  return items.map((item) => {
    const duration = Math.max(item.durationMinutes || 30, 5);
    const start = minutesToTime(currentStartMinutes);
    const end = minutesToTime(currentStartMinutes + duration);
    currentStartMinutes += duration;
    return {
      ...item,
      startTime: start,
      endTime: end,
      durationMinutes: duration,
    };
  });
};

const genId = () => Math.random().toString(36).substring(2, 11);

// ── Sensible Default Seed ───────────────────────────────────────────────────

export const createDefaultDocket = (): ScheduleItem[] => [
  {
    id: genId(),
    title: "Morning Pulse & Docket Review",
    startTime: "09:00",
    endTime: "09:30",
    durationMinutes: 30,
    category: "focus",
    isCompleted: false,
  },
  {
    id: genId(),
    title: "Core Deep Work Block",
    startTime: "09:30",
    endTime: "11:30",
    durationMinutes: 120,
    category: "target",
    isCompleted: false,
  },
  {
    id: genId(),
    title: "Mindful Lunch & Walk",
    startTime: "12:00",
    endTime: "13:00",
    durationMinutes: 60,
    category: "habit",
    isCompleted: false,
  },
  {
    id: genId(),
    title: "Afternoon Focus Sprint",
    startTime: "14:00",
    endTime: "16:00",
    durationMinutes: 120,
    category: "target",
    isCompleted: false,
  },
  {
    id: genId(),
    title: "Daily Habit Review & Wrap-up",
    startTime: "17:00",
    endTime: "17:30",
    durationMinutes: 30,
    category: "habit",
    isCompleted: false,
  },
];

interface ScheduleState {
  targetDate: string; // YYYY-MM-DD
  items: ScheduleItem[];

  // Actions
  addItem: (
    item: Omit<ScheduleItem, "id" | "isCompleted" | "endTime"> & {
      id?: string;
      endTime?: string;
      isCompleted?: boolean;
    }
  ) => void;
  updateItem: (id: string, updates: Partial<ScheduleItem>) => void;
  deleteItem: (id: string) => Promise<void>;
  toggleComplete: (id: string) => void;
  shiftSchedule: (minutes: number) => Promise<void>;
  reorderSchedule: (newItems: ScheduleItem[]) => void;
  commitBlueprint: (date: string, newItems: ScheduleItem[]) => Promise<void>;
  checkAndResetForNewDay: () => void;
  clearDocket: () => Promise<void>;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      targetDate: getTodayDateString(),
      items: createDefaultDocket(),

      addItem: (item) => {
        const id = item.id || genId();
        const duration = item.durationMinutes || 30;
        const endTime = item.endTime || calculateEndTime(item.startTime, duration);

        const newItem: ScheduleItem = {
          id,
          title: item.title,
          startTime: item.startTime,
          endTime,
          durationMinutes: duration,
          category: item.category,
          milestoneId: item.milestoneId,
          isCompleted: !!item.isCompleted,
          isPinned: item.isPinned,
        };

        const updated = [...get().items, newItem].sort(
          (a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime)
        );

        set({ items: updated });
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item;
            const updated = { ...item, ...updates };
            if (updates.durationMinutes && !updates.endTime) {
              updated.endTime = calculateEndTime(
                updated.startTime,
                updated.durationMinutes
              );
            }
            return updated;
          }),
        }));
      },

      deleteItem: async (id) => {
        const itemToDelete = get().items.find((item) => item.id === id);
        if (itemToDelete?.notificationId) {
          await cancelNotification(itemToDelete.notificationId);
        }
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      toggleComplete: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
          ),
        }));
      },

      shiftSchedule: async (minutes: number) => {
        const { items, targetDate } = get();
        if (items.length === 0) return;

        // Shift uncompleted tasks forward by `minutes`
        const updatedItems: ScheduleItem[] = [];

        for (const item of items) {
          if (item.isCompleted) {
            updatedItems.push(item);
          } else {
            const newStart = addMinutesToTime(item.startTime, minutes);
            const newEnd = addMinutesToTime(item.endTime, minutes);

            // Re-schedule notification if exists
            let newNotifId = item.notificationId;
            if (item.notificationId) {
              await cancelNotification(item.notificationId);
              newNotifId =
                (await scheduleScheduleItemReminder(
                  { title: item.title, startTime: newStart },
                  targetDate
                )) || undefined;
            }

            updatedItems.push({
              ...item,
              startTime: newStart,
              endTime: newEnd,
              notificationId: newNotifId,
            });
          }
        }

        set({ items: updatedItems });
      },

      reorderSchedule: (newItems) => {
        // Anchor to the earliest startTime in the CURRENT store items (not the
        // stale times carried on the dragged items) so reordering never shifts
        // the docket's first slot later or earlier than intended.
        const currentItems = get().items;
        const anchorMinutes =
          currentItems.length > 0
            ? Math.min(...currentItems.map((i) => timeToMinutes(i.startTime)))
            : timeToMinutes(newItems[0]?.startTime ?? "09:00");
        const anchorTime = minutesToTime(anchorMinutes);
        const cascaded = cascadeScheduleItems(newItems, anchorTime);
        set({ items: cascaded });
      },

      commitBlueprint: async (date, newItems) => {
        const state = get();

        // Cancel previous notifications
        for (const item of state.items) {
          if (item.notificationId) {
            await cancelNotification(item.notificationId);
          }
        }

        // Schedule new notifications for each item
        const finalItems: ScheduleItem[] = [];
        for (const item of newItems) {
          let notifId: string | undefined = undefined;
          try {
            const scheduledId = await scheduleScheduleItemReminder(
              { title: item.title, startTime: item.startTime },
              date
            );
            if (scheduledId) notifId = scheduledId;
          } catch (e) {
            console.warn("Could not schedule task notification:", e);
          }

          finalItems.push({
            ...item,
            notificationId: notifId,
          });
        }

        set({
          targetDate: date,
          items: finalItems,
        });
      },

      checkAndResetForNewDay: () => {
        const today = getTodayDateString();
        const { targetDate, items } = get();

        if (targetDate !== today) {
          // Carry over incomplete target blocks or reset habit completion
          const carried = items.map((item) => ({
            ...item,
            isCompleted: false,
          }));
          set({
            targetDate: today,
            items: carried.length > 0 ? carried : createDefaultDocket(),
          });
        }
      },

      clearDocket: async () => {
        const { items } = get();
        for (const item of items) {
          if (item.notificationId) {
            await cancelNotification(item.notificationId);
          }
        }
        set({ items: [] });
      },
    }),
    {
      name: "twentifi-schedule-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
