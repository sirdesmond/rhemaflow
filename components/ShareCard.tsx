import { View, Text, ImageBackground, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BookOpen, Flame, Download } from "lucide-react-native";
import { DeclarationCategory } from "../types";
import { CATEGORY_GRADIENTS } from "../constants/categories";
import { COLORS } from "../constants/theme";

interface ShareCardProps {
  text: string;
  reference: string;
  scriptureText: string;
  category: DeclarationCategory;
  backgroundImageUrl: string | null;
}

/**
 * A non-interactive, self-sizing card designed for sharing.
 * Trimmed layout with declaration, scripture reference, and download CTA.
 */
export function ShareCard({
  text,
  reference,
  scriptureText,
  category,
  backgroundImageUrl,
}: ShareCardProps) {
  const [gradStart, gradEnd] = CATEGORY_GRADIENTS[category];

  const content = (
    <View style={styles.inner}>
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.72)",
          "rgba(0,0,0,0.35)",
          "rgba(0,0,0,0.55)",
          "rgba(0,0,0,0.95)",
        ]}
        locations={[0, 0.2, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Category */}
      <View style={styles.categoryRow}>
        <Text style={styles.categoryLabel}>{category}</Text>
        <View style={styles.categoryDivider} />
      </View>

      {/* Declaration */}
      <View style={styles.declarationContainer}>
        <Text style={styles.declarationText}>
          &ldquo;{text}&rdquo;
        </Text>
      </View>

      {/* Scripture reference only (trimmed - no full verse text) */}
      <View style={styles.referenceBadge}>
        <BookOpen size={12} color={COLORS.divineGold} />
        <Text style={styles.referenceText}>{reference}</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Download CTA banner */}
      <View style={styles.ctaBanner}>
        <View style={styles.ctaLeft}>
          <Flame size={20} color={COLORS.divineGold} fill={COLORS.divineGold} />
          <View>
            <Text style={styles.ctaBrand}>RhemaFlow</Text>
            <Text style={styles.ctaTagline}>AI-Powered Faith Declarations</Text>
          </View>
        </View>
        <View style={styles.ctaButton}>
          <Download size={12} color={COLORS.voidBlack} />
          <Text style={styles.ctaButtonText}>Get App</Text>
        </View>
      </View>
    </View>
  );

  if (backgroundImageUrl) {
    return (
      <View style={styles.wrapper}>
        <ImageBackground
          source={{ uri: backgroundImageUrl }}
          style={styles.image}
          imageStyle={{ borderRadius: 24, opacity: 0.8 }}
        >
          {content}
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[gradStart, gradEnd]}
        style={styles.gradient}
      >
        {content}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 390,
    borderRadius: 24,
    overflow: "hidden",
  },
  image: {
    width: "100%",
  },
  gradient: {
    width: "100%",
    borderRadius: 24,
  },
  inner: {
    padding: 28,
    paddingTop: 32,
    paddingBottom: 20,
    gap: 16,
  },
  categoryRow: {
    marginBottom: 4,
  },
  categoryLabel: {
    fontFamily: "Lato-Bold",
    fontSize: 10,
    color: COLORS.divineGold,
    textTransform: "uppercase",
    letterSpacing: 3,
  },
  categoryDivider: {
    height: 2,
    width: 32,
    backgroundColor: COLORS.divineGold,
    marginTop: 4,
  },
  declarationContainer: {
    alignItems: "center",
  },
  declarationText: {
    fontFamily: "Cinzel",
    fontSize: 20,
    color: "white",
    textAlign: "center",
    lineHeight: 32,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  referenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  referenceText: {
    fontFamily: "Lato-Bold",
    fontSize: 11,
    color: COLORS.divineGold,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginTop: 4,
  },
  ctaBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ctaLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  ctaBrand: {
    fontFamily: "Cinzel",
    fontSize: 15,
    color: "white",
    letterSpacing: 1,
  },
  ctaTagline: {
    fontFamily: "Lato",
    fontSize: 10,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 0.5,
    marginTop: 1,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: COLORS.divineGold,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  ctaButtonText: {
    fontFamily: "Lato-Bold",
    fontSize: 11,
    color: COLORS.voidBlack,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
