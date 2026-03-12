export const COLORS = {
  // ── Light / Warm tokens ──
  background: "#FBF8F3",
  backgroundWarm: "#F5EFE6",
  backgroundMuted: "#EDE7DC",
  surface: "#FFFFFF",
  surfacePressed: "#F5F0EA",

  textPrimary: "#1C1917",
  textSecondary: "#57534E",
  textTertiary: "#A8A29E",
  textInverse: "#FFFFFF",

  accent: "#D4954A",
  accentLight: "#F5DEB3",
  accentMuted: "rgba(212,149,74,0.12)",

  amber: "#E8A317",
  amberLight: "rgba(232,163,23,0.10)",

  purple: "#8B5CF6",
  purpleLight: "#EDE9FE",
  purpleMuted: "rgba(139,92,246,0.10)",

  border: "#E7E0D6",
  borderLight: "#F0EAE0",

  error: "#DC2626",
  errorLight: "#FEF2F2",

  // ── Legacy tokens (kept for DeclarationCard / ShareCard / dark contexts) ──
  electricPurple: "#7C3AED",
  deepPurple: "#4C1D95",
  fireOrange: "#F59E0B",
  divineGold: "#FBBF24",
  warmGold: "#D4A854",
  voidBlack: "#0F172A",
  slate900: "#1E293B",
  slate800: "#1A2332",
  slate700: "#334155",
  slate400: "#94A3B8",
  white: "#FFFFFF",
  glass: "rgba(255,255,255,0.06)",
  glassBorder: "rgba(255,255,255,0.12)",
} as const;

export const SHADOWS = {
  small: {
    shadowColor: "#B8A68E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  medium: {
    shadowColor: "#B8A68E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 4,
  },
  large: {
    shadowColor: "#B8A68E",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const FONTS = {
  display: "Cinzel",
  heading: "PlayfairDisplay",
  headingItalic: "PlayfairDisplay-Italic",
  body: "Lato",
  bodyBold: "Lato-Bold",
} as const;

export const LOADING_MESSAGES = [
  "Preparing your declaration...",
  "Searching the scriptures...",
  "The Spirit is moving...",
  "Downloading heaven\u2019s frequency...",
  "Igniting the fire...",
  "Aligning your words with heaven...",
];
