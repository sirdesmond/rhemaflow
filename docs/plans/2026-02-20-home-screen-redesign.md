# Home Screen Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the traditional mood-grid home screen with an input-first "agentic" layout — centered text input with golden glow, mic button for voice input, horizontal category pills at the bottom.

**Architecture:** The `MoodInput` component is replaced with a new `DeclarationInput` component containing the glowing input field with mic/send buttons. A new `useSpeechRecognition` hook wraps `expo-speech-recognition`. The home screen layout shifts from a top-down scroll to a vertically centered flex layout. Category presets move to a horizontal `ScrollView` of compact pills via a new `CategoryPills` component.

**Tech Stack:** expo-speech-recognition (new dep), React Native Animated (pulse effects), existing Cinzel/Lato fonts, existing COLORS/theme constants.

---

### Task 1: Install expo-speech-recognition and configure plugin

**Files:**
- Modify: `package.json` (via npm install)
- Modify: `app.config.js:48-71` (add plugin entry)

**Step 1: Install the package**

Run: `npx expo install expo-speech-recognition`

**Step 2: Add the config plugin to app.config.js**

In the `plugins` array (after the `expo-notifications` entry on line 70), add:

```javascript
[
  "expo-speech-recognition",
  {
    microphonePermission: "Allow RhemaFlow to use the microphone for voice declarations.",
    speechRecognitionPermission: "Allow RhemaFlow to use speech recognition for voice declarations.",
    androidSpeechServicePackages: ["com.google.android.googlequicksearchbox"],
  },
],
```

**Step 3: Commit**

```bash
git add package.json package-lock.json app.config.js
git commit -m "chore: add expo-speech-recognition dependency and config plugin"
```

---

### Task 2: Create useSpeechRecognition hook

**Files:**
- Create: `hooks/useSpeechRecognition.ts`

**Step 1: Write the hook**

```typescript
import { useState, useCallback } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => setIsListening(false));
  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript;
    if (text) setTranscript(text);
  });
  useSpeechRecognitionEvent("error", (event) => {
    console.warn("Speech recognition error:", event.error, event.message);
    setIsListening(false);
  });

  const startListening = useCallback(async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      console.warn("Speech recognition permissions not granted");
      return;
    }
    setTranscript("");
    ExpoSpeechRecognitionModule.start({
      lang: "en-US",
      interimResults: true,
      continuous: false,
    });
  }, []);

  const stopListening = useCallback(() => {
    ExpoSpeechRecognitionModule.stop();
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    clearTranscript,
  };
}
```

**Step 2: Commit**

```bash
git add hooks/useSpeechRecognition.ts
git commit -m "feat: add useSpeechRecognition hook wrapping expo-speech-recognition"
```

---

### Task 3: Create CategoryPills component

**Files:**
- Create: `components/CategoryPills.tsx`

**Step 1: Write the component**

```typescript
import { ScrollView, Pressable, Text, StyleSheet } from "react-native";
import * as Haptics from "expo-haptics";
import { MOOD_PRESETS } from "../constants/categories";
import { MoodPreset } from "../types";
import { COLORS } from "../constants/theme";

interface CategoryPillsProps {
  onSelect: (preset: MoodPreset) => void;
  disabled?: boolean;
}

export function CategoryPills({ onSelect, disabled }: CategoryPillsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {MOOD_PRESETS.map((preset) => (
        <Pressable
          key={preset.label}
          disabled={disabled}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onSelect(preset);
          }}
          style={styles.pill}
        >
          <Text style={styles.emoji}>{preset.emoji}</Text>
          <Text style={styles.label}>{preset.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    gap: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: COLORS.glass,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontFamily: "Lato-Bold",
    fontSize: 12,
    color: COLORS.white,
    letterSpacing: 0.3,
  },
});
```

**Step 2: Commit**

```bash
git add components/CategoryPills.tsx
git commit -m "feat: add horizontal CategoryPills component"
```

---

### Task 4: Create DeclarationInput component

**Files:**
- Create: `components/DeclarationInput.tsx`

This is the hero input field with golden glow, mic button (left), send button (right), and voice input integration.

**Step 1: Write the component**

```typescript
import { View, TextInput, Pressable, StyleSheet, Animated } from "react-native";
import { useState, useRef, useEffect } from "react";
import { Mic, ArrowRight, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { COLORS } from "../constants/theme";

interface DeclarationInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
  isListening: boolean;
  transcript: string;
  onMicPress: () => void;
}

export function DeclarationInput({
  onSubmit,
  isLoading,
  isListening,
  transcript,
  onMicPress,
}: DeclarationInputProps) {
  const [text, setText] = useState("");
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Sync transcript from speech recognition into text field
  useEffect(() => {
    if (transcript) setText(transcript);
  }, [transcript]);

  // Pulse animation for mic when listening
  useEffect(() => {
    if (isListening) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening, pulseAnim]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(trimmed);
    setText("");
  };

  const hasText = text.trim().length > 0;

  return (
    <View style={[styles.container, isListening && styles.containerListening]}>
      {/* Mic button */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onMicPress();
        }}
        disabled={isLoading}
        style={styles.micButton}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Mic
            size={20}
            color={isListening ? COLORS.divineGold : COLORS.slate400}
          />
        </Animated.View>
      </Pressable>

      {/* Text input */}
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Declare healing, breakthrough, favor..."
        placeholderTextColor={COLORS.slate700}
        editable={!isLoading}
        onSubmitEditing={handleSubmit}
        returnKeyType="send"
        multiline={false}
        style={styles.input}
      />

      {/* Send button */}
      <Pressable
        onPress={handleSubmit}
        disabled={isLoading || !hasText}
        style={[
          styles.sendButton,
          hasText && !isLoading
            ? styles.sendButtonActive
            : styles.sendButtonInactive,
        ]}
      >
        {isLoading ? (
          <Sparkles size={18} color="white" />
        ) : (
          <ArrowRight
            size={20}
            color={hasText ? COLORS.voidBlack : COLORS.slate700}
          />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.divineGold + "40",
    paddingRight: 8,
    paddingLeft: 4,
    shadowColor: COLORS.divineGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  containerListening: {
    borderColor: COLORS.divineGold + "80",
    shadowOpacity: 0.35,
    shadowRadius: 20,
  },
  micButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    color: COLORS.white,
    fontSize: 15,
    fontFamily: "Lato",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: COLORS.divineGold,
    shadowColor: COLORS.divineGold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  sendButtonInactive: {
    backgroundColor: COLORS.slate700,
  },
});
```

