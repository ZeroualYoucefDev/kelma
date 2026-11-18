import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { getViewer } from "@/lib/auth";
import { getPlayer, getProgressFor } from "@/lib/data";
import { refillHearts } from "@/lib/gamification";
import { getLanguage } from "@/services/languages";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  if (!viewer.verified) redirect("/verify");

  const [player, progress] = await Promise.all([
    getPlayer(viewer),
    getProgressFor(viewer.id),
  ]);

  if (!player.onboardingCompleted) redirect("/onboarding");

  const hearts = refillHearts(progress.hearts, progress.heartsUpdatedAt);
  const target = await getLanguage(player.targetLanguage);

  return (
    <AppShell
      stats={{
        name: player.name,
        avatar: player.avatar,
        plan: player.plan,
        xp: progress.xp,
        gems: progress.gems,
        hearts: hearts.hearts,
        streak: progress.streak,
        targetLanguage: { code: target.code, name: target.name },
        isPreview: viewer.isPreview,
      }}
    >
      {children}
    </AppShell>
  );
}
