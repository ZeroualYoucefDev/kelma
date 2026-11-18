/**
 * Custom sigils. IDs are persisted in SQLite; labels and artwork are
 * presentation-only so changing the artwork later never breaks saved profiles.
 */
export const AVATARS = [
  { id: "fox", label: "Ember", gradient: "from-[#FF8A5B] to-[#C2435F]" },
  { id: "owl", label: "Halo", gradient: "from-[#A89BFF] to-[#5B49B8]" },
  { id: "panda", label: "Echo", gradient: "from-[#DDE6F2] to-[#7890B2]" },
  { id: "tiger", label: "Solstice", gradient: "from-[#FFD166] to-[#E07A3F]" },
  { id: "frog", label: "Verdant", gradient: "from-[#9BE7A4] to-[#2F9C74]" },
  { id: "koala", label: "Tide", gradient: "from-[#8ED8E8] to-[#397AA6]" },
  { id: "raccoon", label: "Dusk", gradient: "from-[#C9B6FF] to-[#6B5AA6]" },
  { id: "penguin", label: "Nacre", gradient: "from-[#B8F1E8] to-[#3E8E8C]" },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];

export const DEFAULT_AVATAR: AvatarId = "fox";

export function isAvatarId(value: string | null | undefined): value is AvatarId {
  return AVATARS.some((avatar) => avatar.id === value);
}

export function getAvatar(value: string | null | undefined) {
  return AVATARS.find((avatar) => avatar.id === value) ?? AVATARS[0];
}
