# RhemaFlow Mobile App — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the RhemaFlow web prototype into a production React Native (Expo) mobile app with Firebase backend, cinematic audio engine, user accounts, and saved declarations.

**Architecture:** Expo Router file-based navigation, Firebase Cloud Functions proxying Gemini API, expo-av dual-channel audio engine, Firestore persistence, NativeWind styling.

**Tech Stack:** Expo SDK 52+, TypeScript, Expo Router v4, NativeWind, react-native-reanimated, expo-av, Firebase (Auth, Firestore, Cloud Functions, Storage), Google Gemini API, EAS Build.

---

## Phase 1: Project Scaffolding

### Task 1.1: Initialize Expo Project

**Files:**
- Create: `rhemaflow/` (new Expo project — separate from prototype)

**Step 1: Create Expo project with Expo Router template**

```bash
cd /Users/sir_dez/Workspace/Ideas
npx create-expo-app@latest rhemaflow --template tabs
cd rhemaflow
```

**Step 2: Verify it runs**

```bash
npx expo start
```

Expected: Metro bundler starts, app loads in simulator/Expo Go.

**Step 3: Commit**

```bash
git init
git add -A
git commit -m "chore: init Expo project with tabs template"
```

---

### Task 1.2: Install Core Dependencies

**Step 1: Install production dependencies**

```bash
npx expo install expo-av expo-font expo-haptics expo-blur expo-linear-gradient expo-notifications expo-file-system expo-sharing expo-image expo-apple-authentication react-native-view-shot react-native-reanimated nativewind tailwindcss react-native-css-interop
```

**Step 2: Install Firebase dependencies**

```bash
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore @react-native-firebase/storage @react-native-firebase/functions @react-native-google-signin/google-signin
```

**Step 3: Install dev dependencies**

```bash
npm install -D jest @testing-library/react-native @testing-library/jest-dom @types/react @types/react-native
```

**Step 4: Verify install**

```bash
npx expo start
```

Expected: No dependency resolution errors.

**Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install core dependencies"
```

---

### Task 1.3: Configure NativeWind (Tailwind)

**Files:**
- Create: `tailwind.config.js`
- Create: `global.css`
- Modify: `app/_layout.tsx`

**Step 1: Create tailwind.config.js**

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        'electric-purple': '#7C3AED',
        'deep-purple': '#4C1D95',
        'fire-orange': '#F59E0B',
        'divine-gold': '#FBBF24',
        'void-black': '#0F172A',
      },
      fontFamily: {
        'display': ['Cinzel'],
        'heading': ['PlayfairDisplay'],
        'body': ['Lato'],
        'body-bold': ['Lato-Bold'],
      },
    },
  },
  plugins: [],
};
```

**Step 2: Create global.css**

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 3: Wire into root layout**

In `app/_layout.tsx`, add at the top:

```tsx
import "../global.css";
```

**Step 4: Add NativeWind babel preset**

In `babel.config.js`, add `"nativewind/babel"` to presets array.

**Step 5: Verify styling works — add a test className to any screen**

```bash
npx expo start --clear
```

Expected: Tailwind classes apply correctly.

**Step 6: Commit**

```bash
git add tailwind.config.js global.css babel.config.js app/_layout.tsx
git commit -m "chore: configure NativeWind with custom theme colors"
```

---

### Task 1.4: Configure Custom Fonts

**Files:**
- Create: `assets/fonts/Cinzel-Bold.ttf` (download from Google Fonts)
- Create: `assets/fonts/Lato-Regular.ttf`
- Create: `assets/fonts/Lato-Bold.ttf`
- Create: `assets/fonts/PlayfairDisplay-Regular.ttf`
- Create: `assets/fonts/PlayfairDisplay-Italic.ttf`
- Modify: `app/_layout.tsx`

**Step 1: Download fonts**

Download Cinzel, Lato, and Playfair Display from Google Fonts. Place .ttf files in `assets/fonts/`.

**Step 2: Load fonts in root layout**

```tsx
// app/_layout.tsx
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cinzel: require("../assets/fonts/Cinzel-Bold.ttf"),
    Lato: require("../assets/fonts/Lato-Regular.ttf"),
    "Lato-Bold": require("../assets/fonts/Lato-Bold.ttf"),
    PlayfairDisplay: require("../assets/fonts/PlayfairDisplay-Regular.ttf"),
    "PlayfairDisplay-Italic": require("../assets/fonts/PlayfairDisplay-Italic.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  // ... rest of layout
}
```

**Step 3: Verify fonts render**

Create a test `<Text>` element with `fontFamily: "Cinzel"`. Confirm it renders the serif font, not system default.

**Step 4: Commit**

```bash
git add assets/fonts/ app/_layout.tsx
git commit -m "chore: load Cinzel, Lato, and Playfair Display fonts"
```

---

### Task 1.5: Configure EAS Build

**Files:**
- Create: `eas.json`

**Step 1: Install EAS CLI and login**

```bash
npm install -g eas-cli
eas login
```

**Step 2: Configure EAS**

```bash
eas build:configure
```

This generates `eas.json`. Update it:

```json
{
  "cli": { "version": ">= 3.0.0" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {}
  },
  "submit": {
    "production": {}
  }
}
```

**Step 3: Create a development build**

```bash
eas build --platform ios --profile development
```

Expected: Build queues on EAS. This creates the dev client needed for native modules (Firebase, expo-av, etc.).

**Step 4: Commit**

```bash
git add eas.json app.json
git commit -m "chore: configure EAS Build profiles"
```

---

## Phase 2: Types, Constants & Theme

### Task 2.1: Port and Extend Types

**Files:**
- Create: `types/index.ts`

**Step 1: Write types file**

```tsx
// types/index.ts

export enum DeclarationCategory {
  HEALTH = "Health & Healing",
  WEALTH = "Wealth & Prosperity",
  IDENTITY = "Identity",
  SUCCESS = "Success & Victory",
  PROTECTION = "Protection & Fearlessness",
  WISDOM = "Wisdom & Guidance",
  GENERAL = "General",
}

export type AtmosphereType = "glory" | "warfare" | "peace" | "rise" | "selah" | "none";

export interface Declaration {
  id: string;
  text: string;
  category: DeclarationCategory;
  reference: string;
  scriptureText: string;
  atmosphere: AtmosphereType;
  imageUrl: string | null;
  createdAt: number; // Firestore timestamp as millis
  isFavorite: boolean;
  userId: string;
}

export interface GeneratedContent {
  text: string;
  reference: string;
  scriptureText: string;
  backgroundImageUrl: string | null;
  audioBase64: string | null;
}

export interface MoodPreset {
  emoji: string;
  label: string;
  category: DeclarationCategory;
  prompt: string;
}

export interface TrackMeta {
  id: AtmosphereType;
  label: string;
  description: string;
  bundled: boolean; // true = in app assets, false = stream from Firebase Storage
}

export interface UserSettings {
  notificationsEnabled: boolean;
  notificationTime: string; // "HH:mm"
  defaultAtmosphere: AtmosphereType;
  defaultCategory: DeclarationCategory;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: number;
  settings: UserSettings;
}
```

**Step 2: Commit**

```bash
git add types/index.ts
git commit -m "feat: add TypeScript type definitions"
```

---

### Task 2.2: Port and Extend Constants

**Files:**
- Create: `constants/categories.ts`
- Create: `constants/tracks.ts`
- Create: `constants/notifications.ts`

**Step 1: Write categories.ts**

