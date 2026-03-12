import { ScrollView, Pressable, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { DeclarationCategory } from "../types";
import { useTheme } from "../hooks/useTheme";

interface CategoryNavProps {
  selectedCategory: DeclarationCategory;
  onSelect: (category: DeclarationCategory) => void;
}

export function CategoryNav({ selectedCategory, onSelect }: CategoryNavProps) {
  const { colors, shadows } = useTheme();
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
                ? colors.purple
                : colors.surface,
              ...(isSelected
                ? {}
                : shadows.small),
            }}
          >
            <Text
              style={{
                fontFamily: "Lato-Bold",
                fontSize: 13,
                color: isSelected ? colors.textInverse : colors.textSecondary,
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
