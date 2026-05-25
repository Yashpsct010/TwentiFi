import React, { useState } from "react";
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/use-theme";
import { useMilestoneStore, Milestone, MilestoneType } from "@/store/milestoneStore";
import { useSettingsStore } from "@/store/settingsStore";
import { generateMilestonePlan } from "@/services/gemini";
import { useDialogStore } from "@/store/dialogStore";

const TEMPLATES = [
  { title: "Read 10 Pages", type: "habit" as const, description: "Daily reading habit", tasks: ["Read 10 pages"] },
  { title: "Couch to 5k", type: "target" as const, description: "Run a 5k in 9 weeks", deadline: "9 weeks", tasks: ["Week 1: Walk/Run intervals", "Week 2: Jog 5 mins", "Week 3: Jog 10 mins", "Week 9: Run 5k"] },
  { title: "Learn to Code", type: "target" as const, description: "Master basics", deadline: "1 month", tasks: ["Variables & Data types", "Functions & Loops", "Build a simple project"] }
];

// ─── Progress bar component ────────────────────────────────────────────────
function ProgressBar({ completed, total, color }: { completed: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : completed / total;
  return (
    <View style={{ height: 3, backgroundColor: "#D9D5CE", borderRadius: 2, marginTop: 8 }}>
      <View style={{ width: `${Math.round(pct * 100)}%`, height: 3, backgroundColor: color, borderRadius: 2 }} />
    </View>
  );
}

// ─── Single milestone card ─────────────────────────────────────────────────
function MilestoneCard({
  milestone,
  t,
  onComplete,
  onReopen,
  onDelete,
  onPress,
}: {
  milestone: Milestone;
  t: any;
  onComplete: () => void;
  onReopen: () => void;
  onDelete: () => void;
  onPress: () => void;
}) {
  const completed = milestone.tasks.filter((tk) => tk.status === "completed").length;
  const total = milestone.tasks.length;
  const carried = milestone.tasks.filter((tk) => tk.status === "carried").length;

  return (
    <TouchableOpacity
      onPress={onPress}
      className={`border ${t.border} rounded-[4px] p-5 mb-3`}
      style={{ backgroundColor: milestone.isCompleted ? t.colors.card : t.colors.card }}
      activeOpacity={0.75}
    >
      {/* Top row */}
      <View className="flex-row justify-between items-start mb-2">
        <View className="flex-1 mr-3">
          {/* Type + deadline */}
          <View className="flex-row items-center gap-2 mb-1">
            <View
              style={{
                backgroundColor:
                  milestone.type === "target" ? t.colors.brown + "28" : t.colors.green + "22",
                borderRadius: 2,
                paddingHorizontal: 6,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 8,
                  letterSpacing: 1.5,
                  color: milestone.type === "target" ? t.colors.brown : t.colors.green,
                }}
              >
                {milestone.type === "target" ? "TARGET" : "HABIT"}
              </Text>
            </View>
            {milestone.deadline && (
              <Text
                style={{ fontFamily: "Inter_400Regular", fontSize: 10, color: t.colors.subtext }}
              >
                Due {milestone.deadline}
              </Text>
            )}
            {milestone.isCompleted && (
              <View
                style={{
                  backgroundColor: t.colors.green + "22",
                  borderRadius: 2,
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 8,
                    letterSpacing: 1.5,
                    color: t.colors.green,
                  }}
                >
                  COMPLETED
                </Text>
              </View>
            )}
          </View>
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 15,
              color: milestone.isCompleted ? t.colors.subtext : t.colors.text,
            }}
            numberOfLines={1}
          >
            {milestone.title}
          </Text>
          {milestone.description ? (
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: t.colors.subtext,
                marginTop: 2,
              }}
              numberOfLines={1}
            >
              {milestone.description}
            </Text>
          ) : null}
        </View>

        {/* Actions menu */}
        <TouchableOpacity
          onPress={() => {
            useDialogStore.getState().showDialog(
              milestone.title,
              "What would you like to do?",
              [
                milestone.isCompleted
                  ? { text: "Reopen Milestone", style: "default", onPress: onReopen }
                  : { text: "Mark as Complete", style: "default", onPress: onComplete },
                { text: "Delete", style: "destructive", onPress: onDelete },
                { text: "Cancel", style: "cancel" },
              ]
            );
          }}
          style={{ padding: 4 }}
        >
          <Ionicons name="ellipsis-vertical" size={16} color={t.colors.subtext} />
        </TouchableOpacity>
      </View>

      {/* Progress */}
      <View className="flex-row justify-between items-center mt-1">
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: t.colors.subtext }}>
          {total === 0 ? "No tasks yet" : `${completed}/${total} tasks done`}
          {carried > 0 ? `  ·  ${carried} carried` : ""}
        </Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: t.colors.subtext }}>
          {milestone.sessionCount} {milestone.sessionCount === 1 ? "session" : "sessions"}
        </Text>
      </View>
      {total > 0 && <ProgressBar completed={completed} total={total} color={t.colors.green} />}
    </TouchableOpacity>
  );
}

