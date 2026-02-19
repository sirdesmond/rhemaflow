import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ArrowRight, ArrowLeft } from "lucide-react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { updateUserSettings } from "../../services/settings";

type GenderOption = "male" | "female" | null;
type MaritalOption = "single" | "married" | null;

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [gender, setGender] = useState<GenderOption>(null);
  const [maritalStatus, setMaritalStatus] = useState<MaritalOption>(null);
  const [hasSelectedGender, setHasSelectedGender] = useState(false);
  const [hasSelectedMarital, setHasSelectedMarital] = useState(false);

  const handleSelectGender = (g: GenderOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGender(g);
    setHasSelectedGender(true);
  };

  const handleSelectMarital = (m: MaritalOption) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMaritalStatus(m);
    setHasSelectedMarital(true);
  };

  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep(2);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep(1);
  };

  const handleFinish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const voiceGender: "male" | "female" = gender === "male" ? "male" : "female";
    await updateUserSettings({ gender, maritalStatus, voiceGender, onboardingComplete: true });
    router.replace("/(tabs)");
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 1) {
      await updateUserSettings({ gender: null, maritalStatus: null, voiceGender: "female", onboardingComplete: true });
    } else {
      const voiceGender: "male" | "female" = gender === "male" ? "male" : "female";
      await updateUserSettings({ gender, maritalStatus: null, voiceGender, onboardingComplete: true });
    }
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient
      colors={[COLORS.voidBlack, COLORS.deepPurple, COLORS.voidBlack]}
      locations={[0, 0.45, 1]}
      style={styles.container}
    >
      {/* Back button (step 2 only) */}
      {step === 2 && (
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={20} color={COLORS.slate400} />
        </Pressable>
      )}

      {/* Skip button */}
      <Pressable onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={styles.content}>
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.dot, step === 1 && styles.dotActive]} />
          <View style={[styles.dot, step === 2 && styles.dotActive]} />
        </View>

        {step === 1 ? (
          <>
            <Text style={styles.headline}>Personalize Your</Text>
            <Text style={styles.headlineAccent}>Experience</Text>

            <Text style={styles.tagline}>
              Choose your gender so declarations{"\n"}speak directly to you
            </Text>

            {/* Gender pills */}
            <View style={styles.pillContainer}>
              <Pressable
                style={[styles.pill, gender === "male" && styles.pillActive]}
                onPress={() => handleSelectGender("male")}
              >
                <Text style={styles.pillEmoji}>{"  "}</Text>
                <Text style={[styles.pillLabel, gender === "male" && styles.pillLabelActive]}>
                  Male
                </Text>
                <Text style={styles.pillDesc}>Man of God, Son, King</Text>
              </Pressable>

              <Pressable
                style={[styles.pill, gender === "female" && styles.pillActive]}
                onPress={() => handleSelectGender("female")}
              >
                <Text style={styles.pillEmoji}>{"  "}</Text>
                <Text style={[styles.pillLabel, gender === "female" && styles.pillLabelActive]}>
                  Female
                </Text>
                <Text style={styles.pillDesc}>Woman of God, Daughter, Queen</Text>
              </Pressable>
            </View>

            {hasSelectedGender && (
              <Pressable
                onPress={handleNextStep}
                style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
              >
                <Text style={styles.ctaText}>Continue</Text>
                <ArrowRight size={20} color={COLORS.white} />
              </Pressable>
            )}
          </>
        ) : (
          <>
            <Text style={styles.headline}>One More Thing</Text>
            <Text style={styles.headlineAccent}>Your Status</Text>

            <Text style={styles.tagline}>
              So your declarations match{"\n"}where you are in life
            </Text>

            {/* Marital status pills */}
            <View style={styles.pillContainer}>
              <Pressable
                style={[styles.pill, maritalStatus === "single" && styles.pillActive]}
                onPress={() => handleSelectMarital("single")}
              >
                <Text style={styles.pillEmoji}>{"  "}</Text>
                <Text style={[styles.pillLabel, maritalStatus === "single" && styles.pillLabelActive]}>
                  Single
                </Text>
                <Text style={styles.pillDesc}>Trusting God for my future</Text>
              </Pressable>

              <Pressable
                style={[styles.pill, maritalStatus === "married" && styles.pillActive]}
                onPress={() => handleSelectMarital("married")}
              >
                <Text style={styles.pillEmoji}>{"  "}</Text>
                <Text style={[styles.pillLabel, maritalStatus === "married" && styles.pillLabelActive]}>
                  Married
                </Text>
                <Text style={styles.pillDesc}>Building with my spouse</Text>
              </Pressable>
            </View>

            {hasSelectedMarital && (
              <Pressable
                onPress={handleFinish}
                style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
              >
                <Text style={styles.ctaText}>Get Started</Text>
                <ArrowRight size={20} color={COLORS.white} />
              </Pressable>
            )}
          </>
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 24,
    zIndex: 10,
    padding: 8,
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
  stepIndicator: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.slate700,
  },
  dotActive: {
    backgroundColor: COLORS.divineGold,
    width: 24,
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
