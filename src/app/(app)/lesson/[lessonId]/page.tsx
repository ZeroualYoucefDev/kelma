import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LessonPlayer } from "@/components/app/lesson-player";
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
  if (!viewer) return null;

  const [player, progress] = await Promise.all([
    getPlayer(viewer),
    getProgressFor(viewer.id),
  ]);

  const curriculum = await buildCurriculum(player.sourceLanguage, player.targetLanguage).catch(() => null);
  const unit = curriculum?.units.find((item) => item.lessons.some((lesson) => lesson.id === lessonId));
  if (!unit) notFound();

  const lesson = await buildLesson(
    player.sourceLanguage,
    player.targetLanguage,
    unit.id,
    lessonId,
  ).catch(() => null);

  if (!lesson) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-coral/30 bg-coral/8 p-6 text-center">
        <h1 className="font-display text-xl font-bold text-coral">Live lesson unavailable</h1>
        <p className="mt-2 text-sm text-slate-300">
          A translation provider did not return enough data. Refresh to try fresh words.
        </p>
        <Button asChild className="mt-5">
          <Link href="/learn">Back to path</Link>
        </Button>
      </div>
    );
  }

  const hearts = refillHearts(progress.hearts, progress.heartsUpdatedAt);

  return (
    <LessonPlayer
      lesson={lesson}
      hearts={hearts.hearts}
      isPro={viewer.isPreview ? false : await isProUser(viewer.id)}
    />
  );
}
