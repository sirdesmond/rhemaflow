export enum DeclarationCategory {
  HEALTH = "Health & Healing",
  WEALTH = "Wealth & Prosperity",
  IDENTITY = "Identity",
  SUCCESS = "Success & Victory",
  PROTECTION = "Protection & Fearlessness",
  WISDOM = "Wisdom & Guidance",
  MARRIAGE = "Marriage & Family",
  FAVOR = "Favor & Open Doors",
  PEACE = "Peace & Rest",
  CHILDREN = "Children & Fruitfulness",
  GENERAL = "General",
}

export type AtmosphereType =
  | "glory"
  | "warfare"
  | "peace"
  | "rise"
  | "selah"
  | "none";

export interface Declaration {
  id: string;
  text: string;
  category: DeclarationCategory;
  reference: string;
  scriptureText: string;
  atmosphere: AtmosphereType;
  imageUrl: string | null;
  audioUrl: string | null;
  createdAt: number;
  isFavorite: boolean;
  userId: string;
}

export interface GeneratedContent {
  text: string;
  reference: string;
  scriptureText: string;
  backgroundImageUrl: string | null;
  audioBase64: string | null;
  audioUrl: string | null;
}

export interface MoodPreset {
  emoji: string;
  label: string;
  category: DeclarationCategory;
  prompt: string;
}

export interface TrackMeta {
  id: AtmosphereType;
  label: string;
  description: string;
  bundled: boolean;
}

export type AgeRange = "18-24" | "25-34" | "35-44" | "45-54" | "55+";
export type LifeStage = "student" | "professional" | "business-owner" | "homemaker" | "retired" | "other";

export interface UserSettings {
  notificationsEnabled: boolean;
  notificationTime: string;
  notificationTimes: string[];
  defaultAtmosphere: AtmosphereType;
  defaultCategory: DeclarationCategory;
  gender: "male" | "female" | null;
  maritalStatus: "single" | "married" | null;
  voiceGender: "male" | "female";
  onboardingComplete: boolean;
  ageRange: AgeRange | null;
  lifeStages: LifeStage[];
  faithFocusAreas: DeclarationCategory[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: number;
  settings: UserSettings;
  subscriptionTier?: SubscriptionTier;
  streakData?: StreakData;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastDeclarationDate: string; // YYYY-MM-DD
  graceUsed: boolean;          // true if yesterday was missed but grace preserved streak
}

export type SubscriptionTier = "free" | "pro";

export interface UsageStatus {
  tier: SubscriptionTier;
  declarationsToday: number;
  dailyLimit: number;
  canGenerate: boolean;
}
