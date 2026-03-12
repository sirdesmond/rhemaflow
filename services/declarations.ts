import { functions } from "./firebase";
import { DeclarationCategory, AgeRange, StreakData } from "../types";
import { getDeviceId } from "./device";

class AbortError extends Error {
  name = "AbortError";
  constructor() {
    super("Aborted");
  }
}

function friendlyMessage(error: unknown): string {
  const msg =
    error instanceof Error ? error.message.toLowerCase() : String(error);

  if (msg.includes("resource-exhausted") || msg.includes("daily limit")) {
    return "You've reached your daily limit. Upgrade to Pro for unlimited declarations.";
  }
  if (msg.includes("permission-denied") || msg.includes("pro feature")) {
    return "This is a Pro feature. Upgrade to unlock.";
  }
  if (
    msg.includes("network") ||
    msg.includes("fetch") ||
    msg.includes("timeout") ||
    msg.includes("unavailable")
  ) {
    return "You appear to be offline. Please check your connection.";
  }
  if (msg.includes("internal") || msg.includes("500") || msg.includes("capacity")) {
    return "Our servers are busy. Please try again in a moment.";
  }
  return "Something went wrong. Please try again.";
}

/**
 * Calls the generateDeclaration Cloud Function.
 * Returns declaration text and scripture only (no audio).
 */
export async function generateDeclaration(
  category: DeclarationCategory,
  mood: string,
  customText?: string,
  gender?: "male" | "female" | null,
  maritalStatus?: "single" | "married" | null,
  ageRange?: AgeRange | null,
  lifeStages?: string[],
  faithFocusAreas?: string[]
): Promise<{ text: string; reference: string; scriptureText: string; streakData: StreakData | null }> {
  try {
    const deviceId = await getDeviceId();
    const fn = functions.httpsCallable("generateDeclaration");
    const result = await fn({ category, mood, customText, deviceId, gender, maritalStatus, ageRange, lifeStages, faithFocusAreas });
    return result.data as { text: string; reference: string; scriptureText: string; streakData: StreakData | null };
  } catch (error) {
    throw new Error(friendlyMessage(error));
  }
}

/**
 * Calls the standalone generateSpeech Cloud Function.
 * Supports cancellation via AbortSignal to avoid wasting bandwidth
 * when the user triggers a new generation before TTS completes.
 */
export type WordTiming = { word: string; start: number; end: number };

export async function generateSpeech(
  text: string,
  voiceGender?: "male" | "female",
  signal?: AbortSignal
): Promise<{ audioBase64: string | null; audioUrl: string | null; alignment: WordTiming[] | null }> {
  try {
    const fn = functions.httpsCallable("generateSpeech");
    const resultPromise = fn({ text, voiceGender });

    // If an abort signal is provided, race the call against it
    if (signal) {
      const abortPromise = new Promise<never>((_, reject) => {
        if (signal.aborted) reject(new AbortError());
        signal.addEventListener("abort", () => reject(new AbortError()));
      });
      const result = await Promise.race([resultPromise, abortPromise]);
      const data = result.data as { audioBase64: string | null; audioUrl: string | null; alignment: WordTiming[] | null };
      return { audioBase64: data.audioBase64, audioUrl: data.audioUrl ?? null, alignment: data.alignment ?? null };
    }

    const result = await resultPromise;
    const data = result.data as { audioBase64: string | null; audioUrl: string | null; alignment: WordTiming[] | null };
    return { audioBase64: data.audioBase64, audioUrl: data.audioUrl ?? null, alignment: data.alignment ?? null };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error(friendlyMessage(error));
  }
}

/**
 * Calls the generateImage Cloud Function.
 * Returns a Firebase Storage URL for the generated image.
 */
export async function generateImage(
  category: DeclarationCategory,
  declarationText: string
): Promise<string | null> {
  try {
    const fn = functions.httpsCallable("generateImage");
    const result = await fn({ category, declarationText });
    return (result.data as { imageUrl: string | null }).imageUrl;
  } catch (error) {
    throw new Error(friendlyMessage(error));
  }
}
