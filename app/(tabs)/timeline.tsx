import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLogStore } from "@/store/logStore";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Audio } from "expo-av";
import { useTheme } from "@/hooks/use-theme";

// Productivity label helper (same logic as before)
function prodLabel(p: number) {
  if (p > 3) return { text: "Deep Work", level: "high" };
  if (p > 1) return { text: "Communication", level: "mid" };
  return { text: "Distraction", level: "low" };
}

export default function TimelineScreen() {
  // ── All existing logic preserved ─────────────────────────────────────────
  const { logs } = useLogStore();
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

  const [activeTab, setActiveTab] = React.useState<"timeline" | "digest">("timeline");

  // ── Group logs by date (Timeline view) ────────────────────────────────────
  const groupedLogs = logs.reduce((acc: Record<string, typeof logs>, log) => {
    const dateKey = format(new Date(log.timestamp), "yyyy-MM-dd");
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(log);
    return acc;
  }, {});

  const sortedDateKeys = Object.keys(groupedLogs).sort((a, b) =>
    b.localeCompare(a)
  );

  // ── Daily Digest Heuristics (Today's logs) ────────────────────────────────
  const todayLogs = logs.filter(
    (log) => format(new Date(log.timestamp), "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")
  );

  const digestGroups = todayLogs.reduce((acc: Record<string, typeof logs>, log) => {
    const hour = new Date(log.timestamp).getHours();
    let group = "Evening";
    if (hour >= 5 && hour < 12) group = "Morning Focus";
    else if (hour >= 12 && hour < 17) group = "Afternoon Flow";
    else group = "Evening Wrap-up";

    if (!acc[group]) acc[group] = [];
    acc[group].push(log);
    return acc;
  }, {});

  const digestKeys = ["Morning Focus", "Afternoon Flow", "Evening Wrap-up"].filter(k => digestGroups[k]);


  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View className={`flex-1 ${t.bg}`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 56, paddingBottom: 100, paddingHorizontal: 24 }}
      >
        {/* Page header & Tabs */}
        <View className="mb-8 flex-row justify-between items-end">
          <View>
            <Text
              style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 2 }}
              className={`${t.textSubtle} uppercase mb-1`}
            >
              Today, {format(new Date(), "MMM d")}
            </Text>
            <Text
              style={{ fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.5 }}
              className={t.textPrimary}
            >
              Timeline
            </Text>
          </View>

          {/* Tab Matcher */}
          <View className={`flex-row border rounded-[4px] p-1`} style={{ borderColor: t.colors.border, backgroundColor: t.colors.card }}>
            <TouchableOpacity
              onPress={() => setActiveTab("timeline")}
              className={`px-3 py-1.5 rounded-[2px] ${activeTab === "timeline" ? "" : "opacity-60"}`}
              style={{ backgroundColor: activeTab === "timeline" ? t.colors.bg : "transparent" }}
            >
              <Text style={{ fontFamily: activeTab === "timeline" ? "Inter_600SemiBold" : "Inter_500Medium", fontSize: 11 }} className={activeTab === "timeline" ? t.textPrimary : t.textSubtle}>All</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("digest")}
              className={`px-3 py-1.5 rounded-[2px] ${activeTab === "digest" ? "" : "opacity-60"}`}
              style={{ backgroundColor: activeTab === "digest" ? t.colors.bg : "transparent" }}
            >
              <Text style={{ fontFamily: activeTab === "digest" ? "Inter_600SemiBold" : "Inter_500Medium", fontSize: 11 }} className={activeTab === "digest" ? t.textPrimary : t.textSubtle}>Digest</Text>
            </TouchableOpacity>
          </View>
        </View>

        {logs.length === 0 ? (
          // Empty state
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
              No pulses recorded yet. Start focusing to see your timeline.
            </Text>
          </View>
        ) : activeTab === "digest" ? (
          // Daily Digest View
          digestKeys.length > 0 ? (
            digestKeys.map((groupName) => (
              <View key={groupName} className="mb-8">
                <Text
                  style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2 }}
                  className={`${t.textSubtle} uppercase mb-4`}
                >
                  {groupName}
                </Text>
                {digestGroups[groupName].map((log: any, idx: number) => (
                  <TimelineLogCard key={log.id} log={log} idx={idx} isLast={idx === digestGroups[groupName].length - 1} t={t} playSound={playSound} />
                ))}
              </View>
            ))
          ) : (
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14 }} className={`${t.textSubtle} text-center mt-12`}>
              No pulses recorded today yet.
            </Text>
          )
        ) : (
          // Timeline View
          sortedDateKeys.map((dateKey) => {
            const dayLogs = groupedLogs[dateKey];
            const dayDate = new Date(dayLogs[0].timestamp);

            return (
              <View key={dateKey} className="mb-8">
                <Text
                  style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2 }}
                  className={`${t.textSubtle} uppercase mb-4`}
                >
                  {format(dayDate, "EEEE, MMM d")}
                </Text>
                {dayLogs.map((log: any, idx: number) => (
                  <TimelineLogCard key={log.id} log={log} idx={idx} isLast={idx === dayLogs.length - 1} t={t} playSound={playSound} />
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* FAB — Log entry */}
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

function TimelineLogCard({ log, idx, isLast, t, playSound }: any) {
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
    <View
      className={`${t.cardBg} border ${t.border} rounded-[4px] p-4 ${
        !isLast ? "mb-3" : ""
      }`}
    >
      {/* Time + productivity badge */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Text
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.5 }}
            className={t.textSubtle}
          >
            {format(new Date(log.timestamp), "h:mm a")}
          </Text>
          {log.environment ? (
            <View className="flex-row items-center ml-2">
              <View className="w-1 h-1 rounded-full mr-1.5" style={{ backgroundColor: t.colors.border }} />
              <Text
                style={{ fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 0.5 }}
                className={t.textSubtle}
              >
                {log.environment}
              </Text>
            </View>
          ) : null}
        </View>
        
        <View
          className="rounded-[4px] px-2 py-1"
          style={{ backgroundColor: `${prodColor}18` }}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 10,
              letterSpacing: 1,
              color: prodColor,
            }}
            className="uppercase"
          >
            {prod.text}
          </Text>
        </View>
      </View>

      {/* Tags */}
      {tagsArray.length > 0 && (
        <View className="flex-row flex-wrap gap-1 mb-2">
          {tagsArray.map((tag: string) => (
            <View key={tag} className="px-2 py-0.5 rounded border" style={{ backgroundColor: t.colors.bg, borderColor: t.colors.border }}>
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 9, color: t.colors.subtext }}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Activity text */}
      <Text
        style={{ fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 }}
        className={`${t.textDim} mb-3`}
      >
        {log.activity}
      </Text>

      {/* Remarks */}
      {log.remarks ? (
        <View className="mb-3 pl-2 border-l-2" style={{ borderColor: t.colors.border }}>
          <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, color: t.colors.subtext }}>
            P.S. {log.remarks}
          </Text>
        </View>
      ) : null}

      {/* Footer: mood + play note */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View
            className="w-1.5 h-1.5 rounded-[1px] mr-2"
            style={{ backgroundColor: t.colors.subtext }}
          />
          <Text
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5 }}
            className={`${t.textSubtle} uppercase`}
          >
            {log.mood.replace("_", " ")}
          </Text>
        </View>

        {log.audioUri && (
          <TouchableOpacity
            onPress={() => playSound(log.audioUri!)}
            className={`flex-row items-center px-3 py-1.5 rounded-[4px] border ${t.border}`}
            style={{ backgroundColor: t.colors.bg }}
          >
            <Ionicons
              name="play-outline"
              size={12}
              color={t.colors.subtext}
            />
            <Text
              style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1 }}
              className={`${t.textSubtle} uppercase ml-1.5`}
            >
              Play Note
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
