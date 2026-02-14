import { useState, useEffect, useCallback } from "react";
import {
  View,
  FlatList,
  Pressable,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Heart, Trash2, BookOpen } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Typography } from "../../components/ui/Typography";
import { COLORS } from "../../constants/theme";
import { CATEGORY_GRADIENTS } from "../../constants/categories";
import { Declaration, DeclarationCategory } from "../../types";
import {
  onDeclarationsSnapshot,
  deleteDeclaration,
  toggleFavorite,
} from "../../services/favorites";

export default function SavedScreen() {
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "favorites">("all");

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

  const renderItem = ({ item }: { item: Declaration }) => {
    const gradientColors = CATEGORY_GRADIENTS[item.category] ||
      CATEGORY_GRADIENTS[DeclarationCategory.GENERAL];

    return (
      <View style={styles.card}>
        <LinearGradient
          colors={[gradientColors[0] + "20", gradientColors[1] + "10"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          {/* Category label */}
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.categoryPill,
                { backgroundColor: gradientColors[0] + "30" },
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
                onPress={() => handleToggleFavorite(item)}
                style={styles.iconBtn}
              >
                <Heart
                  size={18}
                  color={
                    item.isFavorite ? COLORS.fireOrange : COLORS.slate400
                  }
                  fill={item.isFavorite ? COLORS.fireOrange : "transparent"}
                />
              </Pressable>
              <Pressable
                onPress={() => handleDelete(item)}
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
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.voidBlack,
  },
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
    backgroundColor: COLORS.slate900,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterBtnActive: {
    borderColor: COLORS.electricPurple,
    backgroundColor: COLORS.electricPurple + "20",
  },
  filterText: {
    color: COLORS.slate400,
    fontSize: 14,
  },
  filterTextActive: {
    color: COLORS.electricPurple,
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
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardGradient: {
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
