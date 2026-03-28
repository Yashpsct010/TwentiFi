import { useLogStore } from "@/store/logStore";
import { useSessionStore } from "@/store/sessionStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useInsightStore } from "@/store/insightStore";
import { generateAIInsights, AIInsights } from "@/services/gemini";
import StreakCalendar from "@/components/StreakCalendar";
import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect } from "react";
import { ScrollView, Text, View, ActivityIndicator } from "react-native";

export default function StatsScreen() {
  const { logs } = useLogStore();
  const { goals } = useSessionStore();
  const { geminiApiKey } = useSettingsStore();
  const { aiInsights, lastPulseCount, lastTimestamp, setInsights } = useInsightStore();

  const [isLoadingAI, setIsLoadingAI] = useState(false);

  // Calculate Productivity Score (average productivity * 20 for 0-100 scale)
  const avgProductivity =
    logs.length > 0
      ? logs.reduce((acc, log) => acc + log.productivity, 0) / logs.length
      : 0;
  const productivityScore = Math.round(avgProductivity * 20);

  // Calculate Focus Streak (very basic placeholder for now: total days with logs)
  const uniqueDays = new Set(
    logs.map((log) => new Date(log.timestamp).toDateString()),
  ).size;
  const streak = uniqueDays;

  // Calculate Daily Goal Progress
  const completedGoals = goals.filter((g) => g.completed).length;
  const goalProgress =
    goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0;

  // Activity Breakdown (Count by mood)
  const breakdown = logs.reduce((acc: any, log) => {
    acc[log.mood] = (acc[log.mood] || 0) + 1;
    return acc;
  }, {});

  const moodColors: any = {
    deep_work: "#8B5CF6",
    focused: "#10B981",
    neutral: "#F59E0B",
    exhausted: "#EF4444",
  };

  const moodLabels: any = {
    deep_work: "Deep Work",
    focused: "Focused",
    neutral: "Neutral",
    exhausted: "Exhausted",
  };

  useEffect(() => {
    async function fetchInsights() {
      if (!geminiApiKey || logs.length === 0) return;

      const currentLatestTimestamp = logs[0]?.timestamp || null;

      // Only generate if we don't have insights OR the logs have changed since the last generated insight
      if (
        aiInsights &&
        lastPulseCount === logs.length &&
        lastTimestamp === currentLatestTimestamp
      ) {
        return; // We have up-to-date insights cached
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
  }, [logs, geminiApiKey, aiInsights, lastPulseCount, lastTimestamp, setInsights]);

  return (
    <View className="flex-1 bg-brand-bg pt-12">
      <View className="px-6 mb-8">
        <Text className="text-3xl font-bold text-white">Stats & Insights</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="px-6">
        <View className="flex-row gap-4 mb-8">
          <View className="flex-1 bg-brand-card p-6 rounded-[32px] border border-white/5">
            <Text className="text-brand-subtext text-[10px] font-bold uppercase tracking-wider mb-2">
              Productivity Score
            </Text>
            <View className="flex-row items-baseline">
              <Text className="text-4xl font-black text-white">
                {productivityScore}
              </Text>
              <Ionicons
                name="stats-chart"
                size={16}
                color="#8B5CF6"
                style={{ marginLeft: 4 }}
              />
            </View>
          </View>
          <View className="flex-1 bg-brand-card p-6 rounded-[32px] border border-white/5">
            <Text className="text-brand-subtext text-[10px] font-bold uppercase tracking-wider mb-2">
              Focus Streak
            </Text>
            <Text className="text-4xl font-black text-white">
              {streak} <Text className="text-lg font-bold">Days</Text>
            </Text>
          </View>
        </View>

        <View className="mb-8">
          <StreakCalendar logs={logs} />
        </View>

        <View className="bg-brand-card p-8 rounded-[40px] border border-white/5 items-center mb-8">
          <Text className="text-white font-bold mb-6 tracking-widest uppercase">
            Daily Goal Progress
          </Text>
          <View className="w-48 h-24 items-center justify-end overflow-hidden">
            <View className="w-48 h-48 rounded-full border-[12px] border-brand-purple/10 absolute -bottom-24" />
            <View
              className="w-48 h-48 rounded-full border-[12px] border-brand-purple absolute -bottom-24"
              style={{
                transform: [{ rotate: `${-180 + goalProgress * 1.8}deg` }],
              }}
            />
            <Text className="text-3xl font-black text-white mb-2">
              {goalProgress}%
            </Text>
            <Text className="text-brand-subtext text-[10px] font-bold uppercase tracking-widest">
              TARGET REACHED
            </Text>
          </View>
        </View>

        <View className="bg-brand-card p-6 rounded-[32px] border border-white/5 mb-10">
          <Text className="text-white font-bold mb-4 tracking-widest uppercase">
            Activity Breakdown
          </Text>
          {Object.keys(breakdown).length > 0 ? (
            Object.keys(breakdown).map((mood: any) => (
              <BreakdownItem
                key={mood}
                label={moodLabels[mood] || mood}
                duration={`${breakdown[mood]} pulses`}
                color={moodColors[mood] || "#8B5CF6"}
              />
            ))
          ) : (
            <Text className="text-brand-subtext text-center py-4">
              No pulses recorded yet.
            </Text>
          )}
        </View>

        <View className="bg-brand-purple p-6 rounded-[32px] mb-12 overflow-hidden">
          <View className="flex-row items-center mb-4">
            <Ionicons name="sparkles" size={20} color="white" />
            <Text className="text-white font-black ml-2 uppercase tracking-wider">
              {aiInsights ? `AI ANALYSIS: ${aiInsights.productivityLevel.toUpperCase()}` : "AI INSIGHT"}
            </Text>
            {isLoadingAI && <ActivityIndicator size="small" color="white" style={{ marginLeft: 10 }} />}
          </View>
          
          <Text className="text-white text-base font-bold mb-2">
            {aiInsights?.summary || (logs.length > 5 
                ? "Analyzing your latest pulses..." 
                : "Gather more data by logging pulses to unlock personalized AI insights.")}
          </Text>
          
          {aiInsights?.advice && (
            <View className="bg-white/10 p-4 rounded-2xl mt-2 border border-white/10">
              <Text className="text-white/90 text-sm italic leading-relaxed">
                &quot;{aiInsights.advice}&quot;
              </Text>
            </View>
          )}

          {!geminiApiKey && (
            <Text className="text-white/60 text-[10px] mt-4 font-bold uppercase tracking-widest">
              Connect Gemini API in Settings for deep analysis
            </Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function BreakdownItem({ label, duration, color }: any) {
  return (
    <View className="flex-row items-center justify-between mb-4">
      <View className="flex-row items-center">
        <View
          className="w-3 h-3 rounded-full mr-3"
          style={{ backgroundColor: color }}
        />
        <Text className="text-white font-medium">{label}</Text>
      </View>
      <Text className="text-brand-subtext font-bold">{duration}</Text>
    </View>
  );
}
