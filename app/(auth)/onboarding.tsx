import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Platform, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { ArrowRight, ArrowLeft } from "lucide-react-native";
import { COLORS, FONTS, SHADOWS } from "../../constants/theme";
import { updateUserSettings } from "../../services/settings";
import { DeclarationCategory, AgeRange, LifeStage } from "../../types";

type GenderOption = "male" | "female" | null;
type MaritalOption = "single" | "married" | null;

const TOTAL_STEPS = 5;

const AGE_RANGES: { value: AgeRange; label: string }[] = [
  { value: "18-24", label: "18-24" },
  { value: "25-34", label: "25-34" },
  { value: "35-44", label: "35-44" },
  { value: "45-54", label: "45-54" },
  { value: "55+", label: "55+" },
];

const LIFE_STAGES: { value: LifeStage; label: string; desc: string }[] = [
  { value: "student", label: "Student", desc: "Learning & growing" },
  { value: "professional", label: "Professional", desc: "Building my career" },
  { value: "business-owner", label: "Business Owner", desc: "Running my enterprise" },
  { value: "homemaker", label: "Homemaker", desc: "Building my home" },
  { value: "retired", label: "Retired", desc: "Enjoying my harvest" },
  { value: "other", label: "Other", desc: "Something not listed" },
];

