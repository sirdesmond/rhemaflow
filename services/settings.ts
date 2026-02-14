import { db, auth } from "./firebase";
import { UserSettings, DeclarationCategory } from "../types";

const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: false,
  notificationTime: "08:00",
  defaultAtmosphere: "glory",
  defaultCategory: DeclarationCategory.GENERAL,
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
      return { ...DEFAULT_SETTINGS, ...data?.settings };
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
    const settingsUpdate: Record<string, any> = {};
    for (const [key, value] of Object.entries(partial)) {
      settingsUpdate[`settings.${key}`] = value;
    }
    await db.collection("users").doc(uid).update(settingsUpdate);
  } catch (e) {
    console.error("updateUserSettings error:", e);
  }
}
