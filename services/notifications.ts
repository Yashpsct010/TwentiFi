import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { useSettingsStore } from "@/store/settingsStore";
import { generateNotificationContent } from "./gemini";

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const LOG_NOTIFICATIONS = [
  { title: "Pulse Check! ✌️", body: "What's the move? Log your last session, bestie." },
  { title: "Vibe Check ⏱️", body: "20 mins are up! What did you actually get done?" },
  { title: "Spill the tea ☕", body: "Time to log your progress. Don't ghost your goals!" },
  { title: "Main Character Energy 🌟", body: "Update your log! Are we winning right now?" },
  { title: "No cap, time to log 🧢", body: "Keep it 100. Drop your latest update." },
  { title: "W or L? 🎮", body: "20 minutes down. Is this session a W or an L?" },
  { title: "Locked in? 🔒", body: "Let's see that productivity drop." }
];

const REMINDER_NOTIFICATIONS = [
  { title: "Still there? 💀", body: "The grind don't stop, but your logs did. Come back!" },
  { title: "Bro, you ghosted? 👻", body: "We need that log update ASAP." },
  { title: "Hello? 🎤", body: "Is this thing on? We are missing your log." },
  { title: "Don't sell the bag 💰", body: "You missed a pulse. Get back in the zone!" },
  { title: "Bruh... 🤦‍♂️", body: "We're waiting on your update. Let's get it." }
];

export function getRandomLogNotification() {
  return LOG_NOTIFICATIONS[Math.floor(Math.random() * LOG_NOTIFICATIONS.length)];
}

export function getRandomReminderNotification() {
  return REMINDER_NOTIFICATIONS[Math.floor(Math.random() * REMINDER_NOTIFICATIONS.length)];
}

export async function requestPermissions() {
  if (Platform.OS === "web") return false;

  // Silently skip if in Expo Go to avoid SDK-level warnings/errors for push
  if (isExpoGo) {
    console.log("[Notifications] Skipping push permission request in Expo Go. Use a development build for full features.");
    // We can still request local notification permissions if needed
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Logs & Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#8B5CF6',
    });
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    return finalStatus === "granted";
  } catch (e) {
    console.warn("Failed to get notification permissions:", e);
    return false;
  }
}

export async function scheduleLoggingNotification(
  intervalMinutes: number = 20,
  content?: { title: string; body: string }
) {
  if (Platform.OS === "web") return; // Skip notifications on web

  let notificationContent = content || getRandomLogNotification();
  if (!content) {
    const { geminiApiKey } = useSettingsStore.getState();
    if (geminiApiKey) {
      try {
        notificationContent = await generateNotificationContent(geminiApiKey, 'log_prompt');
      } catch (e) {
        console.warn("Gemini notification generation failed, using fallback.");
      }
    }
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationContent.title,
        body: notificationContent.body,
        data: { type: "log_prompt" },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: intervalMinutes * 60,
        repeats: true,
      },
    });
  } catch (error) {
    console.warn("Failed to schedule notification:", error);
  }
}

export async function scheduleReminderNotification(
  delayMinutes: number = 5,
  content?: { title: string; body: string }
) {
  if (Platform.OS === "web") return; // Skip notifications on web

  let notificationContent = content || getRandomReminderNotification();
  if (!content) {
    const { geminiApiKey } = useSettingsStore.getState();
    if (geminiApiKey) {
      try {
        notificationContent = await generateNotificationContent(geminiApiKey, 'reminder');
      } catch (e) {
        console.warn("Gemini notification reminder generation failed, using fallback.");
      }
    }
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notificationContent.title,
        body: notificationContent.body,
        data: { type: "reminder" },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delayMinutes * 60,
        repeats: false,
      },
    });
  } catch (error) {
    console.warn("Failed to schedule reminder:", error);
  }
}

export async function cancelAllScheduledNotificationsAsync() {
  if (Platform.OS === "web") return; // Skip on web

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.warn("Failed to cancel notifications:", error);
  }
}
