import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import * as crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import { verifySubscription } from "./utils/subscription";
import { sanitizeText, sanitizeVoiceGender } from "./utils/sanitize";

/**
 * Converts raw 16-bit PCM audio from Gemini TTS into a WAV file.
 * expo-av on the mobile client can play WAV directly, but not raw PCM.
 */
function pcmToWavBase64(
  pcmBase64: string,
  sampleRate = 24000,
  channels = 1,
  bitsPerSample = 16
): string {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");
  const dataLength = pcmBuffer.length;
  const headerSize = 44;
  const fileSize = headerSize + dataLength;

  const wav = Buffer.alloc(fileSize);

  // RIFF header
  wav.write("RIFF", 0);
  wav.writeUInt32LE(fileSize - 8, 4);
  wav.write("WAVE", 8);

  // fmt sub-chunk
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16); // sub-chunk size (PCM = 16)
  wav.writeUInt16LE(1, 20); // audio format (1 = PCM)
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28); // byte rate
  wav.writeUInt16LE(channels * (bitsPerSample / 8), 32); // block align
  wav.writeUInt16LE(bitsPerSample, 34);

  // data sub-chunk
  wav.write("data", 36);
  wav.writeUInt32LE(dataLength, 40);
  pcmBuffer.copy(wav, 44);

  return wav.toString("base64");
}

const VOICEBOX_TIMEOUT_MS = 15_000;
const TTS_CACHE_PREFIX = "tts-cache";

function ttsHash(text: string, voiceGender: string): string {
  return crypto.createHash("sha256").update(`${voiceGender}:${text}`).digest("hex");
}

/**
 * Check Firebase Storage for a previously cached WAV file.
 * Returns { audioBase64, audioUrl } on hit, null on miss.
 */
async function getCachedAudio(
  uid: string,
  hash: string
): Promise<{ audioBase64: string; audioUrl: string } | null> {
  const bucket = admin.storage().bucket();
  const file = bucket.file(`${TTS_CACHE_PREFIX}/${uid}/${hash}.wav`);

  try {
    const [exists] = await file.exists();
    if (!exists) return null;

    const [buffer] = await file.download();
    const [metadata] = await file.getMetadata();
    const audioUrl = metadata.mediaLink as string;

    console.log(`[TTS Cache] HIT for ${hash}`);
    return { audioBase64: buffer.toString("base64"), audioUrl };
  } catch {
    return null;
  }
}

/**
 * Upload generated WAV audio to Firebase Storage cache.
 * Returns the public download URL.
 */
async function cacheAudio(
  uid: string,
  hash: string,
  wavBase64: string
): Promise<string> {
  const bucket = admin.storage().bucket();
  const file = bucket.file(`${TTS_CACHE_PREFIX}/${uid}/${hash}.wav`);
  const buffer = Buffer.from(wavBase64, "base64");

  await file.save(buffer, {
    contentType: "audio/wav",
    metadata: { cacheControl: "public, max-age=31536000" },
  });

  const [signedUrl] = await file.getSignedUrl({
    action: "read",
    expires: "01-01-2030",
  });

  console.log(`[TTS Cache] Stored ${buffer.length} bytes for ${hash}`);
  return signedUrl;
}

/**
 * Try generating speech via Voicebox (Qwen3-TTS).
 * Returns WAV base64 on success, or null if unavailable/failed.
 */
async function tryVoicebox(
  text: string,
  voiceGender: string
): Promise<string | null> {
  const apiUrl = process.env.VOICEBOX_API_URL;
  if (!apiUrl) return null;

  const profileId =
    voiceGender === "male"
      ? process.env.VOICEBOX_MALE_PROFILE_ID
      : process.env.VOICEBOX_FEMALE_PROFILE_ID;

  if (!profileId) {
    console.warn(`[Voicebox] No profile ID configured for gender: ${voiceGender}`);
    return null;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), VOICEBOX_TIMEOUT_MS);

  try {
    const res = await fetch(`${apiUrl}/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, profile_id: profileId }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.warn(`[Voicebox] HTTP ${res.status}: ${await res.text()}`);
      return null;
    }

    // Voicebox returns WAV audio as binary
    const arrayBuffer = await res.arrayBuffer();
    const wavBase64 = Buffer.from(arrayBuffer).toString("base64");

    console.log(`[Voicebox] Generated ${arrayBuffer.byteLength} bytes of WAV audio`);
    return wavBase64;
  } catch (err: any) {
    if (err.name === "AbortError") {
      console.warn("[Voicebox] Request timed out");
    } else {
      console.warn("[Voicebox] Request failed:", err.message);
    }
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Generate speech via Gemini TTS (fallback).
 * Returns WAV base64 on success, or null on failure.
 */
async function generateWithGemini(
  text: string,
  voiceGender: string
): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY not set");
    return null;
  }

  const MALE_VOICES = ["Puck", "Charon", "Enceladus"];
  const FEMALE_VOICES = ["Kore", "Aoede", "Leda"];
  const voicePool = voiceGender === "male" ? MALE_VOICES : FEMALE_VOICES;
  const voiceName = voicePool[Math.floor(Math.random() * voicePool.length)];

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: ["AUDIO" as any],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const pcmBase64 =
    response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

  if (!pcmBase64) {
    console.warn("No audio data returned from Gemini TTS");
    return null;
  }

  return pcmToWavBase64(pcmBase64, 24000, 1, 16);
}

export const generateSpeech = functions
  .runWith({ timeoutSeconds: 120, memory: "512MB" })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
    }

    // Pro-only feature
    const tier = await verifySubscription(context.auth.uid);
    if (tier === "free") {
      throw new functions.https.HttpsError(
        "permission-denied",
        "TTS audio is a Pro feature. Upgrade to unlock."
      );
    }

    const text = sanitizeText(data.text, 2000);
    if (!text) {
      throw new functions.https.HttpsError("invalid-argument", "Text is required.");
    }

    const voiceGender = sanitizeVoiceGender(data.voiceGender);
    console.log(`[generateSpeech] uid=${context.auth.uid}, voiceGender=${voiceGender}`);

    const hash = ttsHash(text, voiceGender);
    const uid = context.auth.uid;

    try {
      // 1. Check cache
      const cached = await getCachedAudio(uid, hash);
      if (cached) {
        console.log("[generateSpeech] Serving from cache");
        return { audioBase64: cached.audioBase64, audioUrl: cached.audioUrl };
      }

      // 2. Generate fresh audio
      let wavBase64: string | null = null;

      // Try Voicebox first (self-hosted Qwen3-TTS)
      wavBase64 = await tryVoicebox(text, voiceGender);
      if (wavBase64) {
        console.log("[generateSpeech] Using Voicebox audio");
      } else {
        // Fall back to Gemini TTS
        console.log("[generateSpeech] Voicebox unavailable, falling back to Gemini TTS");
        wavBase64 = await generateWithGemini(text, voiceGender);
      }

      if (!wavBase64) {
        return { audioBase64: null, audioUrl: null };
      }

      // 3. Cache to Storage (non-blocking — don't let cache failure break playback)
      let audioUrl: string | null = null;
      try {
        audioUrl = await cacheAudio(uid, hash, wavBase64);
      } catch (cacheErr) {
        console.warn("[TTS Cache] Upload failed (non-fatal):", cacheErr);
      }

      return { audioBase64: wavBase64, audioUrl };
    } catch (error) {
      console.error("generateSpeech error:", error);
      return { audioBase64: null, audioUrl: null };
    }
  });
