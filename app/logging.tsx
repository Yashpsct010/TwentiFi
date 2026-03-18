import { transcribeWithSarvam } from "@/services/sarvam";
import { useLogStore } from "@/store/logStore";
import { useSessionStore } from "@/store/sessionStore";
import { useSettingsStore } from "@/store/settingsStore";
import { Ionicons } from "@expo/vector-icons";
import { 
  useAudioRecorder, 
  useAudioRecorderState, 
  RecordingPresets, 
  requestRecordingPermissionsAsync 
} from "expo-audio";
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

// Safe access to native modules that might be missing in Expo Go
let ExpoSpeechRecognitionModule: any = null;
let useSpeechRecognitionEvent: (
  event: string,
  callback: (event: any) => void,
) => void = () => {};
let isRecognitionAvailable: () => boolean = () => false;
let supportsRecording: () => boolean = () => false;

try {
  // We use require to avoid top-level crash in Expo Go
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
  const router = useRouter();
  const addLog = useLogStore((state) => state.addLog);
  const [activity, setActivity] = useState("");
  const [mood, setMood] = useState<
    "focused" | "neutral" | "exhausted" | "deep_work"
  >("neutral");
  const [productivity, setProductivity] = useState(3);

  // Expo Audio 1.x logic
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [sttError, setSttError] = useState<string | null>(null);
  const [useSpeechFallback, setUseSpeechFallback] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const { sarvamApiKey } = useSettingsStore();

  // Speech Recognition Events
  useSpeechRecognitionEvent("start", () => {
    setLiveTranscript("");
  });

  useSpeechRecognitionEvent("end", () => {
    // End is handled by status listeners
  });

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

  useSpeechRecognitionEvent("audiostart", (event: any) => {
    if (event.uri) {
      console.log("STT Audio recording started:", event.uri);
    }
  });

  useSpeechRecognitionEvent("audioend", (event: any) => {
    if (!useSpeechFallback && event.uri) {
      setAudioUri(event.uri);
      if (liveTranscript && !activity) {
        setActivity(liveTranscript);
      }
    }
  });

  async function startRecording() {
    try {
      console.log("Requesting permissions..");
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        console.warn("Audio permissions not granted");
        return;
      }

      const sttAvailable = isRecognitionAvailable();
      let speechPerm = { granted: false };

      if (sttAvailable) {
        speechPerm =
          await ExpoSpeechRecognitionModule.requestPermissionsAsync().catch(
            () => ({ granted: false }),
          );
      }

      // ON NATIVE: Use expo-audio for the actual recording
      if (Platform.OS !== "web") {
        setUseSpeechFallback(true);
        setSttError(null);
        setLiveTranscript("");

        await recorder.prepareToRecordAsync();
        recorder.record();
        
        console.log("Recording started on Native with expo-audio.");
      }
      // ON WEB:
      else {
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
    console.log("Stopping recording..");
    setIsStopping(true);

    let finalUri = audioUri;

    if (useSpeechFallback) {
      try {
        await recorder.stop(); // Correct method name for expo-audio 1.x
        finalUri = recorder.uri;
        setAudioUri(finalUri);
        console.log("Recording stopped and saved to:", finalUri);
      } catch (e) {
        console.error("Error stopping recording:", e);
      }
      
      if (isRecognitionAvailable()) {
        ExpoSpeechRecognitionModule.stop();
      }
    } else {
      if (isRecognitionAvailable()) {
        ExpoSpeechRecognitionModule.stop();
      }
    }

    setIsStopping(false);

    // After stopping, if we have a URI and an API key, get a premium transcript
    if (finalUri && sarvamApiKey) {
      setIsTranscribing(true);
      setSttError(null);
      try {
        const professionalTranscript = await transcribeWithSarvam(
          finalUri,
          sarvamApiKey,
        );
        if (professionalTranscript) {
          if (!activity.trim() || activity === liveTranscript) {
            setActivity(professionalTranscript);
          }
          setLiveTranscript(professionalTranscript);
        }
      } catch (err: any) {
        console.error("Sarvam transcription failed:", err);
        if (liveTranscript && !activity.trim()) {
          setActivity(liveTranscript);
        }
        if (!liveTranscript) {
          setSttError("Transcription failed");
        }
      } finally {
        setIsTranscribing(false);
      }
    } else if (liveTranscript && !activity.trim()) {
      setActivity(liveTranscript);
    }
  }

  const handleRetry = () => {
    const wasAutoFilled =
      activity === liveTranscript || activity === "Voice Entry";
    setAudioUri(null);
    setSttError(null);
    if (wasAutoFilled) {
      setActivity("");
    }
    setLiveTranscript("");
  };

  const handleSave = async () => {
    if (recorderState.isRecording) {
      console.log("Still recording, auto-stopping before save...");
      await stopRecording();
    }

    if (activity.trim() || audioUri) {
      await addLog(activity || "Voice Entry", mood, productivity, audioUri);

      const { isActive, rescheduleNextPulse } = useSessionStore.getState();
      if (isActive) {
        await rescheduleNextPulse();
      }

      router.back();
    } else {
      console.warn("Activity and audio are empty, not saving");
    }
  };

  const isRecording = recorderState.isRecording;

  return (
    <View className="flex-1 bg-brand-bg pt-12">
      <View className="px-6 mb-8 flex-row justify-between items-center">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white uppercase tracking-widest">
          Logging
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View className="items-center mb-12">
          <View className="w-40 h-40 rounded-full bg-brand-purple/10 items-center justify-center border border-brand-purple/20">
            <TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              className={`w-32 h-32 rounded-full items-center justify-center shadow-2xl ${isRecording ? "bg-red-500 shadow-red-500/50" : "bg-brand-purple shadow-brand-purple/50"}`}
            >
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={48}
                color="white"
              />
            </TouchableOpacity>
          </View>
          <Text
            className={`font-black mt-6 tracking-widest uppercase text-center ${sttError ? "text-red-500" : "text-brand-purple"}`}
          >
            {isStopping
              ? "FINALIZING..."
              : isTranscribing
                ? "TRANSCRIBING..."
                : sttError
                  ? sttError
                  : isRecording
                    ? liveTranscript || "LISTENING..."
                    : audioUri
                      ? "RECORDED ✓"
                      : "TAP TO RECORD"}
          </Text>
          {audioUri && !isRecording && (
            <TouchableOpacity
              onPress={handleRetry}
              className="mt-4 px-6 py-2 rounded-full border border-red-500/30 bg-red-500/5 flex-row items-center"
            >
              <Ionicons name="refresh" size={14} color="#F87171" />
              <Text className="text-red-400 text-[10px] font-black uppercase tracking-[2px] ml-2">
                Retry Recording
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="px-6 space-y-8">
          <View>
            <Text className="text-brand-subtext text-xs font-bold uppercase mb-4 tracking-[3px]">
              Quick Entry
            </Text>
            <View className="bg-brand-card p-5 rounded-[24px] border border-white/5 flex-row items-center">
              <Ionicons name="text-outline" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 text-white ml-3 text-lg"
                placeholder="What did you actually do?"
                placeholderTextColor="#4B5563"
                value={activity}
                onChangeText={setActivity}
              />
            </View>
          </View>

          <View className="mt-8">
            <Text className="text-brand-subtext text-xs font-bold uppercase mb-4 tracking-[3px]">
              How was the vibe?
            </Text>
            <View className="flex-row flex-wrap gap-4">
              <MoodBtn
                label="Focused"
                value="focused"
                current={mood}
                set={setMood}
                icon="eye"
              />
              <MoodBtn
                label="Neutral"
                value="neutral"
                current={mood}
                set={setMood}
                icon="happy"
              />
              <MoodBtn
                label="Exhausted"
                value="exhausted"
                current={mood}
                set={setMood}
                icon="battery-dead"
              />
              <MoodBtn
                label="Deep Work"
                value="deep_work"
                current={mood}
                set={setMood}
                icon="flash"
              />
            </View>
          </View>

          <View className="mt-8">
            <Text className="text-brand-subtext text-xs font-bold uppercase mb-4 tracking-[3px]">
              Productivity
            </Text>
            <View className="flex-row gap-2">
              <ProdBtn
                label="Distracted"
                value={1}
                current={productivity}
                set={setProductivity}
                color="#EF4444"
              />
              <ProdBtn
                label="Somewhat"
                value={3}
                current={productivity}
                set={setProductivity}
                color="#F59E0B"
              />
              <ProdBtn
                label="Productive"
                value={5}
                current={productivity}
                set={setProductivity}
                color="#8B5CF6"
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSave}
            className="bg-brand-purple p-5 rounded-full items-center mt-12 shadow-2xl shadow-brand-purple/50 flex-row justify-center"
          >
            <View className="mr-3">
              <Ionicons name="paper-plane" size={20} color="white" />
            </View>
            <Text className="text-white font-black text-lg ml-3">
              SAVE LOG ENTRY
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

function ProdBtn({ label, value, current, set, color }: any) {
  const active = current === value;
  return (
    <TouchableOpacity
      onPress={() => set(value)}
      className={`flex-1 py-4 rounded-2xl items-center border ${active ? "border-brand-purple bg-brand-purple/10" : "border-white/5 bg-brand-card"}`}
    >
      <Text
        className={`font-bold ${active ? "text-white" : "text-brand-subtext"}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MoodBtn({ label, value, current, set, icon }: any) {
  const active = current === value;
  return (
    <TouchableOpacity
      onPress={() => set(value)}
      className={`items-center px-5 py-4 rounded-[20px] border ${active ? "bg-brand-purple/20 border-brand-purple shadow-glow" : "bg-brand-card border-white/5"}`}
    >
      <Ionicons name={icon} size={24} color={active ? "#8B5CF6" : "#4B5563"} />
      <Text
        className={`mt-2 text-[10px] font-bold uppercase tracking-widest ${active ? "text-white" : "text-brand-subtext"}`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}
