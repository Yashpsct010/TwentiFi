import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

// Check if running in Expo Go
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export async function requestPermissions() {
  if (Platform.OS === "web") return false;

  // Silently skip if in Expo Go to avoid SDK-level warnings/errors for push
  if (isExpoGo) {
    console.log("[Notifications] Skipping push permission request in Expo Go. Use a development build for full features.");
    // We can still request local notification permissions if needed
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

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: content?.title || "Time to log!",
        body: content?.body || "20 minutes done. What did you actually do?",
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

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: content?.title || "Still there?",
        body: content?.body || "You ghosted your log. What happened?",
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
