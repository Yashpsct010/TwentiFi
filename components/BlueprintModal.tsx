import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/hooks/use-theme";
import { useSettingsStore } from "@/store/settingsStore";
import { useMilestoneStore } from "@/store/milestoneStore";
import { useMembership } from "@/hooks/use-membership";
import { useDialogStore } from "@/store/dialogStore";
import { generateScheduleBlueprint } from "@/services/aiGateway";
import {
  useScheduleStore,
  ScheduleItem,
  ScheduleCategory,
  getTodayDateString,
  getTomorrowDateString,
  cascadeScheduleItems,
  formatDuration,
  calculateEndTime,
} from "@/store/scheduleStore";

interface BlueprintModalProps {
  visible: boolean;
  onClose: () => void;
  initialMode?: "tomorrow" | "today";
}

const genId = () => Math.random().toString(36).substring(2, 11);

export default function BlueprintModal({
  visible,
  onClose,
  initialMode = "tomorrow",
}: BlueprintModalProps) {
  const t = useTheme();
  const { startOfDay, endOfDay, geminiApiKey } = useSettingsStore();
  const { isPulsePlus } = useMembership();
  const { milestones } = useMilestoneStore();
  const { items: currentDocket, commitBlueprint } = useScheduleStore();

  const [mode, setMode] = useState<"tomorrow" | "today">(initialMode);
  const [promptText, setPromptText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [draftItems, setDraftItems] = useState<ScheduleItem[]>([]);
  const [newTitle, setNewTitle] = useState("");

  const targetDate =
    mode === "tomorrow" ? getTomorrowDateString() : getTodayDateString();

  // Initialize draft when modal opens
  useEffect(() => {
    if (visible) {
      setMode(initialMode);
      setPromptText("");
      setNewTitle("");

      if (initialMode === "today" && currentDocket.length > 0) {
        // Clone current docket for rebalancing
        setDraftItems(currentDocket.map((item) => ({ ...item })));
      } else {
        // Create an initial template based on user's workday
        const baseItems: ScheduleItem[] = [
          {
            id: genId(),
            title: "Morning Planning & Review",
            startTime: startOfDay || "09:00",
            endTime: calculateEndTime(startOfDay || "09:00", 30),
            durationMinutes: 30,
            category: "focus",
            isCompleted: false,
          },
          {
            id: genId(),
            title: "Core Priority Sprint",
            startTime: calculateEndTime(startOfDay || "09:00", 30),
            endTime: calculateEndTime(calculateEndTime(startOfDay || "09:00", 30), 90),
            durationMinutes: 90,
            category: "target",
            isCompleted: false,
          },
        ];
        setDraftItems(cascadeScheduleItems(baseItems));
      }
    }
  }, [visible, initialMode]);

  // Context Switcher handler
  const handleToggleMode = (newMode: "tomorrow" | "today") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode(newMode);
    if (newMode === "today" && currentDocket.length > 0) {
      setDraftItems(currentDocket.map((item) => ({ ...item })));
    }
  };

  // Build active milestones summary
  const getActiveMilestonesSummary = (): string => {
    const active = milestones.filter((m) => !m.isCompleted);
    if (active.length === 0) return "";
    return active
      .map((m) => {
        const pending = m.tasks
          .filter((t) => t.status !== "completed")
          .map((t) => t.text)
          .join(", ");
        return `- [${m.type.toUpperCase()}] ${m.title}${
          pending ? ` (Tasks: ${pending})` : ""
        }`;
      })
      .join("\n");
  };

  // Generate with AI
  const handleGenerateAI = async (overridePrompt?: string) => {
    const effectivePrompt = (overridePrompt ?? promptText).trim();

    if (!geminiApiKey && !isPulsePlus) {
      useDialogStore.getState().showDialog(
        "Gemini Key Required",
        "Add your Gemini API key in Settings or upgrade to Pulse+ to use AI Blueprint generation."
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGenerating(true);

    try {
      const activeSummary = getActiveMilestonesSummary();
      const generated = await generateScheduleBlueprint({
        userPrompt: effectivePrompt,
        targetDate,
        contextType: mode,
        activeMilestonesSummary: activeSummary,
        workdayStart: startOfDay || "09:00",
        workdayEnd: endOfDay || "21:00",
      });

      const converted: ScheduleItem[] = generated.map((raw) => ({
        id: genId(),
        title: raw.title,
        startTime: raw.startTime,
        endTime: raw.endTime || calculateEndTime(raw.startTime, raw.durationMinutes),
        durationMinutes: raw.durationMinutes,
        category: raw.category,
        isCompleted: false,
      }));

      const cascaded = cascadeScheduleItems(converted);
      setDraftItems(cascaded);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.warn("AI blueprint generation failed, falling back to local synthesis:", err);
      // Intelligent fallback synthesis from milestones
      fallbackSynthesize();
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-Draft from Active Milestones & Habits shortcut
  const handleAutoDraftFromMilestones = () => {
    handleGenerateAI("Auto-draft a balanced day from my active milestones, habits, and focus targets.");
  };

  // Fallback synthesizer when offline or API call unavailable
  const fallbackSynthesize = () => {
    const active = milestones.filter((m) => !m.isCompleted);
    let start = startOfDay || "09:00";
    const synthesized: ScheduleItem[] = [];

    // Add kickoff
    synthesized.push({
      id: genId(),
      title: "Daily Standup & Docket Review",
      startTime: start,
      endTime: calculateEndTime(start, 30),
      durationMinutes: 30,
      category: "focus",
      isCompleted: false,
    });

    if (active.length > 0) {
      active.slice(0, 4).forEach((m) => {
        const pendingTask = m.tasks.find((t) => t.status !== "completed");
        const title = pendingTask
          ? `${m.title}: ${pendingTask.text}`
          : m.title;
        synthesized.push({
          id: genId(),
          title,
          startTime: "00:00", // Will be cascaded
          endTime: "00:00",
          durationMinutes: m.type === "habit" ? 30 : 90,
          category: m.type === "habit" ? "habit" : "target",
          milestoneId: m.id,
          isCompleted: false,
        });
      });
    } else {
      synthesized.push({
        id: genId(),
        title: "Deep Work Sprint",
        startTime: "00:00",
        endTime: "00:00",
        durationMinutes: 90,
        category: "target",
        isCompleted: false,
      });
      synthesized.push({
        id: genId(),
        title: "Health & Habit Reset",
        startTime: "00:00",
        endTime: "00:00",
        durationMinutes: 45,
        category: "habit",
        isCompleted: false,
      });
    }

    const cascaded = cascadeScheduleItems(synthesized, start);
    setDraftItems(cascaded);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Reorder helper (move up / down)
  const moveItem = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= draftItems.length) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = [...draftItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, moved);

    const cascaded = cascadeScheduleItems(updated);
    setDraftItems(cascaded);
  };

  // Adjust duration (+15m or -15m)
  const adjustDuration = (index: number, delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const updated = draftItems.map((item, i) => {
      if (i !== index) return item;
      const newDuration = Math.max(15, (item.durationMinutes || 30) + delta);
      return {
        ...item,
        durationMinutes: newDuration,
      };
    });
    setDraftItems(cascadeScheduleItems(updated));
  };

  // Cycle category (habit -> target -> focus -> habit)
  const cycleCategory = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const sequence: ScheduleCategory[] = ["focus", "target", "habit"];
    const updated = draftItems.map((item, i) => {
      if (i !== index) return item;
      const curIdx = sequence.indexOf(item.category);
      const nextCat = sequence[(curIdx + 1) % sequence.length];
      return { ...item, category: nextCat };
    });
    setDraftItems(updated);
  };

  // Delete item
  const deleteItem = (index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const updated = draftItems.filter((_, i) => i !== index);
    setDraftItems(cascadeScheduleItems(updated));
  };

  // Add custom manual item
  const handleAddManualItem = () => {
    if (!newTitle.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const newItem: ScheduleItem = {
      id: genId(),
      title: newTitle.trim(),
      startTime: "00:00",
      endTime: "00:00",
      durationMinutes: 30,
      category: "focus",
      isCompleted: false,
    };

    const cascaded = cascadeScheduleItems([...draftItems, newItem]);
    setDraftItems(cascaded);
    setNewTitle("");
  };

  // Commit to Docket
  const handleCommit = async () => {
    if (draftItems.length === 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsCommitting(true);
    try {
      await commitBlueprint(targetDate, draftItems);
      onClose();
    } catch (e) {
      console.error("Failed to commit blueprint:", e);
    } finally {
      setIsCommitting(false);
    }
  };

  const tomorrowDateFormatted = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d
      .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
      .toUpperCase();
  })();

  const todayDateFormatted = new Date()
    .toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    .toUpperCase();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className={`flex-1 ${t.bg}`}
      >
        {/* ── Sheet Header ────────────────────────────────────────────── */}
        <View
          className="flex-row items-center justify-between px-6 pt-5 pb-4 border-b"
          style={{ borderBottomColor: t.colors.border }}
        >
          <View className="flex-row items-center gap-2">
            <View
              className="w-7 h-7 rounded-[4px] items-center justify-center"
              style={{ backgroundColor: t.colors.greenLight }}
            >
              <Ionicons name="sparkles" size={16} color={t.colors.green} />
            </View>
            <View>
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 16,
                  letterSpacing: -0.3,
                  color: t.colors.text,
                }}
              >
                Blueprint Studio
              </Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 10,
                  color: t.colors.subtext,
                }}
              >
                Vellum Ledger Daily Architect
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={onClose}
            className="w-8 h-8 rounded-[4px] border items-center justify-center"
            style={{
              borderColor: t.colors.border,
              backgroundColor: t.colors.card,
            }}
          >
            <Ionicons name="close" size={16} color={t.colors.subtext} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        >
          {/* ── Context Switcher ──────────────────────────────────────── */}
          <View
            className="flex-row rounded-[4px] p-1 border mb-4"
            style={{
              borderColor: t.colors.border,
              backgroundColor: t.colors.card,
            }}
          >
            <TouchableOpacity
              onPress={() => handleToggleMode("tomorrow")}
              className="flex-1 py-2 items-center rounded-[3px]"
              style={{
                backgroundColor:
                  mode === "tomorrow" ? t.colors.text : "transparent",
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 11,
                  letterSpacing: 0.5,
                  color:
                    mode === "tomorrow"
                      ? t.isDark
                        ? "#0D0B1F"
                        : "#FAFAF8"
                      : t.colors.subtext,
                }}
              >
                Plan Tomorrow ({tomorrowDateFormatted})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleToggleMode("today")}
              className="flex-1 py-2 items-center rounded-[3px]"
              style={{
                backgroundColor:
                  mode === "today" ? t.colors.text : "transparent",
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 11,
                  letterSpacing: 0.5,
                  color:
                    mode === "today"
                      ? t.isDark
                        ? "#0D0B1F"
                        : "#FAFAF8"
                      : t.colors.subtext,
                }}
              >
                Rebalance Today ({todayDateFormatted})
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Natural Language AI Input ─────────────────────────────── */}
          <View
            className="rounded-[4px] p-3.5 border mb-3"
            style={{
              borderColor: t.colors.border,
              backgroundColor: t.colors.card,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 10,
                letterSpacing: 1.5,
                color: t.colors.subtext,
                marginBottom: 8,
              }}
              className="uppercase"
            >
              Intention & Directives
            </Text>

            <TextInput
              value={promptText}
              onChangeText={setPromptText}
              placeholder="e.g. Focus on shipping the API, gym before 1pm, write 2 blog posts..."
              placeholderTextColor={t.colors.subtext}
              multiline
              numberOfLines={3}
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 13,
                color: t.colors.text,
                minHeight: 64,
                textAlignVertical: "top",
                backgroundColor: t.colors.bg,
                borderColor: t.colors.border,
                borderWidth: 1,
                borderRadius: 4,
                padding: 10,
                marginBottom: 10,
              }}
            />

            <View className="flex-row items-center gap-2">
              <TouchableOpacity
                onPress={() => handleGenerateAI()}
                disabled={isGenerating}
                className="flex-1 py-2.5 px-3 rounded-[4px] flex-row items-center justify-center"
                style={{ backgroundColor: t.colors.text }}
              >
                {isGenerating ? (
                  <ActivityIndicator
                    size="small"
                    color={t.isDark ? "#0D0B1F" : "#FAFAF8"}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="sparkles"
                      size={13}
                      color={t.isDark ? "#0D0B1F" : "#FAFAF8"}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={{
                        fontFamily: "Inter_700Bold",
                        fontSize: 11,
                        letterSpacing: 1,
                        color: t.isDark ? "#0D0B1F" : "#FAFAF8",
                      }}
                      className="uppercase"
                    >
                      Generate Blueprint
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Quick Shortcut: Auto-Draft from Milestones ─────────────── */}
          <TouchableOpacity
            onPress={handleAutoDraftFromMilestones}
            disabled={isGenerating}
            className="flex-row items-center justify-center py-2.5 px-3 rounded-[4px] border mb-5"
            style={{
              borderColor: t.colors.green,
              backgroundColor: t.colors.greenLight,
            }}
          >
            <Ionicons
              name="flash-outline"
              size={13}
              color={t.colors.green}
              style={{ marginRight: 6 }}
            />
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 11,
                letterSpacing: 0.5,
                color: t.colors.text,
              }}
            >
              Auto-Draft from Active Milestones & Habits
            </Text>
          </TouchableOpacity>

          {/* ── Section Title: Schedule Stream ────────────────────────── */}
          <View className="flex-row items-center justify-between mb-2">
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 10,
                letterSpacing: 1.5,
                color: t.colors.subtext,
              }}
              className="uppercase"
            >
              Drafted Schedule ({draftItems.length} Blocks)
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 10,
                color: t.colors.subtext,
              }}
            >
              Auto-cascades sequentially
            </Text>
          </View>

          {/* ── Drafted Items List ────────────────────────────────────── */}
          {draftItems.length === 0 ? (
            <View
              className="p-6 rounded-[4px] border items-center justify-center mb-4"
              style={{
                borderColor: t.colors.border,
                borderStyle: "dashed",
                backgroundColor: t.colors.card,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  color: t.colors.subtext,
                }}
              >
                No blocks in blueprint. Use AI to draft or add manually.
              </Text>
            </View>
          ) : (
            <View className="gap-2 mb-4">
              {draftItems.map((item, index) => (
                <View
                  key={item.id}
                  className="rounded-[4px] p-3 border"
                  style={{
                    borderColor: t.colors.border,
                    backgroundColor: t.colors.card,
                  }}
                >
                  {/* Top Bar: Time Badge + Duration + Category + Actions */}
                  <View className="flex-row items-center justify-between mb-2">
                    <View className="flex-row items-center gap-1.5">
                      {/* Monospaced 24h Time Badge */}
                      <View
                        className="px-2 py-0.5 rounded-[2px]"
                        style={{
                          backgroundColor: t.isDark
                            ? "rgba(255,255,255,0.08)"
                            : "#EAE6DE",
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: "Inter_600SemiBold",
                            fontSize: 11,
                            letterSpacing: 0.5,
                            color: t.colors.text,
                          }}
                        >
                          {item.startTime} — {item.endTime}
                        </Text>
                      </View>

                      {/* Duration Chip with quick adjust */}
                      <View
                        className="flex-row items-center px-1.5 py-0.5 rounded-[2px] border"
                        style={{
                          borderColor: t.colors.border,
                          backgroundColor: t.colors.bg,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => adjustDuration(index, -15)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 4 }}
                        >
                          <Text
                            style={{
                              fontFamily: "Inter_700Bold",
                              fontSize: 11,
                              color: t.colors.subtext,
                              paddingHorizontal: 2,
                            }}
                          >
                            -
                          </Text>
                        </TouchableOpacity>
                        <Text
                          style={{
                            fontFamily: "Inter_600SemiBold",
                            fontSize: 10,
                            color: t.colors.text,
                            marginHorizontal: 3,
                          }}
                        >
                          {formatDuration(item.durationMinutes)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => adjustDuration(index, 15)}
                          hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                        >
                          <Text
                            style={{
                              fontFamily: "Inter_700Bold",
                              fontSize: 11,
                              color: t.colors.subtext,
                              paddingHorizontal: 2,
                            }}
                          >
                            +
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* Category Chip (Tap to cycle) */}
                      <TouchableOpacity
                        onPress={() => cycleCategory(index)}
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
                      </TouchableOpacity>
                    </View>

                    {/* Reorder and Delete controls */}
                    <View className="flex-row items-center gap-1">
                      {/* Move Up */}
                      <TouchableOpacity
                        onPress={() => moveItem(index, "up")}
                        disabled={index === 0}
                        className="w-6 h-6 items-center justify-center rounded-[2px]"
                        style={{ opacity: index === 0 ? 0.25 : 1 }}
                      >
                        <Ionicons
                          name="chevron-up"
                          size={14}
                          color={t.colors.text}
                        />
                      </TouchableOpacity>

                      {/* Move Down */}
                      <TouchableOpacity
                        onPress={() => moveItem(index, "down")}
                        disabled={index === draftItems.length - 1}
                        className="w-6 h-6 items-center justify-center rounded-[2px]"
                        style={{
                          opacity: index === draftItems.length - 1 ? 0.25 : 1,
                        }}
                      >
                        <Ionicons
                          name="chevron-down"
                          size={14}
                          color={t.colors.text}
                        />
                      </TouchableOpacity>

                      {/* Delete */}
                      <TouchableOpacity
                        onPress={() => deleteItem(index)}
                        className="w-6 h-6 items-center justify-center rounded-[2px] ml-1"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={13}
                          color={t.colors.error}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Title */}
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 13,
                      color: t.colors.text,
                    }}
                  >
                    {item.title}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* ── Add Manual Item Bar ───────────────────────────────────── */}
          <View
            className="flex-row items-center rounded-[4px] p-2 border mb-6"
            style={{
              borderColor: t.colors.border,
              backgroundColor: t.colors.bg,
            }}
          >
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Add another scheduled block..."
              placeholderTextColor={t.colors.subtext}
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: t.colors.text,
                flex: 1,
                paddingVertical: 4,
                paddingHorizontal: 6,
              }}
            />
            <TouchableOpacity
              onPress={handleAddManualItem}
              disabled={!newTitle.trim()}
              className="px-3 py-1.5 rounded-[3px]"
              style={{
                backgroundColor: newTitle.trim()
                  ? t.colors.text
                  : t.colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_700Bold",
                  fontSize: 10,
                  letterSpacing: 1,
                  color: newTitle.trim()
                    ? t.isDark
                      ? "#0D0B1F"
                      : "#FAFAF8"
                    : t.colors.subtext,
                }}
                className="uppercase"
              >
                + Add
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Commit Blueprint Bottom CTA ───────────────────────────── */}
          <TouchableOpacity
            onPress={handleCommit}
            disabled={isCommitting || draftItems.length === 0}
            className="rounded-[4px] py-3.5 px-4 items-center flex-row justify-center"
            style={{
              backgroundColor:
                draftItems.length > 0 ? t.colors.text : t.colors.border,
            }}
          >
            {isCommitting ? (
              <ActivityIndicator
                size="small"
                color={t.isDark ? "#0D0B1F" : "#FAFAF8"}
              />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={16}
                  color={
                    draftItems.length > 0
                      ? t.isDark
                        ? "#0D0B1F"
                        : "#FAFAF8"
                      : t.colors.subtext
                  }
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    fontFamily: "Inter_700Bold",
                    fontSize: 12,
                    letterSpacing: 1.5,
                    color:
                      draftItems.length > 0
                        ? t.isDark
                          ? "#0D0B1F"
                          : "#FAFAF8"
                        : t.colors.subtext,
                  }}
                  className="uppercase"
                >
                  Commit Blueprint ({draftItems.length} Tasks)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
