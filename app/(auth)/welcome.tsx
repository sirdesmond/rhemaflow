import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  ArrowRight,
  Bell,
  ChevronRight,
  Flame,
  Layers,
  Share2,
  Volume2,
} from "lucide-react-native";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ScrollWheelTimePicker } from "../../components/ScrollWheelTimePicker";
import { FONTS } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { scheduleDailyNotification } from "../../hooks/useNotifications";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ScreenKey = "speak-life" | "how-it-works" | "daily-declaration";

const SCREENS: ScreenKey[] = [
  "speak-life",
  "how-it-works",
  "daily-declaration",
];

export default function WelcomeScreen() {
  const { colors, shadows } = useTheme();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notifTime, setNotifTime] = useState("08:00");

  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  const goToIndex = useCallback(
    (index: number) => {
      if (index >= 0 && index < SCREENS.length) {
        flatListRef.current?.scrollToIndex({ index, animated: true });
        setCurrentIndex(index);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    },
    []
  );

  const handleGetStarted = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Fire-and-forget — don't block navigation on permission result
    scheduleDailyNotification(notifTime).catch(() => {});
    router.push("/(auth)/sign-in");
  }, [notifTime, router]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleTimeChange = useCallback((time: string) => {
    setNotifTime(time);
  }, []);

  const renderScreen = useCallback(
    ({ item }: { item: ScreenKey }) => {
      switch (item) {
        case "speak-life":
          return (
            <View style={styles.screen}>
              <View style={styles.screenContent}>
                {/* Flame icon */}
                <View style={styles.flameContainer}>
                  <View style={styles.flameGlow} />
                  <Flame size={80} color={colors.accent} />
                </View>

                {/* Branding */}
                <Text style={styles.brandTitle}>
                  RHEMA{"\n"}
                  <Text style={styles.brandAccent}>FLOW</Text>
                </Text>

                <View style={styles.divider} />

                {/* Headline */}
                <Text style={styles.headline}>Speak Life Over</Text>
                <Text style={styles.headlineAccent}>Your Situation</Text>

                {/* Tagline */}
                <Text style={styles.tagline}>
                  AI-powered faith declarations{"\n"}that shift the atmosphere
                </Text>
              </View>
            </View>
          );

        case "how-it-works":
          return (
            <View style={styles.screen}>
              <View style={styles.screenContent}>
                <Text style={styles.sectionTitle}>
                  How It <Text style={styles.headlineAccent}>Works</Text>
                </Text>

                <View style={styles.stepsContainer}>
                  {/* Step 1 */}
                  <View style={styles.stepRow}>
                    <View
                      style={[
                        styles.stepIcon,
                        { backgroundColor: "rgba(212,149,74,0.10)" },
                      ]}
                    >
                      <Layers size={26} color={colors.accent} />
                    </View>
                    <View style={styles.stepText}>
                      <Text style={styles.stepLabel}>STEP 1</Text>
                      <Text style={styles.stepTitle}>
                        Tap a declaration category
                      </Text>
                      <Text style={styles.stepDesc}>
                        Health, Wealth, Protection, Identity & more
                      </Text>
                    </View>
                  </View>

                  {/* Step 2 */}
                  <View style={styles.stepRow}>
                    <View
                      style={[
                        styles.stepIcon,
                        { backgroundColor: colors.purpleMuted },
                      ]}
                    >
                      <Volume2 size={26} color={colors.purple} />
                    </View>
                    <View style={styles.stepText}>
                      <Text
                        style={[
                          styles.stepLabel,
                          { color: colors.purple },
                        ]}
                      >
                        STEP 2
                      </Text>
                      <Text style={styles.stepTitle}>
                        Declare or Hear it spoken over you
                      </Text>
                      <Text style={styles.stepDesc}>
                        With cinematic audio & atmospheric backing
                      </Text>
                    </View>
                  </View>

                  {/* Step 3 */}
                  <View style={styles.stepRow}>
                    <View
                      style={[
                        styles.stepIcon,
                        { backgroundColor: colors.accentMuted },
                      ]}
                    >
                      <Share2 size={26} color={colors.accent} />
                    </View>
                    <View style={styles.stepText}>
                      <Text
                        style={[
                          styles.stepLabel,
                          { color: colors.accent },
                        ]}
                      >
                        STEP 3
                      </Text>
                      <Text style={styles.stepTitle}>
                        Save & share with the world
                      </Text>
                      <Text style={styles.stepDesc}>
                        Beautiful cards ready to inspire others
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          );

        case "daily-declaration":
          return (
            <View style={styles.screen}>
              <View style={styles.screenContent}>
                {/* Bell icon with glow */}
                <View style={styles.bellContainer}>
                  <View style={styles.bellGlow} />
                  <View style={styles.bellCircle}>
                    <Bell size={44} color={colors.textInverse} />
                  </View>
                </View>

                <Text style={styles.headline}>Never Miss Your</Text>
                <Text style={styles.headlineAccent}>Daily Declaration</Text>

                <Text style={styles.tagline}>
                  Set a daily reminder to speak life{"\n"}and shift the
                  atmosphere over your day
                </Text>

                {/* Time picker */}
                <Text style={styles.timeLabel}>REMIND ME DAILY AT</Text>
                <View style={styles.timePickerWrapper}>
                  <ScrollWheelTimePicker
                    value={notifTime}
                    onChange={handleTimeChange}
                  />
                </View>

                {/* CTA */}
                <Pressable
                  onPress={handleGetStarted}
                  style={({ pressed }) => [
                    styles.ctaButton,
                    pressed && styles.ctaButtonPressed,
                  ]}
                >
                  <Text style={styles.ctaText}>Get Started</Text>
                  <ArrowRight size={20} color={colors.textInverse} />
                </Pressable>
              </View>
            </View>
          );
      }
    },
    [notifTime, handleTimeChange, handleGetStarted, colors, shadows, styles]
  );

  return (
    <LinearGradient
      colors={[colors.background, "#F0E6D6", colors.background]}
      locations={[0, 0.45, 1]}
      style={styles.container}
    >
      {/* Skip */}
      {currentIndex < SCREENS.length - 1 && (
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(auth)/sign-in");
          }}
          style={styles.skipButton}
        >
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      )}

      {/* Carousel */}
      <FlatList
        ref={flatListRef}
        data={SCREENS}
        renderItem={renderScreen}
        keyExtractor={(item) => item}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={styles.flatList}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Bottom: dots + next */}
      <View style={styles.bottomBar}>
        <View style={styles.dots}>
          {SCREENS.map((_, i) => (
            <Pressable key={i} onPress={() => goToIndex(i)}>
              <View
                style={[
                  styles.dot,
                  i === currentIndex ? styles.dotActive : styles.dotInactive,
                ]}
              />
            </Pressable>
          ))}
        </View>

        {currentIndex < SCREENS.length - 1 ? (
          <Pressable
            onPress={() => goToIndex(currentIndex + 1)}
            style={({ pressed }) => [
              styles.nextButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <ChevronRight size={22} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>
    </LinearGradient>
  );
}

const createStyles = (colors: any, shadows: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    flatList: {
      flex: 1,
    },
    skipButton: {
      position: "absolute",
      top: Platform.OS === "ios" ? 60 : 40,
      right: 24,
      zIndex: 10,
      padding: 8,
    },
    skipText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 14,
      color: colors.textTertiary,
      letterSpacing: 2,
      textTransform: "uppercase",
    },

    // --- Screens ---
    screen: {
      width: SCREEN_WIDTH,
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    screenContent: {
      alignItems: "center",
      paddingHorizontal: 32,
      width: "100%",
    },

    // --- Screen 1: Speak Life ---
    flameContainer: {
      marginBottom: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    flameGlow: {
      position: "absolute",
      width: 160,
      height: 160,
      borderRadius: 80,
      backgroundColor: "rgba(212,149,74,0.12)",
    },
    brandTitle: {
      fontFamily: FONTS.display,
      fontSize: 44,
      color: colors.textPrimary,
      textAlign: "center",
      letterSpacing: 6,
      lineHeight: 54,
    },
    brandAccent: {
      color: colors.purple,
    },
    divider: {
      width: 60,
      height: 3,
      borderRadius: 2,
      backgroundColor: colors.accent,
      marginVertical: 24,
    },
    headline: {
      fontFamily: FONTS.display,
      fontSize: 24,
      color: colors.textPrimary,
      textAlign: "center",
    },
    headlineAccent: {
      fontFamily: FONTS.display,
      fontSize: 24,
      color: colors.accent,
      textAlign: "center",
      marginBottom: 16,
    },
    tagline: {
      fontFamily: FONTS.body,
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
    },

    // --- Screen 2: How It Works ---
    sectionTitle: {
      fontFamily: FONTS.display,
      fontSize: 28,
      color: colors.textPrimary,
      textAlign: "center",
      marginBottom: 40,
    },
    stepsContainer: {
      width: "100%",
      gap: 28,
    },
    stepRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 16,
    },
    stepIcon: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      ...shadows.small,
    },
    stepText: {
      flex: 1,
    },
    stepLabel: {
      fontFamily: FONTS.bodyBold,
      fontSize: 10,
      color: colors.accent,
      letterSpacing: 3,
      marginBottom: 4,
    },
    stepTitle: {
      fontFamily: FONTS.bodyBold,
      fontSize: 17,
      color: colors.textPrimary,
    },
    stepDesc: {
      fontFamily: FONTS.body,
      fontSize: 13,
      color: colors.textSecondary,
      marginTop: 4,
      lineHeight: 18,
    },

    // --- Screen 3: Daily Declaration ---
    bellContainer: {
      marginBottom: 28,
      alignItems: "center",
      justifyContent: "center",
    },
    bellGlow: {
      position: "absolute",
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: "rgba(139,92,246,0.10)",
    },
    bellCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.purple,
      alignItems: "center",
      justifyContent: "center",
    },
    timeLabel: {
      fontFamily: FONTS.bodyBold,
      fontSize: 10,
      color: colors.textTertiary,
      letterSpacing: 3,
      marginTop: 28,
      marginBottom: 12,
    },
    timePickerWrapper: {
      marginBottom: 36,
    },
    ctaButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: colors.purple,
      width: "100%",
      paddingVertical: 18,
      borderRadius: 16,
    },
    ctaButtonPressed: {
      opacity: 0.8,
    },
    ctaText: {
      fontFamily: FONTS.display,
      fontSize: 18,
      color: colors.textInverse,
      letterSpacing: 2,
      textTransform: "uppercase",
    },

    // --- Bottom Bar ---
    bottomBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 32,
      paddingBottom: Platform.OS === "ios" ? 50 : 32,
      paddingTop: 16,
    },
    dots: {
      flexDirection: "row",
      gap: 8,
    },
    dot: {
      borderRadius: 4,
    },
    dotActive: {
      width: 28,
      height: 6,
      backgroundColor: colors.accent,
    },
    dotInactive: {
      width: 8,
      height: 6,
      backgroundColor: colors.border,
    },
    nextButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
      ...shadows.small,
    },
  });
