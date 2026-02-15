import firebase from "@react-native-firebase/app";
import "@react-native-firebase/auth";
import "@react-native-firebase/firestore";
import "@react-native-firebase/storage";
import "@react-native-firebase/functions";

// Firebase initializes automatically from GoogleService-Info.plist (iOS)
// and google-services.json (Android). These imports ensure each module
// is registered with the default app instance.

export const auth = firebase.app().auth();
export const db = firebase.app().firestore();
export const storage = firebase.app().storage();
export const functions = firebase.app().functions();

// App Check — initialized lazily to avoid blocking app startup.
// Uses DeviceCheck (iOS) / Play Integrity (Android).
// Requires @react-native-firebase/app-check to be installed.
// Start in monitoring mode; enforce after validating traffic in Firebase Console.
export async function initAppCheck() {
  try {
    // @ts-ignore — module may not be installed yet
    const appCheckModule = await import("@react-native-firebase/app-check");
    const appCheck = appCheckModule.default();
    await appCheck.activate("apple-device-check", false);
  } catch (error) {
    console.warn("App Check init failed (non-fatal):", error);
  }
}
