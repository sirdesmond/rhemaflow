import { useState, useEffect, useMemo } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator, StyleSheet, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, Flame, Infinity, Mic, Heart, Check } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PurchasesPackage } from "react-native-purchases";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
} from "../../services/subscription";
import { linkAccount } from "../../services/auth";
import { logError } from "../../services/crashlytics";
import {
  trackPaywallDismissed,
  trackPurchaseStarted,
  trackPurchaseCompleted,
  trackPurchaseFailed,
  trackRestorePurchases,
} from "../../services/analytics";

const FEATURES = [
  { icon: Infinity, label: "Unlimited declarations" },
  { icon: Mic, label: "TTS audio playback" },
  { icon: Heart, label: "Save to favorites" },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshUsage } = useSubscription();
  const { colors, shadows } = useTheme();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isAnonymous = user?.isAnonymous ?? true;

  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  useEffect(() => {
    if (isAnonymous) {
      setLoading(false);
      return;
    }
    loadOfferings();
  }, [isAnonymous]);

  const loadOfferings = async () => {
    setLoading(true);
    try {
      const offerings = await getOfferings();
      const current = offerings?.current;
      if (current) {
        // Order: monthly, annual, lifetime
        const sorted = [
          current.monthly,
          current.annual,
          current.lifetime,
        ].filter(Boolean) as PurchasesPackage[];
        setPackages(sorted);
        // Default select annual if available
        setSelectedIndex(sorted.length > 1 ? 1 : 0);
      }
    } catch (error) {
      logError(error, "Failed to load offerings");
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!packages[selectedIndex]) return;
    const productId = packages[selectedIndex].identifier;
    setPurchasing(true);
    trackPurchaseStarted(productId);
    try {
      const newTier = await purchasePackage(packages[selectedIndex]);
      if (newTier === "pro") {
        trackPurchaseCompleted(productId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await refreshUsage();
        router.back();
      }
    } catch (error: any) {
      if (error.userCancelled) {
        // User cancelled — no alert needed
      } else if (error.code === "PRODUCT_ALREADY_PURCHASED" || error.message?.includes("already")) {
        // Already subscribed — treat as success
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await refreshUsage();
        router.back();
      } else if (error.message?.includes("simulator") || error.code === "STORE_PROBLEM") {
        Alert.alert(
          "Simulator Detected",
          "In-app purchases don't work in the simulator. Use a real device with a sandbox account to test purchases."
        );
      } else {
        trackPurchaseFailed(productId, error.message || "unknown");
        Alert.alert("Purchase Failed", error.message || "Please try again.");
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    try {
      const tier = await restorePurchases();
      if (tier === "pro") {
        trackRestorePurchases(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await refreshUsage();
        Alert.alert("Restored!", "Your Pro subscription has been restored.");
        router.back();
      } else {
        trackRestorePurchases(false);
        Alert.alert("No Purchases Found", "We couldn't find any active subscriptions.");
      }
    } catch {
      trackRestorePurchases(false);
      Alert.alert("Restore Failed", "Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleSignIn = async (provider: "google" | "apple") => {
    try {
      await linkAccount(provider);
      // After linking, useAuth will update, component re-renders, offerings load
    } catch (error: any) {
      const code = error?.code;
      // User cancelled — don't show error
      if (
        code === "ERR_REQUEST_CANCELED" ||
        code === "SIGN_IN_CANCELLED" ||
        error?.userCancelled
      ) return;
      logError(error, "Paywall sign-in");
      Alert.alert("Sign In Failed", error.message || "Please try again.");
    }
  };

  const getPackageLabel = (index: number) => {
    const labels = ["Monthly", "Annual", "Lifetime"];
    return labels[index] ?? "Plan";
  };

  const getPackageBadge = (index: number) => {
    if (index === 1) return "Save 30%";
    if (index === 2) return "Pay Once";
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Close button */}
      <Pressable
        style={styles.closeButton}
        onPress={() => {
          trackPaywallDismissed();
          router.back();
        }}
      >
        <X size={20} color={colors.textPrimary} />
      </Pressable>

      {/* Branding */}
      <View style={styles.branding}>
        <LinearGradient
          colors={[COLORS.fireOrange, COLORS.warmGold]}
          style={styles.iconCircle}
        >
          <Flame size={32} color="white" fill="white" />
        </LinearGradient>
        <Text style={styles.title}>RhemaFlow Pro</Text>
        <Text style={styles.subtitle}>
          Unlock the full power of your declarations
        </Text>
      </View>

      {/* Feature list */}
      <View style={styles.features}>
        {FEATURES.map((feat) => (
          <View key={feat.label} style={styles.featureRow}>
            <View style={styles.featureIcon}>
              <feat.icon size={18} color={colors.accent} />
            </View>
            <Text style={styles.featureText}>{feat.label}</Text>
          </View>
        ))}
      </View>

      {/* Content area */}
      <View style={styles.contentArea}>
        {loading ? (
          <ActivityIndicator color={colors.accent} size="large" />
        ) : isAnonymous ? (
          // Anonymous: prompt sign-in first
          <View style={styles.anonSection}>
            <Text style={styles.anonTitle}>Create an account first</Text>
            <Text style={styles.anonSubtitle}>
              Sign in to subscribe and unlock Pro features
            </Text>
            <Pressable
              style={[styles.signInButton, { backgroundColor: "#4285F4" }]}
              onPress={() => handleSignIn("google")}
            >
              <Text style={[styles.signInText, { color: colors.textInverse }]}>Continue with Google</Text>
            </Pressable>
            <Pressable
              style={[styles.signInButton, { backgroundColor: colors.textPrimary }]}
              onPress={() => handleSignIn("apple")}
            >
              <Text style={[styles.signInText, { color: colors.textInverse }]}>
                Continue with Apple
              </Text>
            </Pressable>
          </View>
        ) : packages.length === 0 ? (
          // No offerings available (no API key or store not connected)
          <View style={styles.anonSection}>
            <Text style={styles.anonTitle}>Coming Soon</Text>
            <Text style={styles.anonSubtitle}>
              Pro subscriptions are not yet available. Check back soon for unlimited declarations, TTS audio, and more.
            </Text>
            <Pressable
              style={[styles.signInButton, { backgroundColor: colors.backgroundWarm }]}
              onPress={() => router.back()}
            >
              <Text style={[styles.signInText, { color: colors.textPrimary }]}>Got it</Text>
            </Pressable>
          </View>
        ) : (
          // Signed-in: show packages
          <>
            <View style={styles.packages}>
              {packages.map((pkg, i) => {
                const badge = getPackageBadge(i);
                return (
                  <Pressable
                    key={pkg.identifier}
                    style={[
                      styles.packageOption,
                      selectedIndex === i && styles.packageSelected,
                    ]}
                    onPress={() => setSelectedIndex(i)}
                  >
                    <View style={styles.packageRow}>
                      <View
                        style={[
                          styles.radio,
                          selectedIndex === i && styles.radioSelected,
                        ]}
                      >
                        {selectedIndex === i && (
                          <Check size={12} color="white" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.packageLabel}>
                          {getPackageLabel(i)}
                        </Text>
                        <Text style={styles.packagePrice}>
                          {pkg.product.priceString}
                          {i < 2 ? (i === 0 ? "/mo" : "/yr") : ""}
                        </Text>
                      </View>
                      {badge && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{badge}</Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              style={[styles.purchaseButton, purchasing && { opacity: 0.6 }]}
              onPress={handlePurchase}
              disabled={purchasing}
            >
              <LinearGradient
                colors={[COLORS.fireOrange, COLORS.warmGold]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.purchaseGradient}
              >
                {purchasing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.purchaseText}>Subscribe Now</Text>
                )}
              </LinearGradient>
            </Pressable>

            <Pressable onPress={handleRestore} disabled={purchasing}>
              <Text style={styles.restoreText}>Restore Purchases</Text>
            </Pressable>
          </>
        )}
      </View>

      {/* Legal links */}
      <View style={styles.legalRow}>
        <Pressable onPress={() => Linking.openURL("https://sirdesmond.github.io/rhemaflow/terms-of-use.html")}>
          <Text style={styles.legalText}>Terms of Use</Text>
        </Pressable>
        <Text style={styles.legalSeparator}>|</Text>
        <Pressable onPress={() => Linking.openURL("https://sirdesmond.github.io/rhemaflow/privacy-policy.html")}>
          <Text style={styles.legalText}>Privacy Policy</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, shadows: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
    },
    closeButton: {
      alignSelf: "flex-end",
      padding: 8,
      backgroundColor: colors.surface,
      borderRadius: 20,
      ...shadows.small,
    },
    branding: {
      alignItems: "center",
      marginTop: 16,
      gap: 12,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      justifyContent: "center",
      alignItems: "center",
    },
    title: {
      fontFamily: "Cinzel",
      fontSize: 28,
      color: colors.accent,
      textTransform: "uppercase",
      letterSpacing: 2,
    },
    subtitle: {
      fontFamily: "Lato",
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
    },
    features: {
      marginTop: 32,
      gap: 16,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
    },
    featureIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.accentMuted,
      justifyContent: "center",
      alignItems: "center",
    },
    featureText: {
      fontFamily: "Lato",
      fontSize: 16,
      color: colors.textPrimary,
    },
    contentArea: {
      flex: 1,
      justifyContent: "center",
    },
    packages: {
      gap: 10,
      marginBottom: 24,
    },
    packageOption: {
      borderRadius: 14,
      padding: 16,
      backgroundColor: colors.surface,
      ...shadows.small,
    },
    packageSelected: {
      backgroundColor: colors.accentMuted,
      borderWidth: 2,
      borderColor: colors.accent,
    },
    packageRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    radio: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.border,
      justifyContent: "center",
      alignItems: "center",
    },
    radioSelected: {
      borderColor: colors.accent,
      backgroundColor: colors.accent,
    },
    packageLabel: {
      fontFamily: "Lato-Bold",
      fontSize: 16,
      color: colors.textPrimary,
    },
    packagePrice: {
      fontFamily: "Lato",
      fontSize: 14,
      color: colors.textSecondary,
      marginTop: 2,
    },
    badge: {
      backgroundColor: colors.accentMuted,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    badgeText: {
      fontFamily: "Lato-Bold",
      fontSize: 11,
      color: colors.accent,
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    purchaseButton: {
      borderRadius: 16,
      overflow: "hidden",
      marginBottom: 16,
    },
    purchaseGradient: {
      height: 56,
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 16,
    },
    purchaseText: {
      fontFamily: "Lato-Bold",
      fontSize: 18,
      color: "white",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    restoreText: {
      fontFamily: "Lato",
      fontSize: 14,
      color: colors.textTertiary,
      textAlign: "center",
      textDecorationLine: "underline",
    },
    anonSection: {
      alignItems: "center",
      gap: 16,
    },
    anonTitle: {
      fontFamily: "Cinzel",
      fontSize: 20,
      color: colors.textPrimary,
      textAlign: "center",
    },
    anonSubtitle: {
      fontFamily: "Lato",
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 8,
    },
    signInButton: {
      width: "100%",
      height: 50,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    signInText: {
      fontFamily: "Lato-Bold",
      fontSize: 16,
      color: colors.textInverse,
    },
    legalRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: 8,
      paddingBottom: 8,
    },
    legalText: {
      fontFamily: "Lato",
      fontSize: 12,
      color: colors.textTertiary,
      textDecorationLine: "underline",
    },
    legalSeparator: {
      fontFamily: "Lato",
      fontSize: 12,
      color: colors.textTertiary,
    },
  });
