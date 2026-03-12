import { View, Pressable, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { MOOD_PRESETS } from "../constants/categories";
import { MoodPreset } from "../types";
import { COLORS, SHADOWS } from "../constants/theme";

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
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    ...SHADOWS.small,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontFamily: "Lato-Bold",
    fontSize: 11,
    color: COLORS.textPrimary,
    letterSpacing: 0.3,
  },
});
