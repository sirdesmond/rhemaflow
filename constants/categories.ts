import { DeclarationCategory, MoodPreset } from "../types";

export const MOOD_PRESETS: MoodPreset[] = [
  {
    emoji: "\u{1F915}",
    label: "Feeling Sick",
    category: DeclarationCategory.HEALTH,
    prompt:
      "I am fighting sickness. Give me a declaration of healing and divine health.",
  },
  {
    emoji: "\u{1F4C9}",
    label: "Financial Lack",
    category: DeclarationCategory.WEALTH,
    prompt:
      "I am facing financial lack. Give me a declaration of abundance and provision.",
  },
  {
    emoji: "\u{1F628}",
    label: "Afraid",
    category: DeclarationCategory.PROTECTION,
    prompt:
      "I feel afraid and anxious. Give me a declaration of safety and divine protection.",
  },
  {
    emoji: "\u{1F614}",
    label: "Depressed",
    category: DeclarationCategory.IDENTITY,
    prompt: "I feel low and worthless. Remind me of who I am in Christ.",
  },
  {
    emoji: "\u{1F6D1}",
    label: "Stuck/Failed",
    category: DeclarationCategory.SUCCESS,
    prompt:
      "I feel like a failure. Give me a declaration of victory and success.",
  },
  {
    emoji: "\u{1F914}",
    label: "Confused",
    category: DeclarationCategory.WISDOM,
    prompt:
      "I need direction. Give me a declaration of wisdom and clarity.",
  },
];

export const CATEGORY_GRADIENTS: Record<DeclarationCategory, [string, string]> =
  {
    [DeclarationCategory.HEALTH]: ["#059669", "#10B981"],
    [DeclarationCategory.WEALTH]: ["#D97706", "#FBBF24"],
    [DeclarationCategory.IDENTITY]: ["#7C3AED", "#A78BFA"],
    [DeclarationCategory.SUCCESS]: ["#DC2626", "#F59E0B"],
    [DeclarationCategory.PROTECTION]: ["#2563EB", "#7C3AED"],
    [DeclarationCategory.WISDOM]: ["#0891B2", "#06B6D4"],
    [DeclarationCategory.GENERAL]: ["#4C1D95", "#7C3AED"],
  };

export const CATEGORY_IMAGE_THEMES: Record<DeclarationCategory, string> = {
  [DeclarationCategory.HEALTH]:
    "rushing living water, emerald fire, radiant vitality, supernatural healing light",
  [DeclarationCategory.WEALTH]:
    "gold bullion texture, overflowing cornucopia, purple royal velvet, diamond refraction",
  [DeclarationCategory.PROTECTION]:
    "lion roaring, burning shield, blue fire, fortress wall, angelic feathers",
  [DeclarationCategory.SUCCESS]:
    "summit of a mountain, sunrise breaking through storm clouds, eagle wings, lightning",
  [DeclarationCategory.IDENTITY]:
    "golden crown, royal scepter, intense spotlight, galaxy background",
  [DeclarationCategory.WISDOM]:
    "burning bush, ancient scroll glowing, neural network of light, starry cosmos",
  [DeclarationCategory.GENERAL]:
    "epic divine light, exploding golden rays, dramatic cinematic lighting",
};

export const STATIC_DECLARATIONS = [
  {
    id: "h1",
    category: DeclarationCategory.HEALTH,
    text: "I refuse to be sick. I refuse to accommodate sickness in my body; I refuse to accommodate disease in my body. Every disease germ and every virus that touches my body dies instantly in the name of Jesus.",
    reference: "Isaiah 53:5",
    scriptureText:
      "But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.",
  },
  {
    id: "w1",
    category: DeclarationCategory.WEALTH,
    text: "I am not the poor trying to get rich; I am the rich discovering what belongs to me. Money cometh to me now. I'm a money magnet. My needs are met; I have plenty more to put in store.",
    reference: "Philippians 4:19",
    scriptureText:
      "But my God shall supply all your need according to his riches in glory by Christ Jesus.",
  },
  {
    id: "i1",
    category: DeclarationCategory.IDENTITY,
    text: "I am an ambassador, a royal ambassador of the Kingdom of God. I am a new creation. I am superior to Satan. I am the glory of God. Look at me, I am shining.",
    reference: "2 Corinthians 5:20",
    scriptureText:
      "Now then we are ambassadors for Christ, as though God did beseech you by us: we pray you in Christ's stead, be ye reconciled to God.",
  },
  {
    id: "s1",
    category: DeclarationCategory.SUCCESS,
    text: "I am a success and a victor in everything that concerns my life. I do not fail. I cannot think failure... Failure is not an option; it doesn't work with my system.",
    reference: "Joshua 1:8",
    scriptureText:
      "This book of the law shall not depart out of thy mouth; but thou shalt meditate therein day and night, that thou mayest observe to do according to all that is written therein: for then thou shalt make thy way prosperous, and then thou shalt have good success.",
  },
  {
    id: "p1",
    category: DeclarationCategory.PROTECTION,
    text: "No weapon formed against me shall prosper... No evil will befall me, neither shall any plague come nigh my dwelling. The Lord has given His angels charge over me.",
    reference: "Psalm 91:10-11",
    scriptureText:
      "There shall no evil befall thee, neither shall any plague come nigh thy dwelling. For he shall give his angels charge over thee, to keep thee in all thy ways.",
  },
  {
    id: "wd1",
    category: DeclarationCategory.WISDOM,
    text: "I do not lack wisdom. I've got the wisdom of God in me. I have an excellent spirit. When I speak, I dissolve doubts; I explain hard sentences.",
    reference: "James 1:5",
    scriptureText:
      "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.",
  },
];
