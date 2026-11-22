import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/use-theme';
import { useMembership } from '@/hooks/use-membership';
import { LogEntry } from '@/services/database';
import { generateWeeklyTrendInsights, WeeklyTrendInsights } from '@/services/aiGateway';

export default function WeeklyTrendCard({ logs }: { logs: LogEntry[] }) {
  const t = useTheme();
  const { isPro, showPaywall } = useMembership();
  const [trendData, setTrendData] = useState<WeeklyTrendInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function loadTrends() {
      if (!isPro || logs.length === 0) return;
      setIsLoading(true);
      try {
        const data = await generateWeeklyTrendInsights(logs);
        setTrendData(data);
      } catch (err) {
        console.error('Failed to load weekly trends:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadTrends();
  }, [isPro, logs.length]);

  // If Basic plan, render architectural teaser
  if (!isPro) {
    return (
      <View
        className={`border ${t.border} rounded-[4px] p-5 mb-6`}
        style={{ backgroundColor: t.colors.card }}
      >
        <View className="flex-row justify-between items-center mb-3">
          <View className="flex-row items-center flex-1 mr-2">
            <Ionicons name="trending-up-outline" size={16} color={t.colors.green} />
            <Text
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1 }}
              className={`${t.textSubtle} uppercase ml-2`}
              numberOfLines={1}
            >
              Weekly Focus Trends
            </Text>
          </View>
          <View
            className={`px-2 py-0.5 rounded-[2px] border ${t.border} shrink-0`}
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
              PRO
            </Text>
          </View>
        </View>

        <Text
          style={{ fontFamily: 'Inter_700Bold', fontSize: 16, letterSpacing: -0.3 }}
          className={`${t.textPrimary} mb-2`}
        >
          Multi-Day Behavioral Coach
        </Text>

        <Text
          style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }}
          className={`${t.textSubtle} mb-4`}
        >
          Unlock deep multi-day velocity scoring, peak cognitive focus windows, and personalized cadence coaching across all your logged pulses.
        </Text>

        {/* Teaser Metrics Inset */}
        <View
          className={`border ${t.border} rounded-[4px] p-3 mb-4 flex-row justify-between items-center`}
          style={{ backgroundColor: t.colors.bg }}
        >
          <View>
            <Text
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.5 }}
              className={`${t.textSubtle} uppercase mb-0.5`}
            >
              Rhythm Velocity
            </Text>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 16 }} className={t.textPrimary}>
              88 / 100
            </Text>
          </View>
          <View>
            <Text
              style={{ fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.5 }}
              className={`${t.textSubtle} uppercase mb-0.5`}
            >
              Peak Focus Window
            </Text>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: t.colors.green }}>
              9:00 AM – 1:30 PM
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={showPaywall}
          className="rounded-[4px] py-3 px-4 items-center justify-center"
          style={{ backgroundColor: t.isDark ? t.colors.text : '#1A1A1A' }}
          activeOpacity={0.85}
        >
          <Text
            style={{
              fontFamily: 'Inter_700Bold',
              fontSize: 11,
              letterSpacing: 1.5,
              color: t.isDark ? '#1A1A1A' : '#FFFFFF',
            }}
          >
            UNLOCK BEHAVIORAL TRENDS →
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Active Pro Member View
  return (
    <View
      className={`border ${t.border} rounded-[4px] p-5 mb-6`}
      style={{ backgroundColor: t.colors.card }}
    >
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center flex-1 mr-2">
          <Ionicons name="sparkles" size={15} color={t.colors.green} />
          <Text
            style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1 }}
            className={`${t.textSubtle} uppercase ml-2`}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            Trend Intelligence
          </Text>
        </View>
        <View
          className={`px-2 py-0.5 rounded-[2px] border ${t.border} shrink-0`}
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
            PRO ACTIVE
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="py-8 items-center justify-center">
          <ActivityIndicator size="small" color={t.colors.green} />
          <Text
            style={{ fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 8 }}
            className={t.textSubtle}
          >
            Synthesizing multi-day rhythm…
          </Text>
        </View>
      ) : (
        <>
          {/* Headline */}
          <Text
            style={{ fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.3 }}
            className={`${t.textPrimary} mb-2`}
          >
            {trendData?.headline || 'Your Weekly Behavioral Cadence'}
          </Text>

          <Text
            style={{ fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 }}
            className={`${t.textSubtle} mb-4`}
          >
            {trendData?.behavioralSummary}
          </Text>

          {/* Metric Grid (Level 2 Tonal Nesting) */}
          <View className="flex-row gap-3 mb-4">
            {/* Velocity */}
            <View
              className={`flex-1 border ${t.border} rounded-[4px] p-3`}
              style={{ backgroundColor: t.colors.bg }}
            >
              <Text
                style={{ fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.5 }}
                className={`${t.textSubtle} uppercase mb-1`}
              >
                Velocity Score
              </Text>
              <Text
                style={{ fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.5 }}
                className={t.textPrimary}
              >
                {trendData?.velocityScore ?? 85}
                <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12 }} className={t.textSubtle}>
                  /100
                </Text>
              </Text>
            </View>

            {/* Deep Work */}
            <View
              className={`flex-1 border ${t.border} rounded-[4px] p-3`}
              style={{ backgroundColor: t.colors.bg }}
            >
              <Text
                style={{ fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.5 }}
                className={`${t.textSubtle} uppercase mb-1`}
              >
                Deep Work
              </Text>
              <Text
                style={{ fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.5, color: t.colors.green }}
              >
                {trendData?.deepWorkPercentage ?? 75}%
              </Text>
            </View>
          </View>

          {/* Peak Window & Top Category */}
          <View
            className={`border ${t.border} rounded-[4px] p-3 mb-4`}
            style={{ backgroundColor: t.colors.bg }}
          >
            <View className="flex-row justify-between items-center mb-1.5">
              <Text
                style={{ fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.5 }}
                className={`${t.textSubtle} uppercase`}
              >
                Peak Cognitive Window
              </Text>
              <Text
                style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: t.colors.green }}
              >
                {trendData?.peakFocusWindow}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text
                style={{ fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.5 }}
                className={`${t.textSubtle} uppercase`}
              >
                Dominant Category
              </Text>
              <Text
                style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12 }}
                className={t.textPrimary}
              >
                {trendData?.topCategory}
              </Text>
            </View>
          </View>

          {/* Actionable Coach Recommendation */}
          <View
            className={`border ${t.border} rounded-[4px] p-3.5`}
            style={{ backgroundColor: t.isDark ? 'rgba(107,142,111,0.1)' : '#F0F5F1' }}
          >
            <View className="flex-row items-center mb-1">
              <Ionicons name="bulb-outline" size={14} color={t.colors.green} />
              <Text
                style={{ fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1.5, color: t.colors.green }}
                className="uppercase ml-1.5"
              >
                Coach Recommendation
              </Text>
            </View>
            <Text
              style={{ fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18 }}
              className={t.textPrimary}
            >
              {trendData?.actionableRecommendation}
            </Text>
          </View>
        </>
      )}
    </View>
  );
}
