import { View, Text, Pressable, Alert, KeyboardAvoidingView, Platform, Keyboard, ScrollView } from "react-native";
import { useState, useRef, useCallback, useEffect, MutableRefObject } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flame, ChevronLeft, Sparkles, Crown } from "lucide-react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { DeclarationInput } from "../../components/DeclarationInput";
import { CategoryPills } from "../../components/CategoryPills";
import { DeclarationCard } from "../../components/DeclarationCard";
import { ShareCard } from "../../components/ShareCard";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { useAudio } from "../../hooks/useAudio";
import { useSubscription } from "../../hooks/useSubscription";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import {
  generateDeclaration,
  generateSpeech,
} from "../../services/declarations";
import { saveDeclaration } from "../../services/favorites";
import { getStreakData } from "../../services/streak";
import {
  DeclarationCategory,
  MoodPreset,
  GeneratedContent,
  UserSettings,
  AgeRange,
  LifeStage,
  StreakData,
} from "../../types";
import { COLORS, SHADOWS } from "../../constants/theme";
import { getUserSettings } from "../../services/settings";
import { logError } from "../../services/crashlytics";
import {
  trackDeclarationGenerated,
  trackDeclarationSaved,
  trackDeclarationShared,
  trackAudioPlayed,
  trackFreshFire,
  trackPaywallViewed,
  trackStreakMilestone,
  trackStreakReset,
} from "../../services/analytics";

