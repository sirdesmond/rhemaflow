import { Text, TextProps, StyleSheet } from "react-native";
import { FONTS } from "../../constants/theme";

type Variant =
  | "display"
  | "heading"
  | "body"
  | "caption"
  | "button"
  | "scripture";

interface TypographyProps extends TextProps {
  variant?: Variant;
}

const variantStyles = StyleSheet.create({
  display: { fontFamily: FONTS.display, fontSize: 28 },
  heading: { fontFamily: FONTS.heading, fontSize: 22 },
  body: { fontFamily: FONTS.body, fontSize: 16 },
  caption: { fontFamily: FONTS.body, fontSize: 13 },
  button: { fontFamily: FONTS.bodyBold, fontSize: 16 },
  scripture: { fontFamily: FONTS.headingItalic, fontSize: 15 },
});

export function Typography({
  variant = "body",
  style,
  ...props
}: TypographyProps) {
  return <Text style={[variantStyles[variant], style]} {...props} />;
}
