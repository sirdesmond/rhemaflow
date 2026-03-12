import * as crypto from "crypto";
import * as admin from "firebase-admin";
import * as functions from "firebase-functions/v1";
import * as https from "https";
import { v4 as uuidv4 } from "uuid";
import { sanitizeText, sanitizeVoiceGender } from "./utils/sanitize";
import { verifySubscription } from "./utils/subscription";

const TTS_CACHE_PREFIX = "tts-cache";

function ttsHash(text: string, voiceId: string): string {
  return crypto.createHash("sha256").update(`${voiceId}:${text}`).digest("hex");
}

/**
 * Deterministically pick a voice based on text hash so the same text
 * always gets the same voice (no random switching).
 */
function pickVoice(text: string, voiceGender: string): string {
  const MALE_VOICES = [
    "nPczCjzI2devNBz1zQrb", // Brian — deep, resonant
    "onwK4e9ZLuTAKqWW03F9", // Daniel — strong broadcaster
    "JBFqnCBsd6RMkjVDRZzb", // George — warm, captivating
    "pqHfZKP75CvOlQylNhV4", // Bill — steady, authoritative
    "iRc49NKOKzEg1DVxmcRs", // Sam - deep, resonant
  ];
  const FEMALE_VOICES = [
    "aFueGIISJUmscc05ZNfD",
    "Lunvplg8eT6CdNzAkjF8",
    "QLAlOeRuLwKX0skeTR7R",
    "iBo5PWT1qLiEyqhM7TrG",
    "8hJ5gV7NwkddDSPrYtar",
  ];
  const pool = voiceGender === "male" ? MALE_VOICES : FEMALE_VOICES;
  const hash = crypto.createHash("md5").update(text).digest();
  return pool[hash[0] % pool.length];
}

/**
 * Check Firebase Storage for a previously cached MP3 file.
 * Returns { audioUrl } on hit, null on miss.
 */
