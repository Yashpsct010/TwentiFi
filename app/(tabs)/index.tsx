import * as Haptics from 'expo-haptics';
import { expandTask } from "@/services/aiGateway";
import WisdomPulse from "@/components/WisdomPulse";
import TodayDocket from "@/components/TodayDocket";
import BlueprintModal from "@/components/BlueprintModal";
import { useSessionStore } from "@/store/sessionStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useMilestoneStore } from "@/store/milestoneStore";
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
  ActivityIndicator,
  Image,
} from "react-native";
import { useDialogStore } from "@/store/dialogStore";
import { TouchableOpacity as GHTouchableOpacity } from "react-native-gesture-handler";
import DraggableFlatList from "react-native-draggable-flatlist";
import Svg, { Circle } from "react-native-svg";

// Ring dimensions for circular progress
const RING_SIZE = 44;
const STROKE = 3;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

import { useMembership } from "@/hooks/use-membership";

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
  const { isPro, incrementAiExpansion, showGatedDialog } = useMembership();
  const t = useTheme();

  const [newGoal, setNewGoal] = useState("");
  const [activeNewGoal, setActiveNewGoal] = useState("");
  const [tempGoals, setTempGoals] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isExpanding, setIsExpanding] = useState<string | null>(null);
  const [goalInputFocused, setGoalInputFocused] = useState(false);
  const [activeGoalInputFocused, setActiveGoalInputFocused] = useState(false);
  const [plannerVisible, setPlannerVisible] = useState(false);
  const [plannerMode, setPlannerMode] = useState<"tomorrow" | "today">("tomorrow");
  const router = useRouter();
  const lapStartOffset = useRef(0);

  // ── Milestone store & overall progress calculation ─────────────────────────
  const { milestones, finalizeSession } = useMilestoneStore();
  const activeMilestones = milestones.filter((m) => !m.isCompleted);

  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

  const selectedMilestone = activeMilestones.find((m) => m.id === selectedMilestoneId) ?? null;

  // Tasks for session preview: carried first, then pending
  const sessionPreviewTasks = selectedMilestone
    ? [
        ...selectedMilestone.tasks.filter((tk) => tk.status === "carried"),
        ...selectedMilestone.tasks.filter((tk) => tk.status === "pending"),
      ]
    : [];

  // Overall progress ring: accurately reflects tasks completed + milestones achieved
  // Completed milestones remain counted so finishing a milestone fills the ring towards 100%
  const { totalUnits, completedUnits } = milestones.reduce(
    (acc, m) => {
      const taskCount = m.tasks.length;
      if (m.isCompleted) {
        const weight = Math.max(1, taskCount);
        return {
          totalUnits: acc.totalUnits + weight,
          completedUnits: acc.completedUnits + weight,
        };
      } else {
        const doneTasks = m.tasks.filter((tk) => tk.status === "completed").length;
        const weight = Math.max(1, taskCount);
        return {
          totalUnits: acc.totalUnits + weight,
          completedUnits: acc.completedUnits + doneTasks,
        };
      }
    },
    { totalUnits: 0, completedUnits: 0 }
  );

  const overallProgress = totalUnits > 0 ? completedUnits / totalUnits : 0;
  const ringOffset = CIRCUMFERENCE * (1 - overallProgress);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      const tasksToStart = sessionPreviewTasks.map((tk) => ({ id: tk.id, text: tk.text }));
      startSession(tasksToStart.length > 0 ? tasksToStart : tempGoals, selectedMilestoneId ?? undefined);
      setTempGoals([]);
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  const handleEnd = async () => {
    try {
      // Finalize milestone tasks before clearing session state
      const { activeMilestoneId } = useSessionStore.getState();
      if (activeMilestoneId) {
        const completedGoals = goals.filter((g) => g.completed);
        const completedIds = completedGoals.map((g) => g.id);
        const completedTexts = completedGoals.map((g) => g.text);
        finalizeSession(activeMilestoneId, completedIds, completedTexts);
      }
      await endSession();
      setSelectedMilestoneId(null);
    } catch (err) {
      console.error("Failed to end session:", err);
      useSessionStore.setState({ isActive: false, startTime: null, endTime: null, activeMilestoneId: null, goals: [] });
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
    useDialogStore.getState().showDialog("Task Options", `Manage "${goalText}"`, [
      {
        text: "Expand with AI ✨",
        style: "default",
        onPress: async () => {
          if (!geminiApiKey && !isPro) {
            useDialogStore.getState().showDialog(
              "API Key Required",
              "Add your Gemini API key in Settings to use AI expansion, or upgrade to TwentiFi Pro for zero-setup cloud AI."
            );
            return;
          }

          const canProceed = incrementAiExpansion();
          if (!canProceed) {
            showGatedDialog(
              "Daily AI Quota Reached",
              "You have used your 3 daily AI goal expansions on the free tier. Upgrade to TwentiFi Pro for unlimited AI expansions."
            );
            return;
          }

          setIsExpanding(goalId);
          try {
            const newTasks = await expandTask(goalText);
            replaceGoalWithMultiple(goalId, newTasks);
          } catch (err: any) {
            useDialogStore.getState().showDialog("Expansion Failed", err.message || "Failed to expand task.");
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
          {/* ── Header ─────────────────────────────────────────────────── */}
          <View className="flex-row justify-between items-start mb-10">
            <View>
              <Text
                style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5 }}
                className={`${t.textSubtle} uppercase mb-1`}
              >
                Welcome Back
              </Text>
              <Text
                style={{ fontFamily: "Inter_700Bold", fontSize: 24, letterSpacing: -0.5 }}
                className={`${t.textPrimary} mb-2`}
              >
                {userName}
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={14} color={t.colors.subtext} />
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12 }} className={`${t.textSubtle} ml-2`}>
                  {startOfDay} — {endOfDay}
                </Text>
              </View>
            </View>

            {/* Right side: AI Blueprint + Milestones ring button + Settings button */}
            <View className="flex-row items-center gap-2.5">
              {/* ── AI Blueprint Studio Button ──────────────────────────── */}
              <TouchableOpacity
                onPress={() => {
                  setPlannerMode("tomorrow");
                  setPlannerVisible(true);
                }}
                className={`w-11 h-11 rounded-[4px] border items-center justify-center ${t.iconBtn} ${t.border}`}
              >
                <Ionicons name="sparkles" size={17} color={t.colors.green} />
              </TouchableOpacity>

              {/* ── Milestones Circular Progress Button ────────────────── */}
              <TouchableOpacity
                onPress={() => router.push("/milestones" as any)}
                className="w-11 h-11 items-center justify-center"
                style={{ position: "relative" }}
              >
                <Svg
                  width={RING_SIZE}
                  height={RING_SIZE}
                  style={{ position: "absolute", }}
                >
                  {/* Background track */}
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    stroke={t.colors.border}
                    strokeWidth={STROKE}
                    fill="none"
                  />
                  {/* Progress arc */}
                  <Circle
                    cx={RING_SIZE / 2}
                    cy={RING_SIZE / 2}
                    r={RADIUS}
                    stroke={t.colors.green}
                    strokeWidth={STROKE}
                    fill="none"
                    strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                  />
                </Svg>
                <Ionicons
                  name={overallProgress === 1 && totalUnits > 0 ? "flag" : "flag-outline"}
                  size={16}
                  color={overallProgress === 1 && totalUnits > 0 ? t.colors.green : t.colors.text}
                />
              </TouchableOpacity>

              {/* Settings button */}
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/settings" as any)}
                className={`w-11 h-11 rounded-[4px] border items-center justify-center ${t.iconBtn} ${t.border}`}
              >
                <Ionicons name="settings-outline" size={20} color={t.colors.subtext} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Today's Docket (Execution Center & Continuous Day Burn Rail) ── */}
          <TodayDocket
            onOpenPlanner={() => {
              setPlannerMode("today");
              setPlannerVisible(true);
            }}
          />
          
          <WisdomPulse />
        </ScrollView>

        <BlueprintModal
          visible={plannerVisible}
          onClose={() => setPlannerVisible(false)}
          initialMode={plannerMode}
        />
      </View>
    );
  }

  // ─── Active session view ───────────────────────────────────────────────────
  const activeMilestone = milestones.find((m) => m.id === useSessionStore.getState().activeMilestoneId) ?? null;

  return (
    <View className={`flex-1 ${t.bg} pt-14 px-6`}>
      <View className="flex-row justify-between items-center mb-2">
        <Image 
          source={require('../../assets/images/logo-secondary-horizontal.png')}
          style={{ height: 28, width: 120, resizeMode: 'contain', tintColor: t.isDark ? '#E2E2E2' : '#1A1A1A' }}
        />
        <View className={`border ${t.border} rounded-[4px] px-3 py-1`}>
          <Text
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 1.5 }}
            className={t.textSubtle}
          >
            {isPaused ? "PAUSED" : "FOCUS SESSION"}
          </Text>
        </View>
      </View>

      {/* Milestone label */}
      {activeMilestone && (
        <View className="flex-row items-center mb-6">
          <View
            style={{
              backgroundColor:
                activeMilestone.type === "target" ? t.colors.brown + "22" : t.colors.green + "20",
              borderRadius: 2,
              paddingHorizontal: 7,
              paddingVertical: 3,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 9,
                letterSpacing: 1.5,
                color: activeMilestone.type === "target" ? t.colors.brown : t.colors.green,
              }}
            >
              {activeMilestone.type === "target" ? "TARGET" : "HABIT"}  ·  {activeMilestone.title.toUpperCase()}
            </Text>
          </View>
        </View>
      )}


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
            Session Tasks
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
                onPress={() => {
                  if (!goal.completed) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } else {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  toggleGoal(goal.id);
                }}
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
