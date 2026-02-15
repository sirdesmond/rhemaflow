import { useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  FlatList,
  Dimensions,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import {
  Flame,
  Layers,
  Volume2,
  Share2,
  Bell,
  ChevronRight,
  ArrowRight,
} from "lucide-react-native";
import { COLORS, FONTS } from "../../constants/theme";
import { scheduleDailyNotification } from "../../hooks/useNotifications";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ScreenKey = "speak-life" | "how-it-works" | "daily-declaration";

const SCREENS: ScreenKey[] = [
  "speak-life",
  "how-it-works",
  "daily-declaration",
];

export default function WelcomeScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notifHour, setNotifHour] = useState(8);
  const [notifMinute, setNotifMinute] = useState(0);

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
    const timeStr = `${String(notifHour).padStart(2, "0")}:${String(notifMinute).padStart(2, "0")}`;
    // Fire-and-forget — don't block navigation on permission result
    scheduleDailyNotification(timeStr).catch(() => {});
    router.push("/(auth)/sign-in");
  }, [notifHour, notifMinute, router]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const cycleHour = useCallback(() => {
    setNotifHour((h) => (h + 1) % 24);
    Haptics.selectionAsync();
  }, []);

  const cycleMinute = useCallback(() => {
    setNotifMinute((m) => (m + 15) % 60);
    Haptics.selectionAsync();
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
                  <Flame size={80} color={COLORS.fireOrange} />
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
                        { borderColor: "rgba(245,158,11,0.3)" },
                      ]}
                    >
                      <Layers size={26} color={COLORS.fireOrange} />
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
                        { borderColor: "rgba(124,58,237,0.3)" },
                      ]}
                    >
                      <Volume2 size={26} color={COLORS.electricPurple} />
                    </View>
                    <View style={styles.stepText}>
                      <Text
                        style={[
                          styles.stepLabel,
                          { color: COLORS.electricPurple },
                        ]}
                      >
                        STEP 2
                      </Text>
                      <Text style={styles.stepTitle}>
                        Hear it spoken over you
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
                        { borderColor: "rgba(251,191,36,0.3)" },
                      ]}
                    >
                      <Share2 size={26} color={COLORS.divineGold} />
                    </View>
                    <View style={styles.stepText}>
                      <Text
                        style={[
                          styles.stepLabel,
                          { color: COLORS.divineGold },
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
                    <Bell size={44} color={COLORS.white} />
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
                <View style={styles.timePicker}>
                  <Pressable onPress={cycleHour} style={styles.timeButton}>
                    <Text style={styles.timeValue}>
                      {String(notifHour).padStart(2, "0")}
                    </Text>
                  </Pressable>
                  <Text style={styles.timeColon}>:</Text>
                  <Pressable onPress={cycleMinute} style={styles.timeButton}>
                    <Text style={styles.timeValue}>
                      {String(notifMinute).padStart(2, "0")}
                    </Text>
                  </Pressable>
                </View>
                <Text style={styles.timeHint}>Tap to change</Text>

                {/* CTA */}
                <Pressable
                  onPress={handleGetStarted}
                  style={({ pressed }) => [
                    styles.ctaButton,
                    pressed && styles.ctaButtonPressed,
                  ]}
                >
                  <Text style={styles.ctaText}>Get Started</Text>
                  <ArrowRight size={20} color={COLORS.white} />
                </Pressable>
              </View>
            </View>
          );
      }
    },
    [notifHour, notifMinute, cycleHour, cycleMinute, handleGetStarted]
  );

  return (
    <LinearGradient
      colors={[COLORS.voidBlack, COLORS.deepPurple, COLORS.voidBlack]}
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
            <ChevronRight size={22} color={COLORS.white} />
          </Pressable>
        ) : (
          <View style={{ width: 48 }} />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
    color: COLORS.slate400,
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
    backgroundColor: "rgba(245,158,11,0.15)",
  },
  brandTitle: {
    fontFamily: FONTS.display,
    fontSize: 44,
    color: COLORS.white,
    textAlign: "center",
    letterSpacing: 6,
    lineHeight: 54,
  },
  brandAccent: {
    color: COLORS.electricPurple,
  },
  divider: {
    width: 60,
    height: 3,
    borderRadius: 2,
    backgroundColor: COLORS.fireOrange,
    marginVertical: 24,
  },
  headline: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.white,
    textAlign: "center",
  },
  headlineAccent: {
    fontFamily: FONTS.display,
    fontSize: 24,
    color: COLORS.divineGold,
    textAlign: "center",
    marginBottom: 16,
  },
  tagline: {
    fontFamily: FONTS.body,
    fontSize: 16,
    color: COLORS.slate400,
    textAlign: "center",
    lineHeight: 24,
  },

  // --- Screen 2: How It Works ---
  sectionTitle: {
    fontFamily: FONTS.display,
    fontSize: 28,
    color: COLORS.white,
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
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  stepText: {
    flex: 1,
  },
  stepLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.fireOrange,
    letterSpacing: 3,
    marginBottom: 4,
  },
  stepTitle: {
    fontFamily: FONTS.bodyBold,
    fontSize: 17,
    color: COLORS.white,
  },
  stepDesc: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.slate400,
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
    backgroundColor: "rgba(124,58,237,0.15)",
  },
  bellCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.electricPurple,
    alignItems: "center",
    justifyContent: "center",
  },
  timeLabel: {
    fontFamily: FONTS.bodyBold,
    fontSize: 10,
    color: COLORS.slate400,
    letterSpacing: 3,
    marginTop: 28,
    marginBottom: 12,
  },
  timePicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeButton: {
    backgroundColor: COLORS.slate900,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  timeValue: {
    fontFamily: FONTS.bodyBold,
    fontSize: 32,
    color: COLORS.white,
  },
  timeColon: {
    fontFamily: FONTS.bodyBold,
    fontSize: 32,
    color: COLORS.slate400,
  },
  timeHint: {
    fontFamily: FONTS.body,
    fontSize: 12,
    color: COLORS.slate400,
    marginTop: 8,
    marginBottom: 36,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.electricPurple,
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
    color: COLORS.white,
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
    backgroundColor: COLORS.divineGold,
  },
  dotInactive: {
    width: 8,
    height: 6,
    backgroundColor: COLORS.slate700,
  },
  nextButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
});
