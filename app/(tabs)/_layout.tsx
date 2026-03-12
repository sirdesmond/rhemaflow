import { Tabs } from "expo-router";
import { View } from "react-native";
import { Home, Heart, Settings } from "lucide-react-native";
import { COLORS, SHADOWS } from "../../constants/theme";
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
        backgroundColor: COLORS.accent,
        marginTop: 4,
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
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textTertiary,
        tabBarBackground: () => (
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: COLORS.surface,
              borderTopWidth: 1,
              borderTopColor: COLORS.borderLight,
              ...SHADOWS.small,
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
