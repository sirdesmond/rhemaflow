import { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Switch,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
  Linking,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  LogOut,
  Trash2,
  Bell,
  Clock,
  Music,
  ChevronRight,
  User,
  Crown,
  Zap,
  Volume2,
  Plus,
  X,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Typography } from "../../components/ui/Typography";
import { COLORS, SHADOWS } from "../../constants/theme";
import { ATMOSPHERE_TRACKS } from "../../constants/tracks";
import { AtmosphereType, UserSettings, LifeStage } from "../../types";
import { useRouter } from "expo-router";
import { auth } from "../../services/firebase";
import { signOut, deleteAccount } from "../../services/auth";
import { useSubscription } from "../../hooks/useSubscription";
import {
  scheduleMultipleNotifications,
  cancelNotifications,
} from "../../hooks/useNotifications";
import {
  getUserSettings,
  updateUserSettings,
} from "../../services/settings";
import { logError } from "../../services/crashlytics";
import {
  trackNotificationToggled,
  trackNotificationTimeChanged,
  trackDefaultAtmosphereChanged,
  trackPaywallViewed,
} from "../../services/analytics";
import { ScrollWheelTimePicker } from "../../components/ScrollWheelTimePicker";

const ATMOSPHERE_OPTIONS: { id: AtmosphereType; label: string }[] =
  ATMOSPHERE_TRACKS.filter((t) => t.id !== "none").map((t) => ({
    id: t.id,
    label: t.label,
  }));

/**
 * Format "HH:MM" (24h) to display string like "8:00 AM"
 */
