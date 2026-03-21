import { useLogStore } from "@/store/logStore";
import { useSessionStore } from "@/store/sessionStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import React from "react";
import {
  Alert,
  Linking,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const router = useRouter();
  const {
    userName,
    setUserName,
    startOfDay,
    setStartOfDay,
    endOfDay,
    setEndOfDay,
    loggingInterval,
    setLoggingInterval,
    activityPrompts,
    missedLogReminders,
    geminiApiKey,
    setGeminiApiKey,
    toggleActivityPrompts,
    toggleMissedLogReminders,
  } = useSettingsStore();
  const { logs, clearLogs } = useLogStore();
  const { endSession } = useSessionStore();

  const exportLogs = async () => {
    if (logs.length === 0) {
      Alert.alert("No Logs", "Capture some pulses before exporting!");
      return;
    }

    try {
      const header = "Timestamp,Activity,Mood,Productivity\n";
      const rows = logs
        .map(
          (log) =>
            `"${log.timestamp}","${log.activity.replace(/"/g, '""')}","${log.mood}",${log.productivity}`,
        )
        .join("\n");

      const csvContent = header + rows;
      // Use FileSystem namespace to avoid potential naming conflicts if I were to import documentDirectory directly
      const fileUri = `${FileSystem.documentDirectory}the25_logs_${new Date().toISOString().split("T")[0]}.csv`;

      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: "utf8",
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert("Sharing Unavailable", "Could not open sharing options.");
      }
    } catch (error) {
      console.error("Export failed:", error);
      Alert.alert(
        "Export Failed",
        "An error occurred while generating the CSV.",
      );
    }
  };

  return (
    <View className="flex-1 bg-brand-bg pt-12">
      <View className="px-6 mb-8 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-white">Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="px-6">
        <Section title="Profile">
          <View className="bg-brand-card p-5 rounded-[24px] mb-3 border border-white/5">
            <View className="flex-row items-center mb-4">
              <Ionicons name="person-outline" size={20} color="#8B5CF6" />
              <Text className="ml-3 text-white font-medium">Display Name</Text>
            </View>
            <TextInput
              className="bg-brand-bg text-white p-4 rounded-2xl border border-white/10"
              value={userName}
              onChangeText={setUserName}
              placeholder="Your name"
              placeholderTextColor="#4B5563"
            />
          </View>

          <View className="bg-brand-card p-5 rounded-[24px] mb-3 border border-white/5">
            <View className="flex-row items-center mb-4">
              <Ionicons name="sparkles-outline" size={20} color="#8B5CF6" />
              <Text className="ml-3 text-white font-medium">
                Gemini AI API Key
              </Text>
            </View>
            <TextInput
              className="bg-brand-bg text-white p-4 rounded-2xl border border-white/10"
              value={geminiApiKey}
              onChangeText={setGeminiApiKey}
              placeholder="Paste your Gemini key here"
              placeholderTextColor="#4B5563"
              secureTextEntry
            />
            <View className="flex-row items-center justify-between mt-3">
              <Text className="text-white/30 text-[10px] font-medium uppercase tracking-widest leading-relaxed flex-1">
                Enables AI insights on Stats
              </Text>
              <TouchableOpacity onPress={() => Linking.openURL('https://aistudio.google.com/app/apikey')}>
                <Text className="text-[#8B5CF6] text-[10px] font-bold uppercase tracking-widest">
                  Get Key
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Section>

        <Section title="Session Configuration">
          <View className="bg-brand-card p-5 rounded-[24px] mb-3 border border-white/5">
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons name="time-outline" size={20} color="#8B5CF6" />
                <Text className="ml-3 text-white font-medium">
                  Start of Day
                </Text>
              </View>
              <TextInput
                className="bg-brand-bg text-white px-4 py-2 rounded-xl border border-white/10 w-24 text-center font-bold"
                value={startOfDay}
                onChangeText={setStartOfDay}
                placeholder="09:00"
                placeholderTextColor="#4B5563"
              />
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="moon-outline" size={20} color="#8B5CF6" />
                <Text className="ml-3 text-white font-medium">End of Day</Text>
              </View>
              <TextInput
                className="bg-brand-bg text-white px-4 py-2 rounded-xl border border-white/10 w-24 text-center font-bold"
                value={endOfDay}
                onChangeText={setEndOfDay}
                placeholder="21:00"
                placeholderTextColor="#4B5563"
              />
            </View>
          </View>
          <View className="bg-brand-card p-5 rounded-[24px] mb-3 border border-white/5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Ionicons name="repeat-outline" size={20} color="#8B5CF6" />
                <Text className="ml-3 text-white font-medium">Logging Interval</Text>
              </View>
              <View className="flex-row items-center">
                <TextInput
                  className="bg-brand-bg text-white px-2 py-2 rounded-xl border border-white/10 w-16 text-center font-bold"
                  value={String(loggingInterval)}
                  onChangeText={(val) => {
                    const num = parseInt(val.replace(/[^0-9]/g, ''), 10);
                    if (!isNaN(num) && num > 0) setLoggingInterval(num);
                  }}
                  keyboardType="numeric"
                  placeholder="20"
                  placeholderTextColor="#4B5563"
                />
                <Text className="ml-2 text-brand-subtext font-bold text-xs">mins</Text>
              </View>
            </View>
          </View>
        </Section>

        <Section title="Notifications">
          <ToggleItem
            icon="notifications-outline"
            title="Activity Prompts"
            isEnabled={activityPrompts}
            onToggle={toggleActivityPrompts}
          />
          <ToggleItem
            icon="alert-circle-outline"
            title="Missed Log Reminders"
            isEnabled={missedLogReminders}
            onToggle={toggleMissedLogReminders}
          />
        </Section>

        <Section title="Data">
          <TouchableOpacity
            onPress={exportLogs}
            className="flex-row items-center p-5 bg-brand-card rounded-[24px] mb-3 border border-white/5"
          >
            <Ionicons name="cloud-upload-outline" size={24} color="#8B5CF6" />
            <Text className="ml-3 text-white text-lg font-medium">
              Export Logs (CSV)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={async () => {
              if (Platform.OS === 'web') {
                const confirmed = window.confirm("Are you sure you want to clear all data? This cannot be undone.");
                if (confirmed) {
                  await clearLogs();
                  await endSession();
                  window.alert("All logs and active sessions have been cleared.");
                }
              } else {
                Alert.alert(
                  "Purge All Data",
                  "Are you sure you want to clear all data? This cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: async () => {
                        await clearLogs();
                        await endSession();
                        Alert.alert(
                          "Data Purged",
                          "All logs and active sessions have been cleared.",
                        );
                      },
                    },
                  ],
                );
              }
            }}
            className="flex-row items-center p-5 bg-brand-card rounded-[24px] border border-red-500/20"
          >
            <Ionicons name="trash-outline" size={24} color="#EF4444" />
            <Text className="ml-3 text-red-500 text-lg font-medium">
              Purge All Data
            </Text>
          </TouchableOpacity>
        </Section>

        <View className="items-center mt-8 mb-12">
          <Text className="text-brand-subtext text-[10px] font-bold uppercase tracking-[4px]">
            TwentiFi v1.0.0 (MVP)
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-8">
      <Text className="text-brand-subtext text-[10px] font-bold uppercase tracking-[2px] mb-4 ml-1">
        {title}
      </Text>
      {children}
    </View>
  );
}



function ToggleItem({
  icon,
  title,
  isEnabled,
  onToggle,
}: {
  icon: any;
  title: string;
  isEnabled: boolean;
  onToggle: () => void;
}) {
  return (
    <View className="flex-row items-center justify-between p-5 bg-brand-card rounded-[24px] mb-3 border border-white/5">
      <View className="flex-row items-center">
        <Ionicons name={icon} size={22} color="#8B5CF6" />
        <Text className="ml-3 text-white font-medium">{title}</Text>
      </View>
      <Switch
        trackColor={{ false: "#1F2937", true: "#8B5CF6" }}
        thumbColor="#fff"
        onValueChange={onToggle}
        value={isEnabled}
      />
    </View>
  );
}
