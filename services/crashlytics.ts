import crashlytics from "@react-native-firebase/crashlytics";
import { auth } from "./firebase";

/**
 * Initialize Crashlytics: enable collection and set user ID on auth changes.
 */
export function initCrashlytics() {
  crashlytics().setCrashlyticsCollectionEnabled(true);

  auth.onAuthStateChanged((user) => {
    if (user) {
      crashlytics().setUserId(user.uid);
    }
  });
}

/**
 * Log a non-fatal error to Crashlytics.
 * In development, also prints to console.error.
 */
export function logError(error: unknown, context?: string) {
  if (__DEV__) {
    console.error(context ?? "Error", error);
  }
  const err = error instanceof Error ? error : new Error(String(error));
  if (context) {
    crashlytics().log(context);
  }
  crashlytics().recordError(err);
}

/**
 * Log a warning message to Crashlytics.
 * In development, also prints to console.warn.
 */
export function logWarning(message: string, context?: string) {
  if (__DEV__) {
    console.warn(context ? `${context}: ${message}` : message);
  }
  crashlytics().log(context ? `[WARN] ${context}: ${message}` : `[WARN] ${message}`);
}