function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const hour24 = h || 0;
  const minute = m || 0;
  const period = hour24 >= 12 ? "PM" : "AM";
  let hour12 = hour24 % 12;
  if (hour12 === 0) hour12 = 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${period}`;
}

export default function SettingsScreen() {
  const user = auth.currentUser;
  const router = useRouter();
  const { isPro, usage } = useSubscription();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTimes, setNotificationTimes] = useState<string[]>([]);
  const [defaultAtmosphere, setDefaultAtmosphere] =
    useState<AtmosphereType>("glory");
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null); // null = adding new
  const [pickerTime, setPickerTime] = useState("08:00");
  const [showAtmospherePicker, setShowAtmospherePicker] = useState(false);
  const [voiceGender, setVoiceGender] = useState<UserSettings["voiceGender"]>("female");
  const [lifeStages, setLifeStages] = useState<LifeStage[]>([]);
  const [showLifeStages, setShowLifeStages] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load saved settings from Firestore on mount
  useEffect(() => {
    getUserSettings().then((settings) => {
      setNotificationsEnabled(settings.notificationsEnabled);
      setNotificationTimes(settings.notificationTimes || []);
      setDefaultAtmosphere(settings.defaultAtmosphere);
      setVoiceGender(settings.voiceGender);
      setLifeStages(settings.lifeStages || []);
    });
  }, []);

  const handleToggleNotifications = async (enabled: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsEnabled(enabled);
    trackNotificationToggled(enabled);
    if (enabled) {
      const times = notificationTimes.length > 0 ? notificationTimes : ["08:00"];
      const success = await scheduleMultipleNotifications(times);
      if (!success) {
        setNotificationsEnabled(false);
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings to receive daily declarations."
        );
        return;
      }
      if (notificationTimes.length === 0) {
        setNotificationTimes(["08:00"]);
        updateUserSettings({ notificationsEnabled: enabled, notificationTimes: ["08:00"] });
        return;
      }
    } else {
      await cancelNotifications();
    }
    updateUserSettings({ notificationsEnabled: enabled });
  };

  const openTimePicker = (index: number | null) => {
    setEditingTimeIndex(index);
    setPickerTime(index !== null && notificationTimes[index] ? notificationTimes[index] : "08:00");
    setShowTimePickerModal(true);
  };

  const handleSaveTime = async () => {
    let newTimes: string[];
    if (editingTimeIndex !== null) {
      newTimes = [...notificationTimes];
      newTimes[editingTimeIndex] = pickerTime;
    } else {
      newTimes = [...notificationTimes, pickerTime];
    }
    setNotificationTimes(newTimes);
    setShowTimePickerModal(false);
    trackNotificationTimeChanged(pickerTime);
    if (notificationsEnabled) {
      await scheduleMultipleNotifications(newTimes);
    }
    updateUserSettings({ notificationTimes: newTimes });
  };

  const handleRemoveTime = async (index: number) => {
    const newTimes = notificationTimes.filter((_, i) => i !== index);
    setNotificationTimes(newTimes);
    if (notificationsEnabled) {
      if (newTimes.length > 0) {
        await scheduleMultipleNotifications(newTimes);
      } else {
        await cancelNotifications();
      }
    }
    updateUserSettings({ notificationTimes: newTimes });
  };

  const handleAtmosphereChange = (atm: AtmosphereType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDefaultAtmosphere(atm);
    setShowAtmospherePicker(false);
    trackDefaultAtmosphereChanged(atm);
    updateUserSettings({ defaultAtmosphere: atm });
  };

  const handleVoiceGenderChange = (v: "male" | "female") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVoiceGender(v);
    updateUserSettings({ voiceGender: v });
  };

  const handleToggleLifeStage = (stage: LifeStage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLifeStages((prev) => {
      const next = prev.includes(stage)
        ? prev.filter((s) => s !== stage)
        : [...prev, stage];
      updateUserSettings({ lifeStages: next });
      return next;
    });
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            await signOut();
          } catch (e) {
            logError(e, "Sign out");
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account, all declarations, and all associated data. This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Are you sure?",
              "This is your final confirmation. All your data will be permanently removed.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete Forever",
                  style: "destructive",
                  onPress: async () => {
                    setIsDeleting(true);
                    try {
                      await deleteAccount();
                    } catch (e) {
                      logError(e, "Delete account");
                      Alert.alert("Error", "Failed to delete account. Please try again.");
                    } finally {
                      setIsDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const atmosphereLabel =
    ATMOSPHERE_OPTIONS.find((a) => a.id === defaultAtmosphere)?.label ||
    "Glory";

  return (
    <SafeAreaView style={styles.container}>
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile section */}
      <View style={styles.profileSection}>
        <LinearGradient
          colors={[COLORS.purple, COLORS.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarRing}
        >
          <View style={styles.avatar}>
            <User size={32} color={COLORS.textTertiary} />
          </View>
        </LinearGradient>
        <View style={styles.profileInfo}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Typography variant="heading" style={styles.profileName}>
              {user?.displayName || "Warrior of Faith"}
            </Typography>
            {isPro && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                  backgroundColor: COLORS.accentMuted,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 10,
                }}
              >
                <Crown size={10} color={COLORS.accent} />
                <Text
                  style={{
                    fontFamily: "Lato-Bold",
                    fontSize: 9,
                    color: COLORS.accent,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Pro
                </Text>
              </View>
            )}
          </View>
          <Typography variant="caption" style={styles.profileEmail}>
            {user?.email || "Anonymous"}
          </Typography>
        </View>
      </View>

      {/* Notifications section */}
      <View style={styles.section}>
        <Typography variant="caption" style={styles.sectionTitle}>
          NOTIFICATIONS
        </Typography>

        <View style={styles.row}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.purpleMuted }]}>
              <Bell size={18} color={COLORS.purple} />
            </View>
            <Typography variant="body" style={styles.rowLabel}>
              Daily Reminders
            </Typography>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{
              false: COLORS.border,
              true: COLORS.purple + "80",
            }}
            thumbColor={
              notificationsEnabled ? COLORS.purple : COLORS.textTertiary
            }
          />
        </View>

        {notificationsEnabled && (
          <View>
            {notificationTimes.map((time, index) => (
              <View key={index} style={styles.row}>
                <Pressable
                  style={styles.rowLeft}
                  onPress={() => openTimePicker(index)}
                >
                  <View style={[styles.iconCircle, { backgroundColor: COLORS.accentMuted }]}>
                    <Clock size={18} color={COLORS.accent} />
                  </View>
                  <Typography variant="body" style={styles.rowLabel}>
                    {formatTime(time)}
                  </Typography>
                </Pressable>
                <Pressable
                  onPress={() => handleRemoveTime(index)}
                  hitSlop={8}
                >
                  <X size={18} color={COLORS.textTertiary} />
                </Pressable>
              </View>
            ))}

            {notificationTimes.length < 3 && (
              <Pressable
                style={styles.row}
                onPress={() => openTimePicker(null)}
              >
                <View style={styles.rowLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: COLORS.purpleMuted }]}>
                    <Plus size={18} color={COLORS.purple} />
                  </View>
                  <Typography variant="body" style={[styles.rowLabel, { color: COLORS.purple }]}>
                    Add Reminder
                  </Typography>
                </View>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Preferences section */}
      <View style={styles.section}>
        <Typography variant="caption" style={styles.sectionTitle}>
          PREFERENCES
        </Typography>

        <Pressable
          style={styles.row}
          onPress={() => setShowAtmospherePicker(!showAtmospherePicker)}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.accentMuted }]}>
              <Music size={18} color={COLORS.accent} />
            </View>
            <Typography variant="body" style={styles.rowLabel}>
              Default Atmosphere
            </Typography>
          </View>
          <View style={styles.rowRight}>
            <Typography variant="caption" style={styles.rowValue}>
              {atmosphereLabel}
            </Typography>
            <ChevronRight size={16} color={COLORS.textTertiary} />
          </View>
        </Pressable>

        {showAtmospherePicker && (
          <View style={styles.pickerContainer}>
            {ATMOSPHERE_OPTIONS.map((opt) => (
              <Pressable
                key={opt.id}
                style={[
                  styles.pickerOption,
                  defaultAtmosphere === opt.id && styles.pickerOptionActive,
                ]}
                onPress={() => handleAtmosphereChange(opt.id)}
              >
                <Typography
                  variant="body"
                  style={[
                    styles.pickerText,
                    defaultAtmosphere === opt.id && styles.pickerTextActive,
                  ]}
                >
                  {opt.label}
                </Typography>
              </Pressable>
            ))}
          </View>
        )}

        {/* Voice row */}
        <Pressable
          style={styles.row}
          onPress={() => handleVoiceGenderChange(voiceGender === "male" ? "female" : "male")}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.accentMuted }]}>
              <Volume2 size={18} color={COLORS.accent} />
            </View>
            <Typography variant="body" style={styles.rowLabel}>
              Voice
            </Typography>
          </View>
          <View style={styles.rowRight}>
            <Typography variant="caption" style={styles.rowValue}>
              {voiceGender === "male" ? "Male" : "Female"}
            </Typography>
            <ChevronRight size={16} color={COLORS.textTertiary} />
          </View>
        </Pressable>

        {/* Life Stages row */}
        <Pressable
          style={styles.row}
          onPress={() => setShowLifeStages(!showLifeStages)}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.purpleMuted }]}>
              <User size={18} color={COLORS.purple} />
            </View>
            <View>
              <Typography variant="body" style={styles.rowLabel}>
                Life Stages
              </Typography>
              {lifeStages.length > 0 && !showLifeStages && (
                <Typography variant="caption" style={{ color: COLORS.textTertiary, marginTop: 2 }}>
                  {lifeStages.map((s) => s === "business-owner" ? "Business Owner" : s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}
                </Typography>
              )}
            </View>
          </View>
          <ChevronRight size={16} color={COLORS.textTertiary} />
        </Pressable>

        {showLifeStages && (
          <View style={styles.pickerContainer}>
            {([
              { value: "student" as LifeStage, label: "Student" },
              { value: "professional" as LifeStage, label: "Professional" },
              { value: "business-owner" as LifeStage, label: "Business Owner" },
              { value: "homemaker" as LifeStage, label: "Homemaker" },
              { value: "retired" as LifeStage, label: "Retired" },
              { value: "other" as LifeStage, label: "Other" },
            ]).map((opt) => {
              const isSelected = lifeStages.includes(opt.value);
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.pickerOption, isSelected && styles.pickerOptionActive]}
                  onPress={() => handleToggleLifeStage(opt.value)}
                >
                  <Typography
                    variant="body"
                    style={[styles.pickerText, isSelected && styles.pickerTextActive]}
                  >
                    {opt.label}
                  </Typography>
                </Pressable>
              );
            })}
          </View>
        )}

      </View>

      {/* Subscription section */}
      <View style={styles.section}>
        <Typography variant="caption" style={styles.sectionTitle}>
          SUBSCRIPTION
        </Typography>

        {isPro ? (
          <>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.accentMuted }]}>
                  <Crown size={18} color={COLORS.accent} />
                </View>
                <View>
                  <Typography variant="body" style={styles.rowLabel}>
                    RhemaFlow Pro
                  </Typography>
                  <Typography variant="caption" style={{ color: COLORS.accent, marginTop: 2 }}>
                    Active
                  </Typography>
                </View>
              </View>
            </View>
            <Pressable
              style={styles.row}
              onPress={() => Linking.openURL(
                Platform.OS === "ios"
                  ? "https://apps.apple.com/account/subscriptions"
                  : "https://play.google.com/store/account/subscriptions"
              )}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.purpleMuted }]}>
                  <Zap size={18} color={COLORS.purple} />
                </View>
                <Typography variant="body" style={styles.rowLabel}>
                  Manage Subscription
                </Typography>
              </View>
              <ChevronRight size={16} color={COLORS.textTertiary} />
            </Pressable>
          </>
        ) : (
          <>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.backgroundMuted }]}>
                  <Crown size={18} color={COLORS.textTertiary} />
                </View>
                <View>
                  <Typography variant="body" style={styles.rowLabel}>
                    Free Plan
                  </Typography>
                  {usage && (
                    <Typography variant="caption" style={{ color: COLORS.textTertiary, marginTop: 2 }}>
                      {usage.declarationsToday}/{usage.dailyLimit} declarations used today
                    </Typography>
                  )}
                </View>
              </View>
            </View>
            <Pressable
              style={styles.row}
              onPress={() => {
                trackPaywallViewed("settings");
                router.push("/(modals)/paywall" as any);
              }}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.accentMuted }]}>
                  <Zap size={18} color={COLORS.accent} />
                </View>
                <Typography variant="body" style={[styles.rowLabel, { color: COLORS.accent }]}>
                  Upgrade to Pro
                </Typography>
              </View>
              <ChevronRight size={16} color={COLORS.accent} />
            </Pressable>
          </>
        )}
      </View>

      {/* Account section */}
      <View style={styles.section}>
        <Typography variant="caption" style={styles.sectionTitle}>
          ACCOUNT
        </Typography>

        <Pressable style={styles.row} onPress={handleSignOut}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.errorLight }]}>
              <LogOut size={18} color={COLORS.error} />
            </View>
            <Typography variant="body" style={[styles.rowLabel, { color: COLORS.error }]}>
              Sign Out
            </Typography>
          </View>
        </Pressable>

        <Pressable
          style={[styles.row, isDeleting && { opacity: 0.5 }]}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          <View style={styles.rowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: COLORS.errorLight }]}>
              <Trash2 size={18} color={COLORS.error} />
            </View>
            <Typography variant="body" style={[styles.rowLabel, { color: COLORS.error }]}>
              {isDeleting ? "Deleting Account..." : "Delete Account"}
            </Typography>
          </View>
        </Pressable>
      </View>

      <Typography variant="caption" style={styles.version}>
        RhemaFlow v1.0.0
      </Typography>
    </ScrollView>

    {/* Time Picker Modal */}
    <Modal
      visible={showTimePickerModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTimePickerModal(false)}
    >
      <View style={styles.modalOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => setShowTimePickerModal(false)}
        />
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>
            {editingTimeIndex !== null ? "Edit Reminder" : "Add Reminder"}
          </Text>
          <ScrollWheelTimePicker
            value={pickerTime}
            onChange={setPickerTime}
          />
          <Pressable
            onPress={handleSaveTime}
            style={({ pressed }) => [styles.modalSaveButton, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.modalSaveText}>Save</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    marginBottom: 8,
  },
  avatarRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: COLORS.backgroundWarm,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: COLORS.textPrimary,
    fontSize: 20,
  },
  profileEmail: {
    color: COLORS.textTertiary,
    marginTop: 2,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: COLORS.accent,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 8,
    ...SHADOWS.small,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  rowLabel: {
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowValue: {
    color: COLORS.textTertiary,
  },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  pickerOption: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundWarm,
  },
  pickerOptionActive: {
    backgroundColor: COLORS.accentMuted,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  pickerText: {
    color: COLORS.textTertiary,
    fontSize: 14,
  },
  pickerTextActive: {
    color: COLORS.accent,
  },
  version: {
    color: COLORS.textTertiary,
    textAlign: "center",
    marginTop: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    width: "85%",
    ...SHADOWS.large,
  },
  modalTitle: {
    fontFamily: "Cinzel",
    fontSize: 18,
    color: COLORS.textPrimary,
    marginBottom: 24,
    textTransform: "uppercase",
    letterSpacing: 2,
  },
  modalSaveButton: {
    backgroundColor: COLORS.purple,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 14,
    marginTop: 24,
  },
  modalSaveText: {
    fontFamily: "Lato-Bold",
    fontSize: 16,
    color: COLORS.textInverse,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
});
