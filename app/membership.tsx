import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useMembership } from '@/hooks/use-membership';
import { useDialogStore } from '@/store/dialogStore';

const PERKS = [
  'Zero-Setup Managed AI (No Gemini API Key Needed)',
  'Unlimited AI Goal Expansions & Subtask Breakdowns',
  'Unlimited Active Milestones & Habit Roadmaps',
  'Unlimited Project Categories & Custom Grouping',
  'Multi-Day Behavioral Trend Coaching & Deep Insights',
  'Encrypted Cloud Backup & Markdown/CSV Data Exports',
  'Exclusive Editorial Theme Palettes & Streak Rescues',
];

export default function MembershipModal() {
  const router = useRouter();
  const t = useTheme();
  const { isPulsePlus, billingCycle, upgradeToPulsePlus, downgradeToBasic } = useMembership();
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

  const handleSubscribe = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    upgradeToPulsePlus(selectedPlan);
    useDialogStore.getState().showDialog(
      'Welcome to Pulse+ ✨',
      'You have successfully unlocked TwentiFi Pulse+. Enjoy zero-setup managed AI, unlimited roadmaps, and deep behavioral coaching.',
      [
        {
          text: 'Get Started',
          style: 'default',
          onPress: () => router.back(),
        },
      ]
    );
  };

  const handleDowngrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    useDialogStore.getState().showDialog(
      'Switch to Standard Pulse?',
      'You will switch to the free Standard Pulse plan. Active roadmaps over 2 will remain preserved but new creations will be capped.',
      [
        {
          text: 'Switch to Free',
          style: 'destructive',
          onPress: () => {
            downgradeToBasic();
            router.back();
          },
        },
        { text: 'Keep Pulse+', style: 'cancel' },
      ]
    );
  };

  const handleRestore = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    useDialogStore.getState().showDialog(
      'Purchases Restored',
      'Your subscription status is up to date.'
    );
  };

  const openTerms = () => {
    Linking.openURL('https://twentifi.app').catch(() => {});
  };

  return (
    <View className={`flex-1 ${t.bg}`}>
      {/* Modal handle */}
      <View className="items-center pt-3 pb-1">
        <View
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            backgroundColor: t.colors.border,
          }}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 24,
          paddingTop: 16,
          paddingBottom: 48,
        }}
      >
        {/* Top bar with Close button and Badge */}
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className={`w-10 h-10 rounded-[4px] border ${t.border} items-center justify-center`}
            style={{ backgroundColor: t.colors.card }}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color={t.colors.text} />
          </TouchableOpacity>
          <View
            className={`px-2.5 py-1 rounded-[4px] border ${t.border}`}
            style={{ backgroundColor: isPulsePlus ? t.colors.greenLight : t.colors.card }}
          >
            <Text
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 10,
                letterSpacing: 1.5,
                color: isPulsePlus ? t.colors.text : t.colors.subtext,
              }}
            >
              {isPulsePlus ? 'ACTIVE MEMBER' : 'PULSE+'}
            </Text>
          </View>
        </View>

        {/* Title & Description */}
        <Text
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 2 }}
          className={`${t.textSubtle} uppercase mb-1`}
        >
          Membership
        </Text>
        <Text
          style={{ fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.5 }}
          className={`${t.textPrimary} mb-2`}
        >
          TwentiFi Pulse+
        </Text>
        <Text
          style={{ fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 }}
          className={`${t.textSubtle} mb-6`}
        >
          Elevate your daily rhythm with zero-setup managed AI, unlimited roadmaps, project categorization, and behavioral coaching.
        </Text>

        {/* Perks Card (Level 1 Tonal Nesting) */}
        <View
          className={`border ${t.border} rounded-[4px] p-5 mb-6`}
          style={{ backgroundColor: t.colors.card }}
        >
          <Text
            style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 2 }}
            className={`${t.textSubtle} uppercase mb-4`}
          >
            Included Perks
          </Text>
          {PERKS.map((perk, idx) => (
            <View key={idx} className="flex-row items-start mb-3">
              <Ionicons
                name="checkmark-circle"
                size={16}
                color={t.colors.green}
                style={{ marginRight: 10, marginTop: 2 }}
              />
              <Text
                style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }}
                className={t.textPrimary}
              >
                {perk}
              </Text>
            </View>
          ))}
        </View>

        {/* Plan Selector (Only if not already subscribed) */}
        {!isPulsePlus ? (
          <>
            <Text
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 2 }}
              className={`${t.textSubtle} uppercase mb-3`}
            >
              Select Plan
            </Text>

            {/* Annual Plan Card */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedPlan('annual');
              }}
              className={`border rounded-[4px] p-4 mb-3`}
              style={{
                backgroundColor: t.colors.card,
                borderColor: selectedPlan === 'annual' ? t.colors.green : t.colors.border,
                borderWidth: selectedPlan === 'annual' ? 2 : 1,
              }}
              activeOpacity={0.8}
            >
              <View className="flex-row justify-between items-center mb-1">
                <View className="flex-row items-center">
                  <Ionicons
                    name={selectedPlan === 'annual' ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={selectedPlan === 'annual' ? t.colors.green : t.colors.subtext}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{ fontFamily: 'Inter_700Bold', fontSize: 15 }}
                    className={t.textPrimary}
                  >
                    Annual Membership
                  </Text>
                </View>
                <View
                  className="px-2 py-0.5 rounded-[2px]"
                  style={{ backgroundColor: t.colors.greenLight }}
                >
                  <Text
                    style={{
                      fontFamily: 'Inter_600SemiBold',
                      fontSize: 9,
                      letterSpacing: 1,
                      color: t.colors.text,
                    }}
                  >
                    SAVE 45%
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 14,
                  color: t.colors.green,
                  marginLeft: 24,
                }}
              >
                $39.99 / year{' '}
                <Text
                  style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }}
                  className={t.textSubtle}
                >
                  ($3.33/mo)
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Monthly Plan Card */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedPlan('monthly');
              }}
              className={`border rounded-[4px] p-4 mb-6`}
              style={{
                backgroundColor: t.colors.card,
                borderColor: selectedPlan === 'monthly' ? t.colors.green : t.colors.border,
                borderWidth: selectedPlan === 'monthly' ? 2 : 1,
              }}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center mb-1">
                <Ionicons
                  name={selectedPlan === 'monthly' ? 'radio-button-on' : 'radio-button-off'}
                  size={16}
                  color={selectedPlan === 'monthly' ? t.colors.green : t.colors.subtext}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{ fontFamily: 'Inter_700Bold', fontSize: 15 }}
                  className={t.textPrimary}
                >
                  Monthly Membership
                </Text>
              </View>
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 14,
                  color: t.colors.textDim,
                  marginLeft: 24,
                }}
              >
                $5.99 / month{' '}
                <Text
                  style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }}
                  className={t.textSubtle}
                >
                  (Cancel anytime)
                </Text>
              </Text>
            </TouchableOpacity>

            {/* Primary Upgrade CTA Button */}
            <TouchableOpacity
              onPress={handleSubscribe}
              className="rounded-[4px] p-4 items-center justify-center mb-4"
              style={{ backgroundColor: t.isDark ? t.colors.text : '#1A1A1A' }}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 13,
                  letterSpacing: 1.5,
                  color: t.isDark ? '#1A1A1A' : '#FFFFFF',
                }}
              >
                UPGRADE TO TWENTIFI PULSE+ →
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          /* Subscribed State Controls */
          <View className="mb-6">
            <View
              className={`border ${t.border} rounded-[4px] p-4 mb-4`}
              style={{ backgroundColor: t.colors.card }}
            >
              <Text
                style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 2 }}
                className={`${t.textSubtle} uppercase mb-1`}
              >
                Current Plan
              </Text>
              <Text
                style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}
                className={`${t.textPrimary} mb-1`}
              >
                TwentiFi Pulse+ ({billingCycle === 'monthly' ? 'Monthly' : 'Annual'})
              </Text>
              <Text
                style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }}
                className={t.textSubtle}
              >
                All premium cloud AI features and unlimited capacities are active.
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleDowngrade}
              className={`border ${t.border} rounded-[4px] p-3.5 items-center justify-center`}
              style={{ backgroundColor: t.colors.bg }}
            >
              <Text
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 12,
                  letterSpacing: 1,
                  color: t.colors.error,
                }}
              >
                SWITCH TO FREE BASIC PLAN
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer info */}
        <View className="flex-row justify-center items-center gap-4 mt-2">
          <TouchableOpacity onPress={handleRestore}>
            <Text
              style={{ fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 1 }}
              className={t.textSubtle}
            >
              RESTORE
            </Text>
          </TouchableOpacity>
          <Text className={t.textSubtle}>•</Text>
          <TouchableOpacity onPress={openTerms}>
            <Text
              style={{ fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 1 }}
              className={t.textSubtle}
            >
              TERMS & PRIVACY
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
