import { useMembershipStore, BASIC_ACTIVE_ROADMAP_LIMIT, BASIC_PROJECT_GROUP_LIMIT, BASIC_DAILY_AI_EXPANSION_LIMIT } from '@/store/membershipStore';
import { useDialogStore } from '@/store/dialogStore';
import { useRouter } from 'expo-router';

export function useMembership() {
  const router = useRouter();
  const {
    tier,
    billingCycle,
    subscriptionExpiresAt,
    licenseKey,
    dailyAiExpansionsUsed,
    upgradeToPro,
    downgradeToBasic,
    activateLicenseKey,
    incrementAiExpansion,
    resetQuotasIfNewDay,
  } = useMembershipStore();

  const isPro = tier === 'pro' || tier === 'pulse_plus';

  const showPaywall = () => {
    router.push('/membership' as any);
  };

  const showGatedDialog = (featureTitle: string, featureDesc: string) => {
    useDialogStore.getState().showDialog(
      featureTitle,
      featureDesc,
      [
        {
          text: 'Upgrade to Pro ✨',
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
    isPro,
    tier,
    billingCycle,
    subscriptionExpiresAt,
    licenseKey,
    tierName: isPro ? 'TwentiFi Pro' : 'Free Standard',
    requiresApiKey: !isPro,
    dailyAiExpansionsUsed,
    remainingExpansions: isPro ? Infinity : Math.max(0, BASIC_DAILY_AI_EXPANSION_LIMIT - dailyAiExpansionsUsed),
    
    // Feature gating checks
    canCreateMilestone: (currentActiveCount: number) => isPro || currentActiveCount < BASIC_ACTIVE_ROADMAP_LIMIT,
    canCreateGroup: (currentGroupCount: number) => isPro || currentGroupCount < BASIC_PROJECT_GROUP_LIMIT,
    canExpandTask: () => isPro || dailyAiExpansionsUsed < BASIC_DAILY_AI_EXPANSION_LIMIT,

    // Actions & Triggers
    upgradeToPro,
    downgradeToBasic,
    activateLicenseKey,
    incrementAiExpansion,
    resetQuotasIfNewDay,
    showPaywall,
    showGatedDialog,
  };
}
