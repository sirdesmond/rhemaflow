import { ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DeclarationCategory } from "../../types";
import { CATEGORY_GRADIENTS } from "../../constants/categories";

interface GradientBackgroundProps extends ViewProps {
  category: DeclarationCategory;
}

export function GradientBackground({
  category,
  style,
  children,
  ...props
}: GradientBackgroundProps) {
  const [start, end] = CATEGORY_GRADIENTS[category];
  return (
    <LinearGradient
      colors={[start, end]}
      style={[{ flex: 1 }, style]}
      {...props}
    >
      {children}
    </LinearGradient>
  );
}