**Step 2: Commit**

```bash
git add components/DeclarationInput.tsx
git commit -m "feat: add DeclarationInput component with mic and golden glow"
```

---

### Task 5: Rewrite home screen layout

**Files:**
- Modify: `app/(tabs)/index.tsx`

This is the main integration task. Replace the scroll-based mood grid with the centered input layout.

**Step 1: Update imports**

Replace the `MoodInput` import with the new components:

```typescript
// Remove:
import { MoodInput } from "../../components/MoodInput";

// Add:
import { DeclarationInput } from "../../components/DeclarationInput";
import { CategoryPills } from "../../components/CategoryPills";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
```

**Step 2: Add the speech recognition hook inside HomeScreen**

After the existing `useAudio()` line, add:

```typescript
const {
  isListening,
  transcript,
  startListening,
  stopListening,
  clearTranscript,
} = useSpeechRecognition();
```

**Step 3: Add mic toggle handler**

```typescript
const handleMicPress = () => {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
};
```

**Step 4: Replace the pre-generation content area**

Replace the entire block from `<KeyboardAvoidingView>` through its closing tag (the `!content` branch, lines ~268-355) with the new centered layout:

```tsx
<KeyboardAvoidingView
  style={{ flex: 1 }}
  behavior={Platform.OS === "ios" ? "padding" : "height"}
  keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
>
  <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24 }}>
    {/* Greeting */}
    <Text
      style={{
        fontFamily: "Cinzel",
        fontSize: 26,
        color: "white",
        textAlign: "center",
        lineHeight: 36,
        marginBottom: 8,
      }}
    >
      What are you{"\n"}believing God for?
    </Text>
    <Text
      style={{
        fontFamily: "Lato",
        fontSize: 14,
        color: COLORS.slate400,
        textAlign: "center",
        marginBottom: 32,
      }}
    >
      Type, speak, or pick a topic below
    </Text>

    {/* Hero input */}
    <DeclarationInput
      onSubmit={(text) => {
        clearTranscript();
        handleCustomMood(text);
      }}
      isLoading={isLoading}
      isListening={isListening}
      transcript={transcript}
      onMicPress={handleMicPress}
    />
  </View>

  {/* Category pills at bottom */}
  <View style={{ paddingBottom: 16, gap: 16 }}>
    <CategoryPills
      onSelect={handleMoodSelect}
      disabled={isLoading}
    />

    {/* Usage counter for free users */}
    {!isPro && usage && (
      <Pressable
        onPress={() => {
          trackPaywallViewed("usage_counter");
          router.push("/(modals)/paywall" as any);
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          paddingVertical: 12,
          paddingHorizontal: 16,
          marginHorizontal: 20,
          borderRadius: 12,
          backgroundColor: COLORS.glass,
          borderWidth: 1,
          borderColor: COLORS.glassBorder,
        }}
      >
        <Text
          style={{
            fontFamily: "Lato",
            fontSize: 14,
            color: usage.canGenerate ? COLORS.slate400 : COLORS.fireOrange,
          }}
        >
          {usage.canGenerate
            ? `${usage.dailyLimit - usage.declarationsToday} of ${usage.dailyLimit} remaining today`
            : "Daily limit reached"}
        </Text>
        <Text
          style={{
            fontFamily: "Lato-Bold",
            fontSize: 12,
            color: COLORS.divineGold,
            textTransform: "uppercase",
          }}
        >
          Upgrade
        </Text>
      </Pressable>
    )}
  </View>
</KeyboardAvoidingView>
```

**Step 5: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat: redesign home screen with centered input-first agentic layout"
```

---

### Task 6: Clean up old MoodInput component

**Files:**
- Verify: `components/MoodInput.tsx` is no longer imported anywhere
- Delete: `components/MoodInput.tsx` (only if no other imports exist)

**Step 1: Search for remaining imports**

Run: `grep -r "MoodInput" --include="*.tsx" --include="*.ts" .`

If only the component file itself appears, delete it.

**Step 2: Delete and commit**

```bash
rm components/MoodInput.tsx
git add components/MoodInput.tsx
git commit -m "chore: remove unused MoodInput component"
```

---

### Task 7: Verify and test

**Step 1: TypeScript check**

Run: `npx tsc --noEmit`

Verify no new errors related to our changes.

**Step 2: Manual verification checklist**

- [ ] Home screen shows centered greeting + glowing input
- [ ] Typing text and pressing send triggers declaration generation
- [ ] Tapping mic icon starts speech recognition, mic pulses gold
- [ ] Speech transcript fills the input field
- [ ] Tapping a category pill triggers generation
- [ ] Free user usage counter displays correctly at bottom
- [ ] After generation, declaration card view is unchanged
- [ ] Fresh Fire button still works from declaration card view
- [ ] Keyboard avoidance works correctly on iOS

**Step 3: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address home screen redesign issues"
```