// ─── Create Milestone inline form ──────────────────────────────────────────
function CreateForm({ t, onCreated, apiKey }: { t: any; onCreated: () => void; apiKey: string }) {
  const { addMilestone, replaceAllTasks } = useMilestoneStore();

  const [title, setTitle] = useState("");
  const [type, setType] = useState<MilestoneType>("target");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [taskInputs, setTaskInputs] = useState<string[]>([]);
  const [newTaskText, setNewTaskText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [descFocused, setDescFocused] = useState(false);
  const [deadlineFocused, setDeadlineFocused] = useState(false);
  const [taskFocused, setTaskFocused] = useState(false);

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      setTaskInputs([...taskInputs, newTaskText.trim()]);
      setNewTaskText("");
    }
  };

  const handleGeneratePlan = async () => {
    if (!title.trim()) {
      useDialogStore.getState().showDialog("Title Required", "Please enter a milestone title first.");
      return;
    }
    if (!apiKey) {
      useDialogStore.getState().showDialog("API Key Required", "Add your Gemini API key in Settings to use AI plan generation.");
      return;
    }
    setIsGenerating(true);
    try {
      const tasks = await generateMilestonePlan(title, description, deadline || undefined, apiKey);
      setTaskInputs(tasks);
    } catch (err: any) {
      useDialogStore.getState().showDialog("Generation Failed", err.message || "Could not generate plan.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = () => {
    if (!title.trim()) {
      useDialogStore.getState().showDialog("Title Required", "Please enter a milestone title.");
      return;
    }
    const id = addMilestone(title.trim(), type, description.trim() || undefined, deadline.trim() || undefined);
    if (taskInputs.length > 0) {
      replaceAllTasks(id, taskInputs);
    }
    onCreated();
  };

  return (
    <View className={`border ${t.border} rounded-[4px] p-5 mb-6`} style={{ backgroundColor: t.colors.card }}>
      <Text
        style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2, color: t.colors.subtext }}
        className="uppercase mb-4"
      >
        New Milestone
      </Text>

      {/* Title */}
      <TextInput
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 14,
          borderColor: titleFocused ? "#6B8E6F" : t.colors.border,
          borderWidth: 1,
          borderRadius: 4,
          color: t.colors.textDim,
          backgroundColor: t.colors.bg,
          padding: 12,
          marginBottom: 12,
        }}
        placeholder="Milestone title…"
        placeholderTextColor={t.colors.subtext}
        value={title}
        onChangeText={setTitle}
        onFocus={() => setTitleFocused(true)}
        onBlur={() => setTitleFocused(false)}
      />

      {/* Type selector */}
      <View className="flex-row gap-2 mb-4">
        {(["target", "habit"] as MilestoneType[]).map((opt) => (
          <TouchableOpacity
            key={opt}
            onPress={() => setType(opt)}
            className="flex-1 py-3 rounded-[4px] items-center border"
            style={{
              borderColor: type === opt ? t.colors.green : t.colors.border,
              backgroundColor: type === opt ? t.colors.greenLight : t.colors.bg,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 11,
                letterSpacing: 1,
                color: type === opt ? t.colors.text : t.colors.subtext,
              }}
              className="uppercase"
            >
              {opt === "target" ? "🎯 Target" : "🔁 Habit"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Description */}
      <TextInput
        style={{
          fontFamily: "Inter_400Regular",
          fontSize: 13,
          borderColor: descFocused ? "#6B8E6F" : t.colors.border,
          borderWidth: 1,
          borderRadius: 4,
          color: t.colors.textDim,
          backgroundColor: t.colors.bg,
          padding: 12,
          marginBottom: 12,
        }}
        placeholder="Description (optional)…"
        placeholderTextColor={t.colors.subtext}
        value={description}
        onChangeText={setDescription}
        onFocus={() => setDescFocused(true)}
        onBlur={() => setDescFocused(false)}
      />

      {/* Deadline — only for target */}
      {type === "target" && (
        <TextInput
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            borderColor: deadlineFocused ? "#6B8E6F" : t.colors.border,
            borderWidth: 1,
            borderRadius: 4,
            color: t.colors.textDim,
            backgroundColor: t.colors.bg,
            padding: 12,
            marginBottom: 12,
          }}
          placeholder="Deadline, e.g. 1 week, Jun 30…"
          placeholderTextColor={t.colors.subtext}
          value={deadline}
          onChangeText={setDeadline}
          onFocus={() => setDeadlineFocused(true)}
          onBlur={() => setDeadlineFocused(false)}
        />
      )}

      {/* AI Generate Plan */}
      <TouchableOpacity
        onPress={handleGeneratePlan}
        disabled={isGenerating}
        className="flex-row items-center justify-center rounded-[4px] py-3 mb-4 border"
        style={{ borderColor: t.colors.border, backgroundColor: t.colors.bg }}
      >
        {isGenerating ? (
          <ActivityIndicator size="small" color={t.colors.green} />
        ) : (
          <Ionicons name="sparkles-outline" size={14} color={t.colors.green} />
        )}
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 11,
            letterSpacing: 1,
            color: t.colors.green,
            marginLeft: 6,
          }}
          className="uppercase"
        >
          {isGenerating ? "Generating…" : "Generate Plan with AI"}
        </Text>
      </TouchableOpacity>

      {/* Task list preview */}
      {taskInputs.length > 0 && (
        <View className={`border ${t.border} rounded-[4px] overflow-hidden mb-3`} style={{ backgroundColor: t.colors.bg }}>
          {taskInputs.map((task, idx) => (
            <View
              key={idx}
              className="flex-row items-center px-3 py-2"
              style={{ borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: t.colors.border }}
            >
              <Text
                style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: t.colors.textDim, flex: 1 }}
                numberOfLines={2}
              >
                {task}
              </Text>
              <TouchableOpacity onPress={() => setTaskInputs(taskInputs.filter((_, i) => i !== idx))} style={{ padding: 4 }}>
                <Ionicons name="close" size={14} color={t.colors.subtext} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Add task manually */}
      <View className="flex-row mb-4 gap-2">
        <TextInput
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            borderColor: taskFocused ? "#6B8E6F" : t.colors.border,
            borderWidth: 1,
            borderRadius: 4,
            color: t.colors.textDim,
            backgroundColor: t.colors.bg,
            paddingHorizontal: 12,
            paddingVertical: 10,
            flex: 1,
          }}
          placeholder="Add a task…"
          placeholderTextColor={t.colors.subtext}
          value={newTaskText}
          onChangeText={setNewTaskText}
          onSubmitEditing={handleAddTask}
          onFocus={() => setTaskFocused(true)}
          onBlur={() => setTaskFocused(false)}
        />
        <TouchableOpacity
          onPress={handleAddTask}
          className="w-11 h-11 rounded-[4px] items-center justify-center border"
          style={{ borderColor: t.colors.border, backgroundColor: t.colors.card }}
        >
          <Ionicons name="add" size={20} color={t.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Action buttons */}
      <View className="flex-row gap-2">
        <TouchableOpacity
          onPress={onCreated}
          className="flex-1 py-3 rounded-[4px] items-center border"
          style={{ borderColor: t.colors.border, backgroundColor: t.colors.bg }}
        >
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: t.colors.subtext }}>
            CANCEL
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleCreate}
          className="flex-1 py-3 rounded-[4px] items-center"
          style={{ backgroundColor: title.trim() ? t.colors.text : "#D9D5CE" }}
          disabled={!title.trim()}
        >
          <Text
            style={{
              fontFamily: "Inter_700Bold",
              fontSize: 12,
              letterSpacing: 1,
              color: title.trim() ? (t.isDark ? "#0D0B1F" : "#FAFAF8") : t.colors.subtext,
            }}
          >
            CREATE
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main screen ────────────────────────────────────────────────────────────
export default function MilestonesScreen() {
  const router = useRouter();
  const t = useTheme();
  const { milestones, deleteMilestone, completeMilestone, reopenMilestone, addMilestone, replaceAllTasks } = useMilestoneStore();
  const { geminiApiKey } = useSettingsStore();

  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");
  const [showCreate, setShowCreate] = useState(false);

  const activeMilestones = milestones.filter((m) => !m.isCompleted);
  const completedMilestones = milestones.filter((m) => m.isCompleted);
  const displayed = activeTab === "active" ? activeMilestones : completedMilestones;

  const handleDelete = (m: Milestone) => {
    useDialogStore.getState().showDialog(
      "Delete Milestone",
      `Delete "${m.title}"? This cannot be undone.`,
      [
        { text: "Delete", style: "destructive", onPress: () => deleteMilestone(m.id) },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  return (
    <View className={`flex-1 ${t.bg}`}>
      {/* Modal handle */}
      <View className="items-center pt-3 pb-1">
        <View className="w-10 h-1 rounded-[2px]" style={{ backgroundColor: t.colors.border }} />
      </View>

      {/* Header */}
      <View className="flex-row justify-between items-center px-6 pt-10 pb-4">
        <View>
          <Text
            style={{ fontFamily: "Inter_400Regular", fontSize: 10, letterSpacing: 2 }}
            className={`${t.textSubtle} uppercase mb-0.5`}
          >
            Your Progress
          </Text>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 22 }} className={t.textPrimary}>
            Milestones
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          className={`w-10 h-10 rounded-[4px] border items-center justify-center ${t.iconBtn} ${t.border}`}
        >
          <Ionicons name="close" size={18} color={t.colors.subtext} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row mx-6 mb-5 border rounded-[4px] overflow-hidden" style={{ borderColor: t.colors.border }}>
        {(["active", "completed"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            className="flex-1 py-2.5 items-center"
            style={{
              backgroundColor: activeTab === tab ? t.colors.text : t.colors.bg,
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 10,
                letterSpacing: 1.5,
                color: activeTab === tab ? (t.isDark ? "#0D0B1F" : "#FAFAF8") : t.colors.subtext,
              }}
              className="uppercase"
            >
              {tab === "active"
                ? `Active (${activeMilestones.length})`
                : `Done (${completedMilestones.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
      >
        {/* Create form */}
        {showCreate && (
          <CreateForm
            t={t}
            apiKey={geminiApiKey}
            onCreated={() => {
              setShowCreate(false);
              setActiveTab("active");
            }}
          />
        )}

        {/* Empty state */}
        {displayed.length === 0 && !showCreate && (
          <View className="items-center py-12">
            <Ionicons
              name={activeTab === "active" ? "flag-outline" : "checkmark-circle-outline"}
              size={36}
              color={t.colors.border}
            />
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: t.colors.subtext,
                marginTop: 12,
                textAlign: "center",
              }}
            >
              {activeTab === "active"
                ? "No active milestones.\nCreate one to get started."
                : "No completed milestones yet."}
            </Text>
          </View>
        )}

        {/* Milestone cards */}
        {displayed.map((m) => (
          <MilestoneCard
            key={m.id}
            milestone={m}
            t={t}
            onComplete={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              completeMilestone(m.id);
            }}
            onReopen={() => reopenMilestone(m.id)}
            onDelete={() => handleDelete(m)}
            onPress={() => {
              // Future: navigate to milestone detail
            }}
          />
        ))}

        {/* New milestone button */}
        {!showCreate && activeTab === "active" && (
          <TouchableOpacity
            onPress={() => setShowCreate(true)}
            className="flex-row items-center justify-center rounded-[4px] py-4 mt-2 border"
            style={{ borderColor: t.colors.border, borderStyle: "dashed", backgroundColor: t.colors.bg }}
          >
            <Ionicons name="add" size={18} color={t.colors.subtext} />
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 11,
                letterSpacing: 1.5,
                color: t.colors.subtext,
                marginLeft: 6,
              }}
              className="uppercase"
            >
              New Milestone
            </Text>
          </TouchableOpacity>
        )}

        {/* Templates */}
        {!showCreate && activeTab === "active" && (
          <View className="mt-8 mb-4">
            <Text
              style={{ fontFamily: "Inter_600SemiBold", fontSize: 10, letterSpacing: 2 }}
              className={`${t.textSubtle} uppercase mb-3`}
            >
              Start from a Template
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {TEMPLATES.map((tpl, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    const id = addMilestone(tpl.title, tpl.type, tpl.description, (tpl as any).deadline);
                    if (tpl.tasks) {
                      replaceAllTasks(id, tpl.tasks);
                    }
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                  className={`border ${t.border} rounded-[4px] p-4`}
                  style={{ backgroundColor: t.colors.card, minWidth: 140 }}
                >
                  <View className="flex-row items-center gap-2 mb-2">
                    <View
                      style={{
                        backgroundColor: tpl.type === "target" ? t.colors.brown + "28" : t.colors.green + "22",
                        borderRadius: 2,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: "Inter_600SemiBold",
                          fontSize: 8,
                          letterSpacing: 1.5,
                          color: tpl.type === "target" ? t.colors.brown : t.colors.green,
                        }}
                      >
                        {tpl.type === "target" ? "TARGET" : "HABIT"}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: t.colors.text }} className="mb-1">
                    {tpl.title}
                  </Text>
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: t.colors.subtext }}>
                    {tpl.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
