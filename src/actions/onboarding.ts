"use server";

import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/auth";
import { updatePlayer } from "@/lib/data";
import { isDailyGoal } from "@/lib/onboarding";
import { getLanguages } from "@/services/languages";

/**
 * Mandatory three-step setup. The native language, target language and daily
 * goal are all server-validated; nothing is pre-selected or inferred.
 */
export async function completeOnboarding(input: {
  nativeLanguage: string;
  targetLanguage: string;
  dailyGoalMinutes: number;
}): Promise<{ ok: boolean; message: string }> {
  try {
    const viewer = await requireViewer();

    const languages = await getLanguages();
    const native = languages.find((language) => language.code === input.nativeLanguage);
    const target = languages.find((language) => language.code === input.targetLanguage);

    if (!native) {
      return { ok: false, message: "Choose the language you already speak." };
    }
    if (!target) {
      return { ok: false, message: "Choose a language you want to learn." };
    }
    if (native.code === target.code) {
      return { ok: false, message: "Your target language must be different from your native language." };
    }
    if (!isDailyGoal(input.dailyGoalMinutes)) {
      return { ok: false, message: "Choose a daily goal." };
    }

    // Avatar is deliberately not touched here: it belongs to Profile/Settings.
    await updatePlayer(viewer.id, {
      sourceLanguage: native.code,
      targetLanguage: target.code,
      learningReason: null,
      dailyGoalMinutes: input.dailyGoalMinutes,
      onboardingCompleted: true,
    });

    revalidatePath("/");
    revalidatePath("/learn");
    revalidatePath("/profile");
    revalidatePath("/settings");
    revalidatePath("/leaderboard");

    return { ok: true, message: `${native.name} → ${target.name} is ready.` };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not save your choices.",
    };
  }
}