```tsx
// constants/categories.ts
import { DeclarationCategory, MoodPreset } from "../types";

export const MOOD_PRESETS: MoodPreset[] = [
  {
    emoji: "🤕",
    label: "Feeling Sick",
    category: DeclarationCategory.HEALTH,
    prompt: "I am fighting sickness. Give me a declaration of healing and divine health.",
  },
  {
    emoji: "📉",
    label: "Financial Lack",
    category: DeclarationCategory.WEALTH,
    prompt: "I am facing financial lack. Give me a declaration of abundance and provision.",
  },
  {
    emoji: "😨",
    label: "Afraid",
    category: DeclarationCategory.PROTECTION,
    prompt: "I feel afraid and anxious. Give me a declaration of safety and divine protection.",
  },
  {
    emoji: "😔",
    label: "Depressed",
    category: DeclarationCategory.IDENTITY,
    prompt: "I feel low and worthless. Remind me of who I am in Christ.",
  },
  {
    emoji: "🛑",
    label: "Stuck/Failed",
    category: DeclarationCategory.SUCCESS,
    prompt: "I feel like a failure. Give me a declaration of victory and success.",
  },
  {
    emoji: "🤔",
    label: "Confused",
    category: DeclarationCategory.WISDOM,
    prompt: "I need direction. Give me a declaration of wisdom and clarity.",
  },
];

export const CATEGORY_GRADIENTS: Record<DeclarationCategory, [string, string]> = {
  [DeclarationCategory.HEALTH]: ["#059669", "#10B981"],
  [DeclarationCategory.WEALTH]: ["#D97706", "#FBBF24"],
  [DeclarationCategory.IDENTITY]: ["#7C3AED", "#A78BFA"],
  [DeclarationCategory.SUCCESS]: ["#DC2626", "#F59E0B"],
  [DeclarationCategory.PROTECTION]: ["#2563EB", "#7C3AED"],
  [DeclarationCategory.WISDOM]: ["#0891B2", "#06B6D4"],
  [DeclarationCategory.GENERAL]: ["#4C1D95", "#7C3AED"],
};

export const CATEGORY_IMAGE_THEMES: Record<DeclarationCategory, string> = {
  [DeclarationCategory.HEALTH]:
    "rushing living water, emerald fire, radiant vitality, supernatural healing light",
  [DeclarationCategory.WEALTH]:
    "gold bullion texture, overflowing cornucopia, purple royal velvet, diamond refraction",
  [DeclarationCategory.PROTECTION]:
    "lion roaring, burning shield, blue fire, fortress wall, angelic feathers",
  [DeclarationCategory.SUCCESS]:
    "summit of a mountain, sunrise breaking through storm clouds, eagle wings, lightning",
  [DeclarationCategory.IDENTITY]:
    "golden crown, royal scepter, intense spotlight, galaxy background",
  [DeclarationCategory.WISDOM]:
    "burning bush, ancient scroll glowing, neural network of light, starry cosmos",
  [DeclarationCategory.GENERAL]:
    "epic divine light, exploding golden rays, dramatic cinematic lighting",
};

export const STATIC_DECLARATIONS = [
  {
    id: "h1",
    category: DeclarationCategory.HEALTH,
    text: "I refuse to be sick. I refuse to accommodate sickness in my body; I refuse to accommodate disease in my body. Every disease germ and every virus that touches my body dies instantly in the name of Jesus.",
    reference: "Isaiah 53:5",
    scriptureText: "But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.",
  },
  {
    id: "w1",
    category: DeclarationCategory.WEALTH,
    text: "I am not the poor trying to get rich; I am the rich discovering what belongs to me. Money cometh to me now. I'm a money magnet. My needs are met; I have plenty more to put in store.",
    reference: "Philippians 4:19",
    scriptureText: "But my God shall supply all your need according to his riches in glory by Christ Jesus.",
  },
  {
    id: "i1",
    category: DeclarationCategory.IDENTITY,
    text: "I am an ambassador, a royal ambassador of the Kingdom of God. I am a new creation. I am superior to Satan. I am the glory of God. Look at me, I am shining.",
    reference: "2 Corinthians 5:20",
    scriptureText: "Now then we are ambassadors for Christ, as though God did beseech you by us: we pray you in Christ's stead, be ye reconciled to God.",
  },
  {
    id: "s1",
    category: DeclarationCategory.SUCCESS,
    text: "I am a success and a victor in everything that concerns my life. I do not fail. I cannot think failure... Failure is not an option; it doesn't work with my system.",
    reference: "Joshua 1:8",
    scriptureText: "This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein: for then thou shalt make thy way prosperous, and then thou shalt have good success.",
  },
  {
    id: "p1",
    category: DeclarationCategory.PROTECTION,
    text: "No weapon formed against me shall prosper... No evil will befall me, neither shall any plague come nigh my dwelling. The Lord has given His angels charge over me.",
    reference: "Psalm 91:10-11",
    scriptureText: "There shall no evil befall thee, neither shall any plague come nigh thy dwelling. For he shall give his angels charge over thee, to keep thee in all thy ways.",
  },
  {
    id: "wd1",
    category: DeclarationCategory.WISDOM,
    text: "I do not lack wisdom. I've got the wisdom of God in me. I have an excellent spirit. When I speak, I dissolve doubts; I explain hard sentences.",
    reference: "James 1:5",
    scriptureText: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.",
  },
];
```

**Step 2: Write tracks.ts**

```tsx
// constants/tracks.ts
import { AtmosphereType, TrackMeta } from "../types";

export const ATMOSPHERE_TRACKS: TrackMeta[] = [
  {
    id: "glory",
    label: "Glory",
    description: "Triumphant orchestral swells with choir pads",
    bundled: true,
  },
  {
    id: "warfare",
    label: "Warfare",
    description: "Epic drums and cinematic percussion",
    bundled: true,
  },
  {
    id: "peace",
    label: "Peace",
    description: "Gentle piano and ambient strings",
    bundled: true,
  },
  {
    id: "rise",
    label: "Rise",
    description: "Building motivational crescendo",
    bundled: true,
  },
  {
    id: "selah",
    label: "Selah",
    description: "Meditative ambient stillness",
    bundled: true,
  },
  {
    id: "none",
    label: "Voice Only",
    description: "Declaration without background music",
    bundled: true,
  },
];

// Maps atmosphere IDs to bundled asset requires.
// Replace these with actual bundled MP3 files once sourced.
export const BUNDLED_TRACK_ASSETS: Partial<Record<AtmosphereType, number>> = {
  glory: require("../assets/tracks/glory.mp3"),
  warfare: require("../assets/tracks/warfare.mp3"),
  peace: require("../assets/tracks/peace.mp3"),
  rise: require("../assets/tracks/rise.mp3"),
  selah: require("../assets/tracks/selah.mp3"),
};
```

**Step 3: Write notifications.ts**

```tsx
// constants/notifications.ts

export const NOTIFICATION_MESSAGES = [
  { title: "RhemaFlow", body: "Your declaration is ready. Speak life today." },
  { title: "RhemaFlow", body: "Rise and declare \u2014 the Word is alive." },
  { title: "RhemaFlow", body: "What will you speak over your day?" },
  { title: "RhemaFlow", body: "Your words carry power. Come declare." },
  { title: "RhemaFlow", body: "Time to align your words with heaven." },
  { title: "RhemaFlow", body: "Heaven is waiting on your voice. Declare!" },
  { title: "RhemaFlow", body: "No weapon formed against you shall prosper. Declare it." },
  { title: "RhemaFlow", body: "Open your mouth wide \u2014 God will fill it." },
  { title: "RhemaFlow", body: "You are the righteousness of God in Christ. Say it." },
  { title: "RhemaFlow", body: "Speak to that mountain. It has to move." },
  { title: "RhemaFlow", body: "Your faith-filled words are seeds. Plant them today." },
  { title: "RhemaFlow", body: "By His stripes, you are healed. Declare it now." },
  { title: "RhemaFlow", body: "The Spirit of God is upon you. Speak boldly." },
  { title: "RhemaFlow", body: "Today is your day for a fresh declaration." },
  { title: "RhemaFlow", body: "Decree a thing and it shall be established." },
];
```

**Step 4: Commit**

```bash
git add constants/
git commit -m "feat: add categories, tracks, and notification constants"
```

---

### Task 2.3: Create Theme Constants

**Files:**
- Create: `constants/theme.ts`

**Step 1: Write theme.ts**

```tsx
// constants/theme.ts

export const COLORS = {
  electricPurple: "#7C3AED",
  deepPurple: "#4C1D95",
  fireOrange: "#F59E0B",
  divineGold: "#FBBF24",
  voidBlack: "#0F172A",
  slate900: "#1E293B",
  slate700: "#334155",
  slate400: "#94A3B8",
  white: "#FFFFFF",
} as const;

export const FONTS = {
  display: "Cinzel",
  heading: "PlayfairDisplay",
  headingItalic: "PlayfairDisplay-Italic",
  body: "Lato",
  bodyBold: "Lato-Bold",
} as const;

export const LOADING_MESSAGES = [
  "Preparing your declaration...",
  "Searching the scriptures...",
  "The Spirit is moving...",
  "Downloading heaven\u2019s frequency...",
  "Igniting the fire...",
  "Aligning your words with heaven...",
];
```

**Step 2: Commit**

```bash
git add constants/theme.ts
git commit -m "feat: add theme color and font constants"
```

---

## Phase 3: Firebase Setup

### Task 3.1: Create Firebase Project

**Step 1: Go to Firebase Console**

Navigate to https://console.firebase.google.com and create a new project called "rhemaflow".

**Step 2: Enable services**

- Authentication → Enable Google and Apple sign-in providers
- Firestore Database → Create in production mode
- Storage → Enable
- Functions → Enable (requires Blaze plan)

**Step 3: Register iOS and Android apps**

- iOS bundle ID: `com.rhemaflow.app` (or your preferred ID)
- Android package name: `com.rhemaflow.app`
- Download `GoogleService-Info.plist` (iOS) and `google-services.json` (Android)

**Step 4: Place config files**

- `GoogleService-Info.plist` → project root (Expo handles placement)
- `google-services.json` → project root

**Step 5: Update app.json / app.config.js**

```json
{
  "expo": {
    "name": "RhemaFlow",
    "slug": "rhemaflow",
    "scheme": "rhemaflow",
    "ios": {
      "bundleIdentifier": "com.rhemaflow.app",
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "android": {
      "package": "com.rhemaflow.app",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "@react-native-firebase/app",
      "@react-native-firebase/auth",
      "@react-native-google-signin/google-signin",
      "expo-apple-authentication"
    ]
  }
}
```

**Step 6: Commit**

```bash
git add app.json google-services.json GoogleService-Info.plist
git commit -m "chore: configure Firebase project with iOS and Android apps"
```

---

### Task 3.2: Write Firebase Service Layer

**Files:**
- Create: `services/firebase.ts`
- Create: `services/auth.ts`
- Create: `services/favorites.ts`
- Create: `services/declarations.ts`

**Step 1: Write firebase.ts (initialization)**

```tsx
// services/firebase.ts
import { firebase } from "@react-native-firebase/app";
import "@react-native-firebase/auth";
import "@react-native-firebase/firestore";
import "@react-native-firebase/storage";
import "@react-native-firebase/functions";

// Firebase initializes automatically from GoogleService-Info.plist / google-services.json.
// This file ensures all modules are imported and provides typed accessors.

export const auth = firebase.auth();
export const db = firebase.firestore();
export const storage = firebase.storage();
export const functions = firebase.functions();
```

**Step 2: Write auth.ts**

