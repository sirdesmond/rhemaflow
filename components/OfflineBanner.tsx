import { View, Text, StyleSheet } from "react-native";
import { WifiOff } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS } from "../constants/theme";

export function OfflineBanner({ visible }: { visible: boolean }) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 4 }]}>
      <WifiOff size={16} color={COLORS.voidBlack} strokeWidth={2} />
      <Text style={styles.text}>
        You're offline. Some features may not work.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingBottom: 8,
    backgroundColor: "#F59E0B",
  },
  text: {
    fontFamily: FONTS.bodyBold,
    fontSize: 13,
    color: COLORS.voidBlack,
  },
});
