import * as admin from "firebase-admin";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastDeclarationDate: string;
  graceUsed: boolean;
}

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastDeclarationDate: "",
  graceUsed: false,
};

function toDateString(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateString(d);
}

/**
 * Updates the user's declaration streak after a successful generation.
 * Grace day mechanic: miss 1 day and streak holds; miss 2 and it resets.
 */
export async function updateStreak(uid: string): Promise<StreakData> {
  const db = admin.firestore();
  const userRef = db.doc(`users/${uid}`);
  const doc = await userRef.get();

  const existing: StreakData = doc.exists && doc.data()?.streakData
    ? doc.data()!.streakData
    : { ...DEFAULT_STREAK };

  const today = toDateString(new Date());
  const yesterday = daysAgo(1);
  const twoDaysAgo = daysAgo(2);

  // Already generated today — no change
  if (existing.lastDeclarationDate === today) {
    return existing;
  }

  let updated: StreakData;

  if (existing.lastDeclarationDate === yesterday) {
    // Consecutive day — increment streak
    updated = {
      currentStreak: existing.currentStreak + 1,
      longestStreak: Math.max(existing.currentStreak + 1, existing.longestStreak),
      lastDeclarationDate: today,
      graceUsed: false,
    };
  } else if (existing.lastDeclarationDate === twoDaysAgo && !existing.graceUsed) {
    // Missed yesterday but grace day available — keep streak, mark grace used
    updated = {
      currentStreak: existing.currentStreak + 1,
      longestStreak: Math.max(existing.currentStreak + 1, existing.longestStreak),
      lastDeclarationDate: today,
      graceUsed: true,
    };
  } else {
    // Streak broken — reset to 1
    updated = {
      currentStreak: 1,
      longestStreak: Math.max(1, existing.longestStreak),
      lastDeclarationDate: today,
      graceUsed: false,
    };
  }

  await userRef.set({ streakData: updated }, { merge: true });
  return updated;
}
