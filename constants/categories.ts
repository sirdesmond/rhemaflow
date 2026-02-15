import { ImageSourcePropType } from "react-native";
import { DeclarationCategory, MoodPreset } from "../types";

export const MOOD_PRESETS: MoodPreset[] = [
  {
    emoji: "\u{2764}\u{FE0F}\u{200D}\u{1F525}",
    label: "Health & Healing",
    category: DeclarationCategory.HEALTH,
    prompt:
      "I am declaring divine health over my body. Give me a powerful declaration of healing and wholeness.",
  },
  {
    emoji: "\u{1F451}",
    label: "Wealth & Prosperity",
    category: DeclarationCategory.WEALTH,
    prompt:
      "I am declaring abundance and financial overflow. Give me a declaration of wealth and provision.",
  },
  {
    emoji: "\u{1F3C6}",
    label: "Success",
    category: DeclarationCategory.SUCCESS,
    prompt:
      "I am declaring success in everything I put my hands to. Give me a declaration of breakthrough and achievement.",
  },
  {
    emoji: "\u{1F981}",
    label: "Fearless",
    category: DeclarationCategory.PROTECTION,
    prompt:
      "I am bold and fearless. Give me a declaration of courage, protection, and divine covering.",
  },
  {
    emoji: "\u{1F4A1}",
    label: "Wisdom",
    category: DeclarationCategory.WISDOM,
    prompt:
      "I walk in divine wisdom and clarity. Give me a declaration of supernatural insight and direction.",
  },
  {
    emoji: "\u{2694}\u{FE0F}",
    label: "Victory",
    category: DeclarationCategory.IDENTITY,
    prompt:
      "I am more than a conqueror. Give me a declaration of total victory and dominion in Christ.",
  },
  {
    emoji: "\u{1F48D}",
    label: "Marriage & Family",
    category: DeclarationCategory.MARRIAGE,
    prompt:
      "I am declaring God's blessing over my marriage and family. Give me a declaration of love, unity, and divine covering over my home.",
  },
  {
    emoji: "\u{1F6AA}",
    label: "Favor & Open Doors",
    category: DeclarationCategory.FAVOR,
    prompt:
      "I walk in supernatural favor. Give me a declaration of divine connections, open doors, and uncommon opportunities.",
  },
  {
    emoji: "\u{1F54A}\u{FE0F}",
    label: "Peace & Rest",
    category: DeclarationCategory.PEACE,
    prompt:
      "I declare the peace of God that passes all understanding. Give me a declaration of rest, calm, and freedom from anxiety.",
  },
  {
    emoji: "\u{1F476}",
    label: "Children & Fruitfulness",
    category: DeclarationCategory.CHILDREN,
    prompt:
      "I declare fruitfulness in every area of my life. Give me a declaration of children, multiplication, and generational blessing.",
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
    [DeclarationCategory.MARRIAGE]: ["#E11D48", "#FB7185"],
    [DeclarationCategory.FAVOR]: ["#7C3AED", "#FBBF24"],
    [DeclarationCategory.PEACE]: ["#1D4ED8", "#93C5FD"],
    [DeclarationCategory.CHILDREN]: ["#EA580C", "#FCD34D"],
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
  [DeclarationCategory.MARRIAGE]:
    "two golden rings intertwined, rose petals, warm candlelight, covenant flame, romantic sunset",
  [DeclarationCategory.FAVOR]:
    "massive ornate doors opening with golden light pouring through, red carpet, divine spotlight, keys",
  [DeclarationCategory.PEACE]:
    "still waters, white dove in flight, serene blue sky, olive branch, gentle morning mist",
  [DeclarationCategory.CHILDREN]:
    "blooming garden, fruit-laden tree of life, golden seeds sprouting, nurturing warm light, rainbow",
  [DeclarationCategory.GENERAL]:
    "epic divine light, exploding golden rays, dramatic cinematic lighting",
};

export const CATEGORY_BACKGROUNDS: Record<DeclarationCategory, ImageSourcePropType> = {
  [DeclarationCategory.HEALTH]: require("../assets/images/categories/health.jpg"),
  [DeclarationCategory.WEALTH]: require("../assets/images/categories/wealth.jpg"),
  [DeclarationCategory.IDENTITY]: require("../assets/images/categories/identity.jpg"),
  [DeclarationCategory.SUCCESS]: require("../assets/images/categories/success.jpg"),
  [DeclarationCategory.PROTECTION]: require("../assets/images/categories/protection.jpg"),
  [DeclarationCategory.WISDOM]: require("../assets/images/categories/wisdom.jpg"),
  [DeclarationCategory.MARRIAGE]: require("../assets/images/categories/marriage.jpg"),
  [DeclarationCategory.FAVOR]: require("../assets/images/categories/favor.jpg"),
  [DeclarationCategory.PEACE]: require("../assets/images/categories/peace.jpg"),
  [DeclarationCategory.CHILDREN]: require("../assets/images/categories/children.jpg"),
  [DeclarationCategory.GENERAL]: require("../assets/images/categories/general.jpg"),
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
