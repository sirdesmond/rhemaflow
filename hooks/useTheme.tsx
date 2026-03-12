import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useColorScheme } from "react-native";
import {
  LIGHT_COLORS,
  DARK_COLORS,
  LIGHT_SHADOWS,
  DARK_SHADOWS,
  ThemeColors,
  ThemeShadows,
} from "../constants/theme";
import { getUserSettings, updateUserSettings } from "../services/settings";
import { useAuth } from "./useAuth";

type ThemeMode = "light" | "dark" | "system";

interface ThemeContextValue {
  colors: ThemeColors;
  shadows: ThemeShadows;
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: LIGHT_COLORS,
  shadows: LIGHT_SHADOWS,
  mode: "system",
  isDark: false,
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>("system");

  useEffect(() => {
    if (!user) return;
    getUserSettings().then((settings) => {
      if (settings.themeMode) {
        setModeState(settings.themeMode);
      }
    });
  }, [user]);

  const isDark =
    mode === "dark" || (mode === "system" && systemScheme === "dark");

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    updateUserSettings({ themeMode: newMode });
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        colors: isDark ? DARK_COLORS : LIGHT_COLORS,
        shadows: isDark ? DARK_SHADOWS : LIGHT_SHADOWS,
        mode,
        isDark,
        setMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
