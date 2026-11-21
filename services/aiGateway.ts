import { LogEntry } from './database';
import {
  AIInsights,
  generateAIInsights,
  transcribeWithGemini,
  assignGroupWithGemini,
  expandTaskWithGemini,
  generateDailyQuote,
  generateMilestonePlan,
  generateScheduleBlueprintWithGemini,
  RawSchedulePlanItem,
} from './gemini';
import { useSettingsStore } from '@/store/settingsStore';
import { useMembershipStore } from '@/store/membershipStore';

export interface WeeklyTrendInsights {
  headline: string;
  velocityScore: number; // 0-100
  deepWorkPercentage: number;
  peakFocusWindow: string;
  behavioralSummary: string;
  actionableRecommendation: string;
  topCategory: string;
}

/**
 * Resolves the effective API key or managed credentials based on membership tier.
 * Returns `isManaged: true` only when a valid key was actually resolved for Pulse+ members.
 */
function getEffectiveKey(): { apiKey: string; isManaged: boolean } {
  const { tier } = useMembershipStore.getState();
  const { geminiApiKey } = useSettingsStore.getState();

  const isPulsePlus = tier === 'pulse_plus';

  if (isPulsePlus) {
    // Prefer personal key, then managed env key (strips undefined/empty)
    const effectiveKey =
      (geminiApiKey && geminiApiKey.trim()) ||
      (process.env.EXPO_PUBLIC_GEMINI_MANAGED_KEY &&
        process.env.EXPO_PUBLIC_GEMINI_MANAGED_KEY.trim()) ||
      '';
    // isManaged is only true when we have a valid key to offer
    return { apiKey: effectiveKey, isManaged: Boolean(effectiveKey) };
  }

  return { apiKey: geminiApiKey || '', isManaged: false };
}

/**
 * AI Audio Transcription Gateway
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
  const { apiKey, isManaged } = getEffectiveKey();
  if (!apiKey && !isManaged) {
    throw new Error('Gemini API key required on Standard Pulse. Add it in Settings or upgrade to Pulse+ for zero-setup cloud AI.');
  }
  return await transcribeWithGemini(audioUri, apiKey);
}

/**
 * AI Task Expansion Gateway
 */
export async function expandTask(task: string): Promise<string[]> {
  const { apiKey, isManaged } = getEffectiveKey();
  if (!apiKey && !isManaged) {
    throw new Error('Gemini API key required on Standard Pulse. Add it in Settings or upgrade to Pulse+ for zero-setup cloud AI.');
  }
  return await expandTaskWithGemini(task, apiKey);
}

/**
 * AI Project Group Categorization Gateway
 */
export async function assignGroup(
  activity: string,
  transcript: string,
  userGroups: string[]
): Promise<string> {
  const { apiKey } = getEffectiveKey();
  if (!apiKey) return 'Uncategorized';
  return await assignGroupWithGemini(activity, transcript, userGroups, apiKey);
}

/**
 * AI Daily Coaching Insights Gateway
 */
export async function generateDailyInsights(logs: LogEntry[]): Promise<AIInsights> {
  const { apiKey } = getEffectiveKey();
  return await generateAIInsights(logs, apiKey || undefined);
}

/**
 * AI Milestone Plan Generator Gateway
 */
export async function generateMilestoneRoadmap(
  title: string,
  description: string,
  deadline?: string
): Promise<string[]> {
  const { apiKey, isManaged } = getEffectiveKey();
  if (!apiKey && !isManaged) {
    throw new Error('Gemini API key required on Standard Pulse. Add it in Settings or upgrade to Pulse+ for zero-setup cloud AI.');
  }
  return await generateMilestonePlan(title, description, deadline, apiKey);
}

/**
 * AI Schedule Blueprint Studio Gateway
 */
export async function generateScheduleBlueprint(params: {
  userPrompt?: string;
  targetDate: string;
  contextType: 'tomorrow' | 'today';
  activeMilestonesSummary?: string;
  workdayStart: string;
  workdayEnd: string;
}): Promise<RawSchedulePlanItem[]> {
  const { apiKey, isManaged } = getEffectiveKey();
  if (!apiKey && !isManaged) {
    throw new Error('Gemini API key required on Standard Pulse. Add it in Settings or upgrade to Pulse+ for zero-setup cloud AI.');
  }
  return await generateScheduleBlueprintWithGemini(params, apiKey);
}

/**
 * AI Daily Quote Generator Gateway
 */
export async function fetchDailyQuote(): Promise<{ quote: string; author: string; keyword: string }> {
  const { apiKey } = getEffectiveKey();
  if (!apiKey) {
    return {
      quote: "Focus is a matter of deciding what things you're not going to do.",
      author: 'John Carmack',
      keyword: 'minimalist',
    };
  }
  return await generateDailyQuote(apiKey);
}

/**
 * Weekly & Multi-Day Behavioral Trend Coaching Engine (Pulse+ Exclusive)
 */
