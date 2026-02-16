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
    const proEntitlement = entitlements?.["RhemaFlow Pro"] ?? entitlements?.pro;
    if (proEntitlement) {
      const expiry = proEntitlement.expires_date;
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
 * Tracks by both user ID and device ID to prevent multi-account abuse.
 * Pro users are always allowed.
 */
export async function checkAndIncrementUsage(
  uid: string,
  tier: "pro" | "free",
  deviceId?: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  if (tier === "pro") {
    return { allowed: true, count: 0, limit: Infinity };
  }

  const db = admin.firestore();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const hasDeviceId = deviceId && deviceId !== "unknown-ios" && deviceId !== "unknown-android";

  const usageRef = db.doc(`users/${uid}/usage/${today}`);
  const deviceUsageRef = hasDeviceId
    ? db.doc(`deviceUsage/${deviceId}/daily/${today}`)
    : null;

  return db.runTransaction(async (tx) => {
    // Read all docs inside transaction for consistency
    const userDoc = await tx.get(usageRef);
    const userCount = userDoc.exists ? (userDoc.data()?.declarationCount ?? 0) : 0;

    let deviceCount = 0;
    if (deviceUsageRef) {
      const deviceDoc = await tx.get(deviceUsageRef);
      deviceCount = deviceDoc.exists ? (deviceDoc.data()?.declarationCount ?? 0) : 0;
    }

    // Check device limit (prevents multi-account abuse)
    if (deviceUsageRef && deviceCount >= FREE_DAILY_LIMIT) {
      return { allowed: false, count: deviceCount, limit: FREE_DAILY_LIMIT };
    }

    // Check user limit
    if (userCount >= FREE_DAILY_LIMIT) {
      return { allowed: false, count: userCount, limit: FREE_DAILY_LIMIT };
    }

    // Increment both counters
    tx.set(usageRef, { declarationCount: userCount + 1 }, { merge: true });
    if (deviceUsageRef) {
      tx.set(deviceUsageRef, { declarationCount: deviceCount + 1 }, { merge: true });
    }

    return {
      allowed: true,
      count: userCount + 1,
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