```tsx
// services/auth.ts
import { auth, db } from "./firebase";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import firebase from "@react-native-firebase/app";
import { UserProfile, UserSettings } from "../types";

GoogleSignin.configure({
  webClientId: "YOUR_WEB_CLIENT_ID", // from Firebase Console
});

const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  notificationTime: "08:00",
  defaultAtmosphere: "glory",
  defaultCategory: "General" as any,
};

async function ensureUserDoc(uid: string, displayName: string, email: string, photoURL: string | null) {
  const userRef = db.collection("users").doc(uid);
  const doc = await userRef.get();
  if (!doc.exists) {
    const profile: UserProfile = {
      uid,
      displayName,
      email,
      photoURL,
      createdAt: Date.now(),
      settings: DEFAULT_SETTINGS,
    };
    await userRef.set(profile);
  }
}

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices();
  const { data } = await GoogleSignin.signIn();
  const credential = firebase.auth.GoogleAuthProvider.credential(data?.idToken ?? null);
  const result = await auth.signInWithCredential(credential);
  const user = result.user;
  await ensureUserDoc(user.uid, user.displayName ?? "", user.email ?? "", user.photoURL);
  return user;
}

export async function signInWithApple() {
  const appleCredential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  const { identityToken, fullName } = appleCredential;
  if (!identityToken) throw new Error("Apple sign-in failed: no identity token");

  const credential = firebase.auth.OAuthProvider("apple.com").credential({
    idToken: identityToken,
    rawNonce: undefined,
  });
  const result = await auth.signInWithCredential(credential);
  const user = result.user;
  const name = fullName
    ? `${fullName.givenName ?? ""} ${fullName.familyName ?? ""}`.trim()
    : user.displayName ?? "";
  await ensureUserDoc(user.uid, name, user.email ?? "", user.photoURL);
  return user;
}

export async function signInAnonymously() {
  const result = await auth.signInAnonymously();
  await ensureUserDoc(result.user.uid, "Guest", "", null);
  return result.user;
}

export async function signOut() {
  await auth.signOut();
}

export function onAuthStateChanged(callback: (user: firebase.User | null) => void) {
  return auth.onAuthStateChanged(callback);
}
```

**Step 3: Write declarations.ts (Cloud Function calls)**

```tsx
// services/declarations.ts
import { functions } from "./firebase";
import { DeclarationCategory, GeneratedContent } from "../types";

export async function generateDeclaration(
  category: DeclarationCategory,
  mood: string,
  customText?: string
): Promise<{ text: string; reference: string; scriptureText: string }> {
  const fn = functions.httpsCallable("generateDeclaration");
  const result = await fn({ category, mood, customText });
  return result.data as { text: string; reference: string; scriptureText: string };
}

export async function generateSpeech(text: string): Promise<string | null> {
  const fn = functions.httpsCallable("generateSpeech");
  const result = await fn({ text });
  return (result.data as { audioBase64: string | null }).audioBase64;
}

export async function generateImage(
  category: DeclarationCategory,
  declarationText: string
): Promise<string | null> {
  const fn = functions.httpsCallable("generateImage");
  const result = await fn({ category, declarationText });
  return (result.data as { imageUrl: string | null }).imageUrl;
}

export async function generateAllContent(
  category: DeclarationCategory,
  mood: string,
  customText?: string
): Promise<GeneratedContent> {
  // Step 1: Generate text (must complete first)
  const declaration = await generateDeclaration(category, mood, customText);

  // Step 2: Generate speech + image in parallel
  const [audioBase64, imageUrl] = await Promise.all([
    generateSpeech(declaration.text),
    generateImage(category, declaration.text),
  ]);

  return {
    text: declaration.text,
    reference: declaration.reference,
    scriptureText: declaration.scriptureText,
    backgroundImageUrl: imageUrl,
    audioBase64,
  };
}
```

**Step 4: Write favorites.ts (Firestore CRUD)**

```tsx
// services/favorites.ts
import { db, auth } from "./firebase";
import { Declaration, DeclarationCategory, AtmosphereType } from "../types";

function declarationsRef() {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error("Not authenticated");
  return db.collection("users").doc(uid).collection("declarations");
}

export async function saveDeclaration(params: {
  text: string;
  reference: string;
  scriptureText: string;
  category: DeclarationCategory;
  atmosphere: AtmosphereType;
  imageUrl: string | null;
}): Promise<string> {
  const ref = declarationsRef().doc();
  const declaration: Declaration = {
    id: ref.id,
    userId: auth.currentUser!.uid,
    text: params.text,
    reference: params.reference,
    scriptureText: params.scriptureText,
    category: params.category,
    atmosphere: params.atmosphere,
    imageUrl: params.imageUrl,
    createdAt: Date.now(),
    isFavorite: true,
  };
  await ref.set(declaration);
  return ref.id;
}

export async function deleteDeclaration(id: string): Promise<void> {
  await declarationsRef().doc(id).delete();
}

export function onDeclarationsSnapshot(
  callback: (declarations: Declaration[]) => void
) {
  return declarationsRef()
    .orderBy("createdAt", "desc")
    .onSnapshot((snapshot) => {
      const declarations = snapshot.docs.map((doc) => doc.data() as Declaration);
      callback(declarations);
    });
}
```

**Step 5: Commit**

```bash
git add services/
git commit -m "feat: add Firebase service layer (auth, declarations, favorites)"
```

---

## Phase 4: Firebase Cloud Functions

### Task 4.1: Initialize Cloud Functions Project

**Files:**
- Create: `functions/` directory

**Step 1: Initialize Firebase Functions**

```bash
cd /Users/sir_dez/Workspace/Ideas/rhemaflow
mkdir functions && cd functions
npm init -y
npm install firebase-functions firebase-admin @google/genai
npm install -D typescript @types/node
```