export default function HomeScreen() {
  const [currentCategory, setCurrentCategory] = useState<DeclarationCategory>(
    DeclarationCategory.GENERAL
  );
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [gender, setGender] = useState<UserSettings["gender"]>(null);
  const [maritalStatus, setMaritalStatus] = useState<UserSettings["maritalStatus"]>(null);
  const [voiceGender, setVoiceGender] = useState<UserSettings["voiceGender"]>("female");
  const [ageRange, setAgeRange] = useState<AgeRange | null>(null);
  const [lifeStages, setLifeStages] = useState<LifeStage[]>([]);
  const [faithFocusAreas, setFaithFocusAreas] = useState<DeclarationCategory[]>([]);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<string>("");
  const [streak, setStreak] = useState(0);
  const [milestoneMessage, setMilestoneMessage] = useState<string | null>(null);
  const generationIdRef = useRef(0);
  const ttsAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  const router = useRouter();
  const { isPro, usage, refreshUsage } = useSubscription();
  const { isPlaying, atmosphere, setAtmosphere, play, togglePlayback, cycleAtmosphere, stop, progress } =
    useAudio();
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechRecognition();
  const viewShotRef = useRef<ViewShot>(null);

  // Reload user preferences every time the tab gains focus
  // (picks up changes made in Settings or Onboarding)
  const STREAK_MILESTONES = [1, 7, 14, 30, 60, 100];

  const MILESTONE_MESSAGES: Record<number, string> = {
    1: "Your faith journey begins! Can you make it to 7?",
    7: "7 days of faith! Keep declaring!",
    14: "14 days strong! You're building a habit!",
    30: "30 days of faith! Unstoppable!",
    60: "60 days! Your faith is on fire!",
    100: "100 days! What a testimony!",
  };

  const handleStreakUpdate = useCallback((streakData: StreakData | null) => {
    if (!streakData) return;
    const prev = streak;
    setStreak(streakData.currentStreak);

    // Streak reset detection
    if (prev > 1 && streakData.currentStreak === 1) {
      trackStreakReset();
    }

    // Milestone detection
    if (STREAK_MILESTONES.includes(streakData.currentStreak) && streakData.currentStreak !== prev) {
      trackStreakMilestone(streakData.currentStreak);
      setMilestoneMessage(MILESTONE_MESSAGES[streakData.currentStreak]);
      setTimeout(() => setMilestoneMessage(null), 4000);
    }
  }, [streak]);

  useFocusEffect(
    useCallback(() => {
      getUserSettings().then((settings) => {
        setAtmosphere(settings.defaultAtmosphere);
        setGender(settings.gender);
        setMaritalStatus(settings.maritalStatus);
        setVoiceGender(settings.voiceGender);
        setAgeRange(settings.ageRange);
        setLifeStages(settings.lifeStages);
        setFaithFocusAreas(settings.faithFocusAreas);
      });
      getStreakData().then(handleStreakUpdate);
    }, [])
  );

  const processGeneration = async (
    prompt: string,
    category: DeclarationCategory
  ) => {
    // Check usage before generating
    if (!isPro && usage && !usage.canGenerate) {
      trackPaywallViewed("daily_limit");
      router.push("/(modals)/paywall" as any);
      return;
    }

    // Cancel any in-flight TTS and increment generation ID
    ttsAbortRef.current?.abort();
    const thisGeneration = ++generationIdRef.current;

    setIsLoading(true);
    setContent(null);
    setCurrentCategory(category);
    setLastPrompt(prompt);
    setIsSaved(false);
    setIsAudioLoading(false);
    await stop();

    try {
      // Step 1: Get declaration text (fast — no TTS)
      const declaration = await generateDeclaration(category, prompt, undefined, gender, maritalStatus, ageRange, lifeStages, faithFocusAreas);

      // Stale check — a newer generation was started
      if (thisGeneration !== generationIdRef.current) return;

      // Show card immediately with text + kick off TTS in parallel
      setContent({
        text: declaration.text,
        reference: declaration.reference,
        scriptureText: declaration.scriptureText,
        backgroundImageUrl: null,
        audioBase64: null,
        audioUrl: null,
      });
      setIsLoading(false);
      trackDeclarationGenerated(category, isPro);
      handleStreakUpdate(declaration.streakData);
      refreshUsage().catch(() => {});

      // Start TTS immediately — don't wait for UI render cycle
      if (isPro) {
        setIsAudioLoading(true);
        const abortController = new AbortController();
        ttsAbortRef.current = abortController;

        // Fire TTS request immediately (runs concurrently with UI updates above)
        generateSpeech(declaration.text, voiceGender, abortController.signal)
          .then((speech) => {
            // Stale check — discard if a newer generation started
            if (thisGeneration !== generationIdRef.current) return;

            setIsAudioLoading(false);
            const audioSource = speech?.audioBase64 ?? speech?.audioUrl;
            if (audioSource) {
              setContent((prev) => prev ? { ...prev, audioBase64: speech?.audioBase64 ?? null, audioUrl: speech?.audioUrl ?? null } : null);
              play(audioSource);
              trackAudioPlayed();
            }
          })
          .catch((e) => {
            if (e instanceof Error && e.name === "AbortError") return;
            if (thisGeneration === generationIdRef.current) setIsAudioLoading(false);
          });
      }
    } catch (error: any) {
      logError(error, "Generation failed");
      setIsLoading(false);
      Alert.alert(
        "Generation Failed",
        error?.message || "Something went wrong. Please try again.",
        [
          { text: "Retry", onPress: () => processGeneration(prompt, category) },
          { text: "OK" },
        ]
      );
    }
  };

  const handleMoodSelect = (preset: MoodPreset) => {
    processGeneration(preset.prompt, preset.category);
  };

  const handleCustomMood = (text: string) => {
    processGeneration(text, currentCategory);
  };

  const handleMicPress = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleShare = async () => {
    if (!viewShotRef.current?.capture) return;
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, { mimeType: "image/png" });
      trackDeclarationShared(currentCategory);
    } catch (error) {
      logError(error, "Share failed");
    }
  };

  const handleSave = async () => {
    if (!content || isSaved) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSaved(true);
    trackDeclarationSaved(currentCategory);
    try {
      await saveDeclaration({
        text: content.text,
        reference: content.reference,
        scriptureText: content.scriptureText,
        category: currentCategory,
        atmosphere,
        imageUrl: content.backgroundImageUrl,
        audioUrl: content.audioUrl,
      });
    } catch (error) {
      logError(error, "Save failed");
      setIsSaved(false);
    }
  };

  const goBack = async () => {
    ttsAbortRef.current?.abort();
    generationIdRef.current++;
    await stop();
    setContent(null);
    setIsSaved(false);
    setIsAudioLoading(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      {/* Header */}
      <View
        style={{
          height: 56,
          paddingHorizontal: 16,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {content ? (
            <Pressable
              onPress={goBack}
              style={{
                padding: 8,
                marginLeft: -8,
                backgroundColor: COLORS.surface,
                borderRadius: 20,
                ...SHADOWS.small,
              }}
            >
              <ChevronLeft size={20} color={COLORS.textPrimary} />
            </Pressable>
          ) : (
            <Flame size={22} color={COLORS.accent} fill={COLORS.accent} />
          )}
          <Text
            style={{
              fontFamily: "Cinzel",
              fontSize: 20,
              color: COLORS.textPrimary,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Rhema
            <Text style={{ color: COLORS.accent }}>Flow</Text>
          </Text>
          {isPro && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: COLORS.accentMuted,
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 10,
              }}
            >
              <Crown size={10} color={COLORS.accent} />
              <Text
                style={{
                  fontFamily: "Lato-Bold",
                  fontSize: 9,
                  color: COLORS.accent,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Pro
              </Text>
            </View>
          )}
        </View>

        {/* Streak badge */}
        {streak > 0 && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: COLORS.accentMuted,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
            }}
          >
            <Flame size={14} color={COLORS.accent} fill={COLORS.accent} />
            <Text
              style={{
                fontFamily: "Lato-Bold",
                fontSize: 13,
                color: COLORS.accent,
              }}
            >
              {streak}
            </Text>
          </View>
        )}
      </View>

      {/* Milestone celebration */}
      {milestoneMessage && (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={{
            alignItems: "center",
            paddingVertical: 6,
            paddingHorizontal: 16,
          }}
        >
          <Text
            style={{
              fontFamily: "Lato-Bold",
              fontSize: 13,
              color: COLORS.accent,
              textAlign: "center",
            }}
          >
            {milestoneMessage}
          </Text>
        </Animated.View>
      )}

      {/* Subtle divider */}
      <View style={{ height: 1, backgroundColor: COLORS.borderLight, marginHorizontal: 16 }} />

      {/* Main Content */}
      {isLoading ? (
        <LoadingOverlay />
      ) : !content ? (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingBottom: 100 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={{
                fontFamily: "Cinzel",
                fontSize: 26,
                color: COLORS.textPrimary,
                textAlign: "center",
                lineHeight: 36,
                marginBottom: 8,
              }}
            >
              Declare the Word{"\n"}over your life
            </Text>
            <Text
              style={{
                fontFamily: "Lato",
                fontSize: 14,
                color: COLORS.textSecondary,
                textAlign: "center",
                marginBottom: 32,
              }}
            >
              Type, speak, or pick a topic below
            </Text>

            <DeclarationInput
              onSubmit={(text) => {
                clearTranscript();
                handleCustomMood(text);
              }}
              isLoading={isLoading}
              isListening={isListening}
              transcript={transcript}
              onMicPress={handleMicPress}
            />

            {/* Category pills below input — hide when keyboard is up */}
            {!keyboardVisible && (
              <View style={{ marginTop: 40 }}>
                <CategoryPills
                  onSelect={handleMoodSelect}
                  disabled={isLoading}
                />
              </View>
            )}

            {/* Usage counter for free users */}
            {!keyboardVisible && !isPro && usage && (
              <Pressable
                onPress={() => {
                  trackPaywallViewed("usage_counter");
                  router.push("/(modals)/paywall" as any);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  marginTop: 16,
                  borderRadius: 12,
                  backgroundColor: COLORS.surface,
                  ...SHADOWS.small,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Lato",
                    fontSize: 14,
                    color: usage.canGenerate ? COLORS.textSecondary : COLORS.error,
                  }}
                >
                  {usage.canGenerate
                    ? `${usage.dailyLimit - usage.declarationsToday} of ${usage.dailyLimit} remaining today`
                    : "Daily limit reached"}
                </Text>
                <Text
                  style={{
                    fontFamily: "Lato-Bold",
                    fontSize: 12,
                    color: COLORS.accent,
                    textTransform: "uppercase",
                  }}
                >
                  Upgrade
                </Text>
              </Pressable>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={{ flex: 1, padding: 16, paddingBottom: 100 }}>
          <DeclarationCard
            text={content.text}
            reference={content.reference}
            scriptureText={content.scriptureText}
            category={currentCategory}
            isPlaying={isPlaying}
            isAudioLoading={isAudioLoading}
            onPlayToggle={() => togglePlayback(content.audioBase64 ?? content.audioUrl)}
            atmosphere={atmosphere}
            onAtmosphereChange={cycleAtmosphere}
            onShare={handleShare}
            onSave={handleSave}
            isSaved={isSaved}
            isPro={isPro}
            onUpgrade={() => router.push("/(modals)/paywall" as any)}
            progress={progress}
          />

          {/* Hidden off-screen ShareCard for ViewShot capture */}
          <ViewShot
            ref={viewShotRef}
            options={{ format: "png", quality: 1 }}
            style={{ position: "absolute", left: -9999 }}
          >
            <ShareCard
              text={content.text}
              reference={content.reference}
              scriptureText={content.scriptureText}
              category={currentCategory}
            />
          </ViewShot>

          {/* Fresh Fire button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              trackFreshFire(currentCategory);
              processGeneration(
                lastPrompt || `Generate another declaration about ${currentCategory}`,
                currentCategory
              );
            }}
            style={{
              marginTop: 12,
              height: 56,
              backgroundColor: COLORS.surface,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              ...SHADOWS.small,
            }}
          >
            <Sparkles size={18} color={COLORS.accent} />
            <Text
              style={{
                fontFamily: "Lato-Bold",
                fontSize: 14,
                color: COLORS.accent,
                textTransform: "uppercase",
                letterSpacing: 1.5,
              }}
            >
              Fresh Fire
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
