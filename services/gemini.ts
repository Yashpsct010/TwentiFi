import { LogEntry } from "./database";
import { getSettings } from "@/store/settingsStore"; // We'll need a way to get the key without the hook if calling from background

// Safe import for Firebase SDK
let FirebaseVertexAI: any = null;
try {
  FirebaseVertexAI = require("@react-native-firebase/vertexai");
} catch (e) {
  console.log("[Gemini] Firebase Vertex AI SDK not available in this environment (likely Expo Go). Falling back to REST API.");
}

/**
 * Interface for AI generated insights
 */
export interface AIInsights {
  summary: string;
  advice: string;
  productivityLevel: 'high' | 'medium' | 'low';
}

/**
 * Low-level call to Gemini. 
 * Detects environment and uses either Firebase SDK or direct REST API.
 */
const callGemini = async (prompt: string, apiKey?: string): Promise<string> => {
  // If SDK is available, use it (Option A - Production)
  if (FirebaseVertexAI) {
    try {
      const { getVertexAI, getGenerativeModel } = FirebaseVertexAI;
      const vertexAI = getVertexAI();
      const model = getGenerativeModel(vertexAI, { 
        model: "gemini-3.1-flash-lite" 
      });

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error: any) {
      console.error("[Gemini SDK Error]:", error);
      // If SDK fails (e.g. not configured), continue to fallback if apiKey exists
      if (!apiKey) throw error;
    }
  }

  // Fallback: Use direct REST API (Option B - Development/Expo Go)
  if (!apiKey) {
    throw new Error("Gemini API Key is required for development/Expo Go. Add it in Settings.");
  }

  const model = "gemini-3.1-flash-lite";
  console.log(`[Gemini] Using REST API fallback (model: ${model})`);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[Gemini REST] HTTP ${response.status} from ${model}:`, errorText);
      let errorData: any = {};
      try { errorData = JSON.parse(errorText); } catch {}
      const message = errorData?.error?.message || errorText || `HTTP ${response.status}`;
      throw new Error(`Gemini API failed (${response.status}): ${message}`);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    return rawText;
  } catch (error) {
    console.error("[Gemini REST Error]:", error);
    throw error;
  }
};

/**
 * Robustly extracts a JSON object from a Gemini response that may be
 * wrapped in markdown code fences or surrounding prose.
 */
const extractJSON = (raw: string): any => {
  // Strip markdown code fences
  let cleaned = raw.replace(/```(?:json)?\s*/gi, "").replace(/```/g, "").trim();
  
  // Try direct parse first
  try { return JSON.parse(cleaned); } catch {}
  
  // Find the first { and last } to extract the JSON object
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    try { return JSON.parse(cleaned.substring(start, end + 1)); } catch {}
  }
  
  console.warn("[Gemini] Could not parse JSON from response:", raw.substring(0, 200));
  throw new Error("Failed to parse Gemini JSON response");
};

/**
 * Generates both log prompt and reminder in a single API call
 */
export const generateConsolidatedNotifications = async (
  apiKey?: string
): Promise<{ log_prompt: { title: string, body: string }, reminder: { title: string, body: string } }> => {
  const prompt = `
    Generate TWO short, Gen-Z style notifications for a focus app.
    1. log_prompt: Asking the user to log what they did in the last 20 minutes.
    2. reminder: Reminding the user they missed a log/pulse and should come back.
    
    Tone: Gen-Z slang, vibey, chaotic, motivational.
    Format as pure JSON: {"log_prompt": {"title": "...", "body": "..."}, "reminder": {"title": "...", "body": "..."}}
    No markdown formatting. Max 30 chars for titles, 60 for bodies.
  `;

  try {
    const responseText = await callGemini(prompt, apiKey);
    return extractJSON(responseText);
  } catch (e) {
    console.warn("Gemini consolidated call failed, using fallbacks:", e);
    return {
      log_prompt: { title: "Pulse Check! ✌️", body: "What's the move? Log your last session, bestie." },
      reminder: { title: "Still there? 💀", body: "The grind don't stop, but your logs did. Come back!" }
    };
  }
};

/**
 * Generates deep insights from log data
 */
export const generateAIInsights = async (
  logs: LogEntry[],
  apiKey?: string
): Promise<AIInsights> => {
  if (logs.length === 0) {
    return {
      summary: "No data yet. Start your first session to unlock AI analysis!",
      advice: "Try logging a few focus pulses today.",
      productivityLevel: 'low'
    };
  }

  const logsSummary = logs.map(l => `- At ${new Date(l.timestamp).toLocaleTimeString()}: ${l.activity} (Mood: ${l.mood}, Prod: ${l.productivity}/5)`).join('\n');
  
  const prompt = `
    Analyze these productivity logs for today:
    ${logsSummary}

    Provide a summary of the day, personalized advice, and a productivity level.
    Tone: Modern, helpful, slightly Gen-Z/professional hybrid.
    Format as JSON: {"summary": "...", "advice": "...", "productivityLevel": "high|medium|low"}
    No markdown formatting, just pure JSON.
  `;

  try {
    const responseText = await callGemini(prompt, apiKey);
    return extractJSON(responseText);
  } catch {
    return {
      summary: "We're gathering insights from your pulses...",
      advice: "Keep logging consistently for a deeper analysis.",
      productivityLevel: 'medium'
    };
  }
};
