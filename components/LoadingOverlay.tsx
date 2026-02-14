import { View, Text, StyleSheet } from "react-native";
import { useEffect, useState } from "react";
import { BlurView } from "expo-blur";
import { Flame } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from "react-native-reanimated";
import { LOADING_MESSAGES, COLORS } from "../constants/theme";

export function LoadingOverlay() {
  const [messageIndex, setMessageIndex] = useState(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.2, { duration: 1200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const animatedIcon = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const animatedGlow = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill}>
      <View style={styles.container}>
        {/* Glow ring behind the flame */}
        <View style={styles.iconWrapper}>
          <Animated.View style={[styles.glowRing, animatedGlow]} />
          <Animated.View style={[styles.iconContainer, animatedIcon]}>
            <Flame size={56} color={COLORS.divineGold} fill={COLORS.fireOrange} />
          </Animated.View>
        </View>

        <Text style={styles.title}>IGNITING THE WORD</Text>

        <View style={styles.divider} />

        <Text style={styles.subtitle}>{LOADING_MESSAGES[messageIndex]}</Text>
      </View>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconWrapper: {
    marginBottom: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.divineGold,
    shadowColor: COLORS.divineGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(251,191,36,0.08)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Cinzel",
    fontSize: 24,
    color: COLORS.divineGold,
    textAlign: "center",
    letterSpacing: 4,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: COLORS.divineGold,
    marginVertical: 16,
    borderRadius: 1,
    opacity: 0.5,
  },
  subtitle: {
    fontFamily: "Lato",
    fontSize: 13,
    color: COLORS.slate400,
    textTransform: "uppercase",
    letterSpacing: 3,
    textAlign: "center",
  },
});
