import { useState, useCallback } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

export function useSpeechRecognition() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  useSpeechRecognitionEvent("start", () => {
    setIsListening(true);
  });

  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
  });

  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript ?? "";
    setTranscript(text);
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.warn("Speech recognition error:", event.error, event.message);
    setIsListening(false);
  });

  const startListening = useCallback(async () => {
    const { granted } =
      await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!granted) {
      console.warn("Speech recognition permissions not granted");
      return;
    }
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
