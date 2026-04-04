import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettingsStore } from "@/store/settingsStore";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const theme = useSettingsStore((s) => s.theme);
  const isDark = theme === "dark";

  const paddingBottom = Math.max(10, insets.bottom);
  const height = 56 + paddingBottom;

  // Vellum Ledger tab bar tokens
  const tabBarBg = isDark ? "#0D0B1F" : "#FAFAF8";
  const activeColor = isDark ? "#8B5CF6" : "#1A1A1A";
  const inactiveColor = isDark ? "#6B6882" : "#B0ABA4";  // dimmer = more contrast vs active
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#D9D5CE";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopWidth: 1,
          borderTopColor: borderColor,
          elevation: 0,
          shadowOpacity: 0,
          height,
          paddingBottom,
        },
        tabBarLabelStyle: {
          fontFamily: "Inter_600SemiBold",
          fontSize: 10,
          letterSpacing: 0.5,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="timeline"
        options={{
          title: "Timeline",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
