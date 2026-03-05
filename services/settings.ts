import { db, auth } from "./firebase";
import { UserSettings, DeclarationCategory } from "../types";

const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: false,
  notificationTime: "08:00",
  notificationTimes: [],
  defaultAtmosphere: "glory",
  defaultCategory: DeclarationCategory.GENERAL,
  gender: null,
  maritalStatus: null,
  voiceGender: "female",
  onboardingComplete: false,
  ageRange: null,
  lifeStage: null,
  faithFocusAreas: [],
};

/**
 * Reads the current user's settings from Firestore.
 * Returns defaults if the document or settings field doesn't exist.
 */
export async function getUserSettings(): Promise<UserSettings> {
  const uid = auth.currentUser?.uid;
  if (!uid) return DEFAULT_SETTINGS;

  try {
    const doc = await db.collection("users").doc(uid).get();
    if (doc.exists) {
      const data = doc.data();
      const raw = data?.settings || {};
      const settings = { ...DEFAULT_SETTINGS, ...raw };
      // Migrate: if old notificationTime exists but notificationTimes is empty, migrate it
      if (raw.notificationTime && (!raw.notificationTimes || raw.notificationTimes.length === 0)) {
        settings.notificationTimes = [settings.notificationTime];
      }
      return settings;
    }
  } catch (e) {
    console.error("getUserSettings error:", e);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Updates specific fields in the user's settings.
 * Merges with existing settings (doesn't overwrite the whole object).
 */
export async function updateUserSettings(
  partial: Partial<UserSettings>
): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;

  try {
    await db.collection("users").doc(uid).set(
      { settings: partial },
      { merge: true }
    );
  } catch (e) {
    console.error("updateUserSettings error:", e);
  }
}
