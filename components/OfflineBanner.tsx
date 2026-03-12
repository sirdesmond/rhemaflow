import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { WifiOff } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FONTS } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";

export function OfflineBanner({ visible }: { visible: boolean }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 4 }]}>
      <WifiOff size={16} color={colors.amber} strokeWidth={2} />
      <Text style={styles.text}>
        You're offline. Some features may not work.
      </Text>
    </View>
  );
}

function createStyles(colors: any) {
  return StyleSheet.create({
    banner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingBottom: 8,
      backgroundColor: colors.amberLight,
    },
    text: {
      fontFamily: FONTS.bodyBold,
      fontSize: 13,
      color: colors.amber,
    },
  });
}
