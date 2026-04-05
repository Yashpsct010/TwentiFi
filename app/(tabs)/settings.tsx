import { useLogStore } from "@/store/logStore";
import { useSessionStore } from "@/store/sessionStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import { zip, unzip } from "react-native-zip-archive";
import { mergeLogsFromBackup } from "@/services/database";
import { useDialogStore } from "@/store/dialogStore";
import * as Sharing from "expo-sharing";
import React from "react";
import {
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
  // ── All existing logic preserved ─────────────────────────────────────────
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
    theme,
    setTheme,
    customTags,
    addCustomTag,
    removeCustomTag,
  } = useSettingsStore();
  const { logs, clearLogs } = useLogStore();
  const { endSession } = useSessionStore();
  const t = useTheme();

  const [localInterval, setLocalInterval] = React.useState(String(loggingInterval));
  const [nameFocused, setNameFocused] = React.useState(false);
  const [keyFocused, setKeyFocused] = React.useState(false);
  const [newTag, setNewTag] = React.useState("");
  const [tagFocused, setTagFocused] = React.useState(false);

  React.useEffect(() => {
    setLocalInterval(String(loggingInterval));
  }, [loggingInterval]);

  const exportLogs = async () => {
    if (logs.length === 0) {
      useDialogStore.getState().showDialog("No Logs", "No data to backup!");
      return;
    }
    try {
      const backupDir = `${FileSystem.documentDirectory}TwentiFi_Backup_Temp/`;
      const dbPath = `${FileSystem.documentDirectory}SQLite/the25.db`;
      const audioDir = `${FileSystem.documentDirectory}twentifi-audio/`;

      await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
      
      const dbInfo = await FileSystem.getInfoAsync(dbPath);
      if (dbInfo.exists) await FileSystem.copyAsync({ from: dbPath, to: `${backupDir}the25.db` });
      
      const audioInfo = await FileSystem.getInfoAsync(audioDir);
      if (audioInfo.exists) await FileSystem.copyAsync({ from: audioDir, to: `${backupDir}twentifi-audio` });
      
      const zipPath = `${FileSystem.documentDirectory}TwentiFi_Backup_${new Date().toISOString().split("T")[0]}.zip`;
      await zip(backupDir, zipPath);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(zipPath);
      } else {
        useDialogStore.getState().showDialog("Sharing Unavailable", "Could not open sharing options.");
      }
      
      await FileSystem.deleteAsync(backupDir, { idempotent: true });
    } catch (error) {
      console.error("Export backup failed:", error);
      useDialogStore.getState().showDialog("Backup Failed", "An error occurred while generating the bundle.");
    }
  };

  const importLogs = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || result.assets.length === 0) return;

      const zipUri = result.assets[0].uri;
      const targetDir = `${FileSystem.documentDirectory}TwentiFi_Restore_Temp/`;
      await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });

      await unzip(zipUri, targetDir);

      const extractedAudioDir = `${targetDir}twentifi-audio/`;
      const extractedAudioInfo = await FileSystem.getInfoAsync(extractedAudioDir);
      if (extractedAudioInfo.exists) {
        const liveAudioDir = `${FileSystem.documentDirectory}twentifi-audio/`;
        await FileSystem.makeDirectoryAsync(liveAudioDir, { intermediates: true });
        
        const files = await FileSystem.readDirectoryAsync(extractedAudioDir);
        for (const file of files) {
           await FileSystem.copyAsync({
             from: `${extractedAudioDir}${file}`,
             to: `${liveAudioDir}${file}`
           });
        }
      }

      const extractedDbPath = `${targetDir}the25.db`;
      const extractedDbInfo = await FileSystem.getInfoAsync(extractedDbPath);
      
      if (extractedDbInfo.exists) {
        const mergeDbTarget = `${FileSystem.documentDirectory}SQLite/the25_backup.db`;
        await FileSystem.copyAsync({ from: extractedDbPath, to: mergeDbTarget });
        
        await mergeLogsFromBackup("the25_backup.db");
        await FileSystem.deleteAsync(mergeDbTarget, { idempotent: true });
      }

      await FileSystem.deleteAsync(targetDir, { idempotent: true });
      await useLogStore.getState().loadLogs();
      useDialogStore.getState().showDialog("Restore Complete", "Data imported and merged successfully!");

    } catch (error) {
      console.error("Import backup failed:", error);
      useDialogStore.getState().showDialog("Import Failed", String(error));
    }
  };

  const handlePurge = async () => {
    if (Platform.OS === "web") {
      const confirmed = window.confirm("Are you sure you want to clear all data? This cannot be undone.");
      if (confirmed) {
        await clearLogs();
        await endSession();
        window.alert("All logs and active sessions have been cleared.");
      }
    } else {
      useDialogStore.getState().showDialog(
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
              useDialogStore.getState().showDialog("Data Purged", "All logs and active sessions have been cleared.");
            },
          },
        ]
      );
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View className={`flex-1 ${t.bg}`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 56, paddingBottom: 48, paddingHorizontal: 24 }}
      >
        {/* Page header */}
        <View className="mb-8">
          <Text
            style={{ fontFamily: "Inter_700Bold", fontSize: 28, letterSpacing: -0.5 }}
            className={t.textPrimary}
          >
            Settings
          </Text>
        </View>

        {/* ── PROFILE ──────────────────────────────────────────────────────── */}
        <SectionHeader label="Profile" textSubtle={t.textSubtle} />

        {/* Display Name */}
        <SettingCard t={t}>
          <SettingRow
            icon="person-outline"
            label="Display Name"
            t={t}
          />
          <TextInput
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              borderColor: nameFocused ? "#6B8E6F" : t.colors.border,
              borderWidth: 1,
              borderRadius: 4,
              color: t.colors.textDim,
              backgroundColor: t.colors.bg,
              padding: 12,
              marginTop: 10,
            }}
            value={userName}
            onChangeText={setUserName}
            placeholder="Your name"
            placeholderTextColor={t.colors.subtext}
            onFocus={() => setNameFocused(true)}
            onBlur={() => setNameFocused(false)}
          />
        </SettingCard>

        {/* Gemini Key */}
        <SettingCard t={t}>
          <SettingRow icon="sparkles-outline" label="Gemini AI API Key" t={t} />
          <TextInput
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              borderColor: keyFocused ? "#6B8E6F" : t.colors.border,
              borderWidth: 1,
              borderRadius: 4,
              color: t.colors.textDim,
              backgroundColor: t.colors.bg,
              padding: 12,
              marginTop: 10,
            }}
            value={geminiApiKey}
            onChangeText={setGeminiApiKey}
            placeholder="Paste your Gemini key here"
            placeholderTextColor={t.colors.subtext}
            secureTextEntry
            onFocus={() => setKeyFocused(true)}
            onBlur={() => setKeyFocused(false)}
          />
          <View className="flex-row items-center justify-between mt-3">
            <Text
              style={{ fontFamily: "Inter_400Regular", fontSize: 11 }}
              className={t.textSubtle}
            >
              Enables AI insights on Stats screen
            </Text>
            <TouchableOpacity
              onPress={() => Linking.openURL("https://aistudio.google.com/app/apikey")}
            >
              <Text
                style={{ fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1, color: t.colors.green }}
                className="uppercase"
              >
                Get Key →
              </Text>
            </TouchableOpacity>
          </View>
        </SettingCard>

        {/* ── APPEARANCE ─────────────────────────────────────────────────── */}
        <SectionHeader label="Appearance" textSubtle={t.textSubtle} />

        <SettingCard t={t}>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons
                name={theme === "dark" ? "moon-outline" : "sunny-outline"}
                size={18}
                color={t.colors.subtext}
              />
              <View className="ml-3">
                <Text
                  style={{ fontFamily: "Inter_500Medium", fontSize: 14 }}
                  className={t.textPrimary}
                >
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </Text>
                <Text
                  style={{ fontFamily: "Inter_400Regular", fontSize: 11 }}
                  className={t.textSubtle}
                >
                  Vellum Ledger theme
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{
                false: t.colors.border,
                true: t.colors.green,
              }}
              thumbColor="#fff"
              onValueChange={(val) => setTheme(val ? "dark" : "light")}
              value={theme === "dark"}
            />
          </View>
        </SettingCard>

        {/* ── SESSION CONFIGURATION ─────────────────────────────────────── */}
        <SectionHeader label="Session Configuration" textSubtle={t.textSubtle} />

        <SettingCard t={t}>
          {/* Start of Day */}
          <View className="flex-row items-center justify-between mb-4">
            <SettingRow icon="time-outline" label="Start of Day" t={t} inline />
            <TextInput
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 14,
                borderColor: t.colors.border,
                borderWidth: 1,
                borderRadius: 4,
                color: t.colors.text,
                backgroundColor: t.colors.bg,
                paddingHorizontal: 12,
                paddingVertical: 8,
                width: 80,
                textAlign: "center",
              }}
              value={startOfDay}
              onChangeText={setStartOfDay}
              placeholder="09:00"
              placeholderTextColor={t.colors.subtext}
            />
          </View>

          {/* Separator */}
          <View className="h-[1px]" style={{ backgroundColor: t.colors.border, marginBottom: 14 }} />

          {/* End of Day */}
          <View className="flex-row items-center justify-between mb-4">
            <SettingRow icon="moon-outline" label="End of Day" t={t} inline />
            <TextInput
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 14,
                borderColor: t.colors.border,
                borderWidth: 1,
                borderRadius: 4,
                color: t.colors.text,
                backgroundColor: t.colors.bg,
                paddingHorizontal: 12,
                paddingVertical: 8,
                width: 80,
                textAlign: "center",
              }}
              value={endOfDay}
              onChangeText={setEndOfDay}
              placeholder="21:00"
              placeholderTextColor={t.colors.subtext}
            />
          </View>

          {/* Separator */}
          <View className="h-[1px]" style={{ backgroundColor: t.colors.border, marginBottom: 14 }} />

          {/* Logging Interval */}
          <View className="flex-row items-center justify-between">
            <SettingRow icon="repeat-outline" label="Logging Interval" t={t} inline />
            <View className="flex-row items-center">
              <TextInput
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 14,
                  borderColor: t.colors.border,
                  borderWidth: 1,
                  borderRadius: 4,
                  color: t.colors.text,
                  backgroundColor: t.colors.bg,
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  width: 60,
                  textAlign: "center",
                }}
                value={localInterval}
                onChangeText={setLocalInterval}
                onBlur={() => {
                  const num = parseInt(localInterval.replace(/[^0-9]/g, ""), 10);
                  if (!isNaN(num) && num > 0) {
                    setLoggingInterval(num);
                    setLocalInterval(String(num));
                  } else {
                    setLocalInterval(String(loggingInterval));
                  }
                }}
                keyboardType="numeric"
                placeholder="20"
                placeholderTextColor={t.colors.subtext}
              />
              <Text
                style={{ fontFamily: "Inter_600SemiBold", fontSize: 11 }}
                className={`${t.textSubtle} ml-2`}
              >
                mins
              </Text>
            </View>
          </View>
        </SettingCard>

        {/* ── NOTIFICATIONS ─────────────────────────────────────────────── */}
        <SectionHeader label="Notifications" textSubtle={t.textSubtle} />

        <SettingCard t={t}>
          <ToggleRow
            icon="notifications-outline"
            label="Activity Prompts"
            isEnabled={activityPrompts}
            onToggle={toggleActivityPrompts}
            t={t}
          />
          <View className="h-[1px] my-3" style={{ backgroundColor: t.colors.border }} />
          <ToggleRow
            icon="alert-circle-outline"
            label="Missed Log Reminders"
            isEnabled={missedLogReminders}
            onToggle={toggleMissedLogReminders}
            t={t}
          />
        </SettingCard>

        {/* ── CUSTOM TAGS ───────────────────────────────────────────── */}
        <SectionHeader label="Custom Tags" textSubtle={t.textSubtle} />
        <SettingCard t={t}>
          <SettingRow icon="pricetags-outline" label="Personal Tags (Max 5)" t={t} />
          
          <View className="flex-row items-center mt-3 mb-4">
            <TextInput
              style={{
                flex: 1,
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                borderColor: tagFocused ? "#6B8E6F" : t.colors.border,
                borderWidth: 1,
                borderRadius: 4,
                color: t.colors.textDim,
                backgroundColor: t.colors.bg,
                padding: 10,
              }}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="E.g., Client Work, Reading"
              placeholderTextColor={t.colors.subtext}
              onFocus={() => setTagFocused(true)}
              onBlur={() => setTagFocused(false)}
              maxLength={15}
              editable={customTags.length < 5}
            />
            <TouchableOpacity
              className={`ml-2 h-[42px] px-4 rounded-[4px] items-center justify-center ${
                customTags.length >= 5 || !newTag.trim() ? "opacity-50" : ""
              }`}
              style={{ backgroundColor: t.colors.text }}
              disabled={customTags.length >= 5 || !newTag.trim()}
              onPress={() => {
                if (newTag.trim()) {
                  addCustomTag(newTag.trim());
                  setNewTag("");
                }
              }}
            >
              <Text
                style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: t.isDark ? '#0D0B1F' : '#FAFAF8' }}
                className="uppercase"
              >
                Add
              </Text>
            </TouchableOpacity>
          </View>

          {customTags.length > 0 ? (
            <View className="flex-row flex-wrap gap-2">
              {customTags.map((tag) => (
                <View
                  key={tag}
                  className="flex-row items-center rounded-[4px] border px-3 py-1.5"
                  style={{ borderColor: t.colors.border, backgroundColor: t.colors.bg }}
                >
                  <Text
                    style={{ fontFamily: "Inter_500Medium", fontSize: 12, color: t.colors.textDim }}
                    className="mr-2"
                  >
                    {tag}
                  </Text>
                  <TouchableOpacity onPress={() => removeCustomTag(tag)}>
                    <Ionicons name="close-circle" size={16} color={t.colors.error} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <Text
              style={{ fontFamily: "Inter_400Regular", fontSize: 12 }}
              className={`${t.textSubtle}`}
            >
              No custom tags added yet.
            </Text>
          )}
        </SettingCard>

        {/* ── DATA MANAGEMENT ───────────────────────────────────────────── */}
        <SectionHeader label="Data Management" textSubtle={t.textSubtle} />

        {/* Export */}
        <TouchableOpacity
          onPress={exportLogs}
          className={`flex-row items-center p-4 rounded-[4px] border ${t.border} mb-3`}
          style={{ backgroundColor: t.colors.card }}
        >
          <Ionicons name="archive-outline" size={18} color={t.colors.subtext} />
          <Text
            style={{ fontFamily: "Inter_500Medium", fontSize: 14 }}
            className={`${t.textPrimary} ml-3`}
          >
            Create Backup (.zip)
          </Text>
          <Ionicons name="chevron-forward" size={16} color={t.colors.border} style={{ marginLeft: "auto" }} />
        </TouchableOpacity>

        {/* Import */}
        <TouchableOpacity
          onPress={importLogs}
          className={`flex-row items-center p-4 rounded-[4px] border ${t.border} mb-3`}
          style={{ backgroundColor: t.colors.card }}
        >
          <Ionicons name="download-outline" size={18} color={t.colors.subtext} />
          <Text
            style={{ fontFamily: "Inter_500Medium", fontSize: 14 }}
            className={`${t.textPrimary} ml-3`}
          >
            Import & Merge Backup
          </Text>
          <Ionicons name="chevron-forward" size={16} color={t.colors.border} style={{ marginLeft: "auto" }} />
        </TouchableOpacity>

        {/* Purge */}
        <TouchableOpacity
          onPress={handlePurge}
          className="flex-row items-center p-4 rounded-[4px] border mb-8"
          style={{
            borderColor: t.colors.error,
            backgroundColor: t.colors.card,
          }}
        >
          <Ionicons name="trash-outline" size={18} color={t.colors.error} />
          <Text
            style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: t.colors.error }}
            className="ml-3"
          >
            Purge All Data
          </Text>
        </TouchableOpacity>

        {/* Footer */}
        <View className="items-center pb-4">
          <Text
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2 }}
            className={`${t.textSubtle} uppercase`}
          >
            TwentiFi v1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ label, textSubtle }: { label: string; textSubtle: string }) {
  return (
    <Text
      style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2 }}
      className={`${textSubtle} uppercase mb-3 mt-2`}
    >
      {label}
    </Text>
  );
}

