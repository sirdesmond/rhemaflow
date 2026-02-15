import * as functions from "firebase-functions/v1";
import { GoogleGenAI } from "@google/genai";

const SYSTEM_INSTRUCTION = `
You are a fiery, charismatic prayer warrior. Your goal is to generate PERSONALIZED, EXPLOSIVE faith declarations.

INSTRUCTIONS:
1. Declaration: Must be in the FIRST PERSON ("I", "My"). It must be an authoritative decree based on the situation.
2. Scripture Reference: Provide a relevant Bible verse (e.g. "Romans 8:37").
3. Scripture Text: Provide the ACTUAL TEXT of that bible verse.
4. It must be according to teachings or confessions/declarations from Pastor Chris Oyakhilome or Pastor David Oyedepo only.
5. It must always end with "In the mighty name of Jesus. AMEN!"

TONE:
- Use "I COMMAND", "I DECREE", "I AM".
- Reject sickness, lack, and fear.
`;

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

  wav.write("RIFF", 0);
  wav.writeUInt32LE(fileSize - 8, 4);
  wav.write("WAVE", 8);

  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28);
  wav.writeUInt16LE(channels * (bitsPerSample / 8), 32);
  wav.writeUInt16LE(bitsPerSample, 34);

  wav.write("data", 36);
  wav.writeUInt32LE(dataLength, 40);
  pcmBuffer.copy(wav, 44);

  return wav.toString("base64");
}

/**
 * Combined function: generates declaration text + TTS audio in one call.
 * Eliminates an extra cold start and round-trip vs two separate functions.
 */
export const generateDeclaration = functions
  .runWith({ timeoutSeconds: 120, memory: "512MB" })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
    }

    const { category, mood, customText } = data;

    const userSituation = customText || mood;
    if (!userSituation) {
      throw new functions.https.HttpsError("invalid-argument", "Mood or custom text is required.");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not set");
      throw new functions.https.HttpsError("internal", "Server configuration error.");
    }

    const ai = new GoogleGenAI({ apiKey });

    // Step 1: Generate declaration text
    const prompt = `Category: ${category}. User Situation: "${userSituation}". Write a personal declaration, cite the scripture, and write out the scripture text.`;

    let declaration: { text: string; reference: string; scriptureText: string };

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT" as any,
            properties: {
              text: {
                type: "STRING" as any,
                description: "The personalized faith declaration.",
              },
              reference: {
                type: "STRING" as any,
                description: "The Bible verse reference.",
              },
              scriptureText: {
                type: "STRING" as any,
                description: "The full text of the bible verse.",
              },
            },
            required: ["text", "reference", "scriptureText"],
          },
        },
      });

      if (response.text) {
        declaration = JSON.parse(response.text);
      } else {
        throw new Error("Empty response from Gemini");
      }
    } catch (error) {
      console.error("generateDeclaration text error:", error);
      declaration = {
        text: "I AM MORE THAN A CONQUEROR! No weapon formed against me shall prosper! I decree and declare that the power of the living God is at work in my life. In the mighty name of Jesus. AMEN!",
        reference: "Romans 8:37",
        scriptureText:
          "Nay, in all these things we are more than conquerors through him that loved us.",
      };
    }

    // Step 2: Generate TTS audio from the declaration text (same function, no extra cold start)
    let audioBase64: string | null = null;
    try {
      const ttsResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: declaration.text }] }],
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
        ttsResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (pcmBase64) {
        audioBase64 = pcmToWavBase64(pcmBase64, 24000, 1, 16);
      }
    } catch (error) {
      console.error("generateDeclaration TTS error:", error);
    }

    return {
      text: declaration.text,
      reference: declaration.reference,
      scriptureText: declaration.scriptureText,
      audioBase64,
    };
  });
