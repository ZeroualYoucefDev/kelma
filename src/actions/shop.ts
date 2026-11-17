"use server";

import { revalidatePath } from "next/cache";
import { requireViewer } from "@/lib/auth";
import { shopItems } from "@/lib/config";
import { getProgressFor, saveProgress } from "@/lib/data";
import { MAX_HEARTS } from "@/lib/gamification";

/** Spend gems on a consumable. Pro checkout is handled by /api/checkout/chargily. */
export async function purchaseItem(itemId: string): Promise<{ ok: boolean; message: string }> {
  const viewer = await requireViewer();
  const item = shopItems.find((entry) => entry.id === itemId && entry.kind !== "pro");
  if (!item) return { ok: false, message: "Unknown item." };

  const current = await getProgressFor(viewer.id);
  if (current.gems < item.price) {
    return { ok: false, message: "Not enough gems. Finish a lesson to earn more." };
  }

  if (item.kind === "hearts" && current.hearts >= MAX_HEARTS) {
    return { ok: false, message: "Your hearts are already full." };
  }

  await saveProgress(viewer.id, {
    ...current,
    gems: current.gems - item.price,
    hearts: item.kind === "hearts" ? MAX_HEARTS : current.hearts,
    heartsUpdatedAt: item.kind === "hearts" ? new Date() : current.heartsUpdatedAt,
    streakFreezes: item.kind === "freeze" ? current.streakFreezes + 1 : current.streakFreezes,
  });

  revalidatePath("/shop");
  revalidatePath("/learn");
  revalidatePath("/profile");

  return { ok: true, message: `${item.name} added to your account.` };
}
