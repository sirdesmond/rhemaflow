import { View, Text, Pressable, Alert, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChevronLeft } from "lucide-react-native";
import { useRouter } from "expo-router";
import {
  signInWithGoogle,
  signInWithApple,
  signInAnonymously,
} from "../../services/auth";
import { COLORS } from "../../constants/theme";

export default function SignInScreen() {
  const router = useRouter();

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert("Sign in failed", error.message);
    }
  };

  const handleApple = async () => {
    try {
      await signInWithApple();
    } catch (error: any) {
      Alert.alert("Sign in failed", error.message);
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
    <SafeAreaView className="flex-1 bg-void-black">
      {/* Back button */}
      <Pressable
        onPress={() => router.back()}
        className="p-4 self-start active:opacity-60"
      >
        <ChevronLeft size={24} color="white" />
      </Pressable>

      <View className="flex-1 justify-center px-6">
        <Text
          style={{ fontFamily: "Cinzel" }}
          className="text-3xl text-white text-center mb-2"
        >
          Sign In
        </Text>
        <Text
          style={{ fontFamily: "Lato" }}
          className="text-slate-400 text-center mb-10"
        >
          Save your declarations and sync across devices
        </Text>

        {/* Google */}
        <Pressable
          onPress={handleGoogle}
          className="w-full bg-white py-4 rounded-2xl items-center mb-4 active:opacity-80"
        >
          <Text
            style={{ fontFamily: "Lato-Bold" }}
            className="text-void-black text-lg"
          >
            Continue with Google
          </Text>
        </Pressable>

        {/* Apple (iOS only) */}
        {Platform.OS === "ios" && (
          <Pressable
            onPress={handleApple}
            className="w-full bg-white py-4 rounded-2xl items-center mb-4 active:opacity-80"
          >
            <Text
              style={{ fontFamily: "Lato-Bold" }}
              className="text-void-black text-lg"
            >
              Continue with Apple
            </Text>
          </Pressable>
        )}

        {/* Anonymous */}
        <Pressable
          onPress={handleAnonymous}
          className="w-full border border-slate-700 py-4 rounded-2xl items-center mt-6 active:opacity-80"
        >
          <Text
            style={{ fontFamily: "Lato" }}
            className="text-slate-400 text-base"
          >
            Try without an account
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
