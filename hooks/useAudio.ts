import { useState, useCallback, useEffect } from "react";
import { audioEngine } from "../services/audioEngine";
import { AtmosphereType } from "../types";

export function useAudio() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [atmosphere, setAtmosphere] = useState<AtmosphereType>("glory");

  // Cleanup on unmount
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
  };
}
