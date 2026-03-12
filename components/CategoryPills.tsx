import { useMemo } from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { MOOD_PRESETS } from "../constants/categories";
import { MoodPreset } from "../types";
import { useTheme } from "../hooks/useTheme";

interface CategoryPillsProps {
  onSelect: (preset: MoodPreset) => void;
  disabled?: boolean;
}

export function CategoryPills({
  onSelect,
  disabled,
}: CategoryPillsProps) {
  const { colors, shadows } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

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

const createStyles = (colors: any, shadows: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: 10,
    },
    pill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 9999,
      paddingHorizontal: 14,
      paddingVertical: 8,
      gap: 6,
      ...shadows.small,
    },
    emoji: {
      fontSize: 14,
    },
    label: {
      fontFamily: "Lato-Bold",
      fontSize: 11,
      color: colors.textPrimary,
      letterSpacing: 0.3,
    },
  });
