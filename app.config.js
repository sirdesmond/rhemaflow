export default {
  expo: {
    name: "RhemaFlow",
    slug: "rhemaflow",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "rhemaflow",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    updates: {
      url: "https://u.expo.dev/07320aee-cd96-4da8-8614-8b518ab20b89",
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#0F172A",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.rhemaflow.app",
      googleServicesFile:
        process.env.GOOGLE_SERVICE_INFO_PLIST || "./GoogleService-Info.plist",
      usesAppleSignIn: true,
    },
    android: {
      package: "com.rhemaflow.app",
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#0F172A",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      "expo-font",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-google-signin/google-signin",
      "expo-apple-authentication",
      ["expo-notifications", { sounds: [] }],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "07320aee-cd96-4da8-8614-8b518ab20b89",
      },
    },
    owner: "sirdesmond",
  },
};
