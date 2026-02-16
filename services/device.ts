import * as Application from "expo-application";
import { Platform } from "react-native";

/**
 * Get a stable device identifier.
 * iOS: uses identifierForVendor (resets on app reinstall)
 * Android: uses androidId (persists across reinstalls)
 */
export async function getDeviceId(): Promise<string> {
  if (Platform.OS === "ios") {
    return (await Application.getIosIdForVendorAsync()) ?? "unknown-ios";
  }
  return Application.androidId ?? "unknown-android";
}