**Step 2: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2020",
    "lib": ["es2020"],
    "outDir": "./lib",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"]
}
```

**Step 3: Create firebase.json in project root**

```json
{
  "functions": {
    "source": "functions",
    "runtime": "nodejs20",
    "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"]
  },
  "firestore": {
    "rules": "firestore.rules"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

**Step 4: Add build script to functions/package.json**

```json
{
  "scripts": {
    "build": "tsc",
    "deploy": "firebase deploy --only functions"
  }
}
```

**Step 5: Commit**

```bash
cd /Users/sir_dez/Workspace/Ideas/rhemaflow
git add functions/ firebase.json
git commit -m "chore: initialize Firebase Cloud Functions project"
```

---

### Task 4.2: Write generateDeclaration Cloud Function

**Files:**
- Create: `functions/src/generateDeclaration.ts`

**Step 1: Write the function**

```tsx
// functions/src/generateDeclaration.ts
import * as functions from "firebase-functions";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = functions.config().gemini?.key || process.env.GEMINI_API_KEY;

const SYSTEM_INSTRUCTION = `
You are a fiery, charismatic prayer warrior. Your goal is to generate PERSONALIZED, EXPLOSIVE faith declarations.

INSTRUCTIONS:
1. Declaration: Must be in the FIRST PERSON ("I", "My"). It must be an authoritative decree based on the situation.
2. Scripture Reference: Provide a relevant Bible verse (e.g. "Romans 8:37").
3. Scripture Text: Provide the ACTUAL TEXT of that bible verse.
4. It must be according to teachings or confessions/declarations from Pastor Chris Oyakhilome or Pastor David Oyedepo only.
5. It must always end with "In the mighty name of Jesus. AMEN!"

TONE:
- Use "I COMMAND", "I DECREE", "I AM".
- Reject sickness, lack, and fear.
`;

export const generateDeclaration = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.HttpsError("unauthenticated", "Must be signed in.");
  }

  const { category, mood, customText } = data;
  const prompt = customText
    ? `Category: ${category}. User Situation: "${customText}". Write a personal declaration, cite the scripture, and write out the scripture text.`
    : `Category: ${category}. User Situation: "${mood}". Write a personal declaration, cite the scripture, and write out the scripture text.`;

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT" as any,
        properties: {
          text: { type: "STRING" as any, description: "The personalized faith declaration." },
          reference: { type: "STRING" as any, description: "The Bible verse reference." },
          scriptureText: { type: "STRING" as any, description: "The full text of the bible verse." },
        },
        required: ["text", "reference", "scriptureText"],
      },
    },
  });

  if (response.text) {
    return JSON.parse(response.text);
  }

  // Fallback
  return {
    text: "I AM MORE THAN A CONQUEROR! No weapon formed against me shall prosper! In the mighty name of Jesus. AMEN!",
    reference: "Romans 8:37",
    scriptureText: "Nay, in all these things we are more than conquerors through him that loved us.",
  };
});
```

**Step 2: Commit**

```bash
git add functions/src/generateDeclaration.ts
git commit -m "feat: add generateDeclaration Cloud Function"
```

---

### Task 4.3: Write generateSpeech Cloud Function

**Files:**
- Create: `functions/src/generateSpeech.ts`

**Step 1: Write the function**

This is the critical function that converts Gemini TTS PCM to WAV.

```tsx
// functions/src/generateSpeech.ts
import * as functions from "firebase-functions";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = functions.config().gemini?.key || process.env.GEMINI_API_KEY;

function pcmToWavBase64(pcmBase64: string, sampleRate: number = 24000, channels: number = 1, bitsPerSample: number = 16): string {
  const pcmBuffer = Buffer.from(pcmBase64, "base64");
  const dataLength = pcmBuffer.length;
  const headerSize = 44;
  const fileSize = headerSize + dataLength;

  const wav = Buffer.alloc(fileSize);

  // RIFF header
  wav.write("RIFF", 0);
  wav.writeUInt32LE(fileSize - 8, 4);
  wav.write("WAVE", 8);

  // fmt chunk
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16); // chunk size
  wav.writeUInt16LE(1, 20); // PCM format
  wav.writeUInt16LE(channels, 22);
  wav.writeUInt32LE(sampleRate, 24);
  wav.writeUInt32LE(sampleRate * channels * (bitsPerSample / 8), 28); // byte rate
  wav.writeUInt16LE(channels * (bitsPerSample / 8), 32); // block align
  wav.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  wav.write("data", 36);
  wav.writeUInt32LE(dataLength, 40);
  pcmBuffer.copy(wav, 44);

  return wav.toString("base64");
}

export const generateSpeech = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.HttpsError("unauthenticated", "Must be signed in.");
  }

  const { text } = data;
  if (!text || typeof text !== "string") {
    throw new functions.HttpsError("invalid-argument", "Text is required.");
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO" as any],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Puck" },
          },
        },
      },
    });

    const pcmBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!pcmBase64) {
      return { audioBase64: null };
    }

    // Convert raw PCM to WAV so expo-av can play it
    const wavBase64 = pcmToWavBase64(pcmBase64, 24000, 1, 16);
    return { audioBase64: wavBase64 };
  } catch (error) {
    console.error("TTS generation failed:", error);
    return { audioBase64: null };
  }
});
```

**Step 2: Commit**

```bash
git add functions/src/generateSpeech.ts
git commit -m "feat: add generateSpeech Cloud Function with PCM-to-WAV conversion"
```

---

### Task 4.4: Write generateImage Cloud Function

**Files:**
- Create: `functions/src/generateImage.ts`

**Step 1: Write the function**

```tsx
// functions/src/generateImage.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from "uuid";

const GEMINI_API_KEY = functions.config().gemini?.key || process.env.GEMINI_API_KEY;

const IMAGE_THEMES: Record<string, string> = {
  "Health & Healing": "rushing living water, emerald fire, radiant vitality, supernatural healing light",
  "Wealth & Prosperity": "gold bullion texture, overflowing cornucopia, purple royal velvet, diamond refraction",
  "Protection & Fearlessness": "lion roaring, burning shield, blue fire, fortress wall, angelic feathers",
  "Success & Victory": "summit of a mountain, sunrise breaking through storm clouds, eagle wings, lightning",
  "Identity": "golden crown, royal scepter, intense spotlight, galaxy background",
  "Wisdom & Guidance": "burning bush, ancient scroll glowing, neural network of light, starry cosmos",
  "General": "epic divine light, exploding golden rays, dramatic cinematic lighting",
};

export const generateImage = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.HttpsError("unauthenticated", "Must be signed in.");
  }

  const { category } = data;
  const visualTheme = IMAGE_THEMES[category] || IMAGE_THEMES["General"];
  const prompt = `Epic, cinematic, high-contrast spiritual background. Theme: ${visualTheme}. Intense colors, 4k, digital art style, volumetric lighting. No text.`;

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-image",
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { aspectRatio: "3:4" as any },
      },
    });

    const imagePart = response.candidates?.[0]?.content?.parts?.find(
      (p: any) => p.inlineData
    );

    if (!imagePart?.inlineData?.data) {
      return { imageUrl: null };
    }

    // Upload to Firebase Storage
    const bucket = admin.storage().bucket();
    const fileName = `declarations/${context.auth.uid}/${uuidv4()}.png`;
    const file = bucket.file(fileName);

    const imageBuffer = Buffer.from(imagePart.inlineData.data, "base64");
    await file.save(imageBuffer, {
      contentType: "image/png",
      metadata: { cacheControl: "public,max-age=31536000" },
    });

    await file.makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

    return { imageUrl };
  } catch (error) {
    console.error("Image generation failed:", error);
    return { imageUrl: null };
  }
});
```

**Step 2: Install uuid in functions**

```bash
cd functions
npm install uuid
npm install -D @types/uuid
```

**Step 3: Commit**

```bash
git add functions/src/generateImage.ts functions/package.json
git commit -m "feat: add generateImage Cloud Function with Firebase Storage upload"
```

---

### Task 4.5: Create Functions Index & Deploy

**Files:**
- Create: `functions/src/index.ts`

**Step 1: Write index.ts**

```tsx
// functions/src/index.ts
import * as admin from "firebase-admin";

admin.initializeApp();

export { generateDeclaration } from "./generateDeclaration";
export { generateSpeech } from "./generateSpeech";
export { generateImage } from "./generateImage";
```

**Step 2: Set Gemini API key in Firebase config**

```bash
firebase functions:config:set gemini.key="YOUR_ACTUAL_GEMINI_API_KEY"
```

**Step 3: Build and deploy**

```bash
cd functions
npm run build
firebase deploy --only functions
```

Expected: All 3 functions deployed successfully.

**Step 4: Commit**

```bash
git add functions/src/index.ts
git commit -m "feat: export all Cloud Functions and deploy"
```

---

### Task 4.6: Write Firestore and Storage Rules

**Files:**
- Create: `firestore.rules`
- Create: `storage.rules`

**Step 1: Write firestore.rules**

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /declarations/{declarationId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

**Step 2: Write storage.rules**

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /declarations/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /tracks/{allPaths=**} {
      allow read: if request.auth != null;
    }
  }
}
```

**Step 3: Deploy rules**

```bash
firebase deploy --only firestore:rules,storage:rules
```

**Step 4: Commit**

```bash
git add firestore.rules storage.rules
git commit -m "feat: add Firestore and Storage security rules"
```

---

## Phase 5: Audio Engine

### Task 5.1: Create Placeholder Track Assets

**Files:**
- Create: `assets/tracks/glory.mp3`
- Create: `assets/tracks/warfare.mp3`
- Create: `assets/tracks/peace.mp3`
- Create: `assets/tracks/rise.mp3`
- Create: `assets/tracks/selah.mp3`

**Step 1: Source royalty-free tracks**

Download 5 cinematic loops from Pixabay (https://pixabay.com/music/) or similar:

- **Glory:** Search "epic orchestral triumphant" — pick a ~30-45s loop
- **Warfare:** Search "epic drums cinematic battle" — pick a ~30-45s loop
- **Peace:** Search "peaceful piano ambient" — pick a ~30-45s loop
- **Rise:** Search "motivational cinematic build" — pick a ~30-45s loop
- **Selah:** Search "meditation ambient calm" — pick a ~30-45s loop

Trim to loop-friendly lengths using Audacity or ffmpeg:

```bash
ffmpeg -i downloaded_track.mp3 -t 40 -b:a 128k assets/tracks/glory.mp3
```

**Step 2: Verify all 5 files exist and are reasonable size (1-2MB each)**

```bash
ls -la assets/tracks/
```

**Step 3: Commit**

```bash
git add assets/tracks/
git commit -m "feat: add 5 bundled cinematic atmosphere tracks"
```

---

### Task 5.2: Write Audio Engine Service

**Files:**
- Create: `services/audioEngine.ts`

**Step 1: Write the audio engine**

```tsx
// services/audioEngine.ts
import { Audio, AVPlaybackStatus } from "expo-av";
import * as FileSystem from "expo-file-system";
import { AtmosphereType } from "../types";
import { BUNDLED_TRACK_ASSETS } from "../constants/tracks";

const FADE_STEP_MS = 50;

class AudioEngine {
  private speechSound: Audio.Sound | null = null;
  private musicSound: Audio.Sound | null = null;
  private fadeInterval: ReturnType<typeof setInterval> | null = null;
  private isActive = false;

