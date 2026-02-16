import { Platform } from "react-native";
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
} from "react-native-purchases";
import { SubscriptionTier } from "../types";

// Replace with real API keys once Play Store / App Store apps are connected in RevenueCat
const REVENUECAT_IOS_KEY = "";
const REVENUECAT_ANDROID_KEY = "goog_nTaxPIFFMmqsRjcdlqTRMiBaiWW";

function isConfigured(): boolean {
  const key =
    Platform.OS === "ios" ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
  return key.length > 0 && !key.startsWith("test_");
}

/**
 * Initialize RevenueCat SDK and identify user by Firebase UID.
 * Skips init if no valid API key is set (prevents crash on real devices).
 */
export async function initRevenueCat(firebaseUid: string): Promise<void> {
  if (!isConfigured()) {
    console.warn("RevenueCat: No production API key set, skipping init");
    return;
  }
  const apiKey =
    Platform.OS === "ios" ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;
  Purchases.configure({ apiKey, appUserID: firebaseUid });
}

/**
 * Extract subscription tier from CustomerInfo.
 */
function tierFromCustomerInfo(info: CustomerInfo): SubscriptionTier {
  return info.entitlements.active["pro"] ? "pro" : "free";
}

/**
 * Check current subscription tier from RevenueCat.
 */
export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  if (!isConfigured()) return "free";
  try {
    const info = await Purchases.getCustomerInfo();
    return tierFromCustomerInfo(info);
  } catch {
    return "free";
  }
}

/**
 * Fetch current offering for paywall display.
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!isConfigured()) return null;
  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch {
    return null;
  }
}

/**
 * Execute a purchase and return the new tier.
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<SubscriptionTier> {
  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return tierFromCustomerInfo(customerInfo);
}

/**
 * Restore previous purchases and return current tier.
 */
export async function restorePurchases(): Promise<SubscriptionTier> {
  if (!isConfigured()) return "free";
  const info = await Purchases.restorePurchases();
  return tierFromCustomerInfo(info);
}

/**
 * Listen for real-time subscription changes.
 */
export function onSubscriptionChange(
  callback: (tier: SubscriptionTier) => void
): () => void {
  if (!isConfigured()) return () => {};
  const listener = (info: CustomerInfo) => {
    callback(tierFromCustomerInfo(info));
  };
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => Purchases.removeCustomerInfoUpdateListener(listener);
}
