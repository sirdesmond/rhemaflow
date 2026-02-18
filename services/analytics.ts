import analytics from "@react-native-firebase/analytics";
import { DeclarationCategory } from "../types";

/**
 * Firebase Analytics event tracking for RhemaFlow.
 *
 * Events are fire-and-forget — errors are silently caught
 * so analytics never disrupts the user experience.
 */

function log(event: string, params?: Record<string, any>) {
  analytics().logEvent(event, params).catch(() => {});
}

// ── Auth ──────────────────────────────────────────────

export function trackSignIn(method: "google" | "apple" | "anonymous") {
  analytics().logLogin({ method }).catch(() => {});
}

export function trackSignUp(method: "google" | "apple" | "anonymous") {
  analytics().logSignUp({ method }).catch(() => {});
}

export function trackAccountLinked(method: "google" | "apple") {
  log("account_linked", { method });
}

export function trackSignOut() {
  log("sign_out");
}

export function trackDeleteAccount() {
  log("delete_account");
}

// ── Declarations ──────────────────────────────────────

export function trackDeclarationGenerated(
  category: DeclarationCategory,
  isPro: boolean
) {
  log("declaration_generated", { category, tier: isPro ? "pro" : "free" });
}

export function trackDeclarationSaved(category: DeclarationCategory) {
  log("declaration_saved", { category });
}

export function trackDeclarationShared(category: DeclarationCategory) {
  log("declaration_shared", { category });
}

export function trackFreshFire(category: DeclarationCategory) {
  log("fresh_fire", { category });
}

// ── Audio ─────────────────────────────────────────────

export function trackAudioPlayed() {
  log("audio_played");
}

export function trackAtmosphereChanged(atmosphere: string) {
  log("atmosphere_changed", { atmosphere });
}

// ── Subscription & Paywall ────────────────────────────

export function trackPaywallViewed(source: string) {
  log("paywall_viewed", { source });
}

export function trackPaywallDismissed() {
  log("paywall_dismissed");
}

export function trackPurchaseStarted(product: string) {
  log("purchase_started", { product });
}

export function trackPurchaseCompleted(product: string) {
  log("purchase_completed", { product });
}

export function trackPurchaseFailed(product: string, error: string) {
  log("purchase_failed", { product, error });
}

export function trackRestorePurchases(success: boolean) {
  log("restore_purchases", { success });
}

// ── Settings ──────────────────────────────────────────

export function trackNotificationToggled(enabled: boolean) {
  log("notification_toggled", { enabled });
}

export function trackNotificationTimeChanged(time: string) {
  log("notification_time_changed", { time });
}

export function trackDefaultAtmosphereChanged(atmosphere: string) {
  log("default_atmosphere_changed", { atmosphere });
}

// ── Navigation / Screens ──────────────────────────────

export function trackScreenView(screenName: string) {
  analytics()
    .logScreenView({ screen_name: screenName, screen_class: screenName })
    .catch(() => {});
}

// ── User Properties ───────────────────────────────────

export function setUserTier(tier: "free" | "pro") {
  analytics().setUserProperty("subscription_tier", tier).catch(() => {});
}
