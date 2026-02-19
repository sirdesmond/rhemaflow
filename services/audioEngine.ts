import { Audio, AVPlaybackStatus } from "expo-av";
import { File, Paths } from "expo-file-system";
import { AtmosphereType } from "../types";
import { BUNDLED_TRACK_ASSETS } from "../constants/tracks";

const FADE_STEP_MS = 50;
const MUSIC_VOL_DURING_SPEECH = 0.3;
const MUSIC_VOL_SWELL = 0.5;
const FADE_IN_MS = 2000;
const SWELL_MS = 1000;
const HOLD_MS = 3000;
const FADE_OUT_MS = 3000;

class AudioEngine {
  private speechSound: Audio.Sound | null = null;
  private musicSound: Audio.Sound | null = null;
  private fadeInterval: ReturnType<typeof setInterval> | null = null;
  private isActive = false;
  private isPaused = false;
  private onProgress: ((position: number, duration: number) => void) | null = null;

  /**
   * Configure the audio session for background playback in silent mode.
   */
  async init() {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
    });
  }

  /**
   * Orchestrates the full playback session:
   * 1. Writes WAV base64 to temp file
   * 2. Loads speech + music sounds
   * 3. Plays speech at full volume
   * 4. Fades music in behind speech
   * 5. When speech ends: music swells, holds, fades out
   */
  async playSession(
    audioBase64: string,
    atmosphere: AtmosphereType,
    onComplete: () => void,
    onProgress?: (position: number, duration: number) => void
  ) {
    await this.stopAll();
    this.isActive = true;
    this.onProgress = onProgress ?? null;
    await this.init();

    try {
      // 1. Write WAV base64 to a temp file (expo-av needs a URI)
      const speechFile = new File(Paths.cache, `speech_${Date.now()}.wav`);
      speechFile.write(audioBase64, { encoding: "base64" });
      const speechUri = speechFile.uri;

      // 2. Load speech sound
      const { sound: speechSound } = await Audio.Sound.createAsync(
        { uri: speechUri },
        { volume: 1.0, shouldPlay: false }
      );
      this.speechSound = speechSound;

      // 3. Load music track if atmosphere is not "none"
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

      // 4. Start speech playback
      await this.speechSound.playAsync();

      // 5. Fade music in over 2 seconds to background level
      if (this.musicSound) {
        await this.musicSound.playAsync();
        this.fadeVolume(this.musicSound, 0, MUSIC_VOL_DURING_SPEECH, FADE_IN_MS);
      }

      // 6. Listen for speech completion and report progress
      this.speechSound.setOnPlaybackStatusUpdate(
        (status: AVPlaybackStatus) => {
          if (!status.isLoaded) return;
          if (this.onProgress && status.durationMillis) {
            this.onProgress(status.positionMillis, status.durationMillis);
          }
          if (status.didJustFinish && this.isActive) {
            this.handleSpeechEnd(onComplete);
          }
        }
      );
    } catch (error) {
      console.error("AudioEngine playSession error:", error);
      await this.stopAll();
      onComplete();
    }
  }

  /**
   * Called when speech finishes:
   * - Swell music volume up
   * - Hold for a few seconds (cinematic landing)
   * - Fade out and cleanup
   */
  private async handleSpeechEnd(onComplete: () => void) {
    if (!this.isActive) return;

    if (this.musicSound) {
      // Swell music to 0.5 over 1 second
      await this.fadeVolume(
        this.musicSound,
        MUSIC_VOL_DURING_SPEECH,
        MUSIC_VOL_SWELL,
        SWELL_MS
      );

      // Hold the swell for 3 seconds
      if (this.isActive) {
        await this.delay(HOLD_MS);
      }

      // Fade out over 3 seconds
      if (this.isActive) {
        await this.fadeVolume(this.musicSound, MUSIC_VOL_SWELL, 0, FADE_OUT_MS);
      }
    }

    await this.stopAll();
    onComplete();
  }

  /**
   * Smoothly transitions a sound's volume from one level to another
   * over the specified duration using small incremental steps.
   */
  private fadeVolume(
    sound: Audio.Sound,
    from: number,
    to: number,
    durationMs: number
  ): Promise<void> {
    return new Promise((resolve) => {
      // Clear any existing fade
      if (this.fadeInterval) {
        clearInterval(this.fadeInterval);
        this.fadeInterval = null;
      }

      const totalSteps = Math.max(1, Math.floor(durationMs / FADE_STEP_MS));
      const increment = (to - from) / totalSteps;
      let currentVolume = from;
      let step = 0;

      this.fadeInterval = setInterval(async () => {
        step++;
        currentVolume += increment;

        // Final step — snap to target and resolve
        if (step >= totalSteps) {
          currentVolume = to;
          if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
          }
          try {
            await sound.setVolumeAsync(currentVolume);
          } catch {
            // Sound may have been unloaded
          }
          resolve();
          return;
        }

        // Clamp between 0 and 1
        const clampedVolume = Math.max(0, Math.min(1, currentVolume));
        try {
          await sound.setVolumeAsync(clampedVolume);
        } catch {
          // Sound may have been unloaded — stop fading
          if (this.fadeInterval) {
            clearInterval(this.fadeInterval);
            this.fadeInterval = null;
          }
          resolve();
        }
      }, FADE_STEP_MS);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Pause speech and music without unloading.
   */
  async pause() {
    if (!this.isActive || this.isPaused) return;
    this.isPaused = true;

    if (this.speechSound) {
      try { await this.speechSound.pauseAsync(); } catch {}
    }
    if (this.musicSound) {
      try { await this.musicSound.pauseAsync(); } catch {}
    }
  }

  /**
   * Resume paused speech and music.
   */
  async resume() {
    if (!this.isActive || !this.isPaused) return;
    this.isPaused = false;

    if (this.speechSound) {
      try { await this.speechSound.playAsync(); } catch {}
    }
    if (this.musicSound) {
      try { await this.musicSound.playAsync(); } catch {}
    }
  }

  /**
   * Whether a session is loaded (playing or paused).
   */
  get hasActiveSession(): boolean {
    return this.isActive && this.speechSound !== null;
  }

  /**
   * Stops all audio, unloads sounds, and cleans up.
   */
  async stopAll() {
    this.isActive = false;
    this.isPaused = false;
    this.onProgress = null;

    if (this.fadeInterval) {
      clearInterval(this.fadeInterval);
      this.fadeInterval = null;
    }

    if (this.speechSound) {
      try {
        await this.speechSound.stopAsync();
        await this.speechSound.unloadAsync();
      } catch {
        // Already stopped or unloaded
      }
      this.speechSound = null;
    }

    if (this.musicSound) {
      try {
        await this.musicSound.stopAsync();
        await this.musicSound.unloadAsync();
      } catch {
        // Already stopped or unloaded
      }
      this.musicSound = null;
    }
  }
}

export const audioEngine = new AudioEngine();
