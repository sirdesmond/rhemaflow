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
    "pNInz6obpgDQGcFmaJgB", // Adam — dominant, firm
    "onwK4e9ZLuTAKqWW03F9", // Daniel — strong broadcaster
    "JBFqnCBsd6RMkjVDRZzb", // George — warm, captivating
    "pqHfZKP75CvOlQylNhV4", // Bill — steady, authoritative
  ];
  const FEMALE_VOICES = [
    "EXAVITQu4vr4xnSDxMaL", // Sarah — clear, confident
    "XrExE9yKIg1WjnnlVkGX", // Matilda — warm, authoritative
    "cgSgspJ2msm6clMCkdW9", // Jessica — strong, expressive
    "hpp4J3VqNfWAUOO0d1Us", // Bella — bold, engaging
    "FGY2WhTYpPnrIDTdsKH5", // Laura — confident, articulate
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

/**
 * Generate speech via ElevenLabs TTS API (Turbo v2.5).
 * Returns MP3 buffer on success, or null on failure.
 */
async function generateWithElevenLabs(
  text: string,
  voiceId: string,
  voiceGender: string
): Promise<Buffer | null> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.error("ELEVENLABS_API_KEY not set");
    return null;
  }

  // Normalize smart quotes/apostrophes to ASCII so TTS doesn't mangle them
  const normalizedText = text
    .replace(/[\u2018\u2019\u0060\u00B4]/g, "'")
    .replace(/[\u201C\u201D]/g, '"');

  const t0 = Date.now();
  console.log(`[ElevenLabs] Generating for ${normalizedText.length} chars with voice=${voiceId}`);

  const body = JSON.stringify({
    text: normalizedText,
    model_id: "eleven_turbo_v2_5",
    voice_settings: voiceGender === "male"
      ? { stability: 0.80, similarity_boost: 0.85, style: 0.45, use_speaker_boost: true }
      : { stability: 0.65, similarity_boost: 0.85, style: 0.55, use_speaker_boost: true },
  });

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

  const buffer = await new Promise<Buffer | null>((resolve, reject) => {
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

        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const result = Buffer.concat(chunks);
          console.log(`[ElevenLabs] ${result.length} bytes in ${Date.now() - t0}ms`);
          resolve(result);
        });
        res.on("error", (err) => reject(err));
      }
    );

    req.on("error", (err) => reject(err));
    req.write(body);
    req.end();
  });

  return buffer;
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
        return { audioBase64: null, audioUrl: cached.audioUrl };
      }

      // 2. Generate fresh audio via ElevenLabs TTS
      const mp3Buffer = await generateWithElevenLabs(text, voiceId, voiceGender);

      if (!mp3Buffer) {
        return { audioBase64: null, audioUrl: null };
      }

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

      // Return base64 for immediate playback, audioUrl for saving to Firestore
      // base64 is used by client for local file playback (reliable pause/resume)
      return { audioBase64: mp3Buffer.toString("base64"), audioUrl };
    } catch (error) {
      console.error("generateSpeech error:", error);
      return { audioBase64: null, audioUrl: null };
    }
  });
