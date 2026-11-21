import { useMembershipStore, BASIC_ACTIVE_ROADMAP_LIMIT, BASIC_PROJECT_GROUP_LIMIT, BASIC_DAILY_AI_EXPANSION_LIMIT } from '@/store/membershipStore';
import { useDialogStore } from '@/store/dialogStore';
import { useRouter } from 'expo-router';

export function useMembership() {
  const router = useRouter();
  const {
    tier,
    billingCycle,
    subscriptionExpiresAt,
    isDeveloperSandbox,
    dailyAiExpansionsUsed,
    upgradeToPulsePlus,
    downgradeToBasic,
    toggleDeveloperSandbox,
    incrementAiExpansion,
    resetQuotasIfNewDay,
  } = useMembershipStore();

  const isPulsePlus = tier === 'pulse_plus';

  const showPaywall = () => {
    router.push('/membership' as any);
  };

  const showGatedDialog = (featureTitle: string, featureDesc: string) => {
    useDialogStore.getState().showDialog(
      featureTitle,
      featureDesc,
      [
        {
          text: 'Upgrade to Pulse+ ✨',
          style: 'default',
          onPress: () => {
            router.push('/membership' as any);
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  return {
    isPulsePlus,
    tier,
    billingCycle,
    subscriptionExpiresAt,
    isDeveloperSandbox,
    tierName: isPulsePlus ? 'TwentiFi Pulse+' : 'Standard Pulse',
    requiresApiKey: !isPulsePlus,
    dailyAiExpansionsUsed,
    remainingExpansions: isPulsePlus ? Infinity : Math.max(0, BASIC_DAILY_AI_EXPANSION_LIMIT - dailyAiExpansionsUsed),
    
    // Feature gating checks
    canCreateMilestone: (currentActiveCount: number) => isPulsePlus || currentActiveCount < BASIC_ACTIVE_ROADMAP_LIMIT,
    canCreateGroup: (currentGroupCount: number) => isPulsePlus || currentGroupCount < BASIC_PROJECT_GROUP_LIMIT,
    canExpandTask: () => isPulsePlus || dailyAiExpansionsUsed < BASIC_DAILY_AI_EXPANSION_LIMIT,

    // Actions & Triggers
    upgradeToPulsePlus,
    downgradeToBasic,
    toggleDeveloperSandbox,
    incrementAiExpansion,
    resetQuotasIfNewDay,
    showPaywall,
    showGatedDialog,
  };
}