function SettingCard({ t, children }: { t: any; children: React.ReactNode }) {
  return (
    <View
      className={`border rounded-[4px] p-4 mb-4`}
      style={{ backgroundColor: t.colors.card, borderColor: t.colors.border }}
    >
      {children}
    </View>
  );
}

function SettingRow({
  icon,
  label,
  t,
  inline = false,
}: {
  icon: any;
  label: string;
  t: any;
  inline?: boolean;
}) {
  return (
    <View className={`flex-row items-center ${inline ? "" : "mb-1"}`}>
      <Ionicons name={icon} size={16} color={t.colors.subtext} />
      <Text
        style={{ fontFamily: "Inter_500Medium", fontSize: 14 }}
        className={`${t.textPrimary} ml-2`}
      >
        {label}
      </Text>
    </View>
  );
}

function ToggleRow({
  icon,
  label,
  isEnabled,
  onToggle,
  t,
}: {
  icon: any;
  label: string;
  isEnabled: boolean;
  onToggle: () => void;
  t: any;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <View className="flex-row items-center">
        <Ionicons name={icon} size={16} color={t.colors.subtext} />
        <Text
          style={{ fontFamily: "Inter_500Medium", fontSize: 14 }}
          className={`${t.textPrimary} ml-2`}
        >
          {label}
        </Text>
      </View>
      <Switch
        trackColor={{ false: t.colors.border, true: t.colors.green }}
        thumbColor="#fff"
        onValueChange={onToggle}
        value={isEnabled}
      />
    </View>
  );
}
