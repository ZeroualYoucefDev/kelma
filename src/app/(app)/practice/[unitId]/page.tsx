import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Sparkles } from "lucide-react";
import { LessonPlayer } from "@/components/app/lesson-player";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { getPlayer } from "@/lib/data";
import { buildCurriculum, buildLesson } from "@/services/curriculum";

export const dynamic = "force-dynamic";

/** Free heart practice: mistakes cost nothing, finishing earns one heart. */
export default async function PracticePage({
  params,
}: {
  params: Promise<{ unitId: string }>;
}) {
  const { unitId } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/");

  const player = await getPlayer(viewer);
  const curriculum = await buildCurriculum(player.sourceLanguage, player.targetLanguage).catch(
    () => null,
  );
  const unit = curriculum?.units.find((item) => item.id === unitId);
  if (!unit || unit.lessons.length === 0) notFound();

  const lesson = await buildLesson(
    player.sourceLanguage,
    player.targetLanguage,
    unit.id,
    unit.lessons[0].id,
  ).catch(() => null);

  if (!lesson) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border border-coral/30 bg-coral/[0.07] p-8 text-center">
        <h1 className="font-display text-xl font-extrabold text-coral">Practice unavailable</h1>
        <p className="mt-2 text-sm text-muted">
          A live provider did not return enough words. Refresh to try another round.
        </p>
        <Button asChild className="mt-5">
          <Link href="/learn">Back to cards</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-center gap-3">
        <span className="pill border-teal/30 bg-teal/10 text-teal">
          <Sparkles className="size-3.5" /> Unit practice
        </span>
        <p className="text-sm text-muted">
          No hearts lost here. Finish the round to earn a heart back.
        </p>
      </div>
      <LessonPlayer lesson={lesson} practice={{ unitId: unit.id }} />
    </div>
  );
}