  async init() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
  }

  async playSession(
    audioBase64: string,
    atmosphere: AtmosphereType,
    onComplete: () => void
  ) {
    this.isActive = true;
    await this.stopAll();
    await this.init();

    // 1. Write WAV base64 to temp file
    const speechUri = FileSystem.cacheDirectory + "speech_" + Date.now() + ".wav";
    await FileSystem.writeAsStringAsync(speechUri, audioBase64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // 2. Load speech sound
    const { sound: speechSound } = await Audio.Sound.createAsync(
      { uri: speechUri },
      { volume: 1.0, shouldPlay: false }
    );
    this.speechSound = speechSound;

    // 3. Load music track (if not "none")
    if (atmosphere !== "none") {
      const trackAsset = BUNDLED_TRACK_ASSETS[atmosphere];
      if (trackAsset) {
        const { sound: musicSound } = await Audio.Sound.createAsync(
          trackAsset,
          { volume: 0, isLooping: true, shouldPlay: false }
        );
        this.musicSound = musicSound;
      }
    }

    // 4. Start speech
    await this.speechSound.playAsync();

    // 5. Fade in music over 2 seconds
    if (this.musicSound) {
      await this.musicSound.playAsync();
      this.fadeVolume(this.musicSound, 0, 0.3, 2000);
    }

    // 6. Listen for speech completion
    this.speechSound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;
      if (status.didJustFinish && this.isActive) {
        this.handleSpeechEnd(onComplete);
      }
    });
  }

  private async handleSpeechEnd(onComplete: () => void) {
    if (!this.isActive) return;

    if (this.musicSound) {
      // Swell music to 0.5 over 1 second
      await this.fadeVolume(this.musicSound, 0.3, 0.5, 1000);

      // Hold for 3 seconds
      await this.delay(3000);

      // Fade out over 3 seconds
      if (this.isActive) {
        await this.fadeVolume(this.musicSound, 0.5, 0, 3000);
      }
    }

    await this.stopAll();
    onComplete();
  }

  private fadeVolume(
    sound: Audio.Sound,
    from: number,
    to: number,
    durationMs: number
  ): Promise<void> {
    return new Promise((resolve) => {
      if (this.fadeInterval) clearInterval(this.fadeInterval);

      const steps = durationMs / FADE_STEP_MS;
      const increment = (to - from) / steps;
      let current = from;
      let stepCount = 0;

      this.fadeInterval = setInterval(async () => {
        stepCount++;
        current += increment;

        if (stepCount >= steps) {
          current = to;
          if (this.fadeInterval) clearInterval(this.fadeInterval);
          this.fadeInterval = null;
          try { await sound.setVolumeAsync(current); } catch {}
          resolve();
          return;
        }

        try { await sound.setVolumeAsync(Math.max(0, Math.min(1, current))); } catch {}
      }, FADE_STEP_MS);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async stopAll() {
    this.isActive = false;

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (this.speechSound) {
      try {
        await this.speechSound.stopAsync();
        await this.speechSound.unloadAsync();
      } catch {}
      this.speechSound = null;
    }

    if (this.musicSound) {
      try {
        await this.musicSound.stopAsync();
        await this.musicSound.unloadAsync();
      } catch {}
      this.musicSound = null;
    }
  }
}

export const audioEngine = new AudioEngine();
```

**Step 2: Commit**

```bash
git add services/audioEngine.ts
git commit -m "feat: add expo-av audio engine with dual-channel fade system"
```

---

### Task 5.3: Write useAudio Hook

**Files:**
- Create: `hooks/useAudio.ts`

**Step 1: Write the hook**

```tsx
// hooks/useAudio.ts
import { useState, useCallback, useEffect } from "react";
import { audioEngine } from "../services/audioEngine";
import { AtmosphereType } from "../types";

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [atmosphere, setAtmosphere] = useState<AtmosphereType>("glory");

  useEffect(() => {
    return () => {
      audioEngine.stopAll();
    };
  }, []);

  const play = useCallback(
    async (audioBase64: string) => {
      setIsPlaying(true);
      await audioEngine.playSession(audioBase64, atmosphere, () => {
        setIsPlaying(false);
      });
    },
    [atmosphere]
  );

  const stop = useCallback(async () => {
    await audioEngine.stopAll();
    setIsPlaying(false);
  }, []);

  const togglePlayback = useCallback(
    async (audioBase64: string | null) => {
      if (isPlaying) {
        await stop();
      } else if (audioBase64) {
        await play(audioBase64);
      }
    },
    [isPlaying, play, stop]
  );

  const cycleAtmosphere = useCallback(() => {
    const modes: AtmosphereType[] = ["glory", "warfare", "peace", "rise", "selah", "none"];
    setAtmosphere((prev) => {
      const idx = modes.indexOf(prev);
      return modes[(idx + 1) % modes.length];
    });
  }, []);

  return {
    isPlaying,
    atmosphere,
    setAtmosphere,
    play,
    stop,
    togglePlayback,
    cycleAtmosphere,
  };
}
```

**Step 2: Commit**

```bash
git add hooks/useAudio.ts
git commit -m "feat: add useAudio hook for playback state management"
```

---

## Phase 6: Auth Flow & Navigation

### Task 6.1: Write useAuth Hook

**Files:**
- Create: `hooks/useAuth.ts`

**Step 1: Write the hook**

```tsx
// hooks/useAuth.ts
import { useState, useEffect } from "react";
import { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { onAuthStateChanged } from "../services/auth";

export function useAuth() {
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, loading, isAuthenticated: !!user };
}
```

**Step 2: Commit**

```bash
git add hooks/useAuth.ts
git commit -m "feat: add useAuth hook for Firebase auth state"
```

---

### Task 6.2: Write Root Layout with Auth Gate

**Files:**
- Modify: `app/_layout.tsx`

**Step 1: Write root layout**

```tsx
// app/_layout.tsx
import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../hooks/useAuth";
import { useRouter, useSegments } from "expo-router";

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!user && !inAuthGroup) {
      router.replace("/(auth)/welcome");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  if (loading) return null;
  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cinzel: require("../assets/fonts/Cinzel-Bold.ttf"),
    Lato: require("../assets/fonts/Lato-Regular.ttf"),
    "Lato-Bold": require("../assets/fonts/Lato-Bold.ttf"),
    PlayfairDisplay: require("../assets/fonts/PlayfairDisplay-Regular.ttf"),
    "PlayfairDisplay-Italic": require("../assets/fonts/PlayfairDisplay-Italic.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthGate>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </AuthGate>
  );
}
```

**Step 2: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat: add root layout with auth gate routing"
```

---

### Task 6.3: Write Welcome Screen

**Files:**
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/welcome.tsx`

**Step 1: Write auth layout**

```tsx
// app/(auth)/_layout.tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

**Step 2: Write welcome.tsx**

```tsx
// app/(auth)/welcome.tsx
import { View, Text, Pressable, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Flame } from "lucide-react-native";
import { COLORS } from "../../constants/theme";

const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={[COLORS.voidBlack, COLORS.deepPurple, COLORS.voidBlack]}
      className="flex-1 justify-end items-center px-6 pb-16"
    >
      {/* Hero */}
      <View className="flex-1 justify-center items-center">
        <Flame size={64} color={COLORS.fireOrange} />
        <Text
          style={{ fontFamily: "Cinzel" }}
          className="text-4xl text-white mt-4 tracking-widest"
        >
          RHEMA<Text className="text-electric-purple">FLOW</Text>
        </Text>
        <Text
          style={{ fontFamily: "Lato" }}
          className="text-slate-400 text-lg text-center mt-4 leading-7"
        >
          Speak life over your situation.{"\n"}The atmosphere shifts when you declare.
        </Text>
      </View>

      {/* CTA */}
      <Pressable
        onPress={() => router.push("/(auth)/sign-in")}
        className="w-full bg-electric-purple py-4 rounded-2xl items-center active:opacity-80"
      >
        <Text style={{ fontFamily: "Lato-Bold" }} className="text-white text-lg">
          Get Started
        </Text>
      </Pressable>
    </LinearGradient>
  );
}
```

**Step 3: Commit**

```bash
git add app/\(auth\)/
git commit -m "feat: add welcome screen with hero branding"
```

---

### Task 6.4: Write Sign-In Screen

**Files:**
- Create: `app/(auth)/sign-in.tsx`

**Step 1: Write sign-in.tsx**

```tsx
// app/(auth)/sign-in.tsx
import { View, Text, Pressable, Alert, Platform } from "react-native";
import { signInWithGoogle, signInWithApple, signInAnonymously } from "../../services/auth";
import { COLORS } from "../../constants/theme";

export default function SignInScreen() {
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
    <View className="flex-1 bg-void-black justify-center px-6">
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
        <Text style={{ fontFamily: "Lato-Bold" }} className="text-void-black text-lg">
          Continue with Google
        </Text>
      </Pressable>

      {/* Apple (iOS only) */}
      {Platform.OS === "ios" && (
        <Pressable
          onPress={handleApple}
          className="w-full bg-white py-4 rounded-2xl items-center mb-4 active:opacity-80"
        >
          <Text style={{ fontFamily: "Lato-Bold" }} className="text-void-black text-lg">
            Continue with Apple
          </Text>
        </Pressable>
      )}

      {/* Anonymous */}
      <Pressable
        onPress={handleAnonymous}
        className="w-full border border-slate-700 py-4 rounded-2xl items-center mt-4 active:opacity-80"
      >
        <Text style={{ fontFamily: "Lato" }} className="text-slate-400 text-base">
          Try without an account
        </Text>
      </Pressable>
    </View>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(auth\)/sign-in.tsx
git commit -m "feat: add sign-in screen with Google, Apple, and anonymous auth"
```

---

### Task 6.5: Write Tab Navigator Layout

**Files:**
- Create: `app/(tabs)/_layout.tsx`

**Step 1: Write tabs layout**

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Home, Heart, Settings } from "lucide-react-native";
import { COLORS } from "../../constants/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.electricPurple,
        tabBarInactiveTintColor: COLORS.slate400,
        tabBarStyle: {
          backgroundColor: COLORS.voidBlack,
          borderTopColor: "rgba(255,255,255,0.1)",
          height: 80,
          paddingBottom: 20,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: "Lato-Bold",
          fontSize: 10,
          letterSpacing: 1,
          textTransform: "uppercase",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ color, size }) => <Heart size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(tabs\)/_layout.tsx
git commit -m "feat: add bottom tab navigator with Home, Saved, Settings"
```

---

## Phase 7: Core UI Components

### Task 7.1: Write Typography Component

**Files:**
- Create: `components/ui/Typography.tsx`

**Step 1: Write Typography.tsx**

```tsx
// components/ui/Typography.tsx
import { Text, TextProps } from "react-native";
import { FONTS } from "../../constants/theme";

interface TypographyProps extends TextProps {
  variant?: "display" | "heading" | "body" | "caption" | "button" | "scripture";
}

const VARIANT_STYLES: Record<string, { fontFamily: string; fontSize: number }> = {
  display: { fontFamily: FONTS.display, fontSize: 28 },
  heading: { fontFamily: FONTS.heading, fontSize: 22 },
  body: { fontFamily: FONTS.body, fontSize: 16 },
  caption: { fontFamily: FONTS.body, fontSize: 13 },
  button: { fontFamily: FONTS.bodyBold, fontSize: 16 },
  scripture: { fontFamily: FONTS.headingItalic, fontSize: 15 },
};

export function Typography({
  variant = "body",
  style,
  ...props
}: TypographyProps) {
  const variantStyle = VARIANT_STYLES[variant];
  return <Text style={[variantStyle, style]} {...props} />;
}
```

**Step 2: Commit**

```bash
git add components/ui/Typography.tsx
git commit -m "feat: add Typography component with font variants"
```

---

### Task 7.2: Write GradientBackground Component

**Files:**
- Create: `components/ui/GradientBackground.tsx`

**Step 1: Write GradientBackground.tsx**

```tsx
// components/ui/GradientBackground.tsx
import { ViewProps } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { DeclarationCategory } from "../../types";
import { CATEGORY_GRADIENTS } from "../../constants/categories";

interface GradientBackgroundProps extends ViewProps {
  category: DeclarationCategory;
}

