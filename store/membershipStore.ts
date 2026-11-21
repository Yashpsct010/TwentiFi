import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MembershipTier = 'basic' | 'pulse_plus';
export type BillingCycle = 'monthly' | 'annual' | 'lifetime';

export const BASIC_ACTIVE_ROADMAP_LIMIT = 2;
export const BASIC_PROJECT_GROUP_LIMIT = 3;
export const BASIC_DAILY_AI_EXPANSION_LIMIT = 3;

interface MembershipState {
  tier: MembershipTier;
  billingCycle: BillingCycle | null;
  subscriptionExpiresAt: string | null;
  isDeveloperSandbox: boolean;
  dailyAiExpansionsUsed: number;
  lastQuotaResetDate: string;

  // Actions
  setTier: (tier: MembershipTier) => void;
  upgradeToPulsePlus: (cycle?: BillingCycle) => void;
  downgradeToBasic: () => void;
  toggleDeveloperSandbox: () => void;
  incrementAiExpansion: () => boolean;
  resetQuotasIfNewDay: () => void;
}

const getTodayString = () => new Date().toISOString().split('T')[0];

export const useMembershipStore = create<MembershipState>()(
  persist(
    (set, get) => ({
      tier: 'basic',
      billingCycle: null,
      subscriptionExpiresAt: null,
      isDeveloperSandbox: false,
      dailyAiExpansionsUsed: 0,
      lastQuotaResetDate: getTodayString(),

      setTier: (tier) => set({ tier }),

      upgradeToPulsePlus: (cycle = 'annual') => {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + (cycle === 'annual' ? 1 : 0));
        if (cycle === 'monthly') nextYear.setMonth(nextYear.getMonth() + 1);

        set({
          tier: 'pulse_plus',
          billingCycle: cycle,
          subscriptionExpiresAt: nextYear.toISOString(),
        });
      },

      downgradeToBasic: () => {
        set({
          tier: 'basic',
          billingCycle: null,
          subscriptionExpiresAt: null,
        });
      },

      toggleDeveloperSandbox: () => {
        const next = !get().isDeveloperSandbox;
        set({
          isDeveloperSandbox: next,
          tier: next ? 'pulse_plus' : 'basic',
        });
      },

      incrementAiExpansion: () => {
        const state = get();
        state.resetQuotasIfNewDay();
        const currentCount = get().dailyAiExpansionsUsed;

        if (get().tier === 'pulse_plus') {
          set({ dailyAiExpansionsUsed: currentCount + 1 });
          return true;
        }

        if (currentCount >= BASIC_DAILY_AI_EXPANSION_LIMIT) {
          return false;
        }

        set({ dailyAiExpansionsUsed: currentCount + 1 });
        return true;
      },

      resetQuotasIfNewDay: () => {
        const today = getTodayString();
        if (get().lastQuotaResetDate !== today) {
          set({
            dailyAiExpansionsUsed: 0,
            lastQuotaResetDate: today,
          });
        }
      },
    }),
    {
      name: 'membership-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
