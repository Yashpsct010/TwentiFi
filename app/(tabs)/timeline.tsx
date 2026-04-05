import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLogStore } from "@/store/logStore";
import { useGroupStore } from "@/store/groupStore";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Audio } from "expo-av";
import { useTheme } from "@/hooks/use-theme";
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";

function prodLabel(p: number) {
  if (p >= 4) return { text: "Deep Work", level: "high" };
  if (p >= 2) return { text: "Productive", level: "mid" };
  return { text: "Distracted", level: "low" };
}

export default function TimelineScreen() {
  const { logs } = useLogStore();
  const { groups } = useGroupStore();
  const router = useRouter();
  const t = useTheme();
  const [sound, setSound] = React.useState<Audio.Sound | null>(null);

  async function playSound(uri: string) {
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      setSound(sound);
      await sound.playAsync();
    } catch (err) {
      console.error("Failed to play sound", err);
    }
  }

  React.useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (sound) {
          sound.stopAsync().catch(() => {});
          sound.unloadAsync().catch(() => {});
          setSound(null);
        }
      };
    }, [sound])
  );

  const [activeTab, setActiveTab] = useState<"timeline" | "projects">("timeline");
  
  // Backwards compatibility migration layer
  const standardizedLogs = logs.map(log => ({
    ...log,
    groupName: log.groupName || "Uncategorized",
    duration: log.duration || 25
  }));

  // === Timeline Tab Logic (Today only by default) ===
  const todayDateStr = format(new Date(), "yyyy-MM-dd");
  const timelineLogs = standardizedLogs.filter(
    (log) => format(new Date(log.timestamp), "yyyy-MM-dd") === todayDateStr
  );

  // Group by groupName
  const groupedTimeline = timelineLogs.reduce((acc: Record<string, typeof logs>, log) => {
    if (!acc[log.groupName!]) acc[log.groupName!] = [];
    acc[log.groupName!].push(log);
    return acc;
  }, {});

  // === Projects Tab Logic (Global Rollup) ===
  const groupedProjects = standardizedLogs.reduce((acc: Record<string, typeof logs>, log) => {
    if (!acc[log.groupName!]) acc[log.groupName!] = [];
    acc[log.groupName!].push(log);
    return acc;
  }, {});

  const projectKeys = Object.keys(groupedProjects).sort((a, b) => b.localeCompare(a));

  return (
    <View className={`flex-1 ${t.bg}`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 56, paddingBottom: 100, paddingHorizontal: 24 }}
      >
        {/* Header & Tabs */}
        <View className="mb-8 flex-row justify-between items-end">
          <View>
            <Text
              style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 2 }}
              className={`${t.textSubtle} uppercase mb-1`}
            >
              {activeTab === "timeline" ? `Today, ${format(new Date(), "MMM d")}` : "Historical Archive"}
            </Text>
            <Text
              style={{ fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.5 }}
              className={t.textPrimary}
            >
               {activeTab === "timeline" ? "Timeline" : "Projects"}
            </Text>
          </View>

          {/* Tab Matcher */}
          <View className={`flex-row border rounded-[4px] p-1`} style={{ borderColor: t.colors.border, backgroundColor: t.colors.card }}>
            <TouchableOpacity
              onPress={() => setActiveTab("timeline")}
              className={`px-3 py-1.5 rounded-[2px] ${activeTab === "timeline" ? "" : "opacity-60"}`}
              style={{ backgroundColor: activeTab === "timeline" ? t.colors.bg : "transparent" }}
            >
              <Text style={{ fontFamily: activeTab === "timeline" ? "Inter_600SemiBold" : "Inter_500Medium", fontSize: 11 }} className={activeTab === "timeline" ? t.textPrimary : t.textSubtle}>Daily</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("projects")}
              className={`px-3 py-1.5 rounded-[2px] ${activeTab === "projects" ? "" : "opacity-60"}`}
              style={{ backgroundColor: activeTab === "projects" ? t.colors.bg : "transparent" }}
            >
              <Text style={{ fontFamily: activeTab === "projects" ? "Inter_600SemiBold" : "Inter_500Medium", fontSize: 11 }} className={activeTab === "projects" ? t.textPrimary : t.textSubtle}>Topics</Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === "timeline" ? (
          Object.keys(groupedTimeline).length === 0 ? (
             <EmptyState t={t} message="No focus sessions recorded today. Start a pulse." />
          ) : (
            Object.keys(groupedTimeline).map(groupName => {
               const groupLogs = groupedTimeline[groupName];
               if (groupLogs.length === 1) {
                  return (
                    <View key={groupLogs[0].id} className="mb-4">
                       <TimelineLogCard log={groupLogs[0]} t={t} playSound={playSound} />
                    </View>
                  );
               } else {
                  return (
                    <TimelineStack 
                      key={groupName} 
                      groupName={groupName} 
                      logs={groupLogs} 
                      t={t} 
                      playSound={playSound} 
                    />
                  );
               }
            })
          )
        ) : (
          projectKeys.length === 0 ? (
             <EmptyState t={t} message="You have no historical project data." />
          ) : (
            projectKeys.map(groupName => {
              const projLogs = groupedProjects[groupName];
              const totalMins = projLogs.reduce((sum, l) => sum + (l.duration || 25), 0);
              const lastActive = new Date(projLogs[0].timestamp); // Sorted by timestamp desc naturally
              
              return (
                <View key={groupName} className={`mb-4 p-4 rounded-[4px] border ${t.border} ${t.cardBg}`}>
                  <View className="flex-row justify-between items-start mb-2">
                     <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 16 }} className={t.textPrimary}>{groupName}</Text>
                     <View className="px-2 py-1 rounded" style={{ backgroundColor: t.colors.bg, borderColor: t.colors.border, borderWidth: 1 }}>
                       <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, color: t.colors.subtext }}>{projLogs.length} SESSIONS</Text>
                     </View>
                  </View>
                  <View className="flex-row items-center mt-3 pt-3 border-t" style={{ borderColor: t.colors.border }}>
                     <Ionicons name="time-outline" size={14} color={t.colors.subtext} />
                     <Text style={{ fontFamily: "Inter_500Medium", fontSize: 12, marginLeft: 4 }} className={t.textSubtle}>
                       {Math.round(totalMins / 60)}h {totalMins % 60}m total  •  Last active {format(lastActive, "MMM d")}
                     </Text>
                  </View>
                </View>
              )
            })
          )
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push("/logging" as any)}
        className={`absolute bottom-8 right-6 w-14 h-14 rounded-[4px] items-center justify-center border ${t.border}`}
        style={{ backgroundColor: t.colors.text }}
      >
        <Ionicons name="add" size={26} color={t.isDark ? "#0D0B1F" : "#FAFAF8"} />
      </TouchableOpacity>
    </View>
  );
}

