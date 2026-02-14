import { functions } from "./firebase";
import { DeclarationCategory, GeneratedContent } from "../types";

/**
 * Calls the combined generateDeclaration Cloud Function.
 * Returns declaration text, scripture, AND TTS audio in one round-trip.
 */
export async function generateDeclaration(
  category: DeclarationCategory,
  mood: string,
  customText?: string
): Promise<{ text: string; reference: string; scriptureText: string; audioBase64: string | null }> {
  const fn = functions.httpsCallable("generateDeclaration");
  const result = await fn({ category, mood, customText });
  return result.data as { text: string; reference: string; scriptureText: string; audioBase64: string | null };
}

/**
 * Calls the generateImage Cloud Function.
 * Returns a Firebase Storage URL for the generated image.
 */
export async function generateImage(
  category: DeclarationCategory,
  declarationText: string
): Promise<string | null> {
  const fn = functions.httpsCallable("generateImage");
  const result = await fn({ category, declarationText });
  return (result.data as { imageUrl: string | null }).imageUrl;
}

/**
 * Full generation pipeline: combined text+audio first, then image in parallel.
 */
export async function generateAllContent(
  category: DeclarationCategory,
  mood: string,
  customText?: string
): Promise<GeneratedContent> {
  // Step 1: Combined call — gets text + audio in one round-trip
  const declaration = await generateDeclaration(category, mood, customText);

  // Step 2: Image in background (audio already included)
  const imageUrl = await generateImage(category, declaration.text);

  return {
    text: declaration.text,
    reference: declaration.reference,
    scriptureText: declaration.scriptureText,
    backgroundImageUrl: imageUrl,
    audioBase64: declaration.audioBase64,
  };
}
