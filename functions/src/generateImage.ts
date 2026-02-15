import * as functions from "firebase-functions/v1";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import { verifySubscription } from "./utils/subscription";
import { sanitizeCategory } from "./utils/sanitize";

const IMAGE_THEMES: Record<string, string> = {
  "Health & Healing":
    "rushing living water, emerald fire, radiant vitality, supernatural healing light",
  "Wealth & Prosperity":
    "gold bullion texture, overflowing cornucopia, purple royal velvet, diamond refraction",
  "Protection & Fearlessness":
    "lion roaring, burning shield, blue fire, fortress wall, angelic feathers",
  "Success & Victory":
    "summit of a mountain, sunrise breaking through storm clouds, eagle wings, lightning",
  Identity:
    "golden crown, royal scepter, intense spotlight, galaxy background",
  "Wisdom & Guidance":
    "burning bush, ancient scroll glowing, neural network of light, starry cosmos",
  General:
    "epic divine light, exploding golden rays, dramatic cinematic lighting",
};

export const generateImage = functions
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
        "AI background images are a Pro feature. Upgrade to unlock."
      );
    }

    const category = sanitizeCategory(data.category);
    const visualTheme = IMAGE_THEMES[category] || IMAGE_THEMES["General"];

    const prompt = `Epic, cinematic, high-contrast spiritual background. Theme: ${visualTheme}. Intense colors, 4k, digital art style, volumetric lighting. No text.`;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("GEMINI_API_KEY not set");
      throw new functions.https.HttpsError("internal", "Server configuration error.");
    }

    const ai = new GoogleGenAI({ apiKey });

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: { parts: [{ text: prompt }] },
        config: {
          imageConfig: { aspectRatio: "3:4" as any },
        },
      });

      // Find the image part in the response
      const imagePart = response.candidates?.[0]?.content?.parts?.find(
        (p: any) => p.inlineData
      );

      if (!imagePart?.inlineData?.data) {
        console.warn("No image data returned from Gemini");
        return { imageUrl: null };
      }

      // Upload to Firebase Storage for persistent access
      const bucket = admin.storage().bucket();
      const fileName = `declarations/${context.auth.uid}/${uuidv4()}.png`;
      const file = bucket.file(fileName);

      const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
      await file.save(imageBuffer, {
        contentType: "image/png",
        metadata: {
          cacheControl: "public,max-age=31536000",
        },
      });

      await file.makePublic();
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

      return { imageUrl };
    } catch (error) {
      console.error("generateImage error:", error);
      return { imageUrl: null };
    }
  });
