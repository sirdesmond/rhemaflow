import * as functions from "firebase-functions/v1";
import { verifySubscription, getUsage } from "./utils/subscription";

export const getUsageStatus = functions
  .runWith({ timeoutSeconds: 10, memory: "128MB" })
  .https.onCall(async (_data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "Must be signed in."
      );
    }

    const uid = context.auth.uid;
    const tier = await verifySubscription(uid);
    const { count, limit } = await getUsage(uid);

    return {
      tier,
      declarationsToday: count,
      dailyLimit: limit,
      canGenerate: tier === "pro" || count < limit,
    };
  });
