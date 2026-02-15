import { View, Text, Pressable, TextInput } from "react-native";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MOOD_PRESETS } from "../constants/categories";
import { MoodPreset } from "../types";
import { COLORS } from "../constants/theme";

interface MoodInputProps {
  onMoodSelect: (preset: MoodPreset) => void;
  onCustomMood: (text: string) => void;
  isLoading: boolean;
}

export function MoodInput({
  onMoodSelect,
  onCustomMood,
  isLoading,
}: MoodInputProps) {
  const [customText, setCustomText] = useState("");

  const handleSubmit = () => {
    if (customText.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onCustomMood(customText.trim());
      setCustomText("");
    }
  };

  return (
    <View style={{ width: "100%", gap: 24 }}>
      {/* Section heading */}
      <Text
        style={{
          fontFamily: "Lato-Bold",
          fontSize: 11,
          color: COLORS.warmGold,
          textTransform: "uppercase",
          letterSpacing: 2,
        }}
      >
        What are you declaring today?
      </Text>

      {/* Mood Presets Grid */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        {MOOD_PRESETS.map((preset) => (
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
              backgroundColor: COLORS.glass,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: COLORS.glassBorder,
            }}
          >
            <Text style={{ fontSize: 34, marginBottom: 10 }}>
              {preset.emoji}
            </Text>
            <Text
              style={{
                fontFamily: "Lato-Bold",
                fontSize: 13,
                color: COLORS.white,
                textAlign: "center",
                letterSpacing: 0.3,
              }}
            >
              {preset.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Divider */}
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{ flex: 1, height: 1, backgroundColor: COLORS.glassBorder }}
        />
        <Text
          style={{
            fontFamily: "Lato-Bold",
            fontSize: 10,
            color: COLORS.slate400,
            paddingHorizontal: 12,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          Or describe your situation
        </Text>
        <View
          style={{ flex: 1, height: 1, backgroundColor: COLORS.glassBorder }}
        />
      </View>

      {/* Custom Input */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: COLORS.glass,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: COLORS.glassBorder,
            paddingRight: 8,
          }}
        >
          <TextInput
            value={customText}
            onChangeText={setCustomText}
            placeholder="e.g. Believing God for a child, new job..."
            placeholderTextColor={COLORS.slate700}
            editable={!isLoading}
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
            style={{
              flex: 1,
              paddingHorizontal: 20,
              paddingVertical: 16,
              color: COLORS.white,
              fontSize: 15,
              fontFamily: "Lato",
            }}
          />
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading || !customText.trim()}
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              backgroundColor:
                isLoading || !customText.trim()
                  ? COLORS.slate700
                  : COLORS.divineGold,
              alignItems: "center",
              justifyContent: "center",
              ...(customText.trim() && !isLoading && {
                shadowColor: COLORS.divineGold,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 4,
              }),
            }}
          >
            {isLoading ? (
              <Sparkles size={18} color="white" />
            ) : (
              <ArrowRight size={20} color={COLORS.voidBlack} />
            )}
          </Pressable>
        </View>
    </View>
  );
}
