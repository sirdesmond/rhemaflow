import { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart, Trash2, BookOpen, ChevronLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import ViewShot from "react-native-view-shot";
import { Typography } from "../../components/ui/Typography";
import { DeclarationCard } from "../../components/DeclarationCard";
import { COLORS } from "../../constants/theme";
import { CATEGORY_GRADIENTS } from "../../constants/categories";
import { Declaration, DeclarationCategory } from "../../types";
import {
  onDeclarationsSnapshot,
  deleteDeclaration,
  toggleFavorite,
} from "../../services/favorites";
import { generateSpeech, generateImage } from "../../services/declarations";
import { useAudio } from "../../hooks/useAudio";

export default function SavedScreen() {
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [selected, setSelected] = useState<Declaration | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const { isPlaying, atmosphere, play, togglePlayback, cycleAtmosphere, stop } =
    useAudio();
  const viewShotRef = useRef<ViewShot>(null);

  useEffect(() => {
    const unsubscribe = onDeclarationsSnapshot((items) => {
      setDeclarations(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filtered =
    filter === "favorites"
      ? declarations.filter((d) => d.isFavorite)
      : declarations;

  const handleToggleFavorite = useCallback(
    async (item: Declaration) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      try {
        await toggleFavorite(item.id, !item.isFavorite);
      } catch (e) {
        console.error("Toggle favorite error:", e);
      }
    },
    []
  );

  const handleDelete = useCallback((item: Declaration) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Delete Declaration",
      "Are you sure you want to remove this declaration?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDeclaration(item.id);
            } catch (e) {
              console.error("Delete error:", e);
            }
          },
        },
      ]
    );
  }, []);

  const handleCardPress = (item: Declaration) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(item);
    setAudioBase64(null);
  };

  const handleBack = async () => {
    await stop();
    setSelected(null);
    setAudioBase64(null);
  };

  const handlePlayToggle = async () => {
    if (isPlaying) {
      await stop();
      return;
    }

    // If we already have audio cached, play it
    if (audioBase64) {
      await play(audioBase64);
      return;
    }

    // Generate speech on demand
    if (!selected) return;
    setIsLoadingAudio(true);
    try {
      const audio = await generateSpeech(selected.text);
      if (audio) {
        setAudioBase64(audio);
        await play(audio);
      }
    } catch (e) {
      console.error("Speech generation error:", e);
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const handleRegenerateImage = async () => {
    if (!selected) return;
    setIsGeneratingImage(true);
    try {
      const newImageUrl = await generateImage(selected.category, selected.text);
      if (newImageUrl) {
        setSelected((prev) =>
          prev ? { ...prev, imageUrl: newImageUrl } : null
        );
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShare = async () => {
    if (!viewShotRef.current?.capture) return;
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, { mimeType: "image/png" });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleSaveToggle = async () => {
    if (!selected) return;
    await handleToggleFavorite(selected);
    // Update local selected state to reflect the toggle
    setSelected((prev) =>
      prev ? { ...prev, isFavorite: !prev.isFavorite } : null
    );
  };

  // Detail view when a card is selected
  if (selected) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header with back button */}
        <View style={styles.detailHeader}>
          <Pressable onPress={handleBack} style={styles.backBtn}>
            <ChevronLeft size={18} color="white" />
            <Typography variant="caption" style={styles.backBtnText}>
              Back
            </Typography>
          </Pressable>
          <Typography variant="caption" style={styles.detailHeaderText}>
            SAVED DECLARATION
          </Typography>
          <View style={{ width: 80 }} />
        </View>

        <View style={styles.detailContent}>
          <ViewShot
            ref={viewShotRef}
            options={{ format: "png", quality: 1 }}
            style={{ flex: 1 }}
          >
            <DeclarationCard
              text={selected.text}
              reference={selected.reference}
              scriptureText={selected.scriptureText}
              category={selected.category}
              backgroundImageUrl={selected.imageUrl}
              isPlaying={isPlaying || isLoadingAudio}
              onPlayToggle={handlePlayToggle}
              onRegenerateImage={handleRegenerateImage}
              isGeneratingImage={isGeneratingImage}
              atmosphere={atmosphere}
              onAtmosphereChange={cycleAtmosphere}
              onShare={handleShare}
              onSave={handleSaveToggle}
              isSaved={selected.isFavorite}
            />
          </ViewShot>
        </View>
      </SafeAreaView>
    );
  }

  // List view
  const renderItem = ({ item }: { item: Declaration }) => {
    const gradientColors =
      CATEGORY_GRADIENTS[item.category] ||
      CATEGORY_GRADIENTS[DeclarationCategory.GENERAL];

    return (
      <Pressable onPress={() => handleCardPress(item)}>
        <View style={styles.card}>
          {/* Left accent bar */}
          <View
            style={[
              styles.accentBar,
              { backgroundColor: gradientColors[0] },
            ]}
          />
          <View style={styles.cardBody}>
            {/* Category label */}
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.categoryPill,
                  { backgroundColor: gradientColors[0] + "20" },
                ]}
              >
                <Typography
                  variant="caption"
                  style={[styles.categoryText, { color: gradientColors[0] }]}
                >
                  {item.category}
                </Typography>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleToggleFavorite(item);
                  }}
                  style={styles.iconBtn}
                >
                  <Heart
                    size={18}
                    color={
                      item.isFavorite ? COLORS.divineGold : COLORS.slate400
                    }
                    fill={item.isFavorite ? COLORS.divineGold : "transparent"}
                  />
                </Pressable>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                  style={styles.iconBtn}
                >
                  <Trash2 size={18} color={COLORS.slate400} />
                </Pressable>
              </View>
            </View>

            {/* Declaration text */}
            <Typography
              variant="body"
              style={styles.declarationText}
              numberOfLines={4}
            >
              {item.text}
            </Typography>

            {/* Scripture */}
            <View style={styles.scriptureRow}>
              <BookOpen size={14} color={COLORS.divineGold} />
              <Typography variant="caption" style={styles.reference}>
                {item.reference}
              </Typography>
            </View>
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setFilter("all")}
          style={[
            styles.filterBtn,
            filter === "all" && styles.filterBtnActive,
          ]}
        >
          <Typography
            variant="button"
            style={[
              styles.filterText,
              filter === "all" && styles.filterTextActive,
            ]}
          >
            All ({declarations.length})
          </Typography>
        </Pressable>
        <Pressable
          onPress={() => setFilter("favorites")}
          style={[
            styles.filterBtn,
            filter === "favorites" && styles.filterBtnActive,
          ]}
        >
          <Typography
            variant="button"
            style={[
              styles.filterText,
              filter === "favorites" && styles.filterTextActive,
            ]}
          >
            Favorites
          </Typography>
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.electricPurple} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Heart size={48} color={COLORS.slate700} />
          <Typography variant="heading" style={styles.emptyTitle}>
            {filter === "favorites"
              ? "No favorites yet"
              : "No saved declarations"}
          </Typography>
          <Typography variant="caption" style={styles.emptySubtitle}>
            {filter === "favorites"
              ? "Tap the heart icon on a declaration to save it here."
              : "Generate declarations from the Home tab and save them."}
          </Typography>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.voidBlack,
  },
  // Detail view
  detailHeader: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  backBtnText: {
    color: "white",
    fontSize: 12,
    letterSpacing: 0.5,
  },
  detailHeaderText: {
    color: COLORS.slate400,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  detailContent: {
    flex: 1,
    padding: 16,
    paddingBottom: 100,
  },
  // List view
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  filterBtnActive: {
    borderColor: COLORS.warmGold,
    backgroundColor: "rgba(212,168,84,0.15)",
  },
  filterText: {
    color: COLORS.slate400,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  filterTextActive: {
    color: COLORS.warmGold,
  },
  list: {
    padding: 20,
    paddingBottom: 100,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
    backgroundColor: COLORS.glass,
    flexDirection: "row",
  },
  accentBar: {
    width: 4,
  },
  cardBody: {
    flex: 1,
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconBtn: {
    padding: 6,
  },
  declarationText: {
    color: COLORS.white,
    lineHeight: 24,
    marginBottom: 12,
  },
  scriptureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  reference: {
    color: COLORS.divineGold,
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 12,
  },
  emptyTitle: {
    color: COLORS.slate400,
    textAlign: "center",
  },
  emptySubtitle: {
    color: COLORS.slate700,
    textAlign: "center",
    lineHeight: 20,
  },
});
