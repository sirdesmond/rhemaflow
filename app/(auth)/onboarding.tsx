import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ArrowRight } from "lucide-react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { updateUserSettings } from "../../services/settings";

type GenderOption = "male" | "female" | null;

export default function OnboardingScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<GenderOption>(null);
  const [hasSelected, setHasSelected] = useState(false);

  const handleSelect = (gender: GenderOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(gender);
    setHasSelected(true);
  };

  const handleContinue = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const voiceGender: "male" | "female" = selected === "male" ? "male" : "female";
    await updateUserSettings({ gender: selected, voiceGender, onboardingComplete: true });
    router.replace("/(tabs)");
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Set gender to "skip" sentinel — we store null but mark as visited
    // by setting voiceGender (which always has a value)
    await updateUserSettings({ gender: null, voiceGender: "female", onboardingComplete: true });
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient
      colors={[COLORS.voidBlack, COLORS.deepPurple, COLORS.voidBlack]}
      locations={[0, 0.45, 1]}
      style={styles.container}
    >
      {/* Skip button */}
      <Pressable onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.headline}>Personalize Your</Text>
        <Text style={styles.headlineAccent}>Experience</Text>

        <Text style={styles.tagline}>
          Choose your gender so declarations{"\n"}speak directly to you
        </Text>

        {/* Gender pills */}
        <View style={styles.pillContainer}>
          <Pressable
            style={[
              styles.pill,
              selected === "male" && styles.pillActive,
            ]}
            onPress={() => handleSelect("male")}
          >
            <Text style={styles.pillEmoji}>{"  "}</Text>
            <Text
              style={[
                styles.pillLabel,
                selected === "male" && styles.pillLabelActive,
              ]}
            >
              Male
            </Text>
            <Text style={styles.pillDesc}>
              Man of God, Son, King
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.pill,
              selected === "female" && styles.pillActive,
            ]}
            onPress={() => handleSelect("female")}
          >
            <Text style={styles.pillEmoji}>{"  "}</Text>
            <Text
              style={[
                styles.pillLabel,
                selected === "female" && styles.pillLabelActive,
              ]}
            >
              Female
            </Text>
            <Text style={styles.pillDesc}>
              Woman of God, Daughter, Queen
            </Text>
          </Pressable>
        </View>

        {/* Continue button */}
        {hasSelected && (
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.ctaButton,
              pressed && styles.ctaButtonPressed,
            ]}
          >
            <Text style={styles.ctaText}>Continue</Text>
            <ArrowRight size={20} color={COLORS.white} />
          </Pressable>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 14,
    color: COLORS.slate400,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  headline: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.white,
    textAlign: "center",
  },
  headlineAccent: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.divineGold,
    textAlign: "center",
    marginBottom: 16,
  },
  tagline: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.slate400,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  pillContainer: {
    flexDirection: "row",
    gap: 16,
    width: "100%",
    marginBottom: 40,
  },
  pill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  pillActive: {
    borderColor: COLORS.divineGold,
    backgroundColor: "rgba(212,168,84,0.12)",
  },
  pillEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  pillLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
    color: COLORS.white,
    marginBottom: 6,
  },
  pillLabelActive: {
    color: COLORS.divineGold,
  },
  pillDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.slate400,
    textAlign: "center",
    lineHeight: 18,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.electricPurple,
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
  },
  ctaButtonPressed: {
    opacity: 0.8,
  },
  ctaText: {
    fontFamily: FONTS.display,
    fontSize: 18,
    color: COLORS.white,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
