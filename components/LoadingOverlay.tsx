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
} from "react-native-reanimated";
import { LOADING_MESSAGES, COLORS } from "../constants/theme";

export function LoadingOverlay() {
  const [messageIndex, setMessageIndex] = useState(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    // Pulsing animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.5, { duration: 800 })
      ),
      -1,
      true
    );

    // Rotate messages every 2.5 seconds
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill}>
      <View style={styles.container}>
        <Animated.View style={[styles.iconContainer, animatedStyle]}>
          <Flame size={64} color={COLORS.fireOrange} />
        </Animated.View>

        <Text style={styles.title}>IGNITING...</Text>

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
  iconContainer: {
    marginBottom: 32,
  },
  title: {
    fontFamily: "Cinzel",
    fontSize: 28,
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Lato",
    fontSize: 14,
    color: COLORS.electricPurple,
    textTransform: "uppercase",
    letterSpacing: 3,
    marginTop: 8,
    textAlign: "center",
  },
});
