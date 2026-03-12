import React, { useMemo, useState, useEffect, useRef } from "react";
import { Text, StyleSheet } from "react-native";
import { COLORS } from "../constants/theme";
import { AudioProgress } from "../hooks/useAudio";
import { audioEngine, WordTiming } from "../services/audioEngine";

const LOOK_AHEAD_MS = 150;

interface HighlightedTextProps {
  text: string;
  progress: AudioProgress | null;
}

/** Strip curly quotes and common punctuation for fuzzy word matching. */
function normalize(s: string): string {
  return s.replace(/[\u201C\u201D".,!?;:—\-'"()]/g, "").toLowerCase();
}

/**
 * Build a mapping from alignment word indices to display word indices.
 * Uses greedy forward matching with normalized comparison so curly quotes,
 * punctuation differences, etc. don't cause drift.
 */
function buildAlignmentMap(
  alignment: WordTiming[],
  displayWords: { start: number; end: number }[],
  fullText: string
): number[] {
  const map: number[] = [];
  let dIdx = 0;

  for (let aIdx = 0; aIdx < alignment.length; aIdx++) {
    const aNorm = normalize(alignment[aIdx].word);
    let bestMatch = Math.min(dIdx, displayWords.length - 1);

    // Search forward from current display position for best match
    for (let j = dIdx; j < displayWords.length; j++) {
      const dWord = fullText.slice(displayWords[j].start, displayWords[j].end);
      if (normalize(dWord) === aNorm) {
        bestMatch = j;
        dIdx = j + 1; // advance past this match
        break;
      }
      // If we've searched too far ahead, settle for current position
      if (j - dIdx > 2) {
        bestMatch = Math.min(dIdx, displayWords.length - 1);
        dIdx = Math.min(dIdx + 1, displayWords.length);
        break;
      }
    }

    map.push(bestMatch);
  }

  return map;
}

/**
 * Renders declaration text with word-level highlighting during audio playback.
 *
 * Uses real word-level timestamps from ElevenLabs when available for precise
 * sync. Falls back to punctuation-weighted estimation for cached audio.
 *
 * Performance: 3 Text spans (spoken / current / unspoken), direct subscription
 * to audioEngine, only re-renders when the active word changes.
 */
function HighlightedTextInner({ text }: HighlightedTextProps) {
  const fullText = `\u201C${text}\u201D`;

  // Build display word map: character start/end positions for each word in fullText
  const displayWords = useMemo(() => {
    const tokens = fullText.split(/(\s+)/);
    const words: { start: number; end: number }[] = [];
    let charPos = 0;
    for (const token of tokens) {
      if (token.trim().length > 0) {
        words.push({ start: charPos, end: charPos + token.length });
      }
      charPos += token.length;
    }
    return words;
  }, [fullText]);

  // Fallback: weighted estimation for when timestamps aren't available
  const { weightThresholds, totalWeight } = useMemo(() => {
    const tokens = fullText.split(/(\s+)/);
    const thresholds: number[] = [];
    let cumulative = 0;
    for (const token of tokens) {
      if (token.trim().length > 0) {
        let weight = token.length;
        if (/[.!?]/.test(token.slice(-1))) weight += 6;
        else if (/[,;:\u2014]/.test(token.slice(-1))) weight += 3;
        cumulative += weight;
        thresholds.push(cumulative);
      }
    }
    return { weightThresholds: thresholds, totalWeight: cumulative };
  }, [fullText]);

  const [wordIndex, setWordIndex] = useState(-1);
  const lastIndexRef = useRef(-1);
  // Cache the alignment map so we only rebuild when alignment changes
  const alignmentMapRef = useRef<{ alignment: WordTiming[]; map: number[] } | null>(null);

  useEffect(() => {
    const onStatus = (positionMs: number, durationMs: number) => {
      const alignment = audioEngine.alignment;
      let displayIdx: number;

      if (alignment && alignment.length > 0) {
        // Build or reuse alignment-to-display mapping
        if (
          !alignmentMapRef.current ||
          alignmentMapRef.current.alignment !== alignment
        ) {
          alignmentMapRef.current = {
            alignment,
            map: buildAlignmentMap(alignment, displayWords, fullText),
          };
        }
        const map = alignmentMapRef.current.map;

        // Apply look-ahead: subtract offset so highlight leads slightly
        const posSec = Math.max(0, positionMs - LOOK_AHEAD_MS) / 1000;

        // Binary search for the last alignment word where posSec >= start
        let lo = 0;
        let hi = alignment.length - 1;
        let alignIdx = 0;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (alignment[mid].start <= posSec) {
            alignIdx = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }

        // Map alignment index to display word index
        displayIdx = map[alignIdx] ?? Math.min(alignIdx, displayWords.length - 1);
      } else {
        // Fallback: weighted character estimation
        const ratio = Math.min(positionMs / durationMs, 1);
        const target = ratio * totalWeight;
        let lo = 0;
        let hi = weightThresholds.length - 1;
        while (lo < hi) {
          const mid = (lo + hi) >> 1;
          if (weightThresholds[mid] <= target) {
            lo = mid + 1;
          } else {
            hi = mid;
          }
        }
        displayIdx = Math.min(lo, displayWords.length - 1);
      }

      if (displayIdx !== lastIndexRef.current) {
        lastIndexRef.current = displayIdx;
        setWordIndex(displayIdx);
      }
    };

    audioEngine.addProgressListener(onStatus);
    return () => audioEngine.removeProgressListener(onStatus);
  }, [displayWords, fullText, weightThresholds, totalWeight]);

  useEffect(() => {
    const onReset = () => {
      if (lastIndexRef.current !== -1) {
        lastIndexRef.current = -1;
        setWordIndex(-1);
      }
      alignmentMapRef.current = null;
    };

    audioEngine.addResetListener(onReset);
    return () => audioEngine.removeResetListener(onReset);
  }, []);

  // No highlighting — single Text node
  if (wordIndex < 0 || displayWords.length === 0) {
    return <Text style={styles.base}>{fullText}</Text>;
  }

  const currentWord = displayWords[wordIndex];

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
