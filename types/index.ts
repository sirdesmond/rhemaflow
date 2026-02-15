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

export interface UserSettings {
  notificationsEnabled: boolean;
  notificationTime: string;
  defaultAtmosphere: AtmosphereType;
  defaultCategory: DeclarationCategory;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: number;
  settings: UserSettings;
}
