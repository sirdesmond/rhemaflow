import { useState, useEffect } from "react";
import {
  View,
  Pressable,
  Switch,
  ScrollView,
  Alert,
  StyleSheet,
  Platform,
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
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Typography } from "../../components/ui/Typography";
import { COLORS } from "../../constants/theme";
import { ATMOSPHERE_TRACKS } from "../../constants/tracks";
import { AtmosphereType } from "../../types";
import { auth } from "../../services/firebase";
import { signOut, deleteAccount } from "../../services/auth";
import {
  scheduleDailyNotification,
  cancelNotifications,
} from "../../hooks/useNotifications";
import {
  getUserSettings,
  updateUserSettings,
} from "../../services/settings";

const ATMOSPHERE_OPTIONS: { id: AtmosphereType; label: string }[] =
  ATMOSPHERE_TRACKS.filter((t) => t.id !== "none").map((t) => ({
    id: t.id,
    label: t.label,
  }));

const TIME_OPTIONS = [
  { label: "6:00 AM", value: "06:00" },
  { label: "7:00 AM", value: "07:00" },
  { label: "8:00 AM", value: "08:00" },
  { label: "9:00 AM", value: "09:00" },
  { label: "12:00 PM", value: "12:00" },
  { label: "9:00 PM", value: "21:00" },
];

export default function SettingsScreen() {
  const user = auth.currentUser;
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationTime, setNotificationTime] = useState("08:00");
  const [defaultAtmosphere, setDefaultAtmosphere] =
    useState<AtmosphereType>("glory");
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showAtmospherePicker, setShowAtmospherePicker] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load saved settings from Firestore on mount
  useEffect(() => {
    getUserSettings().then((settings) => {
      setNotificationsEnabled(settings.notificationsEnabled);
      setNotificationTime(settings.notificationTime);
      setDefaultAtmosphere(settings.defaultAtmosphere);
    });
  }, []);

  const handleToggleNotifications = async (enabled: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setNotificationsEnabled(enabled);
    if (enabled) {
      const success = await scheduleDailyNotification(notificationTime);
      if (!success) {
        setNotificationsEnabled(false);
        Alert.alert(
          "Permission Required",
          "Please enable notifications in your device settings to receive daily declarations."
        );
        return;
      }
    } else {
      await cancelNotifications();
    }
    updateUserSettings({ notificationsEnabled: enabled });
  };

  const handleTimeChange = async (time: string) => {
    setNotificationTime(time);
    setShowTimePicker(false);
    if (notificationsEnabled) {
      await scheduleDailyNotification(time);
    }
    updateUserSettings({ notificationTime: time });
  };

  const handleAtmosphereChange = (atm: AtmosphereType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDefaultAtmosphere(atm);
    setShowAtmospherePicker(false);
    updateUserSettings({ defaultAtmosphere: atm });
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
            console.error("Sign out error:", e);
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
                      console.error("Delete account error:", e);
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

  const timeLabel =
    TIME_OPTIONS.find((t) => t.value === notificationTime)?.label ||
    notificationTime;

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
          colors={[COLORS.electricPurple, COLORS.warmGold]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.avatarRing}
        >
          <View style={styles.avatar}>
            <User size={32} color={COLORS.slate400} />
          </View>
        </LinearGradient>
        <View style={styles.profileInfo}>
          <Typography variant="heading" style={styles.profileName}>
            {user?.displayName || "Warrior of Faith"}
          </Typography>
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
            <View style={[styles.iconCircle, { backgroundColor: COLORS.electricPurple + "20" }]}>
              <Bell size={18} color={COLORS.electricPurple} />
            </View>
            <Typography variant="body" style={styles.rowLabel}>
              Daily Reminders
            </Typography>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            trackColor={{
              false: COLORS.slate700,
              true: COLORS.electricPurple + "80",
            }}
            thumbColor={
              notificationsEnabled ? COLORS.electricPurple : COLORS.slate400
            }
          />
        </View>

        {notificationsEnabled && (
          <View>
            <Pressable
              style={styles.row}
              onPress={() => setShowTimePicker(!showTimePicker)}
            >
              <View style={styles.rowLeft}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.fireOrange + "20" }]}>
                  <Clock size={18} color={COLORS.fireOrange} />
                </View>
                <Typography variant="body" style={styles.rowLabel}>
                  Reminder Time
                </Typography>
              </View>
              <View style={styles.rowRight}>
                <Typography variant="caption" style={styles.rowValue}>
                  {timeLabel}
                </Typography>
                <ChevronRight size={16} color={COLORS.slate400} />
              </View>
            </Pressable>

            {showTimePicker && (
              <View style={styles.pickerContainer}>
                {TIME_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.pickerOption,
                      notificationTime === opt.value &&
                        styles.pickerOptionActive,
                    ]}
                    onPress={() => handleTimeChange(opt.value)}
                  >
                    <Typography
                      variant="body"
                      style={[
                        styles.pickerText,
                        notificationTime === opt.value &&
                          styles.pickerTextActive,
                      ]}
                    >
                      {opt.label}
                    </Typography>
                  </Pressable>
                ))}
              </View>
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
            <View style={[styles.iconCircle, { backgroundColor: COLORS.divineGold + "20" }]}>
              <Music size={18} color={COLORS.divineGold} />
            </View>
            <Typography variant="body" style={styles.rowLabel}>
              Default Atmosphere
            </Typography>
          </View>
          <View style={styles.rowRight}>
            <Typography variant="caption" style={styles.rowValue}>
              {atmosphereLabel}
            </Typography>
            <ChevronRight size={16} color={COLORS.slate400} />
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
      </View>

      {/* Account section */}
      <View style={styles.section}>
        <Typography variant="caption" style={styles.sectionTitle}>
          ACCOUNT
        </Typography>

        <Pressable style={styles.row} onPress={handleSignOut}>
          <View style={styles.rowLeft}>
            <View style={[styles.iconCircle, { backgroundColor: "rgba(239,68,68,0.15)" }]}>
              <LogOut size={18} color="#EF4444" />
            </View>
            <Typography variant="body" style={[styles.rowLabel, { color: "#EF4444" }]}>
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
            <View style={[styles.iconCircle, { backgroundColor: "rgba(239,68,68,0.15)" }]}>
              <Trash2 size={18} color="#EF4444" />
            </View>
            <Typography variant="body" style={[styles.rowLabel, { color: "#EF4444" }]}>
              {isDeleting ? "Deleting Account..." : "Delete Account"}
            </Typography>
          </View>
        </Pressable>
      </View>

      <Typography variant="caption" style={styles.version}>
        RhemaFlow v1.0.0
      </Typography>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.voidBlack,
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
    borderBottomColor: COLORS.glassBorder,
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
    backgroundColor: COLORS.slate900,
    justifyContent: "center",
    alignItems: "center",
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: COLORS.white,
    fontSize: 20,
  },
  profileEmail: {
    color: COLORS.slate400,
    marginTop: 2,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    color: COLORS.warmGold,
    fontSize: 11,
    letterSpacing: 2,
    marginBottom: 12,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.glass,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
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
    color: COLORS.white,
    fontSize: 15,
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowValue: {
    color: COLORS.slate400,
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
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  pickerOptionActive: {
    borderColor: COLORS.warmGold,
    backgroundColor: "rgba(212,168,84,0.15)",
  },
  pickerText: {
    color: COLORS.slate400,
    fontSize: 14,
  },
  pickerTextActive: {
    color: COLORS.warmGold,
  },
  version: {
    color: COLORS.slate700,
    textAlign: "center",
    marginTop: 40,
  },
});
