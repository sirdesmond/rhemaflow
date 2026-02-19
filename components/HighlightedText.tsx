import { Text, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";
import { AudioProgress } from "../hooks/useAudio";

interface HighlightedTextProps {
  text: string;
  progress: AudioProgress | null;
}

export function HighlightedText({ text, progress }: HighlightedTextProps) {
  const fullText = `\u201C${text}\u201D`;
  const words = fullText.split(/(\s+)/);

  if (!progress || !progress.duration) {
    return <Text style={styles.base}>{fullText}</Text>;
  }

  const ratio = Math.min(progress.position / progress.duration, 1);
  // Only count actual words (not whitespace) for index calculation
  const wordTokens = words.filter((w) => w.trim().length > 0);
  const currentWordIndex = Math.floor(ratio * wordTokens.length);

  let wordCount = 0;
  return (
    <Text style={styles.base}>
      {words.map((token, i) => {
        if (token.trim().length === 0) {
          return token;
        }
        const idx = wordCount;
        wordCount++;

        let style;
        if (idx < currentWordIndex) {
          style = styles.spoken;
        } else if (idx === currentWordIndex) {
          style = styles.current;
        } else {
          style = styles.unspoken;
        }

        return (
          <Text key={i} style={style}>
            {token}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: "Cinzel",
    fontSize: 22,
    color: "white",
    textAlign: "center",
    lineHeight: 34,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  spoken: {
    color: "white",
  },
  current: {
    color: COLORS.divineGold,
    textShadowColor: "rgba(251,191,36,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  unspoken: {
    color: "rgba(255,255,255,0.4)",
  },
});
