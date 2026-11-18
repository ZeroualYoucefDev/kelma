/**
 * Curated learner avatars. IDs are persisted in SQLite; labels and artwork are
 * presentation-only so changing the artwork later never breaks saved profiles.
 */
export const AVATARS = [
  { id: "fox", label: "Fox", emoji: "🦊", gradient: "from-[#f2a65a] to-[#c96f35]" },
  { id: "owl", label: "Owl", emoji: "🦉", gradient: "from-[#b9a7f3] to-[#6f5bc4]" },
  { id: "panda", label: "Panda", emoji: "🐼", gradient: "from-[#d7dee8] to-[#8e9bab]" },
  { id: "tiger", label: "Tiger", emoji: "🐯", gradient: "from-[#f7c86a] to-[#d98b3d]" },
  { id: "frog", label: "Frog", emoji: "🐸", gradient: "from-[#8fd6a4] to-[#3f9b76]" },
  { id: "koala", label: "Koala", emoji: "🐨", gradient: "from-[#a9c3d6] to-[#5d7f9b]" },
  { id: "raccoon", label: "Raccoon", emoji: "🦝", gradient: "from-[#c5b4a6] to-[#77645a]" },
  { id: "penguin", label: "Penguin", emoji: "🐧", gradient: "from-[#7fd3cf] to-[#3a8f96]" },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];

export const DEFAULT_AVATAR: AvatarId = "fox";

export function isAvatarId(value: string | null | undefined): value is AvatarId {
  return AVATARS.some((avatar) => avatar.id === value);
}

export function getAvatar(value: string | null | undefined) {
  return AVATARS.find((avatar) => avatar.id === value) ?? AVATARS[0];
}
