import { View, Text, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Flame } from "lucide-react-native";
import { COLORS, FONTS } from "../../constants/theme";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[COLORS.voidBlack, COLORS.deepPurple, COLORS.voidBlack]}
      locations={[0, 0.45, 1]}
      style={styles.container}
    >
      {/* Hero Content */}
      <View style={styles.hero}>
        <View style={styles.iconContainer}>
          <Flame size={72} color={COLORS.fireOrange} />
        </View>

        <Text style={styles.title}>
          RHEMA{"\n"}
          <Text style={styles.titleAccent}>FLOW</Text>
        </Text>

        <Text style={styles.tagline}>Speak life over your situation.</Text>

        <Text style={styles.subtitle}>
          AI-powered biblical declarations with cinematic audio.{"\n"}
          The atmosphere shifts when you declare.
        </Text>
      </View>

      {/* CTA */}
      <View style={styles.ctaContainer}>
        <Pressable
          onPress={() => router.push("/(auth)/sign-in")}
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontFamily: FONTS.display,
    fontSize: 48,
    color: COLORS.white,
    textAlign: "center",
    letterSpacing: 6,
    lineHeight: 58,
  },
  titleAccent: {
    color: COLORS.electricPurple,
  },
  tagline: {
    fontFamily: FONTS.heading,
    fontSize: 20,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 24,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: FONTS.body,
    fontSize: 15,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 22,
  },
  ctaContainer: {
    paddingHorizontal: 24,
    paddingBottom: 60,
  },
  button: {
    backgroundColor: COLORS.electricPurple,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    fontFamily: FONTS.bodyBold,
    fontSize: 18,
    color: COLORS.white,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});
