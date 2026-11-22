import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useMembership } from '@/hooks/use-membership';
import { useDialogStore } from '@/store/dialogStore';

const PRO_PERKS = [
  'Voice-to-Insight Journaling (Direct Gemini Stream)',
  'Automated Daily Dockets & AI Blueprint Studio',
  'Weekly Behavioral Coaching & Focus Trends',
  'Unlimited Active Milestones & Habit Roadmaps',
  'Full Data Portability (Markdown & CSV Exports)',
  'Zero Advertising, Zero External Trackers',
];

export default function MembershipModal() {
  const router = useRouter();
  const t = useTheme();
  const {
    isPro,
    billingCycle,
    licenseKey,
    upgradeToPro,
    downgradeToBasic,
    activateLicenseKey,
  } = useMembership();

  const [inputKey, setInputKey] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<'annual' | 'monthly'>('annual');

  const handleActivateKey = () => {
    if (!inputKey.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const success = activateLicenseKey(inputKey);
    if (success) {
      useDialogStore.getState().showDialog(
        'License Activated ✨',
        'TwentiFi Pro has been successfully unlocked on your device.',
        [
          {
            text: 'Continue',
            style: 'default',
            onPress: () => router.back(),
          },
        ]
      );
    } else {
      useDialogStore.getState().showDialog(
        'Invalid Key',
        'Please enter a valid license key or check the format.'
      );
    }
  };

  const handleOpenSupporterLink = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL('https://twentifi.app/#download').catch(() => {});
  };

  const handleUnlockProDirect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    upgradeToPro(selectedPlan);
    useDialogStore.getState().showDialog(
      'Welcome to TwentiFi Pro ✨',
      'You have unlocked all Pro capabilities including unlimited roadmaps, AI blueprint generation, and behavioral trend coaching.',
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
      'Switch to Free Plan?',
      'You will switch back to the free standard tier. Existing roadmaps remain saved.',
      [
        {
          text: 'Switch to Free',
          style: 'destructive',
          onPress: () => {
            downgradeToBasic();
            router.back();
          },
        },
        { text: 'Keep Pro', style: 'cancel' },
      ]
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
            style={{ backgroundColor: isPro ? t.colors.greenLight : t.colors.card }}
          >
            <Text
              style={{
                fontFamily: 'Inter_600SemiBold',
                fontSize: 10,
                letterSpacing: 1.5,
                color: isPro ? t.colors.text : t.colors.subtext,
              }}
            >
              {isPro ? 'PRO ACTIVE' : 'FREE TIER'}
            </Text>
          </View>
        </View>

        {/* Title & Description */}
        <Text
          style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 2 }}
          className={`${t.textSubtle} uppercase mb-1`}
        >
          Upgrade
        </Text>
        <Text
          style={{ fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.5 }}
          className={`${t.textPrimary} mb-2`}
        >
          TwentiFi Pro
        </Text>
        <Text
          style={{ fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22 }}
          className={`${t.textSubtle} mb-6`}
        >
          Deep focus without friction. Unlock automated schedule synthesis, unlimited active milestones, and weekly behavioral trends.
        </Text>

        {/* Perks Card */}
        <View
          className={`border ${t.border} rounded-[4px] p-5 mb-6`}
          style={{ backgroundColor: t.colors.card }}
        >
          <Text
            style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 2 }}
            className={`${t.textSubtle} uppercase mb-4`}
          >
            What's Included
          </Text>
          {PRO_PERKS.map((perk, idx) => (
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

        {!isPro ? (
          <>
            {/* Activation via License Key */}
            <View
              className={`border ${t.border} rounded-[4px] p-4 mb-5`}
              style={{ backgroundColor: t.colors.card }}
            >
              <Text
                style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.5 }}
                className={`${t.textSubtle} uppercase mb-2`}
              >
                Have a License Key?
              </Text>
              <TextInput
                value={inputKey}
                onChangeText={setInputKey}
                placeholder="e.g. TWENTIFI-PRO-XXXX"
                placeholderTextColor={t.colors.subtext}
                autoCapitalize="characters"
                style={{
                  fontFamily: 'Inter_600SemiBold',
                  fontSize: 13,
                  color: t.colors.text,
                  backgroundColor: t.colors.bg,
                  borderColor: t.colors.border,
                  borderWidth: 1,
                  borderRadius: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  marginBottom: 10,
                }}
              />
              <TouchableOpacity
                onPress={handleActivateKey}
                disabled={!inputKey.trim()}
                className="rounded-[4px] py-2.5 px-3 items-center justify-center border"
                style={{
                  backgroundColor: inputKey.trim() ? t.colors.text : t.colors.bg,
                  borderColor: t.colors.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter_700Bold',
                    fontSize: 11,
                    letterSpacing: 1,
                    color: inputKey.trim() ? t.colors.bg : t.colors.subtext,
                  }}
                  className="uppercase"
                >
                  Activate License Key
                </Text>
              </TouchableOpacity>
            </View>

            {/* Direct Unlock / Supporter Options */}
            <Text
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 2 }}
              className={`${t.textSubtle} uppercase mb-3`}
            >
              Unlock Pro
            </Text>

            <TouchableOpacity
              onPress={() => setSelectedPlan('annual')}
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
                    Annual Access
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
                    BEST VALUE
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
                $29.99 / year{' '}
                <Text
                  style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }}
                  className={t.textSubtle}
                >
                  ($2.50/mo)
                </Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setSelectedPlan('monthly')}
              className={`border rounded-[4px] p-4 mb-5`}
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
                  Monthly Access
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
                $3.99 / month
              </Text>
            </TouchableOpacity>

            {/* Primary Upgrade CTA Button */}
            <TouchableOpacity
              onPress={handleUnlockProDirect}
              className="rounded-[4px] p-4 items-center justify-center mb-3"
              style={{ backgroundColor: t.colors.text }}
              activeOpacity={0.85}
            >
              <Text
                style={{
                  fontFamily: 'Inter_700Bold',
                  fontSize: 13,
                  letterSpacing: 1.5,
                  color: t.colors.bg,
                }}
              >
                UNLOCK TWENTIFI PRO →
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleOpenSupporterLink}
              className="py-2.5 items-center justify-center mb-4"
            >
              <Text
                style={{
                  fontFamily: 'Inter_500Medium',
                  fontSize: 12,
                  color: t.colors.green,
                }}
              >
                Learn more or get key on twentifi.app ↗
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
                Current Membership
              </Text>
              <Text
                style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }}
                className={`${t.textPrimary} mb-1`}
              >
                TwentiFi Pro ({billingCycle === 'monthly' ? 'Monthly' : billingCycle === 'lifetime' ? 'Lifetime' : 'Annual'})
              </Text>
              {licenseKey && (
                <Text
                  style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: t.colors.green }}
                  className="mb-1"
                >
                  Key: {licenseKey}
                </Text>
              )}
              <Text
                style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }}
                className={t.textSubtle}
              >
                All Pro features, unlimited dockets, and behavioral coaching are fully active.
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
          <TouchableOpacity onPress={openTerms}>
            <Text
              style={{ fontFamily: 'Inter_500Medium', fontSize: 11, letterSpacing: 1 }}
              className={t.textSubtle}
            >
              TWENTIFI.APP • TERMS & PRIVACY
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
