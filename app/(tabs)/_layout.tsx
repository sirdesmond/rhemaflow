import { Tabs } from "expo-router";
import { View } from "react-native";
import { BlurView } from "expo-blur";
import { Home, Heart, Settings } from "lucide-react-native";
import { COLORS } from "../../constants/theme";
import { useNetwork } from "../../hooks/useNetwork";
import { OfflineBanner } from "../../components/OfflineBanner";

function ActiveDot({ focused }: { focused: boolean }) {
  if (!focused) return null;
  return (
    <View
      style={{
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.divineGold,
        marginTop: 4,
        shadowColor: COLORS.divineGold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
        elevation: 4,
      }}
    />
  );
}

export default function TabLayout() {
  const { isConnected } = useNetwork();

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner visible={!isConnected} />
      <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.white,
        tabBarInactiveTintColor: COLORS.slate400,
        tabBarBackground: () => (
          <BlurView
            intensity={40}
            tint="dark"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15,23,42,0.85)",
              borderTopWidth: 1,
              borderTopColor: COLORS.glassBorder,
            }}
          />
        ),
        tabBarStyle: {
          position: "absolute",
          backgroundColor: "transparent",
          borderTopWidth: 0,
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: "Lato-Bold",
          fontSize: 10,
          letterSpacing: 1.5,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <Home size={22} color={color} strokeWidth={focused ? 2.5 : 1.5} />
              <ActiveDot focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <Heart size={22} color={color} strokeWidth={focused ? 2.5 : 1.5} />
              <ActiveDot focused={focused} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: "center" }}>
              <Settings size={22} color={color} strokeWidth={focused ? 2.5 : 1.5} />
              <ActiveDot focused={focused} />
            </View>
          ),
        }}
      />
    </Tabs>
    </View>
  );
}