export function GradientBackground({
  category,
  style,
  children,
  ...props
}: GradientBackgroundProps) {
  const [start, end] = CATEGORY_GRADIENTS[category];
  return (
    <LinearGradient colors={[start, end]} style={[{ flex: 1 }, style]} {...props}>
      {children}
    </LinearGradient>
  );
}
```

**Step 2: Commit**

```bash
git add components/ui/GradientBackground.tsx
git commit -m "feat: add GradientBackground component for category theming"
```

---

### Task 7.3: Write CategoryNav Component

**Files:**
- Create: `components/CategoryNav.tsx`

**Step 1: Write CategoryNav.tsx**

```tsx
// components/CategoryNav.tsx
import { ScrollView, Pressable, Text } from "react-native";
import { DeclarationCategory } from "../types";
import * as Haptics from "expo-haptics";

interface CategoryNavProps {
  selectedCategory: DeclarationCategory;
  onSelect: (category: DeclarationCategory) => void;
}

export function CategoryNav({ selectedCategory, onSelect }: CategoryNavProps) {
  const categories = Object.values(DeclarationCategory);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 4, gap: 10 }}
    >
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat;
        return (
          <Pressable
            key={cat}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSelect(cat);
            }}
            className={`px-5 py-2.5 rounded-full ${
              isSelected
                ? "bg-electric-purple"
                : "bg-slate-800 border border-white/5"
            }`}
          >
            <Text
              style={{ fontFamily: "Lato-Bold" }}
              className={`text-sm ${isSelected ? "text-white" : "text-slate-400"}`}
            >
              {cat}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
```

**Step 2: Commit**

```bash
git add components/CategoryNav.tsx
git commit -m "feat: add CategoryNav horizontal scroll component"
```

---

### Task 7.4: Write MoodInput Component

**Files:**
- Create: `components/MoodInput.tsx`

**Step 1: Write MoodInput.tsx**

```tsx
// components/MoodInput.tsx
import { View, Text, Pressable, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { MOOD_PRESETS } from "../constants/categories";
import { DeclarationCategory, MoodPreset } from "../types";
import { COLORS } from "../constants/theme";

interface MoodInputProps {
  onMoodSelect: (preset: MoodPreset) => void;
  onCustomMood: (text: string) => void;
  isLoading: boolean;
  selectedCategory: DeclarationCategory;
}

export function MoodInput({
  onMoodSelect,
  onCustomMood,
  isLoading,
  selectedCategory,
}: MoodInputProps) {
  const [customText, setCustomText] = useState("");

  const filteredPresets =
    selectedCategory === DeclarationCategory.GENERAL
      ? MOOD_PRESETS
      : MOOD_PRESETS.filter((p) => p.category === selectedCategory);

  const placeholders: Record<string, string> = {
    [DeclarationCategory.HEALTH]: "Describe your symptoms...",
    [DeclarationCategory.WEALTH]: "Describe your financial situation...",
    [DeclarationCategory.PROTECTION]: "What are you afraid of?",
    [DeclarationCategory.IDENTITY]: "How are you feeling about yourself?",
    [DeclarationCategory.SUCCESS]: "What obstacle are you facing?",
    [DeclarationCategory.WISDOM]: "What decision do you need to make?",
    [DeclarationCategory.GENERAL]: "Describe your situation...",
  };

  const handleSubmit = () => {
    if (customText.trim()) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onCustomMood(customText.trim());
      setCustomText("");
    }
  };

  return (
    <View className="w-full gap-6">
      {/* Mood Presets Grid */}
      {filteredPresets.length > 0 && (
        <View className="flex-row flex-wrap gap-4">
          {filteredPresets.map((preset) => (
            <Pressable
              key={preset.label}
              disabled={isLoading}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onMoodSelect(preset);
              }}
              className="basis-[47%] items-center justify-center p-6 bg-slate-800 rounded-2xl border border-white/5 active:scale-95"
            >
              <Text className="text-4xl mb-3">{preset.emoji}</Text>
              <Text
                style={{ fontFamily: "Lato-Bold" }}
                className="text-sm text-slate-200 text-center"
              >
                {preset.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Divider */}
      <View className="flex-row items-center">
        <View className="flex-1 h-px bg-white/10" />
        <Text style={{ fontFamily: "Lato-Bold" }} className="px-3 text-xs text-slate-500 uppercase tracking-widest">
          Or speak your situation
        </Text>
        <View className="flex-1 h-px bg-white/10" />
      </View>

      {/* Custom Input */}
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="flex-row items-center bg-slate-800 rounded-2xl border border-white/10 pr-2">
          <TextInput
            value={customText}
            onChangeText={setCustomText}
            placeholder={placeholders[selectedCategory]}
            placeholderTextColor={COLORS.slate400}
            editable={!isLoading}
            onSubmitEditing={handleSubmit}
            returnKeyType="send"
            className="flex-1 px-5 py-4 text-white text-lg"
            style={{ fontFamily: "Lato" }}
          />
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading || !customText.trim()}
            className="w-12 h-12 bg-electric-purple rounded-xl items-center justify-center disabled:opacity-50 disabled:bg-slate-700"
          >
            {isLoading ? (
              <Sparkles size={20} color="white" />
            ) : (
              <ArrowRight size={24} color="white" />
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
```

**Step 2: Commit**

```bash
git add components/MoodInput.tsx
git commit -m "feat: add MoodInput component with presets and custom input"
```

---

### Task 7.5: Write DeclarationCard Component

**Files:**
- Create: `components/DeclarationCard.tsx`

**Step 1: Write DeclarationCard.tsx**

```tsx
// components/DeclarationCard.tsx
import { View, Text, Pressable, ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Play, Pause, Share2, RefreshCw, Music, VolumeX, BookOpen } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { DeclarationCategory, AtmosphereType } from "../types";
import { CATEGORY_GRADIENTS } from "../constants/categories";
import { ATMOSPHERE_TRACKS } from "../constants/tracks";
import { COLORS } from "../constants/theme";

interface DeclarationCardProps {
  text: string;
  reference: string;
  scriptureText: string;
  category: DeclarationCategory;
  backgroundImageUrl: string | null;
  isPlaying: boolean;
  onPlayToggle: () => void;
  onRegenerateImage: () => void;
  isGeneratingImage: boolean;
  atmosphere: AtmosphereType;
  onAtmosphereChange: () => void;
  onShare: () => void;
}

export function DeclarationCard({
  text,
  reference,
  scriptureText,
  category,
  backgroundImageUrl,
  isPlaying,
  onPlayToggle,
  onRegenerateImage,
  isGeneratingImage,
  atmosphere,
  onAtmosphereChange,
  onShare,
}: DeclarationCardProps) {
  const [gradStart, gradEnd] = CATEGORY_GRADIENTS[category];
  const trackMeta = ATMOSPHERE_TRACKS.find((t) => t.id === atmosphere);

  const card = (
    <View className="flex-1 rounded-3xl overflow-hidden border border-white/10">
      {/* Gradient overlays */}
      <LinearGradient
        colors={["rgba(0,0,0,0.6)", "transparent", "rgba(0,0,0,0.95)"]}
        className="absolute inset-0 z-10"
      />

      {/* Top controls */}
      <View className="z-20 p-5 flex-row justify-between items-start">
        <View>
          <Text
            style={{ fontFamily: "Lato-Bold" }}
            className="text-[10px] uppercase tracking-[3px] text-divine-gold"
          >
            {category}
          </Text>
          <View className="h-0.5 w-8 bg-divine-gold mt-1" />
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAtmosphereChange();
            }}
            className={`flex-row items-center gap-2 px-3 py-2 rounded-full border border-white/20 ${
              atmosphere !== "none" ? "bg-electric-purple/80" : "bg-black/30"
            }`}
          >
            {atmosphere !== "none" ? (
              <Music size={12} color="white" />
            ) : (
              <VolumeX size={12} color="rgba(255,255,255,0.7)" />
            )}
            <Text style={{ fontFamily: "Lato-Bold" }} className="text-[10px] text-white uppercase tracking-wider">
              {trackMeta?.label ?? "Off"}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRegenerateImage();
            }}
            disabled={isGeneratingImage}
            className="bg-black/30 p-2 rounded-full border border-white/20"
          >
            <RefreshCw
              size={16}
              color={isGeneratingImage ? COLORS.divineGold : "rgba(255,255,255,0.8)"}
            />
          </Pressable>
        </View>
      </View>

      {/* Declaration text */}
      <View className="z-20 flex-1 px-8 justify-center items-center">
        <Text
          style={{ fontFamily: "Cinzel" }}
          className="text-2xl text-white text-center leading-9"
        >
          &ldquo;{text}&rdquo;
        </Text>
      </View>

      {/* Scripture card */}
      <View className="z-20 mx-6 mb-4">
        <BlurView intensity={20} tint="dark" className="rounded-xl overflow-hidden border border-white/10">
          <View className="p-4">
            <Text
              style={{ fontFamily: "PlayfairDisplay-Italic" }}
              className="text-slate-300 text-base text-center leading-6 mb-3"
            >
              {scriptureText}
            </Text>
            <View className="flex-row justify-center">
              <View className="flex-row items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5">
                <BookOpen size={12} color={COLORS.divineGold} />
                <Text
                  style={{ fontFamily: "Lato-Bold" }}
                  className="text-xs text-divine-gold uppercase tracking-widest"
                >
                  {reference}
                </Text>
              </View>
            </View>
          </View>
        </BlurView>
      </View>

      {/* Bottom actions */}
      <View className="z-20 px-5 pb-6 flex-row gap-3">
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onPlayToggle();
          }}
          className={`flex-1 flex-row items-center justify-center gap-2 h-14 rounded-2xl ${
            isPlaying
              ? "bg-electric-purple shadow-lg"
              : "bg-white"
          }`}
        >
          {isPlaying ? (
            <Pause size={20} color="white" fill="white" />
          ) : (
            <Play size={20} color={COLORS.voidBlack} fill={COLORS.voidBlack} />
          )}
          <Text
            style={{ fontFamily: "Lato-Bold" }}
            className={`text-base uppercase tracking-wider ${
              isPlaying ? "text-white" : "text-void-black"
            }`}
          >
            {isPlaying ? "Speaking..." : "Speak Life"}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onShare();
          }}
          className="h-14 w-14 items-center justify-center bg-white/10 border border-white/20 rounded-2xl"
        >
          <Share2 size={24} color="white" />
        </Pressable>
      </View>
    </View>
  );

  if (backgroundImageUrl) {
    return (
      <ImageBackground
        source={{ uri: backgroundImageUrl }}
        className="flex-1 rounded-3xl overflow-hidden"
        imageStyle={{ borderRadius: 24, opacity: 0.8 }}
      >
        {card}
      </ImageBackground>
    );
  }

  return (
    <LinearGradient colors={[gradStart, gradEnd]} className="flex-1 rounded-3xl overflow-hidden">
      {card}
    </LinearGradient>
  );
}
```

**Step 2: Commit**

```bash
git add components/DeclarationCard.tsx
git commit -m "feat: add DeclarationCard with atmosphere controls and glass-morphism"
```

---

### Task 7.6: Write LoadingOverlay Component

**Files:**
- Create: `components/LoadingOverlay.tsx`

**Step 1: Write LoadingOverlay.tsx**

```tsx
// components/LoadingOverlay.tsx
import { View, Text } from "react-native";
import { useEffect, useState } from "react";
import { BlurView } from "expo-blur";
import { Flame } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { LOADING_MESSAGES, COLORS } from "../constants/theme";