export async function generateWeeklyTrendInsights(logs: LogEntry[]): Promise<WeeklyTrendInsights> {
  const { apiKey } = getEffectiveKey();

  if (logs.length === 0) {
    return {
      headline: 'Awaiting Your Focus Rhythm',
      velocityScore: 70,
      deepWorkPercentage: 0,
      peakFocusWindow: '9:00 AM - 1:00 PM',
      behavioralSummary: 'Start logging sessions to generate your weekly multi-day behavioral trend analysis.',
      actionableRecommendation: 'Aim for 4 deep work pulses daily to establish a steady cadence.',
      topCategory: 'General Focus',
    };
  }

  // Calculate stats from logs
  const deepWorkCount = logs.filter((l) => l.mood === 'deep_work' || l.mood === 'focused').length;
  const deepWorkPct = Math.round((deepWorkCount / logs.length) * 100);

  // Group breakdown
  const groupCounts: Record<string, number> = {};
  logs.forEach((l) => {
    const grp = l.groupName || 'Uncategorized';
    groupCounts[grp] = (groupCounts[grp] || 0) + 1;
  });
  const topCategory = Object.keys(groupCounts).sort((a, b) => groupCounts[b] - groupCounts[a])[0] || 'Deep Work';

  if (!apiKey) {
    return {
      headline: `${deepWorkPct}% High-Cadence Focus This Week`,
      velocityScore: Math.min(95, Math.max(40, deepWorkPct + 10)),
      deepWorkPercentage: deepWorkPct,
      peakFocusWindow: 'Morning Cadence (9 AM – 12 PM)',
      behavioralSummary: `You maintained strong consistency across ${logs.length} logged pulses, with majority output directed into ${topCategory}.`,
      actionableRecommendation: 'Protect your morning focus blocks by minimizing context switching after your 3rd pulse.',
      topCategory,
    };
  }

  const logsSample = logs
    .slice(0, 30)
    .map(
      (l) =>
        `- ${new Date(l.timestamp).toLocaleDateString()} at ${new Date(l.timestamp).toLocaleTimeString()}: ${l.activity} [Category: ${l.groupName || 'None'}, Mood: ${l.mood}, Rating: ${l.productivity}/5]`
    )
    .join('\n');

  const prompt = `
    Analyze these multi-day productivity logs for a high-performing user:
    ${logsSample}

    Generate a comprehensive weekly behavioral trend report.
    Return ONLY a JSON object with this exact structure:
    {
      "headline": "Short crisp editorial headline summarizing their rhythm (max 45 chars)",
      "velocityScore": integer between 0 and 100 representing productivity momentum,
      "deepWorkPercentage": integer between 0 and 100,
      "peakFocusWindow": "e.g. 10:00 AM - 1:30 PM",
      "behavioralSummary": "A concise, intelligent 2-sentence breakdown of their behavioral strengths and time distribution",
      "actionableRecommendation": "One high-impact, specific recommendation to improve cadence next week",
      "topCategory": "${topCategory}"
    }
    Tone: Architectural, minimalist, razor-sharp, insightful.
    No markdown code fences, raw JSON only.
  `;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!res.ok) throw new Error('API request failed');
    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const cleaned = rawText.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    return {
      headline: parsed.headline || `${deepWorkPct}% High-Cadence Focus`,
      velocityScore: Number(parsed.velocityScore) || 82,
      deepWorkPercentage: Number(parsed.deepWorkPercentage) || deepWorkPct,
      peakFocusWindow: parsed.peakFocusWindow || '9:00 AM - 12:30 PM',
      behavioralSummary: parsed.behavioralSummary || `Consistent execution across ${logs.length} logged sessions.`,
      actionableRecommendation: parsed.actionableRecommendation || 'Maintain your prime focus blocks.',
      topCategory: parsed.topCategory || topCategory,
    };
  } catch {
    return {
      headline: `${deepWorkPct}% High-Cadence Rhythm`,
      velocityScore: Math.min(95, Math.max(40, deepWorkPct + 10)),
      deepWorkPercentage: deepWorkPct,
      peakFocusWindow: 'Morning Cadence (9 AM – 12 PM)',
      behavioralSummary: `You maintained high output across ${logs.length} recorded blocks, channeling the bulk of your cognitive energy into ${topCategory}.`,
      actionableRecommendation: 'Protect your morning focus window by scheduling high-friction tasks early.',
      topCategory,
    };
  }
}

/**
 * Data Export Generator (Markdown, CSV, Notion-Ready JSON) - Pulse+ Exclusive
 */
export function generateFormattedExport(logs: LogEntry[], format: 'markdown' | 'csv' | 'notion'): string {
  if (format === 'csv') {
    const headers = ['ID', 'Timestamp', 'Date', 'Time', 'Activity', 'Mood', 'Productivity', 'Category', 'Environment', 'Remarks'];
    const rows = logs.map((l) => {
      const d = new Date(l.timestamp);
      return [
        `"${l.id}"`,
        `"${l.timestamp}"`,
        `"${d.toLocaleDateString()}"`,
        `"${d.toLocaleTimeString()}"`,
        `"${(l.activity || '').replace(/"/g, '""')}"`,
        `"${l.mood}"`,
        l.productivity,
        `"${(l.groupName || 'Uncategorized').replace(/"/g, '""')}"`,
        `"${(l.environment || '').replace(/"/g, '""')}"`,
        `"${(l.remarks || '').replace(/"/g, '""')}"`,
      ].join(',');
    });
    return [headers.join(','), ...rows].join('\n');
  }

  if (format === 'markdown') {
    let md = `# TwentiFi Focus Log Export\n*Generated on ${new Date().toLocaleDateString()}*\n\n`;
    md += `| Time | Activity | Category | Mood | Rating |\n| :--- | :--- | :--- | :--- | :--- |\n`;
    logs.forEach((l) => {
      const timeStr = new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      md += `| ${timeStr} | ${l.activity} | ${l.groupName || 'Uncategorized'} | ${l.mood} | ${l.productivity}/5 |\n`;
    });
    return md;
  }

  // Notion-ready structured JSON
  return JSON.stringify(
    {
      app: 'TwentiFi',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      totalEntries: logs.length,
      entries: logs.map((l) => ({
        timestamp: l.timestamp,
        activity: l.activity,
        category: l.groupName || 'Uncategorized',
        mood: l.mood,
        productivity: l.productivity,
        environment: l.environment,
        remarks: l.remarks,
      })),
    },
    null,
    2
  );
}
