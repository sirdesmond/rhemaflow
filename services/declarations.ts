import { functions } from "./firebase";
import { DeclarationCategory, GeneratedContent } from "../types";

function friendlyMessage(error: unknown): string {
  const msg =
    error instanceof Error ? error.message.toLowerCase() : String(error);

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
 * Calls the combined generateDeclaration Cloud Function.
 * Returns declaration text, scripture, AND TTS audio in one round-trip.
 */
export async function generateDeclaration(
  category: DeclarationCategory,
  mood: string,
  customText?: string
): Promise<{ text: string; reference: string; scriptureText: string; audioBase64: string | null }> {
  try {
    const fn = functions.httpsCallable("generateDeclaration");
    const result = await fn({ category, mood, customText });
    return result.data as { text: string; reference: string; scriptureText: string; audioBase64: string | null };
  } catch (error) {
    throw new Error(friendlyMessage(error));
  }
}

/**
 * Calls the standalone generateSpeech Cloud Function.
 * Used for replaying saved declarations that don't have cached audio.
 */
export async function generateSpeech(text: string): Promise<string | null> {
  try {
    const fn = functions.httpsCallable("generateSpeech");
    const result = await fn({ text });
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

/**
 * Full generation pipeline: combined text+audio first, then image in parallel.
 */
export async function generateAllContent(
  category: DeclarationCategory,
  mood: string,
  customText?: string
): Promise<GeneratedContent> {
  try {
    // Fire both in parallel — image only needs category, not declaration text
    const [declaration, imageUrl] = await Promise.all([
      generateDeclaration(category, mood, customText),
      generateImage(category, ""),
    ]);

    return {
      text: declaration.text,
      reference: declaration.reference,
      scriptureText: declaration.scriptureText,
      backgroundImageUrl: imageUrl,
      audioBase64: declaration.audioBase64,
    };
  } catch (error) {
    if (error instanceof Error && error.message !== "Something went wrong. Please try again.") {
      throw error;
    }
    throw new Error(friendlyMessage(error));
  }
}
