import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';
import * as Notifications from 'expo-notifications';
import React from 'react';
import { initDB } from '@/services/database';
import { useLogStore } from '@/store/logStore';
import { View } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { useSettingsStore } from '@/store/settingsStore';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const { hasCompletedOnboarding, theme } = useSettingsStore();

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Initialize DB and load logs
  React.useEffect(() => {
    const setup = async () => {
      try {
        await initDB();
        await useLogStore.getState().loadLogs();
      } catch (error) {
        console.error('Failed to initialize app data:', error);
      }
    };
    setup();
  }, []);

  // Navigate to Logging screen when a notification is tapped
  React.useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.type === 'log_prompt' || data?.type === 'reminder') {
        router.push('/logging' as any);
      }
    });
    return () => subscription.remove();
  }, []);

  // Redirect to onboarding if not completed
  React.useEffect(() => {
    if (!hasCompletedOnboarding) {
      setTimeout(() => {
        router.replace('/onboarding');
      }, 0);
    }
  }, [hasCompletedOnboarding]);

  // Wait for fonts before rendering
  if (!fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme === 'dark' ? '#0D0B1F' : '#FAFAF8',
        }}
      />
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="logging" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
