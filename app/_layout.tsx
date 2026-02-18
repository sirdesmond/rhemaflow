import "../global.css";
import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "../hooks/useAuth";
import { SubscriptionProvider } from "../hooks/useSubscription";
import { getUserSettings } from "../services/settings";
import "react-native-reanimated";

export { ErrorBoundary } from "../components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

/**
 * Redirects users based on auth state:
 * - Not signed in → (auth)/welcome
 * - Signed in but hasn't completed onboarding → (auth)/onboarding
 * - Signed in and onboarded → (tabs)
 */
function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    if (loading || !user) {
      setOnboardingChecked(false);
      return;
    }

    getUserSettings().then((settings) => {
      setNeedsOnboarding(!settings.onboardingComplete);
      setOnboardingChecked(true);
    });
  }, [user, loading]);

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/welcome");
    } else if (user && inAuthGroup) {
      // Wait for onboarding check before redirecting
      if (!onboardingChecked) return;

      const inOnboarding = segments[1] === "onboarding";
      if (needsOnboarding && !inOnboarding) {
        router.replace("/(auth)/onboarding");
      } else if (!needsOnboarding) {
        router.replace("/(tabs)");
      }
    }
  }, [user, loading, segments, onboardingChecked, needsOnboarding]);

  if (loading) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Cinzel: require("../assets/fonts/Cinzel-Bold.ttf"),
    Lato: require("../assets/fonts/Lato-Regular.ttf"),
    "Lato-Bold": require("../assets/fonts/Lato-Bold.ttf"),
    PlayfairDisplay: require("../assets/fonts/PlayfairDisplay-Regular.ttf"),
    "PlayfairDisplay-Italic": require("../assets/fonts/PlayfairDisplay-Italic.ttf"),
  });

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthGate>
      <SubscriptionProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="(modals)"
            options={{ presentation: "modal" }}
          />
        </Stack>
      </SubscriptionProvider>
    </AuthGate>
  );
}
