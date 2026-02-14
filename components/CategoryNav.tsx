import { ScrollView, Pressable, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { DeclarationCategory } from "../types";
import { COLORS } from "../constants/theme";

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
                ? COLORS.electricPurple
                : COLORS.slate900,
              borderWidth: isSelected ? 0 : 1,
              borderColor: "rgba(255,255,255,0.05)",
            }}
          >
            <Text
              style={{
                fontFamily: "Lato-Bold",
                fontSize: 14,
                color: isSelected ? COLORS.white : COLORS.slate400,
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
