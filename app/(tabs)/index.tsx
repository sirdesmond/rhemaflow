import { View, Text, ScrollView, Pressable, Alert, KeyboardAvoidingView, Platform } from "react-native";
import { useState, useRef, useEffect, useCallback } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flame, ChevronLeft, Sparkles, User, Crown } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import * as Haptics from "expo-haptics";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { MoodInput } from "../../components/MoodInput";
import { DeclarationCard } from "../../components/DeclarationCard";
import { ShareCard } from "../../components/ShareCard";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { useAudio } from "../../hooks/useAudio";
import { useSubscription } from "../../hooks/useSubscription";
import {
  generateDeclaration,
  generateSpeech,
} from "../../services/declarations";
import { saveDeclaration } from "../../services/favorites";
import {
  DeclarationCategory,
  MoodPreset,
  GeneratedContent,
  UserSettings,
} from "../../types";
import { COLORS } from "../../constants/theme";
import { getUserSettings } from "../../services/settings";
import {
  trackDeclarationGenerated,
  trackDeclarationSaved,
  trackDeclarationShared,
  trackAudioPlayed,
  trackFreshFire,
  trackPaywallViewed,
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

  const router = useRouter();
  const { isPro, usage, refreshUsage } = useSubscription();
  const { isPlaying, atmosphere, setAtmosphere, play, togglePlayback, cycleAtmosphere, stop } =
    useAudio();
  const viewShotRef = useRef<ViewShot>(null);

  // Reload user preferences every time the tab gains focus
  // (picks up changes made in Settings or Onboarding)
  useFocusEffect(
    useCallback(() => {
      getUserSettings().then((settings) => {
        setAtmosphere(settings.defaultAtmosphere);
        setGender(settings.gender);
        setMaritalStatus(settings.maritalStatus);
        setVoiceGender(settings.voiceGender);
      });
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

    setIsLoading(true);
    setContent(null);
    setCurrentCategory(category);
    setIsSaved(false);
    await stop();

    try {
      // Step 1: Get declaration text (fast — no TTS)
      const declaration = await generateDeclaration(category, prompt, undefined, gender, maritalStatus);

      // Show card immediately with text
      setContent({
        text: declaration.text,
        reference: declaration.reference,
        scriptureText: declaration.scriptureText,
        backgroundImageUrl: null,
        audioBase64: null,
      });
      setIsLoading(false);
      trackDeclarationGenerated(category, isPro);

      // Refresh usage count after generation
      refreshUsage();

      // Step 2: Pro users get TTS audio
      if (isPro) {
        setIsAudioLoading(true);

        const audioBase64 = await generateSpeech(declaration.text, voiceGender).catch(() => null);

        setIsAudioLoading(false);

        if (audioBase64) {
          setContent((prev) => prev ? { ...prev, audioBase64 } : null);
          play(audioBase64);
          trackAudioPlayed();
        }
      }
    } catch (error: any) {
      console.error("Generation failed:", error);
      setIsLoading(false);
      Alert.alert(
        "Generation Failed",
        error?.message || "Something went wrong. Please try again."
      );
    }
  };

  const handleMoodSelect = (preset: MoodPreset) => {
    processGeneration(preset.prompt, preset.category);
  };

  const handleCustomMood = (text: string) => {
    processGeneration(text, currentCategory);
  };


  const handleShare = async () => {
    if (!viewShotRef.current?.capture) return;
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, { mimeType: "image/png" });
      trackDeclarationShared(currentCategory);
    } catch (error) {
      console.error("Share failed:", error);
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
      });
    } catch (error) {
      console.error("Save failed:", error);
      setIsSaved(false);
    }
  };

  const goBack = async () => {
    await stop();
    setContent(null);
    setIsSaved(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.voidBlack }}>
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
                backgroundColor: COLORS.glass,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: COLORS.glassBorder,
              }}
            >
              <ChevronLeft size={20} color="white" />
            </Pressable>
          ) : (
            <Flame size={22} color={COLORS.divineGold} fill={COLORS.fireOrange} />
          )}
          <Text
            style={{
              fontFamily: "Cinzel",
              fontSize: 20,
              color: "white",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Rhema
            <Text style={{ color: COLORS.divineGold }}>Flow</Text>
          </Text>
          {isPro && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: "rgba(251,191,36,0.15)",
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "rgba(251,191,36,0.3)",
              }}
            >
              <Crown size={10} color={COLORS.divineGold} />
              <Text
                style={{
                  fontFamily: "Lato-Bold",
                  fontSize: 9,
                  color: COLORS.divineGold,
                  textTransform: "uppercase",
                  letterSpacing: 1,
                }}
              >
                Pro
              </Text>
            </View>
          )}
        </View>
        <Pressable
          onPress={() => router.push("/(tabs)/settings")}
          style={{
            padding: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: COLORS.glassBorder,
            backgroundColor: COLORS.glass,
          }}
        >
          <User size={18} color={COLORS.divineGold} />
        </Pressable>
      </View>
      {/* Gold accent line */}
      <View style={{ height: 1, backgroundColor: COLORS.glassBorder, marginHorizontal: 16 }}>
        <View style={{ height: 1, width: 60, backgroundColor: COLORS.divineGold, opacity: 0.5 }} />
      </View>

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
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: 100, gap: 32 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* Hero */}
          <View style={{ paddingTop: 24, gap: 8 }}>
            <Text
              style={{
                fontFamily: "Cinzel",
                fontSize: 34,
                color: "white",
                lineHeight: 42,
              }}
            >
              UNLEASH{"\n"}
              <Text style={{ color: COLORS.divineGold }}>YOUR VOICE</Text>
            </Text>
            <Text
              style={{
                fontFamily: "Lato",
                fontSize: 18,
                color: COLORS.slate400,
                marginTop: 8,
                lineHeight: 26,
              }}
            >
              The atmosphere shifts when you speak.
            </Text>
          </View>

          <MoodInput
            onMoodSelect={handleMoodSelect}
            onCustomMood={handleCustomMood}
            isLoading={isLoading}
          />

          {/* Usage counter for free users */}
          {!isPro && usage && (
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
                borderRadius: 12,
                backgroundColor: COLORS.glass,
                borderWidth: 1,
                borderColor: COLORS.glassBorder,
              }}
            >
              <Text
                style={{
                  fontFamily: "Lato",
                  fontSize: 14,
                  color: usage.canGenerate ? COLORS.slate400 : COLORS.fireOrange,
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
                  color: COLORS.divineGold,
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
            onPlayToggle={() => togglePlayback(content.audioBase64)}
            atmosphere={atmosphere}
            onAtmosphereChange={cycleAtmosphere}
            onShare={handleShare}
            onSave={handleSave}
            isSaved={isSaved}
            isPro={isPro}
            onUpgrade={() => router.push("/(modals)/paywall" as any)}
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
                `Generate another declaration about ${currentCategory}`,
                currentCategory
              );
            }}
            style={{
              marginTop: 12,
              height: 56,
              backgroundColor: COLORS.glass,
              borderWidth: 1,
              borderColor: COLORS.glassBorder,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Sparkles size={18} color={COLORS.warmGold} />
            <Text
              style={{
                fontFamily: "Lato-Bold",
                fontSize: 14,
                color: COLORS.warmGold,
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
