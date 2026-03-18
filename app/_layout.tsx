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

import { useColorScheme } from '@/hooks/use-color-scheme';

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
  const colorScheme = useColorScheme();

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="logging" options={{ presentation: 'modal', headerShown: false }} />
          
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
