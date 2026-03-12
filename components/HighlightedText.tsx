import React, { useMemo, useState, useEffect, useRef } from "react";
import { Text, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";
import { AudioProgress } from "../hooks/useAudio";
import { audioEngine } from "../services/audioEngine";

interface HighlightedTextProps {
  text: string;
  progress: AudioProgress | null;
}

/**
 * Renders declaration text with word-level highlighting during audio playback.
 *
 * Maps progress by character position (proportional to speech duration) then
 * snaps to the nearest word boundary. Characters correlate with spoken time
 * far better than word count since short words like "I" take less time than
 * long words like "understanding".
 *
 * Performance: 3 Text spans (spoken / current / unspoken), direct subscription
 * to audioEngine, only re-renders when the active word changes.
 */
function HighlightedTextInner({ text }: HighlightedTextProps) {
  const fullText = `\u201C${text}\u201D`;

  // Build word map: each word's character start/end and its midpoint
  const wordMap = useMemo(() => {
    const tokens = fullText.split(/(\s+)/);
    const map: { start: number; end: number; mid: number }[] = [];
    let charPos = 0;
    for (const token of tokens) {
      if (token.trim().length > 0) {
        const start = charPos;
        const end = charPos + token.length;
        map.push({ start, end, mid: (start + end) / 2 });
      }
      charPos += token.length;
    }
    return map;
  }, [fullText]);

  const totalChars = fullText.length;

  const [wordIndex, setWordIndex] = useState(-1);
  const lastIndexRef = useRef(-1);

  useEffect(() => {
    const onStatus = (position: number, duration: number) => {
      const ratio = Math.min(position / duration, 1);
      // Map time ratio to character position, then find which word contains it
      const charPos = ratio * totalChars;
      let idx = 0;
      for (let i = 0; i < wordMap.length; i++) {
        if (charPos >= wordMap[i].mid) {
          idx = i + 1;
        } else {
          break;
        }
      }
      // idx is now the first word we haven't fully passed — that's the current word
      idx = Math.min(idx, wordMap.length - 1);

      if (idx !== lastIndexRef.current) {
        lastIndexRef.current = idx;
        setWordIndex(idx);
      }
    };

    audioEngine.addProgressListener(onStatus);
    return () => audioEngine.removeProgressListener(onStatus);
  }, [wordMap, totalChars]);

  useEffect(() => {
    const onReset = () => {
      if (lastIndexRef.current !== -1) {
        lastIndexRef.current = -1;
        setWordIndex(-1);
      }
    };

    audioEngine.addResetListener(onReset);
    return () => audioEngine.removeResetListener(onReset);
  }, []);

  // No highlighting — single Text node
  if (wordIndex < 0 || wordMap.length === 0) {
    return <Text style={styles.base}>{fullText}</Text>;
  }

  const currentWord = wordMap[wordIndex];

  const spoken = fullText.slice(0, currentWord.start);
  const current = fullText.slice(currentWord.start, currentWord.end);
  const unspoken = fullText.slice(currentWord.end);

  return (
    <Text style={styles.base}>
      {spoken ? <Text style={styles.spoken}>{spoken}</Text> : null}
      <Text style={styles.current}>{current}</Text>
      {unspoken ? <Text style={styles.unspoken}>{unspoken}</Text> : null}
    </Text>
  );
}

export const HighlightedText = React.memo(HighlightedTextInner);

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
