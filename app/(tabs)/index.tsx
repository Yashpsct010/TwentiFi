import { expandTaskWithGemini } from "@/services/gemini";
import WisdomPulse from "@/components/WisdomPulse";
import { useSessionStore } from "@/store/sessionStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
} from "react-native";
import { TouchableOpacity as GHTouchableOpacity } from "react-native-gesture-handler";
import DraggableFlatList from "react-native-draggable-flatlist";

export default function HomeScreen() {
  const {
    isActive,
    startTime,
    goals,
    startSession,
    endSession,
    toggleGoal,
    addGoal,
    deleteGoal,
    replaceGoalWithMultiple,
    reorderGoals,
  } = useSessionStore();
  const { userName, startOfDay, endOfDay, geminiApiKey } = useSettingsStore();
  const t = useTheme();

  const [newGoal, setNewGoal] = useState("");
  const [activeNewGoal, setActiveNewGoal] = useState("");
  const [tempGoals, setTempGoals] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpanding, setIsExpanding] = useState<string | null>(null);
  const [goalInputFocused, setGoalInputFocused] = useState(false);
  const [activeGoalInputFocused, setActiveGoalInputFocused] = useState(false);
  const router = useRouter();
  const lapStartOffset = useRef(0);



  React.useEffect(() => {
    let interval: any;
    if (!isActive) {
      setElapsed(0);
      setIsPaused(false);
      lapStartOffset.current = 0;
      return;
    }
    if (isActive && startTime && !isPaused) {
      const startTimeNum =
        typeof startTime === "string" ? parseInt(startTime, 10) : startTime;
      if (!isNaN(startTimeNum)) {
        interval = setInterval(() => {
          const totalSessionSeconds = Math.floor(
            (Date.now() - startTimeNum) / 1000
          );
          setElapsed(Math.max(0, totalSessionSeconds - lapStartOffset.current));
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, startTime, isPaused]);

  const handlePause = () => {
    if (isPaused) {
      if (startTime) {
        const startTimeNum =
          typeof startTime === "string" ? parseInt(startTime, 10) : startTime;
        const totalSessionSeconds = Math.floor(
          (Date.now() - startTimeNum) / 1000
        );
        lapStartOffset.current = totalSessionSeconds - elapsed;
      }
      setIsPaused(false);
    } else {
      setIsPaused(true);
    }
  };

  const handleLapReset = () => {
    if (!startTime) return;
    const startTimeNum =
      typeof startTime === "string" ? parseInt(startTime, 10) : startTime;
    lapStartOffset.current = Math.floor((Date.now() - startTimeNum) / 1000);
    setElapsed(0);
  };

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStart = () => {
    try {
      const now = new Date();
      const [startH, startM] = startOfDay.split(":").map(Number);
      const [endH, endM] = endOfDay.split(":").map(Number);
      const startTimeToday = new Date(now);
      startTimeToday.setHours(startH, startM, 0);
      const endTimeToday = new Date(now);
      endTimeToday.setHours(endH, endM, 0);
      const isOutside = now < startTimeToday || now > endTimeToday;
      if (isOutside) console.warn("Starting session outside of configured day boundaries.");
      startSession(tempGoals);
      setTempGoals([]);
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  const handleEnd = async () => {
    try {
      await endSession();
    } catch (err) {
      console.error('Failed to end session:', err);
      // Force-reset as fallback so the UI never gets stuck
      useSessionStore.setState({ isActive: false, startTime: null, endTime: null, goals: [] });
    }
  };

  const addTempGoal = () => {
    if (newGoal.trim()) {
      setTempGoals([...tempGoals, newGoal.trim()]);
      setNewGoal("");
    }
  };

  const handleActiveAddGoal = () => {
    if (activeNewGoal.trim()) {
      addGoal(activeNewGoal.trim());
      setActiveNewGoal("");
    }
  };

  const handleTaskOptions = (goalId: string, goalText: string) => {
    Alert.alert("Task Options", `Manage "${goalText}"`, [
      {
        text: "Expand with AI ✨",
        onPress: async () => {
          if (!geminiApiKey) {
            Alert.alert(
              "API Key Required",
              "Add your Gemini API key in Settings to use AI expansion."
            );
            return;
          }
          setIsExpanding(goalId);
          try {
            const newTasks = await expandTaskWithGemini(goalText, geminiApiKey);
            replaceGoalWithMultiple(goalId, newTasks);
          } catch (err: any) {
            Alert.alert("Expansion Failed", err.message || "Failed to expand task.");
          } finally {
            setIsExpanding(null);
          }
        },
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteGoal(goalId),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // ─── Pre-session view ──────────────────────────────────────────────────────
  if (!isActive) {
    return (
      <View className={`flex-1 ${t.bg}`}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 56, paddingBottom: 40, paddingHorizontal: 24 }}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-10">
            <View>
              <Text
                style={{ fontFamily: "Inter_400Regular", fontSize: 11, letterSpacing: 2 }}
                className={`${t.textSubtle} uppercase`}
              >
                Welcome back
              </Text>
              <Text
                style={{ fontFamily: "Inter_700Bold", fontSize: 24 }}
                className={t.textPrimary}
              >
                {userName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("/(tabs)/settings" as any)}
              className={`w-12 h-12 rounded-[4px] border items-center justify-center ${t.iconBtn} ${t.border}`}
            >
              <Ionicons name="settings-outline" size={20} color={t.colors.subtext} />
            </TouchableOpacity>
          </View>

          {/* Hero card */}
          <View className={`${t.cardBg} border ${t.border} rounded-[4px] p-6 mb-8`}>
            <Text
              style={{ fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.5 }}
              className={`${t.textPrimary} mb-1`}
            >
              Ready to Focus?
            </Text>
            <Text
              style={{ fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 }}
              className={`${t.textSubtle} mb-6`}
            >
              Start your 25-minute deep work interval to maximize productivity today.
            </Text>

            {/* Work day info */}
            <View className={`flex-row items-center ${t.inputBg} border ${t.border} rounded-[4px] p-4 mb-6`}>
              <Ionicons name="time-outline" size={16} color={t.colors.subtext} />
              <View className="ml-3">
                <Text
                  style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5 }}
                  className={`${t.textSubtle} uppercase`}
                >
                  Defined Work Day
                </Text>
                <Text
                  style={{ fontFamily: "Inter_600SemiBold", fontSize: 14 }}
                  className={t.textPrimary}
                >
                  {startOfDay} — {endOfDay}
                </Text>
              </View>
            </View>

            {/* Daily Goals */}
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text
                  style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2 }}
                  className={`${t.textSubtle} uppercase`}
                >
                  Daily Goals
                </Text>
                <View className={`border ${t.border} rounded-[4px] px-2 py-1`}>
                  <Text
                    style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1 }}
                    className={t.textSubtle}
                  >
                    {tempGoals.length} TASKS
                  </Text>
                </View>
              </View>

              {/* Goal input */}
              <View className="flex-row mb-3">
                <TextInput
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 14,
                    borderColor: goalInputFocused ? "#6B8E6F" : t.colors.border,
                    borderWidth: 1,
                  }}
                  className={`flex-1 ${t.inputBg} rounded-[4px] px-4 py-3 mr-2`}
                  placeholder="Add a goal for today…"
                  placeholderTextColor={t.colors.subtext}
                  value={newGoal}
                  onChangeText={setNewGoal}
                  onSubmitEditing={addTempGoal}
                  onFocus={() => setGoalInputFocused(true)}
                  onBlur={() => setGoalInputFocused(false)}
                />
                <TouchableOpacity
                  onPress={addTempGoal}
                  className={`w-12 h-12 rounded-[4px] items-center justify-center ${t.cardHighBg} border ${t.border}`}
                >
                  <Ionicons name="add" size={22} color={t.colors.text} />
                </TouchableOpacity>
              </View>

              {/* Goal list */}
              {tempGoals.map((goal, index) => (
                <View
                  key={index}
                  className={`${t.inputBg} border ${t.border} rounded-[4px] p-4 mb-2 flex-row justify-between items-center`}
                >
                  <Text
                    style={{ fontFamily: "Inter_400Regular", fontSize: 14 }}
                    className={`${t.textDim} flex-1 mr-2`}
                  >
                    {goal}
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setTempGoals(tempGoals.filter((_, i) => i !== index))
                    }
                  >
                    <Ionicons name="close" size={18} color={t.colors.subtext} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Initialize Session button */}
            <TouchableOpacity
              onPress={handleStart}
              className="rounded-[4px] p-4 items-center"
              style={{ backgroundColor: t.colors.text }}
            >
              <Text
                style={{ fontFamily: "Inter_700Bold", fontSize: 13, letterSpacing: 1.5, color: t.isDark ? '#0D0B1F' : '#FAFAF8' }}
                className="uppercase"
              >
                Initialize Session
              </Text>
            </TouchableOpacity>
          </View>
          
          <WisdomPulse />
        </ScrollView>
      </View>
    );
  }

  // ─── Active session view ───────────────────────────────────────────────────
  return (
    <View className={`flex-1 ${t.bg} pt-14 px-6`}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-8">
        <Text
          style={{ fontFamily: "Inter_700Bold", fontSize: 20 }}
          className={t.textPrimary}
        >
          TwentiFi
        </Text>
        <View className={`border ${t.border} rounded-[4px] px-3 py-1`}>
          <Text
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5 }}
            className={t.textSubtle}
          >
            {isPaused ? "PAUSED" : "FOCUS SESSION"}
          </Text>
        </View>
      </View>

      {/* Timer */}
      <View className={`${t.cardBg} border ${t.border} rounded-[4px] p-8 mb-6 items-center`}>
        <Text
          style={{ fontFamily: "Inter_400Regular", fontSize: 11, letterSpacing: 2 }}
          className={`${t.textSubtle} uppercase mb-2`}
        >
          Elapsed Time
        </Text>
        <Text
          style={{ fontFamily: "Inter_700Bold", fontSize: 56, letterSpacing: -2, lineHeight: 64 }}
          className={t.textPrimary}
        >
          {formatTime(elapsed)}
        </Text>

        {/* Controls */}
        <View className="flex-row items-center mt-6 gap-4">
          <TouchableOpacity
            onPress={handleLapReset}
            className={`w-12 h-12 rounded-[4px] border items-center justify-center ${t.iconBtn} ${t.border}`}
          >
            <Ionicons name="refresh" size={20} color={t.colors.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handlePause}
            className="w-14 h-14 rounded-[4px] items-center justify-center"
            style={{ backgroundColor: isPaused ? t.colors.brown : t.colors.text }}
          >
            <Ionicons
              name={isPaused ? "play" : "pause"}
              size={24}
              color={t.isDark ? '#0D0B1F' : '#FAFAF8'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleEnd}
            className={`w-12 h-12 rounded-[4px] border items-center justify-center ${t.iconBtn} ${t.border}`}
          >
            <Ionicons name="stop" size={20} color={t.colors.subtext} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Log button */}
      <TouchableOpacity
        onPress={() => router.push("/logging" as any)}
        className={`border ${t.border} rounded-[4px] p-4 flex-row items-center justify-center mb-6`}
        style={{ backgroundColor: t.colors.card }}
      >
        <Ionicons name="create-outline" size={18} color={t.colors.text} />
        <Text
          style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, letterSpacing: 1 }}
          className={`${t.textPrimary} ml-2 uppercase`}
        >
          Log What You Did
        </Text>
      </TouchableOpacity>

      {/* Goals list */}
      <View className="flex-1">
        <View className="flex-row justify-between items-center mb-4">
          <Text
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2 }}
            className={`${t.textSubtle} uppercase`}
          >
            Today&apos;s Goals
          </Text>
          <Text
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 10 }}
            className={t.textSubtle}
          >
            {goals.filter((g) => g.completed).length}/{goals.length}
          </Text>
        </View>

        <DraggableFlatList
          showsVerticalScrollIndicator={false}
          data={goals}
          onDragEnd={({ data }) => reorderGoals(data)}
          keyExtractor={(item) => item.id}
          containerStyle={{ flex: 1 }}
          renderItem={({ item: goal, drag, isActive: isDragging }) => (
            <View
              className={`flex-row items-center rounded-[4px] mb-3 border justify-between ${
                isDragging
                  ? "opacity-80"
                  : ""
              }`}
              style={{
                backgroundColor: isDragging ? t.colors.card : t.colors.bg,
                borderColor: isDragging ? t.colors.green : t.colors.border,
                padding: 14,
              }}
            >
              <GHTouchableOpacity
                activeOpacity={0.7}
                disabled={isDragging}
                onPress={() => toggleGoal(goal.id)}
                containerStyle={{ flex: 1 }}
                style={{ flexDirection: "row", alignItems: "center" }}
              >
                <View
                  className="w-5 h-5 rounded-[2px] border items-center justify-center mr-3"
                  style={{
                    borderColor: goal.completed ? t.colors.green : t.colors.border,
                    backgroundColor: goal.completed ? t.colors.green : "transparent",
                  }}
                >
                  {goal.completed && (
                    <Ionicons name="checkmark" size={13} color="white" />
                  )}
                </View>
                <Text
                  style={{
                    fontFamily: goal.completed
                      ? "Inter_400Regular"
                      : "Inter_500Medium",
                    fontSize: 14,
                    textDecorationLine: goal.completed ? "line-through" : "none",
                  }}
                  className={`flex-1 ${goal.completed ? t.textSubtle : t.textDim}`}
                >
                  {goal.text}
                </Text>
              </GHTouchableOpacity>

              {isExpanding === goal.id ? (
                <ActivityIndicator size="small" color={t.colors.green} />
              ) : (
                <View className="flex-row items-center ml-2">
                  <GHTouchableOpacity onPressIn={drag} className="p-2 mr-1">
                    <Ionicons name="menu" size={16} color={t.colors.border} />
                  </GHTouchableOpacity>
                  <GHTouchableOpacity
                    onPress={() => handleTaskOptions(goal.id, goal.text)}
                    className="p-2"
                  >
                    <Ionicons
                      name="ellipsis-vertical"
                      size={16}
                      color={t.colors.subtext}
                    />
                  </GHTouchableOpacity>
                </View>
              )}
            </View>
          )}
          ListFooterComponent={
            <View className={`flex-row mt-1 mb-8 border ${t.border} rounded-[4px] overflow-hidden`}
              style={{ backgroundColor: t.colors.bg }}>
              <TextInput
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  flex: 1,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderColor: activeGoalInputFocused ? "#6B8E6F" : "transparent",
                  borderWidth: 1,
                  borderRadius: 4,
                  color: t.colors.textDim,
                }}
                placeholder="Add another goal…"
                placeholderTextColor={t.colors.subtext}
                value={activeNewGoal}
                onChangeText={setActiveNewGoal}
                onSubmitEditing={handleActiveAddGoal}
                onFocus={() => setActiveGoalInputFocused(true)}
                onBlur={() => setActiveGoalInputFocused(false)}
              />
              <TouchableOpacity
                onPress={handleActiveAddGoal}
                className="w-12 items-center justify-center"
                style={{ backgroundColor: t.colors.card }}
              >
                <Ionicons name="add" size={20} color={t.colors.text} />
              </TouchableOpacity>
            </View>
          }
        />
      </View>
    </View>
  );
}
