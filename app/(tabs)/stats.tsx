import HistoricalInsightsCard from "@/components/HistoricalInsightsCard";
import StreakCalendar from "@/components/StreakCalendar";
import { useTheme } from "@/hooks/use-theme";
import { generateAIInsights } from "@/services/gemini";
import { useInsightStore } from "@/store/insightStore";
import { useLogStore } from "@/store/logStore";
import { useSessionStore } from "@/store/sessionStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";

// ── Mood config (same as before) ────────────────────────────────────────────
const moodColors: any = {
  deep_work: "#6B8E6F",
  focused: "#6B8E6F",
  neutral: "#9B7D6A",
  exhausted: "#A64542",
};

const moodLabels: any = {
  deep_work: "Deep Work",
  focused: "Focused",
  neutral: "Neutral",
  exhausted: "Exhausted",
};

export default function StatsScreen() {
  // ── All existing logic preserved ──────────────────────────────────────────
  const { logs } = useLogStore();
  const { goals } = useSessionStore();
  const { geminiApiKey } = useSettingsStore();
  const { aiInsights, lastPulseCount, lastTimestamp, setInsights } =
    useInsightStore();
  const t = useTheme();

  const [isLoadingAI, setIsLoadingAI] = useState(false);

  const uniqueDays = new Set(
    logs.map((log) => new Date(log.timestamp).toDateString()),
  ).size;
  const streak = uniqueDays;

  const completedGoals = goals.filter((g) => g.completed).length;
  const goalProgress =
    goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;

  const breakdown = logs.reduce((acc: any, log) => {
    acc[log.mood] = (acc[log.mood] || 0) + 1;
    return acc;
  }, {});

  useEffect(() => {
    async function fetchInsights() {
      if (!geminiApiKey || logs.length === 0) return;
      const currentLatestTimestamp = logs[0]?.timestamp || null;
      if (
        aiInsights &&
        lastPulseCount === logs.length &&
        lastTimestamp === currentLatestTimestamp
      ) {
        return;
      }
      setIsLoadingAI(true);
      try {
        const insights = await generateAIInsights(logs, geminiApiKey);
        setInsights(insights, logs.length, currentLatestTimestamp || "");
      } catch (error) {
        console.error("Failed to fetch AI insights:", error);
      } finally {
        setIsLoadingAI(false);
      }
    }
    fetchInsights();
  }, [
    logs,
    geminiApiKey,
    aiInsights,
    lastPulseCount,
    lastTimestamp,
    setInsights,
  ]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View className={`flex-1 ${t.bg}`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: 56,
          paddingBottom: 48,
          paddingHorizontal: 24,
        }}
      >
        {/* Page header */}
        <View className="mb-8">
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 28,
              letterSpacing: -0.5,
            }}
            className={t.textPrimary}
          >
            Stats & Insights
          </Text>
        </View>

        <HistoricalInsightsCard logs={logs} />

        <View
          className={`${t.cardBg} border ${t.border} rounded-[4px] p-5 mb-6 flex-row items-center`}
        >
          <Image
            source={{
              uri: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif",
            }}
            style={{ width: 32, height: 32, marginRight: 14 }}
          />
          <View>
            <Text
              style={{ fontFamily: "Inter_700Bold", fontSize: 16 }}
              className={`${t.textPrimary} mb-0.5`}
            >
              {streak}-Day Focus Streak
            </Text>
            <Text
              style={{ fontFamily: "Inter_500Medium", fontSize: 13 }}
              className={t.textSubtle}
            >
              {streak > 5
                ? "Top 10% consistency! 🔥"
                : "Keep the momentum going!"}
            </Text>
          </View>
        </View>

        {/* ── Streak Calendar ──────────────────────────────────────────────── */}
        <View
          className={`${t.cardBg} border ${t.border} rounded-[4px] p-5 mb-6`}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 10,
              letterSpacing: 2,
            }}
            className={`${t.textSubtle} uppercase mb-4`}
          >
            Consistency
          </Text>
          <StreakCalendar logs={logs} />
        </View>

        {/* ── Daily Goal Progress ──────────────────────────────────────────── */}
        <View
          className={`${t.cardBg} border ${t.border} rounded-[4px] p-5 mb-6`}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 10,
              letterSpacing: 2,
            }}
            className={`${t.textSubtle} uppercase mb-4`}
          >
            Daily Goal Progress
          </Text>

          {/* Progress bar */}
          <View
            className={`h-1 rounded-[2px] mb-3`}
            style={{ backgroundColor: t.colors.border }}
          >
            <View
              className="h-1 rounded-[2px]"
              style={{
                width: `${goalProgress}%`,
                backgroundColor: t.colors.green,
              }}
            />
          </View>

          <View className="flex-row justify-between items-center">
            <Text
              style={{ fontFamily: "Inter_400Regular", fontSize: 13 }}
              className={t.textSubtle}
            >
              {completedGoals} of {goals.length} goals completed
            </Text>
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 20,
                letterSpacing: -0.5,
              }}
              className={t.textPrimary}
            >
              {goalProgress}%
            </Text>
          </View>
        </View>

        {/* ── Activity Breakdown ───────────────────────────────────────────── */}
        <View
          className={`${t.cardBg} border ${t.border} rounded-[4px] p-5 mb-6`}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 10,
              letterSpacing: 2,
            }}
            className={`${t.textSubtle} uppercase mb-4`}
          >
            Activity Breakdown
          </Text>

          {Object.keys(breakdown).length > 0 ? (
            Object.keys(breakdown).map((mood: any) => (
              <BreakdownRow
                key={mood}
                label={moodLabels[mood] || mood}
                count={breakdown[mood]}
                total={logs.length}
                color={moodColors[mood] || t.colors.subtext}
                textSubtle={t.textSubtle}
                textPrimary={t.textPrimary}
                borderColor={t.colors.border}
              />
            ))
          ) : (
            <Text
              style={{ fontFamily: "Inter_400Regular", fontSize: 13 }}
              className={`${t.textSubtle} text-center py-2`}
            >
              No pulses recorded yet.
            </Text>
          )}
        </View>

        {/* ── AI Analysis card ─────────────────────────────────────────────── */}
        <View
          className={`border ${t.border} rounded-[4px] p-5 mb-4`}
          style={{ backgroundColor: t.colors.card }}
        >
          {/* Card header */}
          <View className="flex-row items-center mb-4">
            <Ionicons
              name="sparkles-outline"
              size={14}
              color={t.colors.subtext}
            />
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 10,
                letterSpacing: 2,
              }}
              className={`${t.textSubtle} uppercase ml-2 flex-1`}
            >
              {aiInsights
                ? `AI Analysis — ${aiInsights.productivityLevel}`
                : "AI Analysis"}
            </Text>
            {isLoadingAI && (
              <ActivityIndicator size="small" color={t.colors.subtext} />
            )}
          </View>

          {/* Summary text */}
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              lineHeight: 22,
            }}
            className={`${t.textDim} mb-3`}
          >
            {aiInsights?.summary ||
              (logs.length > 5
                ? "Analyzing your latest pulses…"
                : "Gather more data by logging pulses to unlock personalized AI insights.")}
          </Text>

          {/* Advice quote block */}
          {aiInsights?.advice && (
            <View
              className={`border-l-2 pl-4 mt-1`}
              style={{ borderLeftColor: t.colors.green }}
            >
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  fontStyle: "italic",
                  lineHeight: 20,
                }}
                className={t.textSubtle}
              >
                &quot;{aiInsights.advice}&quot;
              </Text>
            </View>
          )}

          {/* No API key hint */}
          {!geminiApiKey && (
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 10,
                letterSpacing: 1.5,
              }}
              className={`${t.textSubtle} uppercase mt-4`}
            >
              Connect Gemini API in Settings for deep analysis
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function BreakdownRow({
  label,
  count,
  total,
  color,
  textSubtle,
  textPrimary,
  borderColor,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  textSubtle: string;
  textPrimary: string;
  borderColor: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <View className="mb-4">
      <View className="flex-row justify-between items-center mb-1">
        <View className="flex-row items-center">
          <View
            className="w-2 h-2 rounded-[1px] mr-2"
            style={{ backgroundColor: color }}
          />
          <Text
            style={{ fontFamily: "Inter_500Medium", fontSize: 13 }}
            className={textPrimary}
          >
            {label}
          </Text>
        </View>
        <Text
          style={{ fontFamily: "Inter_600SemiBold", fontSize: 12 }}
          className={textSubtle}
        >
          {count} pulses · {pct}%
        </Text>
      </View>
      {/* Progress track */}
      <View
        className="h-[2px] rounded-[1px]"
        style={{ backgroundColor: borderColor }}
      >
        <View
          className="h-[2px] rounded-[1px]"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </View>
    </View>
  );
}
