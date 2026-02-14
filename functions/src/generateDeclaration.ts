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

export const generateDeclaration = functions
  .runWith({ timeoutSeconds: 60, memory: "256MB" })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
    }

    const { category, mood, customText } = data;

    const userSituation = customText || mood;
    if (!userSituation) {
      throw new functions.https.HttpsError("invalid-argument", "Mood or custom text is required.");
    }

    const prompt = `Category: ${category}. User Situation: "${userSituation}". Write a personal declaration, cite the scripture, and write out the scripture text.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not set");
      throw new functions.https.HttpsError("internal", "Server configuration error.");
    }

    const ai = new GoogleGenAI({ apiKey });

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
        return JSON.parse(response.text);
      }
      throw new Error("Empty response from Gemini");
    } catch (error) {
      console.error("generateDeclaration error:", error);

      // Return a fallback declaration so the app doesn't break
      return {
        text: "I AM MORE THAN A CONQUEROR! No weapon formed against me shall prosper! I decree and declare that the power of the living God is at work in my life. In the mighty name of Jesus. AMEN!",
        reference: "Romans 8:37",
        scriptureText:
          "Nay, in all these things we are more than conquerors through him that loved us.",
      };
    }
  });
