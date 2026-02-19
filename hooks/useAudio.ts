import { useState, useCallback, useEffect, useRef } from "react";
import { audioEngine } from "../services/audioEngine";
import { AtmosphereType } from "../types";

export type AudioProgress = { position: number; duration: number };

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [atmosphere, setAtmosphere] = useState<AtmosphereType>("glory");
  const [progress, setProgress] = useState<AudioProgress | null>(null);
  const progressRef = useRef(setProgress);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      audioEngine.stopAll();
    };
  }, []);

  const play = useCallback(
    async (audioBase64: string) => {
      setIsPlaying(true);
      setProgress(null);
      await audioEngine.playSession(
        audioBase64,
        atmosphere,
        () => {
          setIsPlaying(false);
          setProgress(null);
        },
        (position, duration) => {
          progressRef.current({ position, duration });
        }
      );
    },
    [atmosphere]
  );

  const stop = useCallback(async () => {
    await audioEngine.stopAll();
    setIsPlaying(false);
    setProgress(null);
  }, []);

  const togglePlayback = useCallback(
    async (audioBase64: string | null) => {
      if (isPlaying) {
        // Pause the current session instead of stopping
        await audioEngine.pause();
        setIsPlaying(false);
      } else if (audioEngine.hasActiveSession) {
        // Resume a paused session
        await audioEngine.resume();
        setIsPlaying(true);
      } else if (audioBase64) {
        // Start a new session
        await play(audioBase64);
      }
    },
    [isPlaying, play]
  );

  const cycleAtmosphere = useCallback(() => {
    const modes: AtmosphereType[] = [
      "glory",
      "warfare",
      "peace",
      "rise",
      "selah",
      "none",
    ];
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
    progress,
  };
}
