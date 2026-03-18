import { Platform } from "react-native";

export interface SarvamSTTResponse {
  transcript: string;
  request_id: string;
  language_code?: string;
}

/**
 * Transcribes audio using Sarvam AI's REST API.
 * This implementation avoids heavy SDKs and Node.js polyfills.
 * @param audioUri The local URI of the audio file to transcribe.
 * @param apiKey The user's Sarvam AI API Key.
 * @returns The transcript text.
 */
export const transcribeWithSarvam = async (
  audioUri: string,
  apiKey: string,
): Promise<string> => {
  if (!apiKey) {
    throw new Error("Sarvam API Key is missing. Please add it in Settings.");
  }

  const formData = new FormData();
  
  // Clean URI for Android
  let cleanUri = audioUri;
  if (Platform.OS === 'android' && !audioUri.startsWith('file://')) {
    cleanUri = 'file://' + audioUri;
  }

  // Robust naming and type detection
  const filename = audioUri.split("/").pop() || "audio.m4a";
  const ext = filename.split(".").pop()?.toLowerCase() || "m4a";

  // Map extensions to correct MIME types that Sarvam accepts
  const mimeMap: Record<string, string> = {
    m4a: "audio/mp4",
    mp4: "audio/mp4",
    wav: "audio/wav",
    webm: "audio/webm",
    ogg: "audio/ogg",
    mp3: "audio/mpeg",
    aac: "audio/aac",
  };
  const type = mimeMap[ext] || `audio/${ext}`;

  console.log(`[Sarvam Fetch] Uploading: ${filename} (type: ${type}) from ${cleanUri}`);

  // @ts-ignore: React Native FormData expects an object for the file
  formData.append("file", {
    uri: cleanUri,
    name: filename,
    type: type,
  });

  formData.append("model", "saaras:v3");
  formData.append("language_code", "en-IN");
  formData.append("with_diarization", "false");

  try {
    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
        // DO NOT set Content-Type, fetch will set it with the correct boundary
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[Sarvam API] HTTP ${response.status}:`, errorText);
      let errorData: any = {};
      try { errorData = JSON.parse(errorText); } catch {}
      const message = errorData?.error?.message || errorData?.message || errorText || `HTTP ${response.status}`;
      throw new Error(`Sarvam API failed (${response.status}): ${message}`);
    }

    const data: SarvamSTTResponse = await response.json();
    return data.transcript;
  } catch (error: any) {
    console.error("Sarvam transcription failed:", error);
    
    // Check for "Network request failed" specifically to give better advice
    if (error.message === 'Network request failed') {
      throw new Error("Sarvam Network Error: Check your internet and ensure the audio file is valid.");
    }
    
    throw error;
  }
};
