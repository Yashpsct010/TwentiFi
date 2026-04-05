import { transcribeWithGemini } from "@/services/gemini";
import { useLogStore } from "@/store/logStore";
import { useSessionStore } from "@/store/sessionStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
} from "expo-audio";
import { Audio } from "expo-av";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { useDialogStore } from "@/store/dialogStore";

// ── Safe access to native modules (unchanged) ────────────────────────────────
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: (
  event: string,
  callback: (event: any) => void
) => void = () => {};
let isRecognitionAvailable: () => boolean = () => false;
let supportsRecording: () => boolean = () => false;

try {
  const STT = require("expo-speech-recognition");
  if (STT) {
    ExpoSpeechRecognitionModule = STT.ExpoSpeechRecognitionModule;
    useSpeechRecognitionEvent = STT.useSpeechRecognitionEvent;
    isRecognitionAvailable = STT.isRecognitionAvailable || (() => false);
    supportsRecording = STT.supportsRecording || (() => false);
  }
} catch {
  console.warn("Speech Recognition module not available in this environment");
}

export default function LoggingScreen() {
  // ── All existing logic preserved (no changes to any handler or state) ─────
  const router = useRouter();
  const addLog = useLogStore((state) => state.addLog);
  const [activity, setActivity] = useState("");
  const [mood, setMood] = useState<
    "focused" | "neutral" | "exhausted" | "deep_work"
  >("neutral");
  const [productivity, setProductivity] = useState(3);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [sttError, setSttError] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [useSpeechFallback, setUseSpeechFallback] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { geminiApiKey } = useSettingsStore();
  const t = useTheme();

  const [activityFocused, setActivityFocused] = useState(false);
  const [remarksFocused, setRemarksFocused] = useState(false);
  const [customEnvFocused, setCustomEnvFocused] = useState(false);

  // New fields
  const [environment, setEnvironment] = useState<string>("");
  const [customEnv, setCustomEnv] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [remarks, setRemarks] = useState<string>("");

  const { customTags } = useSettingsStore();

  useSpeechRecognitionEvent("start", () => { setLiveTranscript(""); });
  useSpeechRecognitionEvent("end", () => {});
  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript || "";
    setLiveTranscript(transcript);
  });
  useSpeechRecognitionEvent("error", (event) => {
    console.error("Speech recognition error:", event.error, event.message);
    if (event.error === "network") {
      setSttError("Network Error - Try Again");
    } else {
      setSttError(`Error: ${event.error}`);
    }
  });

  React.useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  async function playAudio() {
    if (!audioUri) return;
    if (isPlaying && sound) {
      await sound.stopAsync();
      setIsPlaying(false);
      return;
    }
    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true }
      );
      setSound(newSound);
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) setIsPlaying(false);
      });
    } catch (err) {
      console.error("Failed to play sound", err);
      setIsPlaying(false);
    }
  }

  useSpeechRecognitionEvent("audiostart", (event: any) => {
    if (event.uri) console.log("STT Audio recording started:", event.uri);
  });

  useSpeechRecognitionEvent("audioend", (event: any) => {
    if (!useSpeechFallback && event.uri) {
      setAudioUri(event.uri);
      if (liveTranscript && !activity) setActivity(liveTranscript);
    }
  });

  async function startRecording() {
    try {
      const currentAudioPerm = await Audio.getPermissionsAsync();
      let granted = currentAudioPerm.granted;
      if (!granted) {
        const res = await requestRecordingPermissionsAsync();
        granted = res.granted;
      }
      if (!granted) { console.warn("Audio permissions not granted"); return; }

      const sttAvailable = isRecognitionAvailable();
      let speechPerm = { granted: false };

      if (sttAvailable) {
        let hasSpeechPerm = false;
        try {
          if (ExpoSpeechRecognitionModule.getPermissionsAsync) {
            const currentSpeechPerm = await ExpoSpeechRecognitionModule.getPermissionsAsync();
            hasSpeechPerm = currentSpeechPerm.granted;
          }
        } catch (e) {}
        if (!hasSpeechPerm) {
          speechPerm = await ExpoSpeechRecognitionModule.requestPermissionsAsync().catch(() => ({ granted: false }));
        } else {
          speechPerm = { granted: true };
        }
      }

      if (Platform.OS !== "web") {
        setUseSpeechFallback(true);
        setSttError(null);
        setLiveTranscript("");
        await recorder.prepareToRecordAsync();
        recorder.record();
      } else {
        const canPersist = sttAvailable && supportsRecording();
        if (canPersist && speechPerm.granted) {
          setUseSpeechFallback(false);
          setSttError(null);
          ExpoSpeechRecognitionModule.start({
            lang: "en-US",
            interimResults: true,
            requiresOnDeviceRecognition: false,
            recordingOptions: { persist: true },
          });
        } else {
          setUseSpeechFallback(true);
          await recorder.prepareToRecordAsync();
          recorder.record();
        }
      }
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  }

  async function stopRecording() {
    setIsStopping(true);
    let finalUri = audioUri;
    if (useSpeechFallback) {
      try {
        await recorder.stop();
        finalUri = recorder.uri;
        setAudioUri(finalUri);
      } catch (e) { console.error("Error stopping recording:", e); }
      if (isRecognitionAvailable()) ExpoSpeechRecognitionModule.stop();
    } else {
      if (isRecognitionAvailable()) ExpoSpeechRecognitionModule.stop();
    }
    setIsStopping(false);

    if (finalUri && geminiApiKey) {
      setIsTranscribing(true);
      setSttError(null);
      try {
        const professionalTranscript = await transcribeWithGemini(finalUri, geminiApiKey);
        if (professionalTranscript) {
          if (!activity.trim() || activity === liveTranscript) setActivity(professionalTranscript);
          setLiveTranscript(professionalTranscript);
        }
      } catch (err: any) {
        console.error("Gemini transcription failed:", err);
        if (liveTranscript && !activity.trim()) setActivity(liveTranscript);
        if (!liveTranscript) setSttError("Transcription failed");
      } finally {
        setIsTranscribing(false);
      }
    } else if (liveTranscript && !activity.trim()) {
      setActivity(liveTranscript);
    }
    return finalUri;
  }

  const handleRetry = async () => {
    if (isPlaying && sound) { await sound.stopAsync(); setIsPlaying(false); }
    const wasAutoFilled = activity === liveTranscript || activity === "Voice Entry";
    setAudioUri(null);
    setSttError(null);
    if (wasAutoFilled) setActivity("");
    setLiveTranscript("");
  };

  const handleSave = async () => {
    if (isSaving || isTranscribing || isStopping) return;
    setIsSaving(true);
    try {
      let computedUri = audioUri;
      if (recorderState.isRecording) {
        computedUri = await stopRecording();
      }
      
      let stableUri = computedUri;
      if (computedUri) {
        try {
          const ext = computedUri.split('.').pop() || 'm4a';
          const dir = `${FileSystem.documentDirectory}twentifi-audio/`;
          await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
          const newUri = `${dir}log-${Date.now()}.${ext}`;
          await FileSystem.copyAsync({ from: computedUri, to: newUri });
          stableUri = newUri;
        } catch (e) {
          console.error("Failed to make audio persistent:", e);
        }
      }
      
      if (activity.trim() || stableUri) {
        const finalEnv = environment === "Custom" ? customEnv.trim() : environment;
        const finalActivity = activity.trim() || (stableUri ? "No transcript" : "");
        await addLog(
          finalActivity, 
          mood, 
          productivity, 
          stableUri,
          finalEnv || undefined,
          selectedTags.length > 0 ? selectedTags : undefined,
          remarks.trim() || undefined
        );
        const { isActive, rescheduleNextPulse } = useSessionStore.getState();
        if (isActive) {
          rescheduleNextPulse().catch((e) => console.error("Pulse reschedule failed", e));
        }
        router.back();
      } else {
        console.warn("Activity and audio are empty, not saving");
      }
    } catch (err: any) {
      useDialogStore.getState().showDialog("Save Error", "Failed to save log to database: " + (err.message || String(err)));
    } finally {
      setIsSaving(false);
    }
  };

  const isRecording = recorderState.isRecording;

  // ── Status label ──────────────────────────────────────────────────────────
  const statusLabel = isStopping
    ? "Finalizing…"
    : isTranscribing
    ? "Transcribing…"
    : sttError
    ? sttError
    : isRecording
    ? liveTranscript || "Listening…"
    : audioUri
    ? "Recorded ✓"
    : "Tap to record";

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View className={`flex-1 ${t.bg}`}>
      {/* Modal handle area */}
      <View className="items-center pt-3 pb-1">
        <View
          className="w-10 h-1 rounded-[2px]"
          style={{ backgroundColor: t.colors.border }}
        />
      </View>

      {/* Header */}
      <View className="px-6 pt-12 pb-6 flex-row justify-between items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className={`w-10 h-10 rounded-[4px] border items-center justify-center ${t.iconBtn} ${t.border}`}
        >
          <Ionicons name="close" size={20} color={t.colors.subtext} />
        </TouchableOpacity>
        <Text
          style={{ fontFamily: "Inter_700Bold", fontSize: 16 }}
          className={t.textPrimary}
        >
          Log Activity
        </Text>
        {/* Save button in header (matches Stitch design) */}
        {(() => {
          const hasContent = activity.trim().length > 0 || isRecording || audioUri !== null;
          const isBusy = isTranscribing || isStopping || isSaving;
          const isSaveDisabled = isBusy || !hasContent;
          
          return (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaveDisabled}
              className={`rounded-[4px] px-4 py-2 ${
                isSaveDisabled
                  ? `border ${t.border} opacity-40`
                  : t.btnPrimary
              }`}
            >
              <Text
                style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 1 }}
                className={`uppercase ${isSaveDisabled ? t.textSubtle : "text-white"}`}
              >
                {isSaving ? "Saving…" : isTranscribing || isStopping ? "Wait…" : "Save"}
              </Text>
            </TouchableOpacity>
          );
        })()}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
      >
        {/* ── Record button ──────────────────────────────────────────────── */}
        <View className="items-center mb-8">
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-[4px] items-center justify-center border`}
            style={{
              backgroundColor: isRecording
                ? t.colors.error
                : sttError
                ? t.colors.error
                : t.colors.card,
              borderColor: isRecording ? t.colors.error : t.colors.border,
            }}
          >
            <Ionicons
              name={isRecording ? "stop" : "mic-outline"}
              size={32}
              color={isRecording || sttError ? "white" : t.colors.text}
            />
          </TouchableOpacity>

          {/* Status label */}
          <Text
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1.5 }}
            className={`uppercase text-center mt-3 ${
              sttError ? "text-editorial-error" : t.textSubtle
            }`}
          >
            {statusLabel}
          </Text>

          {/* Playback / Retry controls */}
          {audioUri && !isRecording && (
            <View className="flex-row items-center mt-4 gap-3">
              <TouchableOpacity
                onPress={playAudio}
                className={`flex-row items-center px-4 py-2 rounded-[4px] border ${t.border}`}
                style={{ backgroundColor: t.colors.bg }}
              >
                <Ionicons
                  name={isPlaying ? "stop-outline" : "play-outline"}
                  size={14}
                  color={t.colors.subtext}
                />
                <Text
                  style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, letterSpacing: 1 }}
                  className={`${t.textSubtle} uppercase ml-2`}
                >
                  {isPlaying ? "Stop" : "Play"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleRetry}
                className={`flex-row items-center px-4 py-2 rounded-[4px] border`}
                style={{ borderColor: t.colors.error, backgroundColor: t.colors.bg }}
              >
                <Ionicons name="refresh-outline" size={14} color={t.colors.error} />
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 11,
                    letterSpacing: 1,
                    color: t.colors.error,
                  }}
                  className="uppercase ml-2"
                >
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Quick Entry text field ─────────────────────────────────────── */}
        <View className="mb-6">
          <Text
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2 }}
            className={`${t.textSubtle} uppercase mb-3`}
          >
            Quick Entry
          </Text>
          <TextInput
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 15,
              lineHeight: 24,
              borderColor: activityFocused ? "#6B8E6F" : t.colors.border,
              borderWidth: 1,
              borderRadius: 4,
              color: t.colors.textDim,
              backgroundColor: t.colors.bg,
              padding: 14,
              minHeight: 80,
            }}
            placeholder="What did you actually do?"
            placeholderTextColor={t.colors.subtext}
            value={activity}
            onChangeText={setActivity}
            multiline
            onFocus={() => setActivityFocused(true)}
            onBlur={() => setActivityFocused(false)}
          />
        </View>

        {/* ── Environment selector ───────────────────────────────────────── */}
        <View className="mb-6">
          <Text
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2 }}
            className={`${t.textSubtle} uppercase mb-3`}
          >
            Environment
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-3">
            {["Home", "Office", "Cafe", "Custom"].map((env) => (
              <TouchableOpacity
                key={env}
                onPress={() => setEnvironment(env)}
                className="items-center rounded-[4px] border px-4 py-2"
                style={{
                  borderColor: environment === env ? t.colors.green : t.colors.border,
                  backgroundColor: environment === env ? t.colors.greenLight : t.colors.card,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 12,
                    color: environment === env ? t.colors.text : t.colors.subtext,
                  }}
                >
                  {env}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {environment === "Custom" && (
            <TextInput
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                borderColor: customEnvFocused ? "#6B8E6F" : t.colors.border,
                borderWidth: 1,
                borderRadius: 4,
                color: t.colors.textDim,
                backgroundColor: t.colors.bg,
                padding: 12,
              }}
              placeholder="Where are you? (Max 10 words)"
              placeholderTextColor={t.colors.subtext}
              value={customEnv}
              onChangeText={setCustomEnv}
              onFocus={() => setCustomEnvFocused(true)}
              onBlur={() => setCustomEnvFocused(false)}
            />
          )}
        </View>

        {/* ── Tag selector ────────────────────────────────────────────────── */}
        {customTags.length > 0 && (
          <View className="mb-6">
            <Text
              style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2 }}
              className={`${t.textSubtle} uppercase mb-3`}
            >
              Tags
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {customTags.map((tag) => {
                const isActive = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => {
                      if (isActive) {
                        setSelectedTags(selectedTags.filter((t) => t !== tag));
                      } else {
                        setSelectedTags([...selectedTags, tag]);
                      }
                    }}
                    className="flex-row items-center rounded-[4px] border px-3 py-1.5"
                    style={{
                      borderColor: isActive ? t.colors.green : t.colors.border,
                      backgroundColor: isActive ? t.colors.greenLight : t.colors.card,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: "Inter_500Medium",
                        fontSize: 12,
                        color: isActive ? t.colors.text : t.colors.subtext,
                      }}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Mood selector ─────────────────────────────────────────────── */}
        <View className="mb-6">
          <Text
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2 }}
            className={`${t.textSubtle} uppercase mb-3`}
          >
            How was the vibe?
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {(
              [
                { label: "Focused", value: "focused", icon: "eye-outline" },
                { label: "Neutral", value: "neutral", icon: "happy-outline" },
                { label: "Exhausted", value: "exhausted", icon: "battery-dead-outline" },
                { label: "Deep Work", value: "deep_work", icon: "flash-outline" },
              ] as const
            ).map((item) => (
              <MoodBtn
                key={item.value}
                label={item.label}
                value={item.value}
                icon={item.icon}
                current={mood}
                set={setMood}
                t={t}
              />
            ))}
          </View>
        </View>

        {/* ── Productivity selector ─────────────────────────────────────── */}
        <View className="mb-8">
          <Text
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2 }}
            className={`${t.textSubtle} uppercase mb-3`}
          >
            Productivity Level
          </Text>
          <View className="flex-row gap-2">
            {(
              [
                { label: "Distracted", value: 1 },
                { label: "Somewhat", value: 3 },
                { label: "Productive", value: 5 },
              ] as const
            ).map((item) => (
              <ProdBtn
                key={item.value}
                label={item.label}
                value={item.value}
                current={productivity}
                set={setProductivity}
                t={t}
              />
            ))}
          </View>
        </View>

        {/* ── Remarks (P.S.) ─────────────────────────────────────────────── */}
        <View className="mb-8">
          <Text
            style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2 }}
            className={`${t.textSubtle} uppercase mb-3`}
          >
            Remarks (P.S.)
          </Text>
          <TextInput
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              borderColor: remarksFocused ? "#6B8E6F" : t.colors.border,
              borderWidth: 1,
              borderRadius: 4,
              color: t.colors.textDim,
              backgroundColor: t.colors.bg,
              padding: 12,
              minHeight: 60,
            }}
            placeholder="Any extra details you missed..."
            placeholderTextColor={t.colors.subtext}
            value={remarks}
            onChangeText={setRemarks}
            multiline
            onFocus={() => setRemarksFocused(true)}
            onBlur={() => setRemarksFocused(false)}
          />
        </View>

      </ScrollView>
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MoodBtn({ label, value, icon, current, set, t }: any) {
  const active = current === value;
  return (
    <TouchableOpacity
      onPress={() => set(value)}
      className="items-center rounded-[4px] border px-4 py-3"
      style={{
        borderColor: active ? t.colors.green : t.colors.border,
        backgroundColor: active ? t.colors.greenLight : t.colors.card,
      }}
    >
      <Ionicons
        name={icon}
        size={20}
        color={active ? t.colors.text : t.colors.subtext}
      />
      <Text
        style={{
          fontFamily: "Inter_600SemiBold",
          fontSize: 10,
          letterSpacing: 1,
          marginTop: 6,
          color: active ? t.colors.text : t.colors.subtext,
        }}
        className="uppercase"
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ProdBtn({ label, value, current, set, t }: any) {
  const active = current === value;
  return (
    <TouchableOpacity
      onPress={() => set(value)}
      className="flex-1 py-3 rounded-[4px] items-center border"
      style={{
        borderColor: active ? t.colors.green : t.colors.border,
        backgroundColor: active ? t.colors.greenLight : t.colors.card,
      }}
    >
      <Text
        style={{
          fontFamily: "Inter_600SemiBold",
          fontSize: 12,
          color: active ? t.colors.text : t.colors.subtext,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
