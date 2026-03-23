export default {
  expo: {
    name: "RhemaFlow",
    slug: "rhemaflow",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "rhemaflow",
    userInterfaceStyle: "light",
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
      backgroundColor: "#FBF8F3",
    },
    ios: {
      supportsTablet: true,
      isTabletOnly: false,
      bundleIdentifier: "com.rhemaflow.app",
      googleServicesFile:
        process.env.GOOGLE_SERVICE_INFO_PLIST || "./GoogleService-Info.plist",
      usesAppleSignIn: true,
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSPhotoLibraryUsageDescription:
          "RhemaFlow needs access to your photo library to save and share declarations.",
      },
    },
    android: {
      package: "com.rhemaflow.app",
      googleServicesFile:
        process.env.GOOGLE_SERVICES_JSON || "./google-services.json",
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#FBF8F3",
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
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
            forceStaticLinking: [
              "RNFBApp",
              "RNFBAuth",
              "RNFBCrashlytics",
              "RNFBFirestore",
              "RNFBFunctions",
              "RNFBStorage",
            ],
          },
        },
      ],
      "expo-router",
      "expo-font",
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-google-signin/google-signin",
      "expo-apple-authentication",
      "@react-native-firebase/crashlytics",
      ["expo-notifications", { sounds: [] }],
      [
        "expo-speech-recognition",
        {
          microphonePermission:
            "Allow RhemaFlow to use the microphone for voice declarations.",
          speechRecognitionPermission:
            "Allow RhemaFlow to use speech recognition for voice declarations.",
          androidSpeechServicePackages: [
            "com.google.android.googlequicksearchbox",
          ],
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      privacyPolicyUrl: "https://sirdesmond.github.io/rhemaflow/privacy-policy.html",
      termsOfUseUrl: "https://sirdesmond.github.io/rhemaflow/terms-of-use.html",
      router: {},
      eas: {
        projectId: "07320aee-cd96-4da8-8614-8b518ab20b89",
      },
    },
    owner: "sirdesmond",
  },
};
