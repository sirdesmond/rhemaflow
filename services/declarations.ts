import { functions } from "./firebase";
import { DeclarationCategory } from "../types";
import { getDeviceId } from "./device";

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
  maritalStatus?: "single" | "married" | null
): Promise<{ text: string; reference: string; scriptureText: string }> {
  try {
    const deviceId = await getDeviceId();
    const fn = functions.httpsCallable("generateDeclaration");
    const result = await fn({ category, mood, customText, deviceId, gender, maritalStatus });
    return result.data as { text: string; reference: string; scriptureText: string };
  } catch (error) {
    throw new Error(friendlyMessage(error));
  }
}

/**
 * Calls the standalone generateSpeech Cloud Function.
 * Used for replaying saved declarations that don't have cached audio.
 */
export async function generateSpeech(
  text: string,
  voiceGender?: "male" | "female"
): Promise<string | null> {
  try {
    const fn = functions.httpsCallable("generateSpeech");
    const result = await fn({ text, voiceGender });
    return (result.data as { audioBase64: string | null }).audioBase64;
  } catch (error) {
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
