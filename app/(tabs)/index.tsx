import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flame, ChevronLeft, Sparkles, User } from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { CategoryNav } from "../../components/CategoryNav";
import { MoodInput } from "../../components/MoodInput";
import { DeclarationCard } from "../../components/DeclarationCard";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { useAudio } from "../../hooks/useAudio";
import {
  generateDeclaration,
  generateSpeech,
  generateImage,
} from "../../services/declarations";
import { saveDeclaration } from "../../services/favorites";
import {
  DeclarationCategory,
  MoodPreset,
  GeneratedContent,
} from "../../types";
import { COLORS } from "../../constants/theme";

export default function HomeScreen() {
  const [currentCategory, setCurrentCategory] = useState<DeclarationCategory>(
    DeclarationCategory.GENERAL
  );
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const router = useRouter();
  const { isPlaying, atmosphere, togglePlayback, cycleAtmosphere, stop } =
    useAudio();
  const viewShotRef = useRef<ViewShot>(null);

  const processGeneration = async (
    prompt: string,
    category: DeclarationCategory
  ) => {
    setIsLoading(true);
    setContent(null);
    setCurrentCategory(category);
    setIsSaved(false);
    await stop();

    try {
      // Step 1: Get text — show card immediately after this
      const declaration = await generateDeclaration(category, prompt);
      setContent({
        text: declaration.text,
        reference: declaration.reference,
        scriptureText: declaration.scriptureText,
        backgroundImageUrl: null,
        audioBase64: null,
      });
      setIsLoading(false);

      // Step 2: Load speech + image in background (card is already visible)
      const [audioBase64, imageUrl] = await Promise.all([
        generateSpeech(declaration.text).catch(() => null),
        generateImage(category, declaration.text).catch(() => null),
      ]);

      setContent((prev) =>
        prev
          ? { ...prev, audioBase64, backgroundImageUrl: imageUrl }
          : null
      );
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

  const handleRegenerateImage = async () => {
    if (!content) return;
    setIsGeneratingImage(true);
    try {
      const newImageUrl = await generateImage(currentCategory, content.text);
      if (newImageUrl) {
        setContent((prev) =>
          prev ? { ...prev, backgroundImageUrl: newImageUrl } : null
        );
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShare = async () => {
    if (!viewShotRef.current?.capture) return;
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, { mimeType: "image/png" });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleSave = async () => {
    if (!content || isSaved) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSaved(true);
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
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.05)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {content ? (
            <Pressable
              onPress={goBack}
              style={{ padding: 8, marginLeft: -8 }}
            >
              <ChevronLeft size={24} color="white" />
            </Pressable>
          ) : (
            <Flame size={24} color={COLORS.fireOrange} />
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
            <Text style={{ color: COLORS.electricPurple }}>Flow</Text>
          </Text>
        </View>
        <Pressable onPress={() => router.push("/(tabs)/settings")} style={{ padding: 8 }}>
          <User size={20} color={COLORS.slate400} />
        </Pressable>
      </View>

      {/* Main Content */}
      {!content ? (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, gap: 32 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Hero */}
          <View style={{ paddingTop: 24, gap: 8 }}>
            <Text
              style={{
                fontFamily: "Cinzel",
                fontSize: 36,
                color: "white",
                lineHeight: 44,
              }}
            >
              UNLEASH{"\n"}
              <Text style={{ color: COLORS.fireOrange }}>YOUR VOICE</Text>
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
              The atmosphere shifts when you speak.{"\n"}What do you need to
              declare today?
            </Text>
          </View>

          <CategoryNav
            selectedCategory={currentCategory}
            onSelect={setCurrentCategory}
          />

          <MoodInput
            onMoodSelect={handleMoodSelect}
            onCustomMood={handleCustomMood}
            isLoading={isLoading}
            selectedCategory={currentCategory}
          />
        </ScrollView>
      ) : (
        <View style={{ flex: 1, padding: 16 }}>
          {/* Card wrapped in ViewShot for sharing */}
          <ViewShot
            ref={viewShotRef}
            options={{ format: "png", quality: 1 }}
            style={{ flex: 1 }}
          >
            <DeclarationCard
              text={content.text}
              reference={content.reference}
              scriptureText={content.scriptureText}
              category={currentCategory}
              backgroundImageUrl={content.backgroundImageUrl}
              isPlaying={isPlaying}
              onPlayToggle={() => togglePlayback(content.audioBase64)}
              onRegenerateImage={handleRegenerateImage}
              isGeneratingImage={isGeneratingImage}
              atmosphere={atmosphere}
              onAtmosphereChange={cycleAtmosphere}
              onShare={handleShare}
              onSave={handleSave}
              isSaved={isSaved}
              hasAudio={!!content.audioBase64}
            />
          </ViewShot>

          {/* Fresh Fire button */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              processGeneration(
                `Generate another declaration about ${currentCategory}`,
                currentCategory
              );
            }}
            style={{
              marginTop: 12,
              height: 56,
              backgroundColor: COLORS.slate900,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Sparkles size={20} color={COLORS.divineGold} />
            <Text
              style={{
                fontFamily: "Lato-Bold",
                fontSize: 16,
                color: "white",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              Fresh Fire
            </Text>
          </Pressable>
        </View>
      )}

      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay />}
    </SafeAreaView>
  );
}