async function getCachedAudio(
  uid: string,
  hash: string
): Promise<{ audioUrl: string } | null> {
  const bucket = admin.storage().bucket();
  const filePath = `${TTS_CACHE_PREFIX}/${uid}/${hash}.mp3`;
  const file = bucket.file(filePath);

  try {
    const [exists] = await file.exists();
    if (!exists) return null;

    const [metadata] = await file.getMetadata();
    const token = metadata.metadata?.firebaseStorageDownloadTokens as string;
    const audioUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`;

    console.log(`[TTS Cache] HIT for ${hash}`);
    return { audioUrl };
  } catch {
    return null;
  }
}

interface WordTiming {
  word: string;
  start: number; // seconds
  end: number;   // seconds
}

interface TtsResult {
  mp3Buffer: Buffer;
  alignment: WordTiming[];
}

/**
 * Generate speech via ElevenLabs TTS API (Turbo v2.5) with word-level timestamps.
 * Returns MP3 buffer + word timing alignment on success, or null on failure.
 */
async function generateWithElevenLabs(
  text: string,
  voiceId: string,
  voiceGender: string
): Promise<TtsResult | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("ELEVENLABS_API_KEY not set");
    return null;
  }

  // Normalize smart quotes/apostrophes to ASCII so TTS doesn't mangle them
  const normalizedText = text
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');

  const VOICE_NAMES: Record<string, string> = {
    "nPczCjzI2devNBz1zQrb": "Brian",
    "onwK4e9ZLuTAKqWW03F9": "Daniel",
    "JBFqnCBsd6RMkjVDRZzb": "George",
    "pqHfZKP75CvOlQylNhV4": "Bill",
    "iRc49NKOKzEg1DVxmcRs": "Sam",
    "aFueGIISJUmscc05ZNfD": "Female1",
    "Lunvplg8eT6CdNzAkjF8": "Female2",
    "QLAlOeRuLwKX0skeTR7R": "Female3",
    "iBo5PWT1qLiEyqhM7TrG": "Female4",
    "8hJ5gV7NwkddDSPrYtar": "Female5",
  };

  const t0 = Date.now();
  console.log(`[ElevenLabs] voice=${voiceId} (${VOICE_NAMES[voiceId] ?? "unknown"}), gender=${voiceGender}, chars=${normalizedText.length}`);

  const body = JSON.stringify({
    text: normalizedText,
    model_id: "eleven_turbo_v2_5",
    voice_settings: voiceGender === "male"
      ? { stability: 0.90, similarity_boost: 0.85, style: 0.45, use_speaker_boost: true }
      : { stability: 0.93, similarity_boost: 0.85, style: 0.45, use_speaker_boost: true },
    speed: 0.70,
  });

  // Use /with-timestamps endpoint for word-level alignment
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps?output_format=mp3_44100_128`;

  const rawJson = await new Promise<string | null>((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        if (res.statusCode !== 200) {
          let errBody = "";
          res.on("data", (chunk) => (errBody += chunk));
          res.on("end", () => {
            console.error(`[ElevenLabs] HTTP ${res.statusCode}: ${errBody}`);
            resolve(null);
          });
          return;
        }

        const chunks: string[] = [];
        res.setEncoding("utf8");
        res.on("data", (chunk: string) => chunks.push(chunk));
        res.on("end", () => {
          console.log(`[ElevenLabs] response received in ${Date.now() - t0}ms`);
          resolve(chunks.join(""));
        });
        res.on("error", (err) => reject(err));
      }
    );

    req.on("error", (err) => reject(err));
    req.write(body);
    req.end();
  });

  if (!rawJson) return null;

  try {
    const parsed = JSON.parse(rawJson);
    const mp3Buffer = Buffer.from(parsed.audio_base64, "base64");
    console.log(`[ElevenLabs] ${mp3Buffer.length} bytes, parsing alignment...`);

    // Group character-level timestamps into word-level timestamps
    const chars: string[] = parsed.alignment?.characters ?? [];
    const starts: number[] = parsed.alignment?.character_start_times_seconds ?? [];
    const ends: number[] = parsed.alignment?.character_end_times_seconds ?? [];

    const alignment: WordTiming[] = [];
    let wordChars: string[] = [];
    let wordStart = 0;
    let wordEnd = 0;

    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === " " || chars[i] === "\n") {
        if (wordChars.length > 0) {
          alignment.push({ word: wordChars.join(""), start: wordStart, end: wordEnd });
          wordChars = [];
        }
      } else {
        if (wordChars.length === 0) wordStart = starts[i] ?? 0;
        wordChars.push(chars[i]);
        wordEnd = ends[i] ?? wordEnd;
      }
    }
    if (wordChars.length > 0) {
      alignment.push({ word: wordChars.join(""), start: wordStart, end: wordEnd });
    }

    console.log(`[ElevenLabs] ${alignment.length} words aligned`);
    return { mp3Buffer, alignment };
  } catch (e) {
    console.error("[ElevenLabs] Failed to parse timestamps response:", e);
    return null;
  }
}

export const generateSpeech = functions
  .runWith({ timeoutSeconds: 60, memory: "512MB" })
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

    const voiceId = pickVoice(text, voiceGender);
    const hash = ttsHash(text, voiceId);
    const uid = context.auth.uid;

    try {
      // 1. Check cache
      const cached = await getCachedAudio(uid, hash);
      if (cached) {
        console.log("[generateSpeech] Serving from cache");
        return { audioBase64: null, audioUrl: cached.audioUrl, alignment: null };
      }

      // 2. Generate fresh audio via ElevenLabs TTS (with timestamps)
      const ttsResult = await generateWithElevenLabs(text, voiceId, voiceGender);

      if (!ttsResult) {
        return { audioBase64: null, audioUrl: null, alignment: null };
      }

      const { mp3Buffer, alignment } = ttsResult;

      // 3. Upload to Storage and get URL
      const bucket = admin.storage().bucket();
      const filePath = `${TTS_CACHE_PREFIX}/${uid}/${hash}.mp3`;
      const file = bucket.file(filePath);
      const token = uuidv4();

      const t1 = Date.now();
      await file.save(mp3Buffer, {
        contentType: "audio/mpeg",
        metadata: {
          cacheControl: "public, max-age=31536000",
          metadata: { firebaseStorageDownloadTokens: token },
        },
      });
      console.log(`[TTS Cache] Stored ${mp3Buffer.length} bytes in ${Date.now() - t1}ms`);

      const audioUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(filePath)}?alt=media&token=${token}`;

      // Return base64 for immediate playback, audioUrl for saving, alignment for highlighting
      return { audioBase64: mp3Buffer.toString("base64"), audioUrl, alignment };
    } catch (error) {
      console.error("generateSpeech error:", error);
      return { audioBase64: null, audioUrl: null, alignment: null };
    }
  });
