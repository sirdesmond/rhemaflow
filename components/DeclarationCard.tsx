import { View, Text, Pressable, ImageBackground, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  Play,
  Pause,
  Share2,
  RefreshCw,
  Music,
  VolumeX,
  BookOpen,
  Heart,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { DeclarationCategory, AtmosphereType } from "../types";
import { CATEGORY_GRADIENTS } from "../constants/categories";
import { ATMOSPHERE_TRACKS } from "../constants/tracks";
import { COLORS } from "../constants/theme";

interface DeclarationCardProps {
  text: string;
  reference: string;
  scriptureText: string;
  category: DeclarationCategory;
  backgroundImageUrl: string | null;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onRegenerateImage: () => void;
  isGeneratingImage: boolean;
  atmosphere: AtmosphereType;
  onAtmosphereChange: () => void;
  onShare: () => void;
  onSave: () => void;
  isSaved: boolean;
}

export function DeclarationCard({
  text,
  reference,
  scriptureText,
  category,
  backgroundImageUrl,
  isPlaying,
  onPlayToggle,
  onRegenerateImage,
  isGeneratingImage,
  atmosphere,
  onAtmosphereChange,
  onShare,
  onSave,
  isSaved,
}: DeclarationCardProps) {
  const [gradStart, gradEnd] = CATEGORY_GRADIENTS[category];
  const trackMeta = ATMOSPHERE_TRACKS.find((t) => t.id === atmosphere);

  const cardContent = (
    <View style={styles.cardInner}>
      {/* Gradient overlay for readability */}
      <LinearGradient
        colors={[
          "rgba(0,0,0,0.75)",
          "rgba(0,0,0,0.55)",
          "rgba(0,0,0,0.75)",
          "rgba(0,0,0,0.92)",
        ]}
        locations={[0, 0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Top controls */}
      <View style={styles.topControls}>
        <View>
          <Text style={styles.categoryLabel}>{category}</Text>
          <View style={styles.categoryDivider} />
        </View>

        <View style={styles.topButtons}>
          {/* Atmosphere toggle */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAtmosphereChange();
            }}
            style={[
              styles.controlPill,
              atmosphere !== "none" && styles.controlPillActive,
            ]}
          >
            {atmosphere !== "none" ? (
              <Music size={12} color="white" />
            ) : (
              <VolumeX size={12} color="rgba(255,255,255,0.7)" />
            )}
            <Text style={styles.controlPillText}>
              {trackMeta?.label ?? "Off"}
            </Text>
          </Pressable>

          {/* Regenerate image */}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRegenerateImage();
            }}
            disabled={isGeneratingImage}
            style={styles.iconButton}
          >
            <RefreshCw
              size={16}
              color={
                isGeneratingImage
                  ? COLORS.divineGold
                  : "rgba(255,255,255,0.8)"
              }
            />
          </Pressable>
        </View>
      </View>

      {/* Scrollable middle: declaration + scripture */}
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Declaration text */}
        <View style={styles.declarationContainer}>
          <Text style={styles.declarationText}>
            &ldquo;{text}&rdquo;
          </Text>
        </View>

        {/* Scripture card */}
        <View style={styles.scriptureOuter}>
          <BlurView
            intensity={20}
            tint="dark"
            style={styles.scriptureBlur}
          >
            <View style={styles.scriptureInner}>
              <Text style={styles.scriptureText}>{scriptureText}</Text>
              <View style={styles.referenceBadge}>
                <BookOpen size={12} color={COLORS.divineGold} />
                <Text style={styles.referenceText}>{reference}</Text>
              </View>
            </View>
          </BlurView>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={styles.bottomActions}>
        {/* Speak Life / Pause */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onPlayToggle();
          }}
          style={[
            styles.playButton,
            isPlaying ? styles.playButtonActive : styles.playButtonDefault,
          ]}
        >
          {isPlaying ? (
            <Pause size={20} color="white" fill="white" />
          ) : (
            <Play size={20} color={COLORS.voidBlack} fill={COLORS.voidBlack} />
          )}
          <Text
            style={[
              styles.playButtonText,
              { color: isPlaying ? "white" : COLORS.voidBlack },
            ]}
          >
            {isPlaying ? "Speaking..." : "Speak Life"}
          </Text>
        </Pressable>

        {/* Save */}
        <Pressable
          onPress={() => {
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            );
            onSave();
          }}
          style={styles.actionButton}
        >
          <Heart
            size={22}
            color={isSaved ? COLORS.electricPurple : "white"}
            fill={isSaved ? COLORS.electricPurple : "transparent"}
          />
        </Pressable>

        {/* Share */}
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onShare();
          }}
          style={styles.actionButton}
        >
          <Share2 size={22} color="white" />
        </Pressable>
      </View>
    </View>
  );

  // Render with background image or gradient fallback
  if (backgroundImageUrl) {
    return (
      <View style={styles.cardWrapper}>
        <ImageBackground
          source={{ uri: backgroundImageUrl }}
          style={styles.cardImage}
          imageStyle={{ borderRadius: 24, opacity: 0.8 }}
        >
          {cardContent}
        </ImageBackground>
      </View>
    );
  }

  return (
    <View style={styles.cardWrapper}>
      <LinearGradient
        colors={[gradStart, gradEnd]}
        style={styles.cardGradient}
      >
        {cardContent}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  cardImage: {
    flex: 1,
  },
  cardGradient: {
    flex: 1,
    borderRadius: 24,
  },
  cardInner: {
    flex: 1,
  },

  // Top controls
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    zIndex: 20,
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
  topButtons: {
    flexDirection: "row",
    gap: 8,
  },
  controlPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  controlPillActive: {
    backgroundColor: "rgba(124,58,237,0.8)",
  },
  controlPillText: {
    fontFamily: "Lato-Bold",
    fontSize: 10,
    color: "white",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  iconButton: {
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },

  // Scrollable area between top controls and bottom actions
  scrollArea: {
    flex: 1,
    zIndex: 20,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: 8,
  },

  // Declaration
  declarationContainer: {
    alignItems: "center",
    paddingHorizontal: 28,
    marginBottom: 16,
  },
  declarationText: {
    fontFamily: "Cinzel",
    fontSize: 22,
    color: "white",
    textAlign: "center",
    lineHeight: 34,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },

  // Scripture
  scriptureOuter: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  scriptureBlur: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  scriptureInner: {
    padding: 16,
  },
  scriptureText: {
    fontFamily: "PlayfairDisplay-Italic",
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 12,
  },
  referenceBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  referenceText: {
    fontFamily: "Lato-Bold",
    fontSize: 11,
    color: COLORS.divineGold,
    textTransform: "uppercase",
    letterSpacing: 2,
  },

  // Bottom actions
  bottomActions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 8,
    zIndex: 20,
  },
  playButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 56,
    borderRadius: 16,
  },
  playButtonDefault: {
    backgroundColor: "white",
  },
  playButtonActive: {
    backgroundColor: COLORS.electricPurple,
    shadowColor: COLORS.electricPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  playButtonText: {
    fontFamily: "Lato-Bold",
    fontSize: 16,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  actionButton: {
    height: 56,
    width: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
  },
});
