import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/use-theme";
import { useSessionStore } from "@/store/sessionStore";
import {
  useScheduleStore,
  ScheduleItem,
  timeToMinutes,
  formatDuration,
} from "@/store/scheduleStore";

interface TodayDocketProps {
  onOpenPlanner: () => void;
}

export default function TodayDocket({ onOpenPlanner }: TodayDocketProps) {
  const t = useTheme();
  const { startSession } = useSessionStore();
  const {
    items,
    toggleComplete,
    shiftSchedule,
    checkAndResetForNewDay,
  } = useScheduleStore();

  const [currentTimeMinutes, setCurrentTimeMinutes] = useState(() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  });

  const [currentTimeFormatted, setCurrentTimeFormatted] = useState(() => {
    const d = new Date();
    const hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayHours}:${minutes} ${ampm}`;
  });

  const [isShifting, setIsShifting] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    checkAndResetForNewDay();

    const interval = setInterval(() => {
      const d = new Date();
      setCurrentTimeMinutes(d.getHours() * 60 + d.getMinutes());
      const hours = d.getHours();
      const minutes = d.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 === 0 ? 12 : hours % 12;
      setCurrentTimeFormatted(`${displayHours}:${minutes} ${ampm}`);
    }, 15000); // Check every 15s

    return () => clearInterval(interval);
  }, []);

  const handleStartPulse = (item: ScheduleItem) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    startSession([item.title], item.milestoneId);
  };

  const handleToggle = (id: string, currentlyCompleted: boolean) => {
    if (!currentlyCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleComplete(id);
  };

  const handleShift = async (mins: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsShifting(true);
    try {
      await shiftSchedule(mins);
    } finally {
      setIsShifting(false);
    }
  };

  // Find active block
  // 1. Task currently within start and end time that isn't completed
  // 2. Or the first uncompleted task
  const activeItemIndex = items.findIndex((item) => {
    if (item.isCompleted) return false;
    const startMins = timeToMinutes(item.startTime);
    const endMins = timeToMinutes(item.endTime);
    return currentTimeMinutes >= startMins && currentTimeMinutes < endMins;
  });

  const resolvedActiveIndex =
    activeItemIndex !== -1
      ? activeItemIndex
      : items.findIndex((item) => !item.isCompleted);

  const formattedDate = new Date()
    .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    .toUpperCase();

  const totalTasks = items.length;
  const completedTasks = items.filter((i) => i.isCompleted).length;

  return (
    <View className={`${t.cardBg} border ${t.border} rounded-[6px] p-4 mb-6`}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="calendar-outline" size={14} color={t.colors.subtext} />
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 10,
              letterSpacing: 1.5,
            }}
            className={`${t.textSubtle} uppercase`}
          >
            TODAY'S DOCKET • {formattedDate}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onOpenPlanner}
          className="flex-row items-center px-2 py-1 rounded-[4px] border"
          style={{
            borderColor: t.colors.border,
            backgroundColor: t.colors.bg,
          }}
        >
          <Ionicons name="sparkles" size={12} color={t.colors.green} />
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 10,
              letterSpacing: 1,
              color: t.colors.text,
              marginLeft: 4,
            }}
          >
            BLUEPRINT
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Empty State ──────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <View
          className="p-6 rounded-[4px] border items-center justify-center my-2"
          style={{
            borderStyle: "dashed",
            borderColor: t.colors.border,
            backgroundColor: t.colors.bg,
          }}
        >
          <Ionicons name="time-outline" size={28} color={t.colors.subtext} />
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 14,
              color: t.colors.text,
              marginTop: 8,
              textAlign: "center",
            }}
          >
            No items in today's docket
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              color: t.colors.subtext,
              marginTop: 4,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Draft your daily schedule with AI in seconds.
          </Text>
          <TouchableOpacity
            onPress={onOpenPlanner}
            className="rounded-[4px] px-4 py-2 flex-row items-center"
            style={{ backgroundColor: t.colors.text }}
          >
            <Ionicons
              name="sparkles-outline"
              size={14}
              color={t.isDark ? "#0D0B1F" : "#FAFAF8"}
            />
            <Text
              style={{
                fontFamily: "Inter_700Bold",
                fontSize: 11,
                letterSpacing: 1,
                color: t.isDark ? "#0D0B1F" : "#FAFAF8",
                marginLeft: 6,
              }}
              className="uppercase"
            >
              Draft Blueprint
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* ── Day Burn Continuous Timeline ────────────────────────────────── */
        <View className="mb-2">
          {items.map((item, index) => {
            const isCompleted = item.isCompleted;
            const isActive = index === resolvedActiveIndex && !isCompleted;
            const isFirst = index === 0;
            const isLast = index === items.length - 1;

            // Show NOW marker right above the active block or before the first upcoming block
            const showNowMarker =
              index === resolvedActiveIndex && !isCompleted;

            return (
              <View key={item.id}>
                {/* ── The "NOW" Fire Marker ─────────────────────────────── */}
                {showNowMarker && (
                  <View className="flex-row items-center my-2 pl-1">
                    <View
                      className="flex-row items-center px-2 py-1 rounded-[4px] border"
                      style={{
                        backgroundColor: t.isDark
                          ? "rgba(166, 69, 66, 0.20)"
                          : "#FDF4F4",
                        borderColor: "#E09895",
                      }}
                    >
                      {!imageError ? (
                        <Image
                          source={{
                            uri: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f525/512.gif",
                          }}
                          style={{ width: 14, height: 14, marginRight: 5 }}
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <Ionicons
                          name="flame"
                          size={13}
                          color="#A64542"
                          style={{ marginRight: 4 }}
                        />
                      )}
                      <Text
                        style={{
                          fontFamily: "Inter_700Bold",
                          fontSize: 9,
                          letterSpacing: 1,
                          color: "#A64542",
                        }}
                      >
                        NOW • {currentTimeFormatted}
                      </Text>
                    </View>
                    <View
                      className="flex-1 ml-2"
                      style={{
                        height: 1,
                        backgroundColor: "#E09895",
                      }}
                    />
                  </View>
                )}

                {/* ── Timeline Item Row ──────────────────────────────────── */}
                <View className="flex-row">
                  {/* Spine Column */}
                  <View className="items-center w-7 mr-2">
                    {/* Upper Spine Segment */}
                    <View
                      style={{
                        width: 2,
                        height: 10,
                        backgroundColor: isFirst
                          ? "transparent"
                          : isCompleted
                          ? t.colors.green
                          : t.colors.border,
                      }}
                    />

                    {/* Checkmark / Status Marker */}
                    <TouchableOpacity
                      onPress={() => handleToggle(item.id, isCompleted)}
                      activeOpacity={0.7}
                      className="w-5 h-5 rounded-[3px] border items-center justify-center"
                      style={{
                        borderColor: isCompleted
                          ? t.colors.green
                          : isActive
                          ? t.colors.green
                          : t.colors.border,
                        backgroundColor: isCompleted
                          ? t.colors.green
                          : isActive
                          ? t.colors.greenLight
                          : t.colors.bg,
                      }}
                    >
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={13} color="#FFFFFF" />
                      ) : isActive ? (
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 1,
                            backgroundColor: t.colors.green,
                          }}
                        />
                      ) : (
                        <View
                          style={{
                            width: 4,
                            height: 4,
                            borderRadius: 1,
                            backgroundColor: t.colors.subtext,
                          }}
                        />
                      )}
                    </TouchableOpacity>

                    {/* Lower Spine Segment */}
                    <View
                      style={{
                        width: 2,
                        flex: 1,
                        backgroundColor: isLast
                          ? "transparent"
                          : isCompleted
                          ? t.colors.green
                          : t.colors.border,
                        borderStyle: !isCompleted ? "dashed" : "solid",
                      }}
                    />
                  </View>

                  {/* Task Content Column */}
                  <View className="flex-1 pb-4">
                    {isActive ? (
                      /* ── Active Focus Block ───────────────────────────── */
                      <View
                        className="rounded-[4px] p-3.5 border"
                        style={{
                          borderColor: t.colors.green,
                          borderWidth: 1.5,
                          backgroundColor: t.colors.bg,
                        }}
                      >
                        {/* Meta Header */}
                        <View className="flex-row items-center justify-between mb-1.5">
                          <View className="flex-row items-center gap-1.5">
                            {/* 24h Time Badge */}
                            <View
                              className="px-1.5 py-0.5 rounded-[2px]"
                              style={{
                                backgroundColor: t.isDark
                                  ? "rgba(255,255,255,0.08)"
                                  : "#EAE6DE",
                              }}
                            >
                              <Text
                                style={{
                                  fontFamily: "Inter_600SemiBold",
                                  fontSize: 10,
                                  letterSpacing: 0.5,
                                  color: t.colors.text,
                                }}
                              >
                                {item.startTime} — {item.endTime}
                              </Text>
                            </View>

                            {/* Duration Chip */}
                            <Text
                              style={{
                                fontFamily: "Inter_400Regular",
                                fontSize: 10,
                                color: t.colors.subtext,
                              }}
                            >
                              {formatDuration(item.durationMinutes)}
                            </Text>
                          </View>

                          {/* Category Chip */}
                          <View
                            className="px-1.5 py-0.5 rounded-[2px]"
                            style={{
                              backgroundColor:
                                item.category === "target"
                                  ? t.colors.brown + "25"
                                  : item.category === "habit"
                                  ? t.colors.green + "25"
                                  : t.colors.text + "15",
                            }}
                          >
                            <Text
                              style={{
                                fontFamily: "Inter_600SemiBold",
                                fontSize: 8,
                                letterSpacing: 1,
                                color:
                                  item.category === "target"
                                    ? t.colors.brown
                                    : item.category === "habit"
                                    ? t.colors.green
                                    : t.colors.text,
                              }}
                              className="uppercase"
                            >
                              {item.category}
                            </Text>
                          </View>
                        </View>

                        {/* Title */}
                        <Text
                          style={{
                            fontFamily: "Inter_700Bold",
                            fontSize: 15,
                            color: t.colors.text,
                            marginBottom: 10,
                          }}
                        >
                          {item.title}
                        </Text>

                        {/* Primary Start Pulse Button */}
                        <TouchableOpacity
                          onPress={() => handleStartPulse(item)}
                          className="rounded-[4px] py-2.5 px-3 items-center flex-row justify-center"
                          style={{ backgroundColor: t.colors.text }}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name="play"
                            size={13}
                            color={t.isDark ? "#0D0B1F" : "#FAFAF8"}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={{
                              fontFamily: "Inter_700Bold",
                              fontSize: 11,
                              letterSpacing: 1.5,
                              color: t.isDark ? "#0D0B1F" : "#FAFAF8",
                            }}
                            className="uppercase"
                          >
                            Start 20m Focus Pulse
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      /* ── Regular / Completed Block ─────────────────────── */
                      <TouchableOpacity
                        onPress={() => handleToggle(item.id, isCompleted)}
                        activeOpacity={0.7}
                        className="rounded-[4px] px-3 py-2 border flex-row items-center justify-between"
                        style={{
                          backgroundColor: isCompleted
                            ? t.isDark
                              ? "rgba(255,255,255,0.02)"
                              : "#F3EFE9"
                            : t.colors.bg,
                          borderColor: t.colors.border,
                        }}
                      >
                        <View className="flex-1 mr-2">
                          <View className="flex-row items-center gap-1.5 mb-0.5">
                            <Text
                              style={{
                                fontFamily: "Inter_600SemiBold",
                                fontSize: 10,
                                letterSpacing: 0.5,
                                color: isCompleted
                                  ? t.colors.subtext
                                  : t.colors.textDim,
                              }}
                            >
                              {item.startTime}
                            </Text>
                            <Text
                              style={{
                                fontFamily: "Inter_400Regular",
                                fontSize: 10,
                                color: t.colors.subtext,
                              }}
                            >
                              • {formatDuration(item.durationMinutes)}
                            </Text>
                          </View>

                          <Text
                            style={{
                              fontFamily: isCompleted
                                ? "Inter_400Regular"
                                : "Inter_600SemiBold",
                              fontSize: 13,
                              color: isCompleted
                                ? t.colors.subtext
                                : t.colors.text,
                              textDecorationLine: isCompleted
                                ? "line-through"
                                : "none",
                            }}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                        </View>

                        {/* Category Chip */}
                        <View
                          className="px-1.5 py-0.5 rounded-[2px]"
                          style={{
                            backgroundColor:
                              item.category === "target"
                                ? t.colors.brown + "20"
                                : item.category === "habit"
                                ? t.colors.green + "20"
                                : t.colors.text + "10",
                            opacity: isCompleted ? 0.6 : 1,
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: "Inter_600SemiBold",
                              fontSize: 8,
                              letterSpacing: 1,
                              color:
                                item.category === "target"
                                  ? t.colors.brown
                                  : item.category === "habit"
                                  ? t.colors.green
                                  : t.colors.text,
                            }}
                            className="uppercase"
                          >
                            {item.category}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Footer Actions ──────────────────────────────────────────────── */}
      <View
        className="flex-row items-center justify-between pt-2"
        style={{
          borderTopWidth: 1,
          borderTopColor: t.colors.border,
        }}
      >
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 11,
            color: t.colors.subtext,
          }}
        >
          {completedTasks}/{totalTasks} completed
        </Text>

        <TouchableOpacity
          onPress={() => handleShift(30)}
          disabled={isShifting || items.length === 0}
          className="flex-row items-center px-3 py-1.5 rounded-[4px] border"
          style={{
            borderColor: t.colors.border,
            backgroundColor: t.colors.bg,
            opacity: items.length === 0 ? 0.5 : 1,
          }}
        >
          {isShifting ? (
            <ActivityIndicator size="small" color={t.colors.text} />
          ) : (
            <>
              <Ionicons
                name="play-forward-outline"
                size={12}
                color={t.colors.text}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 10,
                  letterSpacing: 0.5,
                  color: t.colors.text,
                }}
              >
                Shift Day +30m
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
