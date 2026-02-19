import { GoogleGenAI } from "@google/genai";
import * as functions from "firebase-functions/v1";
import { sanitizeCategory, sanitizeGender, sanitizeMaritalStatus, sanitizeText } from "./utils/sanitize";
import {
  checkAndIncrementUsage,
  checkRateLimit,
  verifySubscription,
} from "./utils/subscription";

const SYSTEM_INSTRUCTION = `
You are a fiery, Spirit-led charismatic prayer warrior and faith-confession writer. Generate personalized, explosive,
first-person faith declarations aligned with Word-of-Faith / New Creation realities commonly emphasized in the
public teachings of Pastor Chris Oyakhilome and Pastor David Oyedepo.
(do not claim to quote them; do not imitate their exact voice; do not invent "as Pastor X said" lines).

INSTRUCTIONS:
1. Declaration: Must be in the FIRST PERSON ("I", "My"). It must be an authoritative decree based on the situation.
2. Scripture Reference: Provide a relevant Bible verse (e.g. "Romans 8:37").
3. Scripture Text: Provide the ACTUAL TEXT of that bible verse.
4. It must be according to teachings or confessions/declarations from Pastor Chris Oyakhilome or Pastor David Oyedepo only.
5. It must always end with "In the mighty name of Jesus. AMEN!"
6. Do not use vague filler. Be specific to my situation.
7. Do not contradict scripture. Keep it biblical and faith-forward.
8. Keep it intense, confident, and triumphant.

TONE:
- Use "I COMMAND", "I DECREE", "I AM", "I DECLARE".
- Reject sickness, lack, fear, confusion, delay when relevant.
`;

export const generateDeclaration = functions
  .runWith({ timeoutSeconds: 60, memory: "256MB" })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError("unauthenticated", "Must be signed in.");
    }

    const uid = context.auth.uid;

    // Subscription & usage checks
    const tier = await verifySubscription(uid);

    if (!checkRateLimit(uid)) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Too many requests. Please slow down."
      );
    }

    const deviceId = data.deviceId as string | undefined;
    const usage = await checkAndIncrementUsage(uid, tier, deviceId);
    if (!usage.allowed) {
      throw new functions.https.HttpsError(
        "resource-exhausted",
        "Daily limit reached. Upgrade to Pro for unlimited declarations."
      );
    }

    // Sanitize inputs
    const category = sanitizeCategory(data.category);
    const mood = sanitizeText(data.mood);
    const customText = sanitizeText(data.customText);
    const gender = sanitizeGender(data.gender);
    const maritalStatus = sanitizeMaritalStatus(data.maritalStatus);
    console.log(`[generateDeclaration] uid=${uid}, category=${category}, gender=${gender}, maritalStatus=${maritalStatus}`);

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

    const genderContext = gender
      ? `\nGender context: The user is ${gender}. This is CRITICAL — you MUST respect the user's gender throughout the declaration:
- Use ONLY ${gender === "male" ? "masculine" : "feminine"} terms: "${gender === "male" ? "man of God, son, king, his, he, brother, father, husband" : "woman of God, daughter, queen, her, she, sister, mother, wife"}".
- NEVER use ${gender === "male" ? "feminine" : "masculine"} terms like "${gender === "male" ? "womb, daughter, queen, her, she, sister, mother, wife, woman of God" : "son, king, his, he, brother, father, husband, man of God"}".
- ${gender === "male" ? "Do NOT reference womb, pregnancy, or female-specific body parts." : "You may reference womb or pregnancy only if relevant to the user's situation."}`
      : "";

    const maritalContext = maritalStatus
      ? `\nMarital status: The user is ${maritalStatus}. This is CRITICAL — do NOT assume a different status:
- ${maritalStatus === "single" ? "The user is NOT married. Do NOT reference spouse, husband, wife, or marriage as current reality. Do NOT call them a husband/wife/father/mother. Declarations about marriage should be future-focused (e.g. \"God is preparing my spouse\")." : "The user IS married. You may reference spouse and marriage as current reality."}`
      : "";

    const prompt = `Category: ${category}. User Situation: "${userSituation}".${genderContext}${maritalContext} Write a personal declaration, cite the scripture, and write out the scripture text.`;

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
      } else {
        throw new Error("Empty response from Gemini");
      }
    } catch (error) {
      console.error("generateDeclaration error:", error);
      return {
        text: "I AM MORE THAN A CONQUEROR! No weapon formed against me shall prosper! I decree and declare that the power of the living God is at work in my life. In the mighty name of Jesus. AMEN!",
        reference: "Romans 8:37",
        scriptureText:
          "Nay, in all these things we are more than conquerors through him that loved us.",
      };
    }
  });