export function LoadingOverlay() {
  const [messageIndex, setMessageIndex] = useState(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.2, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      true
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.5, { duration: 800 })
      ),
      -1,
      true
    );

    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <BlurView
      intensity={40}
      tint="dark"
      className="absolute inset-0 z-50 items-center justify-center"
    >
      <Animated.View style={animatedStyle} className="mb-8">
        <Flame size={64} color={COLORS.fireOrange} />
      </Animated.View>

      <Text
        style={{ fontFamily: "Cinzel" }}
        className="text-white text-2xl text-center"
      >
        IGNITING...
      </Text>

      <Text
        style={{ fontFamily: "Lato" }}
        className="text-electric-purple text-sm uppercase tracking-[3px] mt-2 text-center"
      >
        {LOADING_MESSAGES[messageIndex]}
      </Text>
    </BlurView>
  );
}
```

**Step 2: Commit**

```bash
git add components/LoadingOverlay.tsx
git commit -m "feat: add animated loading overlay with rotating messages"
```

---

## Phase 8: Home Screen

### Task 8.1: Write Home Screen

**Files:**
- Create: `app/(tabs)/index.tsx`

**Step 1: Write index.tsx**

```tsx
// app/(tabs)/index.tsx
import { View, Text, ScrollView, Pressable } from "react-native";
import { useState, useRef } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flame, ChevronLeft, Sparkles, User } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { CategoryNav } from "../../components/CategoryNav";
import { MoodInput } from "../../components/MoodInput";
import { DeclarationCard } from "../../components/DeclarationCard";
import { LoadingOverlay } from "../../components/LoadingOverlay";
import { useAudio } from "../../hooks/useAudio";
import { generateAllContent, generateImage } from "../../services/declarations";
import { saveDeclaration } from "../../services/favorites";
import { DeclarationCategory, MoodPreset, GeneratedContent } from "../../types";
import { COLORS } from "../../constants/theme";