const FAITH_CATEGORIES: { value: DeclarationCategory; label: string }[] = [
  { value: DeclarationCategory.HEALTH, label: "Health & Healing" },
  { value: DeclarationCategory.WEALTH, label: "Wealth & Prosperity" },
  { value: DeclarationCategory.IDENTITY, label: "Identity" },
  { value: DeclarationCategory.SUCCESS, label: "Success & Victory" },
  { value: DeclarationCategory.PROTECTION, label: "Protection" },
  { value: DeclarationCategory.WISDOM, label: "Wisdom & Guidance" },
  { value: DeclarationCategory.MARRIAGE, label: "Marriage & Family" },
  { value: DeclarationCategory.FAVOR, label: "Favor & Open Doors" },
  { value: DeclarationCategory.PEACE, label: "Peace & Rest" },
  { value: DeclarationCategory.CHILDREN, label: "Children" },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState<GenderOption>(null);
  const [maritalStatus, setMaritalStatus] = useState<MaritalOption>(null);
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [lifeStages, setLifeStages] = useState<LifeStage[]>([]);
  const [faithFocusAreas, setFaithFocusAreas] = useState<DeclarationCategory[]>([]);
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

  const handleSelectAgeRange = (a: AgeRange) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAgeRange(a);
  };

  const handleToggleLifeStage = (l: LifeStage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLifeStages((prev) =>
      prev.includes(l) ? prev.filter((s) => s !== l) : [...prev, l]
    );
  };

  const handleToggleFaithArea = (cat: DeclarationCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFaithFocusAreas((prev) => {
      if (prev.includes(cat)) return prev.filter((c) => c !== cat);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, cat];
    });
  };

  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep((s) => Math.min(s + 1, TOTAL_STEPS) as any);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep((s) => Math.max(s - 1, 1) as any);
  };

  const handleFinish = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const voiceGender: "male" | "female" = gender === "male" ? "male" : "female";
    await updateUserSettings({
      gender,
      maritalStatus,
      voiceGender,
      ageRange,
      lifeStages,
      faithFocusAreas,
      onboardingComplete: true,
    });
    router.replace("/(tabs)");
  };

  const handleSkip = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const voiceGender: "male" | "female" = gender === "male" ? "male" : "female";
    await updateUserSettings({
      gender: gender,
      maritalStatus: maritalStatus,
      voiceGender,
      ageRange,
      lifeStages,
      faithFocusAreas,
      onboardingComplete: true,
    });
    router.replace("/(tabs)");
  };

  // Whether the current step has a selection that enables Continue
  const canContinue = (() => {
    switch (step) {
      case 1: return hasSelectedGender;
      case 2: return hasSelectedMarital;
      case 3: return ageRange !== null;
      case 4: return lifeStages.length > 0;
      case 5: return faithFocusAreas.length >= 2;
      default: return false;
    }
  })();

  const isLastStep = step === TOTAL_STEPS;

  return (
    <LinearGradient
      colors={[COLORS.background, "#F0E6D6", COLORS.background]}
      locations={[0, 0.45, 1]}
      style={styles.container}
    >
      {/* Back button (step 2+) */}
      {step > 1 && (
        <Pressable onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={20} color={COLORS.textTertiary} />
        </Pressable>
      )}

      {/* Skip button */}
      <Pressable onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
      </Pressable>

      <View style={styles.content}>
        {/* Step indicator */}
        <View style={styles.stepIndicator}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View key={i} style={[styles.dot, step === i + 1 && styles.dotActive]} />
          ))}
        </View>

        {step === 1 && (
          <>
            <Text style={styles.headline}>Personalize Your</Text>
            <Text style={styles.headlineAccent}>Experience</Text>
            <Text style={styles.tagline}>
              Choose your gender so declarations{"\n"}speak directly to you
            </Text>
            <View style={styles.pillContainer}>
              <Pressable
                style={[styles.pill, gender === "male" && styles.pillActive]}
                onPress={() => handleSelectGender("male")}
              >
                <Text style={styles.pillEmoji}>{"  "}</Text>
                <Text style={[styles.pillLabel, gender === "male" && styles.pillLabelActive]}>Male</Text>
                <Text style={styles.pillDesc}>Man of God, Son, King</Text>
              </Pressable>
              <Pressable
                style={[styles.pill, gender === "female" && styles.pillActive]}
                onPress={() => handleSelectGender("female")}
              >
                <Text style={styles.pillEmoji}>{"  "}</Text>
                <Text style={[styles.pillLabel, gender === "female" && styles.pillLabelActive]}>Female</Text>
                <Text style={styles.pillDesc}>Woman of God, Daughter, Queen</Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={styles.headline}>Your</Text>
            <Text style={styles.headlineAccent}>Status</Text>
            <Text style={styles.tagline}>
              So your declarations match{"\n"}where you are in life
            </Text>
            <View style={styles.pillContainer}>
              <Pressable
                style={[styles.pill, maritalStatus === "single" && styles.pillActive]}
                onPress={() => handleSelectMarital("single")}
              >
                <Text style={styles.pillEmoji}>{"  "}</Text>
                <Text style={[styles.pillLabel, maritalStatus === "single" && styles.pillLabelActive]}>Single</Text>
                <Text style={styles.pillDesc}>Trusting God for my future</Text>
              </Pressable>
              <Pressable
                style={[styles.pill, maritalStatus === "married" && styles.pillActive]}
                onPress={() => handleSelectMarital("married")}
              >
                <Text style={styles.pillEmoji}>{"  "}</Text>
                <Text style={[styles.pillLabel, maritalStatus === "married" && styles.pillLabelActive]}>Married</Text>
                <Text style={styles.pillDesc}>Building with my spouse</Text>
              </Pressable>
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={styles.headline}>Your</Text>
            <Text style={styles.headlineAccent}>Age Range</Text>
            <Text style={styles.tagline}>
              Helps us tailor declarations{"\n"}to your season of life
            </Text>
            <View style={styles.chipContainer}>
              {AGE_RANGES.map((a) => (
                <Pressable
                  key={a.value}
                  style={[styles.chip, ageRange === a.value && styles.chipActive]}
                  onPress={() => handleSelectAgeRange(a.value)}
                >
                  <Text style={[styles.chipLabel, ageRange === a.value && styles.chipLabelActive]}>
                    {a.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {step === 4 && (
          <>
            <Text style={styles.headline}>Your</Text>
            <Text style={styles.headlineAccent}>Life Stage</Text>
            <Text style={styles.tagline}>
              Select all that apply to{"\n"}your daily reality
            </Text>
            <View style={styles.chipContainer}>
              {LIFE_STAGES.map((l) => {
                const isSelected = lifeStages.includes(l.value);
                return (
                  <Pressable
                    key={l.value}
                    style={[styles.chip, styles.chipWide, isSelected && styles.chipActive]}
                    onPress={() => handleToggleLifeStage(l.value)}
                  >
                    <Text style={[styles.chipLabel, isSelected && styles.chipLabelActive]}>
                      {l.label}
                    </Text>
                    <Text style={styles.chipDesc}>{l.desc}</Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {step === 5 && (
          <>
            <Text style={styles.headline}>Faith</Text>
            <Text style={styles.headlineAccent}>Focus Areas</Text>
            <Text style={styles.tagline}>
              Pick 2-3 areas you're believing{"\n"}God for right now
            </Text>
            <ScrollView
              contentContainerStyle={styles.chipContainer}
              showsVerticalScrollIndicator={false}
              style={{ maxHeight: 280 }}
            >
              {FAITH_CATEGORIES.map((c) => {
                const isSelected = faithFocusAreas.includes(c.value);
                const isDisabled = !isSelected && faithFocusAreas.length >= 3;
                return (
                  <Pressable
                    key={c.value}
                    style={[
                      styles.chip,
                      isSelected && styles.chipActive,
                      isDisabled && styles.chipDisabled,
                    ]}
                    onPress={() => handleToggleFaithArea(c.value)}
                    disabled={isDisabled}
                  >
                    <Text
                      style={[
                        styles.chipLabel,
                        isSelected && styles.chipLabelActive,
                        isDisabled && styles.chipLabelDisabled,
                      ]}
                    >
                      {c.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}

        {canContinue && (
          <Pressable
            onPress={isLastStep ? handleFinish : handleNextStep}
            style={({ pressed }) => [styles.ctaButton, pressed && styles.ctaButtonPressed]}
          >
            <Text style={styles.ctaText}>{isLastStep ? "Get Started" : "Continue"}</Text>
            <ArrowRight size={20} color={COLORS.textInverse} />
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
    color: COLORS.textTertiary,
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
    backgroundColor: COLORS.border,
  },
  dotActive: {
    backgroundColor: COLORS.accent,
    width: 24,
  },
  headline: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.textPrimary,
    textAlign: "center",
  },
  headlineAccent: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.accent,
    textAlign: "center",
    marginBottom: 16,
  },
  tagline: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.textSecondary,
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
    backgroundColor: COLORS.surface,
    ...SHADOWS.medium,
  },
  pillActive: {
    backgroundColor: COLORS.accentMuted,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  pillEmoji: {
    fontSize: 36,
    marginBottom: 12,
  },
  pillLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 6,
  },
  pillLabelActive: {
    color: COLORS.accent,
  },
  pillDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    marginBottom: 40,
    width: "100%",
  },
  chip: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: COLORS.surface,
    ...SHADOWS.small,
  },
  chipWide: {
    width: "100%",
    alignItems: "center",
  },
  chipActive: {
    backgroundColor: COLORS.accentMuted,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  chipDisabled: {
    opacity: 0.35,
  },
  chipLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  chipLabelActive: {
    color: COLORS.accent,
  },
  chipLabelDisabled: {
    color: COLORS.textTertiary,
  },
  chipDesc: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.purple,
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
    color: COLORS.textInverse,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
});
