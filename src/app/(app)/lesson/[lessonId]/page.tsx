import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { LessonPlayer } from "@/components/app/lesson-player";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/lib/auth";
import { getPlayer, getProgressFor, isProUser } from "@/lib/data";
import { refillHearts } from "@/lib/gamification";
import { buildCurriculum, buildLesson } from "@/services/curriculum";

export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/");

  const [player, progress, isPro] = await Promise.all([
    getPlayer(viewer),
    getProgressFor(viewer.id),
    isProUser(viewer.id),
  ]);
  const hearts = refillHearts(progress.hearts, progress.heartsUpdatedAt);

  if (!isPro && hearts.hearts <= 0) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border border-coral/30 bg-coral/[0.07] p-8 text-center">
        <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-coral/15 text-3xl">
          💔
        </div>
        <h1 className="mt-5 font-display text-2xl font-extrabold">Lessons are locked</h1>
        <p className="mt-2 text-sm text-muted">
          Refill your hearts with gems or go Pro to keep this streak alive.
        </p>
        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button asChild variant="secondary">
            <Link href="/learn">Back to cards</Link>
          </Button>
          <Button asChild>
            <Link href="/shop">
              <Heart className="size-4" /> Refill hearts
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const curriculum = await buildCurriculum(player.sourceLanguage, player.targetLanguage).catch(
    () => null,
  );
  const unit = curriculum?.units.find((item) =>
    item.lessons.some((lesson) => lesson.id === lessonId),
  );
  if (!unit) notFound();

  const lesson = await buildLesson(
    player.sourceLanguage,
    player.targetLanguage,
    unit.id,
    lessonId,
  ).catch(() => null);

  if (!lesson) {
    return (
      <div className="mx-auto max-w-xl rounded-[2rem] border border-coral/30 bg-coral/[0.07] p-6 text-center">
        <h1 className="font-display text-xl font-extrabold text-coral">Live lesson unavailable</h1>
        <p className="mt-2 text-sm text-muted">
          A translation provider did not return enough data. Refresh to try fresh words.
        </p>
        <Button asChild className="mt-5">
          <Link href="/learn">Back to cards</Link>
        </Button>
      </div>
    );
  }

  return <LessonPlayer lesson={lesson} />;
}
