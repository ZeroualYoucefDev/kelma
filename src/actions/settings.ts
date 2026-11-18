"use server";

import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/auth";
import { isAvatarId } from "@/lib/avatars";
import { getPlayer, updatePlayer } from "@/lib/data";
import { getLanguage } from "@/services/languages";
import { isDailyGoal } from "@/lib/onboarding";

/** Persist identity and learning-language preferences. */
export async function updateSettings(input: {
  name: string;
  sourceLanguage: string;
  targetLanguage: string;
  dailyGoalMinutes: number;
}): Promise<{ ok: boolean; message: string }> {
  const viewer = await requireViewer();
  const name = input.name.trim().slice(0, 60);
  if (name.length < 2) return { ok: false, message: "Please enter a valid name." };

  const [source, target] = await Promise.all([
    getLanguage(input.sourceLanguage),
    getLanguage(input.targetLanguage),
  ]);
  if (source.code === target.code) {
    return { ok: false, message: "Source and target languages must differ." };
  }
  if (!isDailyGoal(input.dailyGoalMinutes)) {
    return { ok: false, message: "Choose a valid daily goal." };
  }
  await updatePlayer(viewer.id, {
    name,
    sourceLanguage: source.code,
    targetLanguage: target.code,
    dailyGoalMinutes: input.dailyGoalMinutes,
  });

  revalidatePath("/settings");
  revalidatePath("/profile");
  revalidatePath("/learn");
  return { ok: true, message: "Settings saved." };
}

export async function updateProfile(input: { name: string }): Promise<{ ok: boolean; message: string }> {
  const viewer = await requireViewer();
  const name = input.name.trim().slice(0, 60);
  if (name.length < 2) return { ok: false, message: "Please enter a valid name." };
  await updatePlayer(viewer.id, { name });
  revalidatePath("/profile");
  return { ok: true, message: "Profile updated." };
}

/** Change the learner's chosen avatar from their profile or settings. */
export async function updateAvatar(avatar: string): Promise<{ ok: boolean; message: string }> {
  const viewer = await requireViewer();
  if (!isAvatarId(avatar)) return { ok: false, message: "Choose a valid sigil." };

  await updatePlayer(viewer.id, { avatar });
  revalidatePath("/profile");
  revalidatePath("/settings");
  revalidatePath("/learn");
  return { ok: true, message: "Sigil updated." };
}

export async function getPlayerSettings() {
  const viewer = await requireViewer();
  return getPlayer(viewer);
}
