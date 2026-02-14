import { functions } from "./firebase";
import { DeclarationCategory, GeneratedContent } from "../types";

/**
 * Calls the generateDeclaration Cloud Function.
 * Returns declaration text, scripture reference, and scripture text.
 */
export async function generateDeclaration(
  category: DeclarationCategory,
  mood: string,
  customText?: string
): Promise<{ text: string; reference: string; scriptureText: string }> {
  const fn = functions.httpsCallable("generateDeclaration");
  const result = await fn({ category, mood, customText });
  return result.data as { text: string; reference: string; scriptureText: string };
}

/**
 * Calls the generateSpeech Cloud Function.
 * Returns WAV audio as a base64 string (PCM converted to WAV server-side).
 */
export async function generateSpeech(text: string): Promise<string | null> {
  const fn = functions.httpsCallable("generateSpeech");
  const result = await fn({ text });
  return (result.data as { audioBase64: string | null }).audioBase64;
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
 * Full generation pipeline: text first, then speech + image in parallel.
 */
export async function generateAllContent(
  category: DeclarationCategory,
  mood: string,
  customText?: string
): Promise<GeneratedContent> {
  // Step 1: Generate declaration text (must complete first — speech needs the text)
  const declaration = await generateDeclaration(category, mood, customText);

  // Step 2: Generate speech and image in parallel
  const [audioBase64, imageUrl] = await Promise.all([
    generateSpeech(declaration.text),
    generateImage(category, declaration.text),
  ]);

  return {
    text: declaration.text,
    reference: declaration.reference,
    scriptureText: declaration.scriptureText,
    backgroundImageUrl: imageUrl,
    audioBase64,
  };
}
