import * as admin from "firebase-admin";

const FREE_DAILY_LIMIT = 3;

/**
 * Verify subscription tier via RevenueCat REST API.
 * Falls back to "free" on any error.
 */
export async function verifySubscription(
  uid: string
): Promise<"pro" | "free"> {
  const apiKey = process.env.REVENUECAT_API_KEY;
  if (!apiKey) {
    console.warn("REVENUECAT_API_KEY not set, defaulting to free");
    return "free";
  }

  try {
    const res = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${uid}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!res.ok) {
      // 404 = subscriber not found → free user
      if (res.status === 404) return "free";
      console.error(`RevenueCat API error: ${res.status}`);
      return "free";
    }

    const data: any = await res.json();
    const entitlements = data?.subscriber?.entitlements;
    if (entitlements?.pro) {
      const expiry = entitlements.pro.expires_date;
      // null expiry means lifetime, otherwise check if still active
      if (!expiry || new Date(expiry) > new Date()) {
        return "pro";
      }
    }
    return "free";
  } catch (error) {
    console.error("verifySubscription error:", error);
    return "free";
  }
}

/**
 * Check usage and increment declaration count for today.
 * Uses a Firestore transaction on /users/{uid}/usage/{YYYY-MM-DD}.
 * Pro users are always allowed.
 */
export async function checkAndIncrementUsage(
  uid: string,
  tier: "pro" | "free"
): Promise<{ allowed: boolean; count: number; limit: number }> {
  if (tier === "pro") {
    return { allowed: true, count: 0, limit: Infinity };
  }

  const db = admin.firestore();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const usageRef = db.doc(`users/${uid}/usage/${today}`);

  return db.runTransaction(async (tx) => {
    const doc = await tx.get(usageRef);
    const current = doc.exists ? (doc.data()?.declarationCount ?? 0) : 0;

    if (current >= FREE_DAILY_LIMIT) {
      return { allowed: false, count: current, limit: FREE_DAILY_LIMIT };
    }

    tx.set(usageRef, { declarationCount: current + 1 }, { merge: true });
    return {
      allowed: true,
      count: current + 1,
      limit: FREE_DAILY_LIMIT,
    };
  });
}

/**
 * Read-only usage check (no increment).
 */
export async function getUsage(
  uid: string
): Promise<{ count: number; limit: number }> {
  const db = admin.firestore();
  const today = new Date().toISOString().slice(0, 10);
  const doc = await db.doc(`users/${uid}/usage/${today}`).get();
  const count = doc.exists ? (doc.data()?.declarationCount ?? 0) : 0;
  return { count, limit: FREE_DAILY_LIMIT };
}

/**
 * Simple in-memory per-minute rate limiter.
 * Allows 10 requests per minute per user.
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(uid: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(uid);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(uid, { count: 1, resetAt: now + 60_000 });
    return true;
  }

  if (entry.count >= 10) {
    return false;
  }

  entry.count++;
  return true;
}
