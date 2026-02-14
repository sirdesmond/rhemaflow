import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Flame } from "lucide-react-native";
import { COLORS } from "../../constants/theme";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[COLORS.voidBlack, COLORS.deepPurple, COLORS.voidBlack]}
      locations={[0, 0.5, 1]}
      className="flex-1"
    >
      {/* Hero Content */}
      <View className="flex-1 justify-center items-center px-8">
        <View className="items-center mb-8">
          <Flame size={64} color={COLORS.fireOrange} />
          <Text
            style={{ fontFamily: "Cinzel" }}
            className="text-4xl text-white mt-6 tracking-widest text-center"
          >
            RHEMA{"\n"}
            <Text style={{ color: COLORS.electricPurple }}>FLOW</Text>
          </Text>
        </View>

        <Text
          style={{ fontFamily: "PlayfairDisplay" }}
          className="text-xl text-white/80 text-center leading-8 mb-4"
        >
          Speak life over your situation.
        </Text>
        <Text
          style={{ fontFamily: "Lato" }}
          className="text-base text-white/50 text-center leading-6"
        >
          AI-powered biblical declarations with cinematic audio.{"\n"}
          The atmosphere shifts when you declare.
        </Text>
      </View>

      {/* CTA */}
      <View className="px-6 pb-16 gap-4">
        <Pressable
          onPress={() => router.push("/(auth)/sign-in")}
          className="w-full py-4 rounded-2xl items-center active:opacity-80"
          style={{ backgroundColor: COLORS.electricPurple }}
        >
          <Text
            style={{ fontFamily: "Lato-Bold" }}
            className="text-white text-lg"
          >
            Get Started
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}
