import { ScrollView, Pressable, Text, View } from "react-native";
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
                : COLORS.glass,
              borderWidth: 1,
              borderColor: isSelected
                ? "rgba(124,58,237,0.5)"
                : COLORS.glassBorder,
              ...(isSelected && {
                shadowColor: COLORS.electricPurple,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 4,
              }),
            }}
          >
            <Text
              style={{
                fontFamily: "Lato-Bold",
                fontSize: 13,
                color: isSelected ? COLORS.white : COLORS.slate400,
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