export default function HomeScreen() {
  const [currentCategory, setCurrentCategory] = useState<DeclarationCategory>(
    DeclarationCategory.GENERAL
  );
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<GeneratedContent | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const { isPlaying, atmosphere, togglePlayback, cycleAtmosphere, stop } = useAudio();
  const viewShotRef = useRef<ViewShot>(null);

  const processGeneration = async (prompt: string, category: DeclarationCategory) => {
    setIsLoading(true);
    setContent(null);
    setCurrentCategory(category);
    await stop();

    try {
      const result = await generateAllContent(category, prompt);
      setContent(result);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMoodSelect = (preset: MoodPreset) => {
    processGeneration(preset.prompt, preset.category);
  };

  const handleCustomMood = (text: string) => {
    processGeneration(text, currentCategory);
  };

  const handleRegenerateImage = async () => {
    if (!content) return;
    setIsGeneratingImage(true);
    try {
      const newImageUrl = await generateImage(currentCategory, content.text);
      if (newImageUrl) {
        setContent((prev) => (prev ? { ...prev, backgroundImageUrl: newImageUrl } : null));
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleShare = async () => {
    if (!viewShotRef.current?.capture) return;
    try {
      const uri = await viewShotRef.current.capture();
      await Sharing.shareAsync(uri, { mimeType: "image/png" });
    } catch (error) {
      console.error("Share failed:", error);
    }
  };

  const handleSave = async () => {
    if (!content) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await saveDeclaration({
      text: content.text,
      reference: content.reference,
      scriptureText: content.scriptureText,
      category: currentCategory,
      atmosphere,
      imageUrl: content.backgroundImageUrl,
    });
  };

  const goBack = async () => {
    await stop();
    setContent(null);
  };

  return (
    <SafeAreaView className="flex-1 bg-void-black">
      {/* Header */}
      <View className="h-16 px-4 flex-row items-center justify-between border-b border-white/5">
        <View className="flex-row items-center gap-2">
          {content ? (
            <Pressable onPress={goBack} className="p-2 -ml-2 active:opacity-60">
              <ChevronLeft size={24} color="white" />
            </Pressable>
          ) : (
            <Flame size={24} color={COLORS.fireOrange} />
          )}
          <Text style={{ fontFamily: "Cinzel" }} className="text-xl text-white uppercase tracking-tight">
            Rhema<Text className="text-electric-purple">Flow</Text>
          </Text>
        </View>
        <Pressable className="p-2">
          <User size={20} color={COLORS.slate400} />
        </Pressable>
      </View>

      {/* Main Content */}
      {!content ? (
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 20, gap: 32 }}>
          {/* Hero */}
          <View className="pt-6 gap-2">
            <Text style={{ fontFamily: "Cinzel" }} className="text-4xl text-white leading-none">
              UNLEASH{"\n"}
              <Text className="text-fire-orange">YOUR VOICE</Text>
            </Text>
            <Text style={{ fontFamily: "Lato" }} className="text-slate-400 text-lg mt-2">
              The atmosphere shifts when you speak. What do you need to declare today?
            </Text>
          </View>

          <CategoryNav selectedCategory={currentCategory} onSelect={setCurrentCategory} />

          <MoodInput
            onMoodSelect={handleMoodSelect}
            onCustomMood={handleCustomMood}
            isLoading={isLoading}
            selectedCategory={currentCategory}
          />
        </ScrollView>
      ) : (
        <View className="flex-1 p-4">
          <ViewShot ref={viewShotRef} options={{ format: "png", quality: 1 }} className="flex-1">
            <DeclarationCard
              text={content.text}
              reference={content.reference}
              scriptureText={content.scriptureText}
              category={currentCategory}
              backgroundImageUrl={content.backgroundImageUrl}
              isPlaying={isPlaying}
              onPlayToggle={() => togglePlayback(content.audioBase64)}
              onRegenerateImage={handleRegenerateImage}
              isGeneratingImage={isGeneratingImage}
              atmosphere={atmosphere}
              onAtmosphereChange={cycleAtmosphere}
              onShare={handleShare}
            />
          </ViewShot>

          {/* Fresh Fire button */}
          <Pressable
            onPress={() => processGeneration(`Generate another declaration about ${currentCategory}`, currentCategory)}
            className="mt-3 h-14 bg-slate-800 border border-white/10 rounded-2xl flex-row items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Sparkles size={20} color={COLORS.divineGold} />
            <Text style={{ fontFamily: "Lato-Bold" }} className="text-white text-base uppercase tracking-wider">
              Fresh Fire
            </Text>
          </Pressable>
        </View>
      )}

      {/* Loading Overlay */}
      {isLoading && <LoadingOverlay />}
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(tabs\)/index.tsx
git commit -m "feat: add Home screen with generation pipeline and card display"
```

---

## Phase 9: Saved Screen

### Task 9.1: Write Saved Screen

**Files:**
- Create: `app/(tabs)/saved.tsx`

**Step 1: Write saved.tsx**

```tsx
// app/(tabs)/saved.tsx
import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Heart, Trash2, BookOpen } from "lucide-react-native";
import { Declaration } from "../../types";
import { onDeclarationsSnapshot, deleteDeclaration } from "../../services/favorites";
import { COLORS } from "../../constants/theme";

export default function SavedScreen() {
  const [declarations, setDeclarations] = useState<Declaration[]>([]);

  useEffect(() => {
    const unsubscribe = onDeclarationsSnapshot(setDeclarations);
    return unsubscribe;
  }, []);

  const handleDelete = (id: string) => {
    Alert.alert("Delete Declaration", "Remove this declaration from your saved list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteDeclaration(id),
      },
    ]);
  };

  if (declarations.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-void-black items-center justify-center px-8">
        <Heart size={48} color={COLORS.slate700} />
        <Text
          style={{ fontFamily: "PlayfairDisplay" }}
          className="text-xl text-slate-400 mt-4 text-center"
        >
          No declarations saved yet
        </Text>
        <Text style={{ fontFamily: "Lato" }} className="text-slate-500 mt-2 text-center">
          Generate your first declaration and tap the heart to save it.
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-void-black">
      <View className="h-16 px-4 justify-center border-b border-white/5">
        <Text style={{ fontFamily: "Cinzel" }} className="text-xl text-white uppercase">
          Saved Declarations
        </Text>
      </View>

      <FlatList
        data={declarations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        renderItem={({ item }) => (
          <View className="bg-slate-900 rounded-2xl p-5 border border-white/5">
            <View className="flex-row justify-between items-start mb-3">
              <View className="bg-electric-purple/20 px-3 py-1 rounded-full">
                <Text style={{ fontFamily: "Lato-Bold" }} className="text-electric-purple text-xs uppercase">
                  {item.category}
                </Text>
              </View>
              <Pressable onPress={() => handleDelete(item.id)} className="p-1">
                <Trash2 size={16} color={COLORS.slate400} />
              </Pressable>
            </View>

            <Text
              style={{ fontFamily: "Lato" }}
              className="text-white text-base leading-6 mb-3"
              numberOfLines={3}
            >
              {item.text}
            </Text>

            <View className="flex-row items-center gap-2">
              <BookOpen size={12} color={COLORS.divineGold} />
              <Text style={{ fontFamily: "Lato-Bold" }} className="text-divine-gold text-xs uppercase tracking-wider">
                {item.reference}
              </Text>
            </View>

            <Text style={{ fontFamily: "Lato" }} className="text-slate-500 text-xs mt-2">
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(tabs\)/saved.tsx
git commit -m "feat: add Saved screen with Firestore real-time list"
```

---

## Phase 10: Settings Screen

### Task 10.1: Write useNotifications Hook

**Files:**
- Create: `hooks/useNotifications.ts`

**Step 1: Write the hook**

```tsx
// hooks/useNotifications.ts
import { useEffect } from "react";
import * as Notifications from "expo-notifications";
import { NOTIFICATION_MESSAGES } from "../constants/notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleDailyNotification(hour: number, minute: number) {
  // Cancel existing scheduled notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Pick a random message
  const msg = NOTIFICATION_MESSAGES[Math.floor(Math.random() * NOTIFICATION_MESSAGES.length)];

  await Notifications.scheduleNotificationAsync({
    content: {
      title: msg.title,
      body: msg.body,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
```

**Step 2: Commit**

```bash
git add hooks/useNotifications.ts
git commit -m "feat: add useNotifications hook with daily scheduling"
```

---

### Task 10.2: Write Settings Screen

**Files:**
- Create: `app/(tabs)/settings.tsx`

**Step 1: Write settings.tsx**

```tsx
// app/(tabs)/settings.tsx
import { View, Text, Pressable, Switch, Alert } from "react-native";
import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, Bell, Trash2, User } from "lucide-react-native";
import { signOut } from "../../services/auth";
import { auth, db } from "../../services/firebase";
import { UserSettings } from "../../types";
import {
  requestNotificationPermission,
  scheduleDailyNotification,
  cancelAllNotifications,
} from "../../hooks/useNotifications";
import { COLORS } from "../../constants/theme";

const DEFAULT_SETTINGS: UserSettings = {
  notificationsEnabled: true,
  notificationTime: "08:00",
  defaultAtmosphere: "glory",
  defaultCategory: "General" as any,
};

export default function SettingsScreen() {
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const unsub = db
      .collection("users")
      .doc(user.uid)
      .onSnapshot((doc) => {
        const data = doc.data();
        if (data?.settings) setSettings(data.settings);
      });
    return unsub;
  }, [user]);

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    if (!user) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    await db.collection("users").doc(user.uid).update({ settings: newSettings });

    // Handle notification toggle
    if (key === "notificationsEnabled") {
      if (value) {
        const granted = await requestNotificationPermission();
        if (granted) {
          const [h, m] = settings.notificationTime.split(":").map(Number);
          await scheduleDailyNotification(h, m);
        }
      } else {
        await cancelAllNotifications();
      }
    }
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => signOut() },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "This will permanently delete your account and all saved declarations. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!user) return;
            await db.collection("users").doc(user.uid).delete();
            await user.delete();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-void-black">
      <View className="h-16 px-4 justify-center border-b border-white/5">
        <Text style={{ fontFamily: "Cinzel" }} className="text-xl text-white uppercase">
          Settings
        </Text>
      </View>

      <View className="p-4 gap-6">
        {/* Account Section */}
        <View className="gap-3">
          <Text style={{ fontFamily: "Lato-Bold" }} className="text-slate-400 text-xs uppercase tracking-widest">
            Account
          </Text>
          <View className="bg-slate-900 rounded-2xl p-4 flex-row items-center gap-4">
            <View className="w-12 h-12 rounded-full bg-electric-purple/20 items-center justify-center">
              <User size={24} color={COLORS.electricPurple} />
            </View>
            <View className="flex-1">
              <Text style={{ fontFamily: "Lato-Bold" }} className="text-white text-base">
                {user?.displayName || "Guest"}
              </Text>
              <Text style={{ fontFamily: "Lato" }} className="text-slate-400 text-sm">
                {user?.email || "Anonymous account"}
              </Text>
            </View>
          </View>
        </View>

        {/* Notifications Section */}
        <View className="gap-3">
          <Text style={{ fontFamily: "Lato-Bold" }} className="text-slate-400 text-xs uppercase tracking-widest">
            Notifications
          </Text>
          <View className="bg-slate-900 rounded-2xl p-4 gap-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Bell size={20} color={COLORS.electricPurple} />
                <Text style={{ fontFamily: "Lato" }} className="text-white text-base">
                  Daily Reminders
                </Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(v) => updateSetting("notificationsEnabled", v)}
                trackColor={{ true: COLORS.electricPurple, false: COLORS.slate700 }}
              />
            </View>

            {settings.notificationsEnabled && (
              <View className="flex-row items-center justify-between">
                <Text style={{ fontFamily: "Lato" }} className="text-slate-400">
                  Reminder Time
                </Text>
                <Text style={{ fontFamily: "Lato-Bold" }} className="text-white">
                  {settings.notificationTime}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Actions */}
        <View className="gap-3">
          <Pressable
            onPress={handleSignOut}
            className="bg-slate-900 rounded-2xl p-4 flex-row items-center gap-3"
          >
            <LogOut size={20} color={COLORS.fireOrange} />
            <Text style={{ fontFamily: "Lato" }} className="text-white text-base">
              Sign Out
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDeleteAccount}
            className="bg-slate-900 rounded-2xl p-4 flex-row items-center gap-3"
          >
            <Trash2 size={20} color="#EF4444" />
            <Text style={{ fontFamily: "Lato" }} className="text-red-400 text-base">
              Delete Account
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
```

**Step 2: Commit**

```bash
git add app/\(tabs\)/settings.tsx
git commit -m "feat: add Settings screen with notifications and account management"
```

---

## Phase 11: Polish & Integration Testing

### Task 11.1: Add Save/Favorite Button to Home Screen

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Modify: `components/DeclarationCard.tsx`

**Step 1:** Add a heart/save button to the DeclarationCard bottom actions bar, next to the Share button. When tapped, call `saveDeclaration()` from `services/favorites.ts`. Show a filled heart when saved (local state toggle).

**Step 2: Commit**

```bash
git add app/\(tabs\)/index.tsx components/DeclarationCard.tsx
git commit -m "feat: add save/favorite button to declaration card"
```

---

### Task 11.2: Integration Test — Full Generation Flow

**Step 1:** Build dev client

```bash
eas build --platform ios --profile development
```

**Step 2:** Install on device/simulator and test:

1. Open app → Welcome screen appears
2. Sign in with Google → redirects to Home
3. Select "Health & Healing" category
4. Tap "Feeling Sick" mood preset
5. Loading overlay appears with rotating messages
6. Declaration card appears with text, scripture, and background image
7. Tap "Speak Life" → speech plays with Glory atmosphere music
8. Music fades in, speech plays, music swells after speech, fades out
9. Tap atmosphere toggle → cycles through all 6 modes
10. Tap regenerate image → new background appears
11. Tap Share → share sheet opens with card image
12. Navigate to Saved tab → saved declarations appear
13. Navigate to Settings → toggle notifications, sign out

**Step 3:** Fix any issues found during testing.

**Step 4: Commit fixes**

```bash
git add -A
git commit -m "fix: integration test fixes"
```

---

### Task 11.3: Add App Icons and Splash Screen

**Step 1:** Create app icon (1024x1024 PNG) with RhemaFlow branding — flame icon on deep purple background.

**Step 2:** Place in `assets/` and reference in `app.json`:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "backgroundColor": "#0F172A"
    }
  }
}
```

**Step 3: Commit**

```bash
git add assets/icon.png assets/splash.png app.json
git commit -m "feat: add app icon and splash screen"
```

---

### Task 11.4: Production Build

**Step 1:** Create production builds

```bash
eas build --platform ios --profile production
eas build --platform android --profile production
```

**Step 2:** Test production builds on real devices.

**Step 3:** Submit to App Store and Google Play when ready:

```bash
eas submit --platform ios
eas submit --platform android
```

---

## Summary of Phases

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1.1-1.5 | Project scaffolding, deps, NativeWind, fonts, EAS |
| 2 | 2.1-2.3 | Types, constants, theme |
| 3 | 3.1-3.2 | Firebase project setup and service layer |
| 4 | 4.1-4.6 | Cloud Functions (Gemini proxy) and security rules |
| 5 | 5.1-5.3 | Audio engine with cinematic tracks |
| 6 | 6.1-6.5 | Auth flow, navigation, welcome/sign-in screens |
| 7 | 7.1-7.6 | UI components (typography, cards, inputs, loading) |
| 8 | 8.1 | Home screen with full generation pipeline |
| 9 | 9.1 | Saved declarations screen |
| 10 | 10.1-10.2 | Settings screen with notifications |
| 11 | 11.1-11.4 | Polish, integration testing, app icons, production build |

**Total: 27 tasks across 11 phases.**
