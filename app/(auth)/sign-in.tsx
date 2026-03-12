import { useMemo } from "react";
import { View, Text, Pressable, Alert, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import {
  signInWithGoogle,
  signInWithApple,
  signInAnonymously,
} from "../../services/auth";
import { logError } from "../../services/crashlytics";
import { FONTS } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

export default function SignInScreen() {
  const { colors, shadows } = useTheme();
  const router = useRouter();

  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      logError(error, "Google sign-in");
      const code = error?.code || "";
      let message = error.message;
      if (code === "DEVELOPER_ERROR" || message?.includes("DEVELOPER_ERROR")) {
        message =
          "Google Sign-In configuration error. Please check SHA-1 fingerprint and OAuth setup in Firebase Console.";
      }
      Alert.alert("Sign in failed", message || `Unknown error (code: ${code})`);
    }
  };

  const handleApple = async () => {
    try {
      await signInWithApple();
    } catch (error: any) {
      const code = error?.code;
      // User cancelled — don't show error
      if (code === "ERR_REQUEST_CANCELED") return;
      logError(error, "Apple sign-in");
      Alert.alert(
        "Sign in failed",
        error.message || `Unknown error (code: ${code})`
      );
    }
  };

  const handleAnonymous = async () => {
    try {
      await signInAnonymously();
    } catch (error: any) {
      Alert.alert("Sign in failed", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <ChevronLeft size={24} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.title}>Sign In</Text>
        <Text style={styles.subtitle}>
          Save your declarations and sync across devices
        </Text>

        {/* Google */}
        <Pressable
          onPress={handleGoogle}
          style={({ pressed }) => [
            styles.googleBtn,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </Pressable>

        {/* Apple (iOS only) */}
        {Platform.OS === "ios" && (
          <Pressable
            onPress={handleApple}
            style={({ pressed }) => [
              styles.appleBtn,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.appleBtnText}>Continue with Apple</Text>
          </Pressable>
        )}

        {/* Anonymous */}
        <Pressable
          onPress={handleAnonymous}
          style={({ pressed }) => [
            styles.anonBtn,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.anonBtnText}>Try without an account</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: any, shadows: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    backBtn: {
      padding: 16,
      alignSelf: "flex-start",
    },
    content: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    title: {
      fontFamily: FONTS.display,
      fontSize: 32,
      color: colors.textPrimary,
      textAlign: "center",
      marginBottom: 8,
    },
    subtitle: {
      fontFamily: FONTS.body,
      fontSize: 15,
      color: colors.textSecondary,
      textAlign: "center",
      marginBottom: 40,
    },
    googleBtn: {
      backgroundColor: colors.surface,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      marginBottom: 12,
      ...shadows.medium,
    },
    googleBtnText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 16,
      color: colors.textPrimary,
    },
    appleBtn: {
      backgroundColor: colors.textPrimary,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      marginBottom: 12,
    },
    appleBtnText: {
      fontFamily: FONTS.bodyBold,
      fontSize: 16,
      color: colors.textInverse,
    },
    anonBtn: {
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 16,
      borderRadius: 16,
      alignItems: "center",
      marginTop: 24,
    },
    anonBtnText: {
      fontFamily: FONTS.body,
      fontSize: 15,
      color: colors.textTertiary,
    },
    pressed: {
      opacity: 0.8,
    },
  });
