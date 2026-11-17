import { redirect } from "next/navigation";
import { AppShell } from "@/components/app/app-shell";
import { getViewer } from "@/lib/auth";
import { getPlayer, getProgressFor } from "@/lib/data";
import { refillHearts } from "@/lib/gamification";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  if (!viewer) redirect("/sign-in");
  if (!viewer.verified) redirect("/verify");

  const [player, progress] = await Promise.all([
    getPlayer(viewer),
    getProgressFor(viewer.id),
  ]);

  const hearts = refillHearts(progress.hearts, progress.heartsUpdatedAt);

  return (
    <AppShell
      stats={{
        name: player.name,
        plan: player.plan,
        xp: progress.xp,
        gems: progress.gems,
        hearts: hearts.hearts,
        streak: progress.streak,
        targetLanguage: player.targetLanguage,
        isPreview: viewer.isPreview,
      }}
    >
      {children}
    </AppShell>
  );
}