// ── Shared UI Components ──────────────────────────────────────────────────────

function EmptyState({ t, message }: { t: any, message: string }) {
  return (
    <View className="items-center justify-center pt-24">
      <View
        className={`w-16 h-16 rounded-[4px] border ${t.border} items-center justify-center mb-4`}
        style={{ backgroundColor: t.colors.card }}
      >
        <Ionicons name="list-outline" size={28} color={t.colors.border} />
      </View>
      <Text
        style={{ fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 }}
        className={`${t.textSubtle} text-center max-w-[220px]`}
      >
        {message}
      </Text>
    </View>
  )
}

function TimelineStack({ groupName, logs, t, playSound }: any) {
  const [expanded, setExpanded] = useState(false);
  const animatedHeight = useAnimatedStyle(() => {
    return {
      opacity: withTiming(expanded ? 1 : 0, { duration: 200 }),
      transform: [
        { translateY: withSpring(expanded ? 0 : -20, { damping: 15, stiffness: 120 }) }
      ]
    };
  });

  return (
    <View className="mb-4">
      <TouchableOpacity 
        activeOpacity={0.8} 
        onPress={() => setExpanded(!expanded)}
        className="relative z-10"
      >
        {/* Layer 2 (Bottom) */}
        {!expanded && (
          <View className={`absolute top-2 left-2 right-[-8] bottom-[-8] rounded-[4px] border ${t.border} ${t.bg}`} />
        )}
        {/* Layer 1 (Middle) */}
        {!expanded && (
          <View className={`absolute top-1 left-1 right-[-4] bottom-[-4] rounded-[4px] border ${t.border} ${t.bg}`} />
        )}
        {/* Top Card */}
        <View className={`p-4 rounded-[4px] border ${t.border} ${t.cardBg} flex-row justify-between items-center`}>
           <View>
             <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5 }} className={`${t.textSubtle} uppercase mb-1`}>
                {logs.length} Entries Stack
             </Text>
             <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15 }} className={t.textPrimary}>
                {groupName}
             </Text>
           </View>
           <View className={`w-8 h-8 rounded-full border ${t.border} items-center justify-center`} style={{ backgroundColor: t.colors.bg }}>
             <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={t.textPrimary} />
           </View>
        </View>
      </TouchableOpacity>
      
      {expanded && (
        <Animated.View style={animatedHeight} className="mt-3 pl-4 border-l-2" style={[{ borderColor: t.colors.border }, animatedHeight]}>
          {logs.map((log: any, idx: number) => (
             <View key={log.id} className={idx !== logs.length - 1 ? "mb-3" : ""}>
               <TimelineLogCard log={log} t={t} playSound={playSound} compact />
             </View>
          ))}
        </Animated.View>
      )}
    </View>
  )
}

