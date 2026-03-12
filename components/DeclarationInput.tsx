import { useState, useEffect, useRef, useMemo } from "react";
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { Mic, ArrowRight, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { FONTS } from "../constants/theme";
import { useTheme } from "../hooks/useTheme";

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
  const { colors, shadows } = useTheme();
  const [text, setText] = useState("");
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  const styles = useMemo(() => createStyles(colors, shadows), [colors, shadows]);

  // Sync transcript into local text state
  useEffect(() => {
    if (transcript) {
      setText(transcript);
    }
  }, [transcript]);

  // Mic pulse animation when listening
  useEffect(() => {
    if (isListening) {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseRef.current.start();
    } else {
      pulseRef.current?.stop();
      pulseAnim.setValue(1);
    }

    return () => {
      pulseRef.current?.stop();
    };
  }, [isListening, pulseAnim]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onSubmit(trimmed);
    setText("");
  };

  const hasText = text.trim().length > 0;

  return (
    <View
      style={[
        styles.container,
        isListening ? styles.containerListening : styles.containerDefault,
      ]}
    >
      {/* Mic button */}
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onMicPress();
        }}
        style={styles.micButton}
        hitSlop={4}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <Mic
            size={20}
            color={isListening ? colors.accent : colors.textTertiary}
          />
        </Animated.View>
      </Pressable>

      {/* Text input */}
      <TextInput
        style={styles.input}
        placeholder="Declare healing, breakthrough, favor..."
        placeholderTextColor={colors.textTertiary}
        value={text}
        onChangeText={setText}
        returnKeyType="send"
        multiline={false}
        onSubmitEditing={handleSubmit}
        editable={!isLoading}
      />

      {/* Send button */}
      <Pressable
        onPress={handleSubmit}
        style={[
          styles.sendButton,
          isLoading
            ? styles.sendButtonLoading
            : hasText
              ? styles.sendButtonActive
              : styles.sendButtonInactive,
        ]}
        disabled={isLoading || !hasText}
      >
        {isLoading ? (
          <Sparkles size={20} color={colors.textInverse} />
        ) : (
          <ArrowRight
            size={20}
            color={hasText ? colors.textInverse : colors.textTertiary}
          />
        )}
      </Pressable>
    </View>
  );
}

const createStyles = (colors: any, shadows: any) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingHorizontal: 6,
      paddingVertical: 4,
      ...shadows.medium,
    },
    containerDefault: {
      shadowColor: colors.accent,
      shadowOpacity: 0.10,
    },
    containerListening: {
      shadowColor: colors.accent,
      shadowOpacity: 0.25,
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
      fontFamily: FONTS.body,
      fontSize: 15,
      color: colors.textPrimary,
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    sendButtonActive: {
      backgroundColor: colors.accent,
    },
    sendButtonInactive: {
      backgroundColor: colors.backgroundMuted,
    },
    sendButtonLoading: {
      backgroundColor: colors.backgroundMuted,
    },
  });
