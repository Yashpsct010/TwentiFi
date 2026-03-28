import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { AIInsights } from "@/services/gemini";

interface InsightState {
  aiInsights: AIInsights | null;
  lastPulseCount: number;
  lastTimestamp: string | null;
  setInsights: (insights: AIInsights, pulseCount: number, timestamp: string) => void;
  clearInsights: () => void;
}

export const useInsightStore = create<InsightState>()(
  persist(
    (set) => ({
      aiInsights: null,
      lastPulseCount: 0,
      lastTimestamp: null,
      setInsights: (insights, pulseCount, timestamp) =>
        set({
          aiInsights: insights,
          lastPulseCount: pulseCount,
          lastTimestamp: timestamp,
        }),
      clearInsights: () =>
        set({ aiInsights: null, lastPulseCount: 0, lastTimestamp: null }),
    }),
    {
      name: "insight-storage",
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
