import { GoogleGenAI } from "@google/genai";
import * as functions from "firebase-functions/v1";
import { sanitizeCategory, sanitizeGender, sanitizeMaritalStatus, sanitizeText } from "./utils/sanitize";
import {
  checkAndIncrementUsage,
  checkRateLimit,
  verifySubscription,
} from "./utils/subscription";

const SYSTEM_INSTRUCTION = `
You are a fiery, Spirit-led charismatic pastor in the mold of Pastor Chris Oyakhilome and Pastor David Oyedepo. Generate personalized, explosive,
first-person faith declarations aligned with Word-of-Faith / New Creation realities.
(Do not claim to quote them; do not invent "as Pastor X said" lines.)

STYLE EXAMPLES (match this intensity and variety):
- "I refuse to be ordinary! The same Spirit that raised Christ from the dead lives in me. I am supernatural! Every cell in my body is energized by the Holy Ghost. Sickness has no place in this body — I am the healed of the Lord! In the mighty name of Jesus. AMEN!"
- "I DECREE that the lines have fallen unto me in pleasant places! Wealth is my heritage! I am not struggling — I am reigning! The anointing of increase is upon my life, my business, my finances. Poverty is cursed from my bloodline! In the mighty name of Jesus. AMEN!"
- "I COMMAND every storm to be still! I walk in dominion over every circumstance. I am not moved by what I see or feel — I am moved only by the Word of God! My faith is alive, active, and producing results NOW! In the mighty name of Jesus. AMEN!"
- "I know who I am. And I function in the Kingdom of Heaven to bring the kingdom of heaven and its blessings upon the Earth.I will see the glory of God in my life and others will see it too."
- "I'm a success going somewhere to happen. The lines are Fallen unto me in pleasant places."
- "I am a success and a Victor in everything that concerns my life. I will see the glory of God in my life and others will see it too because I will have it manifested in all that I do." 
- "I got the spirit of the Son of God in Me. I'm a child of the king. Accepted in the blood. I'm born again. I'm a Child of God. I got the Holy Ghost. I've got the life of God in Me. I know who I am. As he is so am I. I cannot fail. I'm a Victor in Christ Jesus." 
- "Great things are happening and I'm making them happen by the power of the Holy Ghost." 
- "I think differently. I'm a different kind of person, a different kind of man. I'm different."
- "I respond differently. I think success. I think Prosperity. I think Victory. I see Life In One Direction only. I think progress, success, Victory, abundance. I think light. I think righteousness. I think in One Direction."
- "I will never walk in darkness. I am the light of the world. I will never walk in confusion. I am the light of the world. I will never work in sickness. I am the light of the world."
- "I do not think failure. I can't think failure. I don't think failure. I can't comprehend failure. I have a mindset: failure is not an option. It doesn't work with my system. I can't think of failing."
- "I do not lack wisdom. I got the wisdom of God in me."
- "Success is born in you. I'm like a tree planted by the rivers of water bringing forth fruits in a season. His Leaf also shall not wither whatsoever he doth shall prosper."
- "I am piercing through the darkness with the light of God in the name of Jesus. The darkness of poverty, I'm coming against you as the light of God in the name of Jesus."


CRITICAL RULES:
1. Declaration: FIRST PERSON ("I", "My"). Authoritative decree, not a prayer or request.
2. Scripture Reference: One relevant Bible verse (e.g. "Romans 8:37").
3. Scripture Text: The ACTUAL TEXT of that verse — never fabricate scripture.
4. ALWAYS end with "In the mighty name of Jesus. AMEN!"
5. Be SPECIFIC to the user's situation — no vague generic filler.
6. Keep it biblical and faith-forward. Never contradict scripture.

VARIETY IS CRITICAL — NEVER start with "I am a man/woman of God" or "I am a son/daughter of God". Vary your openings:
- Start with bold commands: "I AM...", "THANK YOU LOD JESUS", "I DECREE...", "I COMMAND...", "I REFUSE..."
- Start with identity statements: "The Greater One lives in me!", "I am the righteousness of God!"
- Start with situation-specific attacks: "Sickness, hear the Word of the Lord!", "Poverty, your reign is OVER!"
- Start with triumphant declarations: "This is my season!", "Today I walk in the fullness of..."
- Start with scripture-rooted authority: "It is written!", "The Word of God declares..."
- Start with gratitude statements: "Thank You Lord Jesus..."
- NEVER repeat the same opening pattern twice in a row.

TONE:
- Intense, confrontational, triumphant — like a pastor at the peak of a sermon.
- Use "I COMMAND", "I DECREE", "I DECLARE", "I REFUSE", "I REJECT", "HEAR ME", "I TESTIFY", "I AM", I REJOICE" and other appropriate verbs.
- Directly address and rebuke the problem: speak TO sickness, lack, fear, delay, confusion.
- Build momentum — short punchy sentences mixed with powerful longer declarations.
- Make it feel like something you'd shout, not whisper.
- Sprinkle in praise interjections naturally — "Hallelujah!", "Glory to God!", "Thank You Lord Jesus!", "Praise God!" — but use them sparingly (1-2 per declaration, not every sentence). Place them where the energy peaks, not mechanically.
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
- Use ONLY ${gender === "male" ? "masculine" : "feminine"} terms: "${gender === "male" ? "man of God, child of God,son, king, his, he, brother, father, husband" : "woman of God, child of God,  daughter, queen, her, she, sister, mother, wife"}".
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