function TimelineLogCard({ log, t, playSound, compact = false }: any) {
  const prod = prodLabel(log.productivity);
  const prodColor =
    prod.level === "high"
      ? t.colors.green
      : prod.level === "mid"
      ? t.colors.brown
      : t.colors.error;

  let tagsArray = [];
  try {
    if (log.tags) tagsArray = JSON.parse(log.tags);
  } catch(e) {}

  return (
    <View className={`${t.cardBg} border ${t.border} rounded-[4px] p-4`}>
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.5 }} className={t.textSubtle}>
            {format(new Date(log.timestamp), "h:mm a")} • {log.duration || 25}m
          </Text>
          {log.environment && (
            <View className="flex-row items-center ml-2">
              <View className="w-1 h-1 rounded-full mr-1.5" style={{ backgroundColor: t.colors.border }} />
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 0.5 }} className={t.textSubtle}>
                {log.environment}
              </Text>
            </View>
          )}
        </View>
        
        <View className="rounded-[4px] px-2 py-1" style={{ backgroundColor: `${prodColor}18` }}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1, color: prodColor }} className="uppercase">
            {prod.text}
          </Text>
        </View>
      </View>

      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 }} className={`${t.textDim} mb-3`}>
        {log.activity}
      </Text>

      {log.remarks && !compact && (
        <View className="mb-3 pl-2 border-l-2" style={{ borderColor: t.colors.border }}>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, color: t.colors.subtext }}>
            P.S. {log.remarks}
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mt-1">
        <View className="flex-row items-center">
          <View className="w-1.5 h-1.5 rounded-[1px] mr-2" style={{ backgroundColor: t.colors.subtext }} />
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5 }} className={`${t.textSubtle} uppercase`}>
            {log.mood.replace("_", " ")}
          </Text>
        </View>

        {log.audioUri && (
          <TouchableOpacity
            onPress={() => playSound(log.audioUri!)}
            className={`flex-row items-center px-3 py-1.5 rounded-[4px] border ${t.border}`}
            style={{ backgroundColor: t.colors.bg }}
          >
            <Ionicons name="play-outline" size={12} color={t.colors.subtext} />
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1 }} className={`${t.textSubtle} uppercase ml-1.5`}>
              Play Note
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
