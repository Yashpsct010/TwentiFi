import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  UIManager,
} from "react-native";
import { useLogStore } from "@/store/logStore";
import { useGroupStore } from "@/store/groupStore";
import { useRouter, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { format } from "date-fns";
import { Audio } from "expo-av";
import { useTheme } from "@/hooks/use-theme";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function prodLabel(p: number) {
  if (p >= 4) return { text: "Deep Work", level: "high" };
  if (p >= 2) return { text: "Productive", level: "mid" };
  return { text: "Distracted", level: "low" };
}

export default function TimelineScreen() {
  const { logs, renameGroupInLogs } = useLogStore();
  const { renameGroup } = useGroupStore();
  const router = useRouter();
  const t = useTheme();

  // ── Audio playback state with toggle support ────────────────────────────────
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [playingAudioUri, setPlayingAudioUri] = useState<string | null>(null);

  const togglePlaySound = async (uri: string) => {
    try {
      if (sound && playingAudioUri === uri) {
        // Tapping currently playing note stops it
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingAudioUri(null);
        return;
      }

      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setPlayingAudioUri(null);
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true }
      );

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingAudioUri(null);
        }
      });

      setSound(newSound);
      setPlayingAudioUri(uri);
    } catch (err) {
      console.error("Failed to play sound", err);
      setPlayingAudioUri(null);
    }
  };

  React.useEffect(() => {
    return sound
      ? () => {
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        if (sound) {
          sound.stopAsync().catch(() => {});
          sound.unloadAsync().catch(() => {});
          setSound(null);
          setPlayingAudioUri(null);
        }
      };
    }, [sound])
  );

  const [activeTab, setActiveTab] = useState<"timeline" | "projects">("timeline");

  // Topics downward drawer shutter state (only one open at a time)
  const [openTopicName, setOpenTopicName] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState("");

  const toggleTopicDrawer = (groupName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setOpenTopicName((prev) => (prev === groupName ? null : groupName));
    if (editingTopic) {
      setEditingTopic(null);
    }
  };

  const handleStartRename = (groupName: string) => {
    setEditingTopic(groupName);
    setEditNameText(groupName);
  };

  const handleSaveRename = async (oldName: string) => {
    const trimmed = editNameText.trim();
    if (trimmed && trimmed !== oldName) {
      renameGroup(oldName, trimmed);
      await renameGroupInLogs(oldName, trimmed);
      setOpenTopicName(trimmed);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setEditingTopic(null);
  };

  // Backwards compatibility migration layer
  const standardizedLogs = logs.map((log) => ({
    ...log,
    groupName: log.groupName || "Uncategorized",
    duration: log.duration || 25,
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
              {activeTab === "timeline" ? "Timeline" : "Topics"}
            </Text>
          </View>

          {/* Tab Matcher */}
          <View
            className="flex-row border rounded-[4px] p-1"
            style={{ borderColor: t.colors.border, backgroundColor: t.colors.card }}
          >
            <TouchableOpacity
              onPress={() => setActiveTab("timeline")}
              className={`px-3 py-1.5 rounded-[2px] ${activeTab === "timeline" ? "" : "opacity-60"}`}
              style={{ backgroundColor: activeTab === "timeline" ? t.colors.bg : "transparent" }}
            >
              <Text
                style={{
                  fontFamily: activeTab === "timeline" ? "Inter_600SemiBold" : "Inter_500Medium",
                  fontSize: 11,
                }}
                className={activeTab === "timeline" ? t.textPrimary : t.textSubtle}
              >
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setActiveTab("projects")}
              className={`px-3 py-1.5 rounded-[2px] ${activeTab === "projects" ? "" : "opacity-60"}`}
              style={{ backgroundColor: activeTab === "projects" ? t.colors.bg : "transparent" }}
            >
              <Text
                style={{
                  fontFamily: activeTab === "projects" ? "Inter_600SemiBold" : "Inter_500Medium",
                  fontSize: 11,
                }}
                className={activeTab === "projects" ? t.textPrimary : t.textSubtle}
              >
                Topics
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {activeTab === "timeline" ? (
          Object.keys(groupedTimeline).length === 0 ? (
            <EmptyState t={t} message="No focus sessions recorded today. Start a pulse." />
          ) : (
            Object.keys(groupedTimeline).map((groupName) => {
              const groupLogs = groupedTimeline[groupName];
              if (groupLogs.length === 1) {
                return (
                  <View key={groupLogs[0].id} className="mb-4">
                    <TimelineLogCard
                      log={groupLogs[0]}
                      t={t}
                      playingAudioUri={playingAudioUri}
                      togglePlaySound={togglePlaySound}
                    />
                  </View>
                );
              } else {
                return (
                  <TimelineStack
                    key={groupName}
                    groupName={groupName}
                    logs={groupLogs}
                    t={t}
                    playingAudioUri={playingAudioUri}
                    togglePlaySound={togglePlaySound}
                  />
                );
              }
            })
          )
        ) : projectKeys.length === 0 ? (
          <EmptyState t={t} message="You have no historical project data." />
        ) : (
          projectKeys.map((groupName) => {
            const projLogs = groupedProjects[groupName];
            const totalMins = projLogs.reduce((sum, l) => sum + (l.duration || 25), 0);
            const lastActive = new Date(projLogs[0].timestamp);
            const isOpen = openTopicName === groupName;
            const isEditing = editingTopic === groupName;

            return (
              <TopicDrawerCard
                key={groupName}
                groupName={groupName}
                projLogs={projLogs}
                totalMins={totalMins}
                lastActive={lastActive}
                isOpen={isOpen}
                isEditing={isEditing}
                editNameText={editNameText}
                setEditNameText={setEditNameText}
                onToggle={() => toggleTopicDrawer(groupName)}
                onStartRename={() => handleStartRename(groupName)}
                onSaveRename={() => handleSaveRename(groupName)}
                onCancelRename={() => setEditingTopic(null)}
                playingAudioUri={playingAudioUri}
                togglePlaySound={togglePlaySound}
                t={t}
              />
            );
          })
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

// ── Downward Drawer Shutter Card Component ─────────────────────────────────────

function TopicDrawerCard({
  groupName,
  projLogs,
  totalMins,
  lastActive,
  isOpen,
  isEditing,
  editNameText,
  setEditNameText,
  onToggle,
  onStartRename,
  onSaveRename,
  onCancelRename,
  playingAudioUri,
  togglePlaySound,
  t,
}: {
  groupName: string;
  projLogs: any[];
  totalMins: number;
  lastActive: Date;
  isOpen: boolean;
  isEditing: boolean;
  editNameText: string;
  setEditNameText: (text: string) => void;
  onToggle: () => void;
  onStartRename: () => void;
  onSaveRename: () => void;
  onCancelRename: () => void;
  playingAudioUri: string | null;
  togglePlaySound: (uri: string) => void;
  t: any;
}) {
  const [contentHeight, setContentHeight] = useState<number>(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(isOpen ? 1 : 0, {
      duration: isOpen ? 450 : 350,
      easing: Easing.bezier(0.16, 1, 0.3, 1),
    });
  }, [isOpen]);

  const shutterStyle = useAnimatedStyle(() => {
    const targetH = contentHeight > 0 ? contentHeight : Math.max(projLogs.length * 130 + 140, 260);
    return {
      height: interpolate(progress.value, [0, 1], [0, targetH]),
      opacity: interpolate(progress.value, [0, 0.15, 1], [0, 0.6, 1]),
      overflow: "hidden" as const,
    };
  });

  const innerContentStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(progress.value, [0, 1], [-22, 0]),
        },
      ],
    };
  });

  const chevronStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(progress.value, [0, 1], [0, 180])}deg`,
        },
      ],
    };
  });

  return (
    <View
      className="mb-4 rounded-[4px] border overflow-hidden"
      style={{
        borderColor: isOpen ? t.colors.textDim : t.colors.border,
        backgroundColor: t.colors.card,
      }}
    >
      {/* ── Accordion Shutter Header (Tappable) ──────────────────── */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={onToggle}
        className="p-4 flex-row justify-between items-center"
      >
        <View className="flex-1 mr-3">
          <View className="flex-row items-center gap-2 mb-1">
            <Text
              style={{ fontFamily: "Inter_600SemiBold", fontSize: 16 }}
              className={t.textPrimary}
            >
              {groupName}
            </Text>
            <View
              className="px-2 py-0.5 rounded"
              style={{
                backgroundColor: t.colors.bg,
                borderColor: t.colors.border,
                borderWidth: 1,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 10,
                  color: t.colors.subtext,
                }}
              >
                {projLogs.length} SESSIONS
              </Text>
            </View>
          </View>
          <View className="flex-row items-center mt-1">
            <Ionicons name="time-outline" size={13} color={t.colors.subtext} />
            <Text
              style={{ fontFamily: "Inter_500Medium", fontSize: 12, marginLeft: 4 }}
              className={t.textSubtle}
            >
              {Math.floor(totalMins / 60)}h {totalMins % 60}m total • Last active{" "}
              {format(lastActive, "MMM d")}
            </Text>
          </View>
        </View>

        <Animated.View
          style={[
            {
              width: 32,
              height: 32,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: t.colors.border,
              backgroundColor: t.colors.bg,
              alignItems: "center",
              justifyContent: "center",
            },
            chevronStyle,
          ]}
        >
          <Ionicons name="chevron-down" size={16} color={t.colors.text} />
        </Animated.View>
      </TouchableOpacity>

      {/* ── Downward Drawer Shutter Panel (Smooth Roller Shutter) ──────────── */}
      <Animated.View style={shutterStyle}>
        <Animated.View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && Math.abs(h - contentHeight) > 1) {
              setContentHeight(h);
            }
          }}
          style={[
            {
              paddingHorizontal: 16,
              paddingBottom: 16,
              paddingTop: 12,
              borderTopWidth: 1,
              borderColor: t.colors.border,
              backgroundColor: t.colors.bg,
            },
            innerContentStyle,
          ]}
        >
          {/* Subtle Decorative Shutter Handle / Top Slat */}
          <View className="items-center mb-3">
            <View
              style={{
                width: 36,
                height: 3,
                borderRadius: 2,
                backgroundColor: t.colors.border,
              }}
            />
          </View>

          {/* Inline Rename Bar */}
          <View
            className="p-3 rounded-[4px] border mb-4"
            style={{
              borderColor: t.colors.border,
              backgroundColor: t.colors.card,
            }}
          >
            {isEditing ? (
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={editNameText}
                  onChangeText={setEditNameText}
                  placeholder="Topic title..."
                  placeholderTextColor={t.colors.subtext}
                  autoFocus
                  style={{
                    flex: 1,
                    fontFamily: "Inter_500Medium",
                    fontSize: 13,
                    color: t.colors.text,
                    paddingVertical: 4,
                    paddingHorizontal: 8,
                    backgroundColor: t.colors.bg,
                    borderColor: t.colors.border,
                    borderWidth: 1,
                    borderRadius: 3,
                  }}
                />
                <TouchableOpacity
                  onPress={onSaveRename}
                  className="px-3 py-2 rounded-[3px]"
                  style={{ backgroundColor: t.colors.text }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 11,
                      color: t.colors.bg,
                    }}
                  >
                    SAVE
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onCancelRename}
                  className="px-2.5 py-2 rounded-[3px] border"
                  style={{ borderColor: t.colors.border, backgroundColor: t.colors.bg }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 11,
                      color: t.colors.subtext,
                    }}
                  >
                    CANCEL
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="folder-outline" size={14} color={t.colors.subtext} />
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 12,
                      color: t.colors.subtext,
                      marginLeft: 6,
                    }}
                  >
                    Topic: {groupName}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={onStartRename}
                  className="flex-row items-center px-2.5 py-1 rounded-[3px] border"
                  style={{ borderColor: t.colors.border, backgroundColor: t.colors.bg }}
                >
                  <Ionicons name="pencil" size={11} color={t.colors.subtext} />
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 10,
                      letterSpacing: 1,
                      color: t.colors.subtext,
                      marginLeft: 4,
                    }}
                    className="uppercase"
                  >
                    Rename
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Sessions List */}
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 10,
              letterSpacing: 1.5,
              color: t.colors.subtext,
            }}
            className="uppercase mb-2.5"
          >
            Sessions in this Topic ({projLogs.length})
          </Text>

          <View className="gap-2.5">
            {projLogs.map((log: any) => (
              <TimelineLogCard
                key={log.id}
                log={log}
                t={t}
                playingAudioUri={playingAudioUri}
                togglePlaySound={togglePlaySound}
                compact
              />
            ))}
          </View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

// ── Shared UI Components ──────────────────────────────────────────────────────

function EmptyState({ t, message }: { t: any; message: string }) {
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
  );
}

function TimelineStack({
  groupName,
  logs,
  t,
  playingAudioUri,
  togglePlaySound,
}: {
  groupName: string;
  logs: any[];
  t: any;
  playingAudioUri: string | null;
  togglePlaySound: (uri: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const animatedHeight = useAnimatedStyle(() => {
    return {
      opacity: withTiming(expanded ? 1 : 0, { duration: 200 }),
      transform: [
        { translateY: withSpring(expanded ? 0 : -20, { damping: 15, stiffness: 120 }) },
      ],
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
          <View
            className={`absolute top-2 left-2 right-[-8] bottom-[-8] rounded-[4px] border ${t.border} ${t.bg}`}
          />
        )}
        {/* Layer 1 (Middle) */}
        {!expanded && (
          <View
            className={`absolute top-1 left-1 right-[-4] bottom-[-4] rounded-[4px] border ${t.border} ${t.bg}`}
          />
        )}
        {/* Top Card */}
        <View
          className={`p-4 rounded-[4px] border ${t.border} ${t.cardBg} flex-row justify-between items-center`}
        >
          <View>
            <Text
              style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5 }}
              className={`${t.textSubtle} uppercase mb-1`}
            >
              {logs.length} Entries Stack
            </Text>
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15 }} className={t.textPrimary}>
              {groupName}
            </Text>
          </View>
          <View
            className={`w-8 h-8 rounded-full border ${t.border} items-center justify-center`}
            style={{ backgroundColor: t.colors.bg }}
          >
            <Ionicons
              name={expanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={t.textPrimary}
            />
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <Animated.View
          className="mt-3 pl-4 border-l-2"
          style={[{ borderColor: t.colors.border }, animatedHeight]}
        >
          {logs.map((log: any, idx: number) => (
            <View key={log.id} className={idx !== logs.length - 1 ? "mb-3" : ""}>
              <TimelineLogCard
                log={log}
                t={t}
                playingAudioUri={playingAudioUri}
                togglePlaySound={togglePlaySound}
                compact
              />
            </View>
          ))}
        </Animated.View>
      )}
    </View>
  );
}

function TimelineLogCard({
  log,
  t,
  playingAudioUri,
  togglePlaySound,
  compact = false,
}: {
  log: any;
  t: any;
  playingAudioUri: string | null;
  togglePlaySound: (uri: string) => void;
  compact?: boolean;
}) {
  const prod = prodLabel(log.productivity);
  const prodColor =
    prod.level === "high"
      ? t.colors.green
      : prod.level === "mid"
      ? t.colors.brown
      : t.colors.error;

  const isAudioPlaying = playingAudioUri === log.audioUri;

  return (
    <View className={`${t.cardBg} border ${t.border} rounded-[4px] p-4`}>
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center">
          <Text
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 0.5 }}
            className={t.textSubtle}
          >
            {format(new Date(log.timestamp), "HH:mm")} • {log.duration || 25}m
          </Text>
          {log.environment && (
            <View className="flex-row items-center ml-2">
              <View
                className="w-1 h-1 rounded-full mr-1.5"
                style={{ backgroundColor: t.colors.border }}
              />
              <Text
                style={{ fontFamily: "Inter_500Medium", fontSize: 10, letterSpacing: 0.5 }}
                className={t.textSubtle}
              >
                {log.environment}
              </Text>
            </View>
          )}
        </View>

        <View className="rounded-[4px] px-2 py-1" style={{ backgroundColor: `${prodColor}18` }}>
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

      <Text
        style={{ fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 }}
        className={`${t.textDim} mb-3`}
      >
        {log.activity}
      </Text>

      {log.remarks && !compact && (
        <View className="mb-3 pl-2 border-l-2" style={{ borderColor: t.colors.border }}>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              lineHeight: 18,
              color: t.colors.subtext,
            }}
          >
            P.S. {log.remarks}
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between mt-1">
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
            onPress={() => togglePlaySound(log.audioUri!)}
            className="flex-row items-center px-3 py-1.5 rounded-[4px] border"
            style={{
              backgroundColor: isAudioPlaying
                ? t.isDark
                  ? "rgba(245, 158, 11, 0.15)"
                  : "#FEF3C7"
                : t.colors.bg,
              borderColor: isAudioPlaying ? "#F59E0B" : t.colors.border,
            }}
          >
            <Ionicons
              name={isAudioPlaying ? "stop" : "play-outline"}
              size={12}
              color={isAudioPlaying ? "#F59E0B" : t.colors.subtext}
            />
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 10,
                letterSpacing: 1,
                color: isAudioPlaying ? "#F59E0B" : t.colors.subtext,
              }}
              className="uppercase ml-1.5"
            >
              {isAudioPlaying ? "Stop Note" : "Play Note"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
