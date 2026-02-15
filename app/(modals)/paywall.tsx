import { useState, useEffect } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { X, Flame, Infinity, Mic, ImageIcon, Check } from "lucide-react-native";
import { useRouter } from "expo-router";
import { PurchasesPackage } from "react-native-purchases";
import * as Haptics from "expo-haptics";
import { COLORS } from "../../constants/theme";
import { useAuth } from "../../hooks/useAuth";
import { useSubscription } from "../../hooks/useSubscription";
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
} from "../../services/subscription";
import { signInWithGoogle, signInWithApple } from "../../services/auth";

const FEATURES = [
  { icon: Infinity, label: "Unlimited declarations" },
  { icon: Mic, label: "TTS audio playback" },
  { icon: ImageIcon, label: "AI background images" },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { refreshUsage } = useSubscription();
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const isAnonymous = user?.isAnonymous ?? true;

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
      console.error("Failed to load offerings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    if (!packages[selectedIndex]) return;
    setPurchasing(true);
    try {
      const newTier = await purchasePackage(packages[selectedIndex]);
      if (newTier === "pro") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await refreshUsage();
        router.back();
      }
    } catch (error: any) {
      if (error.userCancelled) {
        // User cancelled — no alert needed
      } else if (error.message?.includes("simulator") || error.code === "STORE_PROBLEM") {
        Alert.alert(
          "Simulator Detected",
          "In-app purchases don't work in the simulator. Use a real device with a sandbox account to test purchases."
        );
      } else {
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await refreshUsage();
        Alert.alert("Restored!", "Your Pro subscription has been restored.");
        router.back();
      } else {
        Alert.alert("No Purchases Found", "We couldn't find any active subscriptions.");
      }
    } catch {
      Alert.alert("Restore Failed", "Please try again.");
    } finally {
      setPurchasing(false);
    }
  };

  const handleSignIn = async (provider: "google" | "apple") => {
    try {
      if (provider === "google") await signInWithGoogle();
      else await signInWithApple();
      // After sign-in, useAuth will update, component re-renders, offerings load
    } catch (error: any) {
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
        onPress={() => router.back()}
      >
        <X size={20} color="white" />
      </Pressable>

      {/* Branding */}
      <View style={styles.branding}>
        <LinearGradient
          colors={[COLORS.fireOrange, COLORS.divineGold]}
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
              <feat.icon size={18} color={COLORS.divineGold} />
            </View>
            <Text style={styles.featureText}>{feat.label}</Text>
          </View>
        ))}
      </View>

      {/* Content area */}
      <View style={styles.contentArea}>
        {loading ? (
          <ActivityIndicator color={COLORS.divineGold} size="large" />
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
              <Text style={styles.signInText}>Continue with Google</Text>
            </Pressable>
            <Pressable
              style={[styles.signInButton, { backgroundColor: "white" }]}
              onPress={() => handleSignIn("apple")}
            >
              <Text style={[styles.signInText, { color: "black" }]}>
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
              style={[styles.signInButton, { backgroundColor: COLORS.glass, borderWidth: 1, borderColor: COLORS.glassBorder }]}
              onPress={() => router.back()}
            >
              <Text style={styles.signInText}>Got it</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.voidBlack,
    padding: 24,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
    backgroundColor: COLORS.glass,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
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
    color: COLORS.divineGold,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: "Lato",
    fontSize: 16,
    color: COLORS.slate400,
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
    backgroundColor: "rgba(251,191,36,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: {
    fontFamily: "Lato",
    fontSize: 16,
    color: "white",
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
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 14,
    padding: 16,
    backgroundColor: COLORS.glass,
  },
  packageSelected: {
    borderColor: COLORS.divineGold,
    backgroundColor: "rgba(251,191,36,0.08)",
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
    borderColor: COLORS.slate700,
    justifyContent: "center",
    alignItems: "center",
  },
  radioSelected: {
    borderColor: COLORS.divineGold,
    backgroundColor: COLORS.divineGold,
  },
  packageLabel: {
    fontFamily: "Lato-Bold",
    fontSize: 16,
    color: "white",
  },
  packagePrice: {
    fontFamily: "Lato",
    fontSize: 14,
    color: COLORS.slate400,
    marginTop: 2,
  },
  badge: {
    backgroundColor: "rgba(251,191,36,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontFamily: "Lato-Bold",
    fontSize: 11,
    color: COLORS.divineGold,
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
    color: COLORS.slate400,
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
    color: "white",
    textAlign: "center",
  },
  anonSubtitle: {
    fontFamily: "Lato",
    fontSize: 15,
    color: COLORS.slate400,
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
    color: "white",
  },
});
