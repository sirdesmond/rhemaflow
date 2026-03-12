import { ScrollView, Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { DeclarationCategory } from "../types";
import { COLORS, SHADOWS } from "../constants/theme";

interface CategoryNavProps {
  selectedCategory: DeclarationCategory;
  onSelect: (category: DeclarationCategory) => void;
}

export function CategoryNav({ selectedCategory, onSelect }: CategoryNavProps) {
  const categories = Object.values(DeclarationCategory);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 4, gap: 10 }}
    >
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <Pressable
            key={cat}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(cat);
            }}
            style={{
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 9999,
              backgroundColor: isSelected
                ? COLORS.purple
                : COLORS.surface,
              ...(isSelected
                ? {}
                : SHADOWS.small),
            }}
          >
            <Text
              style={{
                fontFamily: "Lato-Bold",
                fontSize: 13,
                color: isSelected ? COLORS.textInverse : COLORS.textSecondary,
                letterSpacing: 0.3,
              }}
            >
              {cat}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
