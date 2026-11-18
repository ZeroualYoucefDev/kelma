export const appConfig = {
  name: "kelma",
  tagline: "Words that stick. Any language you choose.",
  description:
    "A playful language studio that builds every lesson from live translation, dictionary and open vocabulary data.",
  maxHearts: 5,
  heartRefillMinutes: 10,
} as const;

export type ShopItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  kind: "hearts" | "freeze" | "pro";
  icon: string;
};

/**
 * Store catalogue (product definitions, not lesson content). Vocabulary,
 * translations and audio always come from live providers in /src/services.
 */
export const shopItems: ShopItem[] = [
  {
    id: "heart-refill",
    name: "Heart refill",
    description: "Restore all five hearts and keep your run alive.",
    price: 350,
    kind: "hearts",
    icon: "❤️",
  },
  {
    id: "streak-freeze",
    name: "Streak freeze",
    description: "Protect your streak for one missed day.",
    price: 200,
    kind: "freeze",
    icon: "🧊",
  },
  {
    id: "pro-subscription",
    name: "Kelma Pro",
    description: "Unlimited hearts, 1.5× XP and every advanced drill. Pay in DZD with CIB or Edahabia.",
    price: 0,
    kind: "pro",
    icon: "👑",
  },
];

export const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3100";
