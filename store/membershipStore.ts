import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type MembershipTier = 'basic' | 'pro' | 'pulse_plus';
export type BillingCycle = 'monthly' | 'annual' | 'lifetime';

export const BASIC_ACTIVE_ROADMAP_LIMIT = 2;
export const BASIC_PROJECT_GROUP_LIMIT = 3;
export const BASIC_DAILY_AI_EXPANSION_LIMIT = 3;

interface MembershipState {
  tier: MembershipTier;
  billingCycle: BillingCycle | null;
  subscriptionExpiresAt: string | null;
  licenseKey: string | null;
  dailyAiExpansionsUsed: number;
  lastQuotaResetDate: string;

  // Actions
  setTier: (tier: MembershipTier) => void;
  upgradeToPro: (cycle?: BillingCycle, license?: string) => void;
  downgradeToBasic: () => void;
  activateLicenseKey: (key: string) => boolean;
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
      licenseKey: null,
      dailyAiExpansionsUsed: 0,
      lastQuotaResetDate: getTodayString(),

      setTier: (tier) => set({ tier }),

      upgradeToPro: (cycle = 'annual', license) => {
        const nextYear = new Date();
        nextYear.setFullYear(nextYear.getFullYear() + (cycle === 'annual' ? 1 : 0));
        if (cycle === 'monthly') nextYear.setMonth(nextYear.getMonth() + 1);
        if (cycle === 'lifetime') nextYear.setFullYear(nextYear.getFullYear() + 50);

        set({
          tier: 'pro',
          billingCycle: cycle,
          subscriptionExpiresAt: nextYear.toISOString(),
          licenseKey: license || get().licenseKey || 'TWENTIFI-PRO-COMMUNITY',
        });
      },

      downgradeToBasic: () => {
        set({
          tier: 'basic',
          billingCycle: null,
          subscriptionExpiresAt: null,
          licenseKey: null,
        });
      },

      activateLicenseKey: (key: string) => {
        const trimmed = key.trim().toUpperCase();
        // Validates key format (e.g. TWENTIFI-PRO-... or any 8+ char key)
        if (trimmed.length >= 6) {
          get().upgradeToPro('lifetime', trimmed);
          return true;
        }
        return false;
      },

      incrementAiExpansion: () => {
        const state = get();
        state.resetQuotasIfNewDay();
        const currentCount = get().dailyAiExpansionsUsed;

        if (get().tier === 'pro' || get().tier === 'pulse_plus') {
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
