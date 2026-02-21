import { ScrollView, Pressable, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { MOOD_PRESETS } from "../constants/categories";
import { MoodPreset } from "../types";
import { COLORS } from "../constants/theme";

interface CategoryPillsProps {
  onSelect: (preset: MoodPreset) => void;
  disabled?: boolean;
}

export function CategoryPills({
  onSelect,
  disabled,
}: CategoryPillsProps) {
  const handlePress = (preset: MoodPreset) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSelect(preset);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {MOOD_PRESETS.map((preset) => (
        <Pressable
          key={preset.label}
          style={styles.pill}
          onPress={() => handlePress(preset)}
          disabled={disabled}
        >
          <Text style={styles.emoji}>{preset.emoji}</Text>
          <Text style={styles.label}>{preset.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.glass,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontFamily: "Lato-Bold",
    fontSize: 12,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});
