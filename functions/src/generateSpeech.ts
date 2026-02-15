import * as functions from "firebase-functions/v1";
import { GoogleGenAI } from "@google/genai";

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

export const generateSpeech = functions
  .runWith({ timeoutSeconds: 120, memory: "512MB" })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
    }

    const { text } = data;
    if (!text || typeof text !== "string") {
      throw new functions.https.HttpsError("invalid-argument", "Text is required.");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not set");
      throw new functions.https.HttpsError("internal", "Server configuration error.");
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: ["AUDIO" as any],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: "Kore" },
            },
          },
        },
      });

      const pcmBase64 =
        response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!pcmBase64) {
        console.warn("No audio data returned from Gemini TTS");
        return { audioBase64: null };
      }

      // Convert raw PCM to WAV so expo-av can play it
      const wavBase64 = pcmToWavBase64(pcmBase64, 24000, 1, 16);
      return { audioBase64: wavBase64 };
    } catch (error) {
      console.error("generateSpeech error:", error);
      return { audioBase64: null };
    }
  });
