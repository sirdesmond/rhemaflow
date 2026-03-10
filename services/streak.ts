import { db, auth } from "./firebase";
import { StreakData } from "../types";

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastDeclarationDate: "",
  graceUsed: false,
};

export async function getStreakData(): Promise<StreakData> {
  const uid = auth.currentUser?.uid;
  if (!uid) return DEFAULT_STREAK;

  try {
    const doc = await db.collection("users").doc(uid).get();
    const data = doc.data();
    return data?.streakData ?? DEFAULT_STREAK;
  } catch {
    return DEFAULT_STREAK;
  }
}
