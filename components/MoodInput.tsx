import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MOOD_PRESETS } from "../constants/categories";
import { DeclarationCategory, MoodPreset } from "../types";
import { COLORS } from "../constants/theme";

interface MoodInputProps {
  onMoodSelect: (preset: MoodPreset) => void;
  onCustomMood: (text: string) => void;
  isLoading: boolean;
  selectedCategory: DeclarationCategory;
}

const PLACEHOLDERS: Record<DeclarationCategory, string> = {
  [DeclarationCategory.HEALTH]: "Describe your symptoms...",
  [DeclarationCategory.WEALTH]: "Describe your financial situation...",
  [DeclarationCategory.PROTECTION]: "What are you afraid of?",
  [DeclarationCategory.IDENTITY]: "How are you feeling about yourself?",
  [DeclarationCategory.SUCCESS]: "What obstacle are you facing?",
  [DeclarationCategory.WISDOM]: "What decision do you need to make?",
  [DeclarationCategory.GENERAL]: "Describe your situation...",
};

export function MoodInput({
  onMoodSelect,
  onCustomMood,
  isLoading,
  selectedCategory,
}: MoodInputProps) {
  const [customText, setCustomText] = useState("");

  const filteredPresets =
    selectedCategory === DeclarationCategory.GENERAL
      ? MOOD_PRESETS
      : MOOD_PRESETS.filter((p) => p.category === selectedCategory);

  const handleSubmit = () => {
    if (customText.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onCustomMood(customText.trim());
      setCustomText("");
    }
  };

  return (
    <View style={{ width: "100%", gap: 24 }}>
      {/* Mood Presets Grid */}
      {filteredPresets.length > 0 && (
        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          {filteredPresets.map((preset) => (
            <Pressable
              key={preset.label}
              disabled={isLoading}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onMoodSelect(preset);
              }}
              style={{
                flexBasis: "47%",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 24,
                paddingHorizontal: 12,
                backgroundColor: COLORS.slate900,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.05)",
              }}
            >
              <Text style={{ fontSize: 36, marginBottom: 12 }}>
                {preset.emoji}
              </Text>
              <Text
                style={{
                  fontFamily: "Lato-Bold",
                  fontSize: 14,
                  color: COLORS.white,
                  textAlign: "center",
                }}
              >
                {preset.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Divider */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" }}
        />
        <Text
          style={{
            fontFamily: "Lato-Bold",
            fontSize: 11,
            color: COLORS.slate400,
            paddingHorizontal: 12,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          Or speak your situation
        </Text>
        <View
          style={{ flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" }}
        />
      </View>

      {/* Custom Input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: COLORS.slate900,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            paddingRight: 8,
          }}
        >
          <TextInput
            value={customText}
            onChangeText={setCustomText}
            placeholder={PLACEHOLDERS[selectedCategory]}
            placeholderTextColor={COLORS.slate400}
            editable={!isLoading}
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
            style={{
              flex: 1,
              paddingHorizontal: 20,
              paddingVertical: 16,
              color: COLORS.white,
              fontSize: 16,
              fontFamily: "Lato",
            }}
          />
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading || !customText.trim()}
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor:
                isLoading || !customText.trim()
                  ? COLORS.slate700
                  : COLORS.electricPurple,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isLoading ? (
              <Sparkles size={20} color="white" />
            ) : (
              <ArrowRight size={24} color="white" />
            )}
          </Pressable>
        </View>
    </View>
  );
}
