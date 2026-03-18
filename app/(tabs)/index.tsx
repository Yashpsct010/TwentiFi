import { useSessionStore } from "@/store/sessionStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const { isActive, startTime, goals, startSession, endSession, toggleGoal } =
    useSessionStore();
  const { userName, startOfDay, endOfDay } = useSettingsStore();
  const [newGoal, setNewGoal] = useState("");
  const [tempGoals, setTempGoals] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const router = useRouter();

  // Track the offset to subtract from the total session time (to handle pauses and lap resets)
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
          const totalSessionSeconds = Math.floor((Date.now() - startTimeNum) / 1000);
          setElapsed(Math.max(0, totalSessionSeconds - lapStartOffset.current));
        }, 1000);
      }
    }
    return () => clearInterval(interval);
  }, [isActive, startTime, isPaused]);

  const handlePause = () => {
    if (isPaused) {
      // Resuming: Adjust lapStartOffset so the timer continues from the current 'elapsed' value
      if (startTime) {
        const startTimeNum = typeof startTime === "string" ? parseInt(startTime, 10) : startTime;
        const totalSessionSeconds = Math.floor((Date.now() - startTimeNum) / 1000);
        lapStartOffset.current = totalSessionSeconds - elapsed;
      }
      setIsPaused(false);
    } else {
      // Pausing: Just stop the interval (UI will stay at current 'elapsed')
      setIsPaused(true);
    }
  };

  const handleLapReset = () => {
    if (!startTime) return;
    const startTimeNum = typeof startTime === "string" ? parseInt(startTime, 10) : startTime;
    lapStartOffset.current = Math.floor((Date.now() - startTimeNum) / 1000);
    setElapsed(0);
  };


  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    try {
      // Basic validation: Check if current time is within boundaries (optional warning)
      const now = new Date();
      const [startH, startM] = startOfDay.split(':').map(Number);
      const [endH, endM] = endOfDay.split(':').map(Number);
      
      const startTimeToday = new Date(now);
      startTimeToday.setHours(startH, startM, 0);
      
      const endTimeToday = new Date(now);
      endTimeToday.setHours(endH, endM, 0);

      const isOutside = now < startTimeToday || now > endTimeToday;
      
      if (isOutside) {
        console.warn("Starting session outside of configured day boundaries.");
      }

      console.log("Starting session...");
      startSession(tempGoals);
      setTempGoals([]);
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  const handleEnd = () => {
    try {
      console.log("Ending session...");
      endSession();
    } catch (err) {
      console.error("Failed to end session:", err);
    }
  };

  const addTempGoal = () => {
    if (newGoal.trim()) {
      setTempGoals([...tempGoals, newGoal.trim()]);
      setNewGoal("");
    }
  };

  return (
    <View className="flex-1 bg-brand-bg pt-12 px-6">
      <View className="flex-row justify-between items-center mb-10">
        <View className="flex-row items-center">
          <View className="w-12 h-12 rounded-full bg-brand-purple items-center justify-center mr-3">
            <Ionicons name="person" size={24} color="white" />
          </View>
          <View>
            <Text className="text-brand-subtext text-xs">Welcome back,</Text>
            <Text className="text-xl font-bold text-white">{userName}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/settings" as any)}
        >
          <Ionicons name="settings-sharp" size={24} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {!isActive ? (
        <ScrollView showsVerticalScrollIndicator={false}>
          <View className="bg-brand-card p-6 rounded-[32px] mb-8 border border-white/5">
            <Text className="text-2xl font-bold text-white mb-2">
              Ready to Focus?
            </Text>
            <Text className="text-brand-subtext mb-6">
              Initialize your session to start logging.
            </Text>

            <View className="mb-8 flex-row items-center bg-brand-bg/40 p-4 rounded-2xl border border-white/5">
              <Ionicons name="calendar-outline" size={20} color="#8B5CF6" />
              <View className="ml-3">
                <Text className="text-white/40 text-[10px] uppercase font-bold tracking-widest">Defined Work Day</Text>
                <Text className="text-white font-bold">{startOfDay} — {endOfDay}</Text>
              </View>
            </View>

            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-white font-bold">DAILY GOALS</Text>
                <View className="bg-brand-purple/20 px-3 py-1 rounded-full border border-brand-purple/30">
                  <Text className="text-brand-purple text-[10px] font-bold">
                    {tempGoals.length} TASKS
                  </Text>
                </View>
              </View>

              <View className="flex-row mb-4">
                <TextInput
                  className="flex-1 bg-brand-bg text-white p-4 rounded-2xl mr-2 border border-white/10"
                  placeholder="What's a win today?"
                  placeholderTextColor="#4B5563"
                  value={newGoal}
                  onChangeText={setNewGoal}
                  onSubmitEditing={addTempGoal}
                />
                <TouchableOpacity
                  onPress={addTempGoal}
                  className="bg-brand-purple w-14 h-14 rounded-2xl justify-center items-center shadow-lg shadow-brand-purple/50"
                >
                  <Ionicons name="add" size={28} color="white" />
                </TouchableOpacity>
              </View>

              {tempGoals.map((goal, index) => (
                <View
                  key={index}
                  className="bg-brand-bg/50 p-4 rounded-2xl mb-2 flex-row justify-between items-center border border-white/5"
                >
                  <Text className="text-slate-200">{goal}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      setTempGoals(tempGoals.filter((_, i) => i !== index))
                    }
                  >
                    <Ionicons name="close-circle" size={22} color="#4B5563" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                console.log("Initialize session pressed");
                handleStart();
              }}
              className="bg-brand-purple p-5 rounded-full items-center shadow-xl shadow-brand-purple/40"
            >
              <Text className="text-white font-black text-lg">
                INITIALIZE SESSION
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <View className="flex-1">
          <View className="items-center mb-10">
            <View className="w-64 h-64 rounded-full border-8 border-brand-card items-center justify-center">
              <View className="absolute w-64 h-64 rounded-full border-8 border-brand-purple/30" />
              <View className="items-center">
                <Text className="text-brand-subtext text-xs font-bold uppercase tracking-widest mb-1">
                  {isPaused ? "Paused" : "Focus Session"}
                </Text>
                <Text className="text-6xl font-black text-white">
                  {formatTime(elapsed)}
                </Text>
              </View>
            </View>

            <View className="flex-row mt-8">
              <TouchableOpacity
                className="bg-brand-card w-14 h-14 rounded-full items-center justify-center mr-4 border border-white/10"
                onPress={handleLapReset}
              >
                <Ionicons name="refresh" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePause}
                className={`w-20 h-20 rounded-full items-center justify-center shadow-2xl ${isPaused ? 'bg-amber-500 shadow-amber-500/60' : 'bg-brand-purple shadow-brand-purple/60'}`}
              >
                <Ionicons name={isPaused ? "play" : "pause"} size={36} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleEnd}
                className="bg-brand-card w-14 h-14 rounded-full items-center justify-center ml-4 border border-white/10"
              >
                <Ionicons name="stop" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              console.log("Navigating to logging");
              router.push("/logging" as any);
            }}
            className="bg-brand-purple flex-row p-5 rounded-[24px] items-center justify-center mb-10 shadow-lg shadow-brand-purple/30"
          >
            <Ionicons name="create" size={24} color="white" />
            <Text className="text-white font-black text-lg ml-3">
              LOG WHAT YOU DID
            </Text>
          </TouchableOpacity>

          <View className="flex-1">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-white">
                Today&apos;s top goals
              </Text>
              <View className="bg-brand-purple/20 px-3 py-1 rounded-full border border-brand-purple/30">
                <Text className="text-brand-purple text-[10px] font-bold">
                  {goals.length} TASKS
                </Text>
              </View>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {goals.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  onPress={() => toggleGoal(goal.id)}
                  className="flex-row items-center p-5 bg-brand-card rounded-[24px] mb-4 border border-white/5 justify-between"
                >
                  <View className="flex-row items-center flex-1">
                    <Ionicons
                      name={
                        goal.completed ? "checkmark-circle" : "ellipse-outline"
                      }
                      size={28}
                      color={goal.completed ? "#8B5CF6" : "#4B5563"}
                    />
                    <Text
                      className={`ml-4 text-lg font-medium flex-1 ${goal.completed ? "text-brand-subtext line-through" : "text-white"}`}
                    >
                      {goal.text}
                    </Text>
                  </View>
                  <Ionicons
                    name="ellipsis-vertical"
                    size={20}
                    color="#4B5563"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}
