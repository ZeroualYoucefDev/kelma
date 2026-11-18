import Link from "next/link";
import { Glyph, type GlyphName } from "@/components/brand/glyphs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getViewer } from "@/lib/auth";
import { getProgressFor } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function QuestsPage() {
  const viewer = await getViewer();
  if (!viewer) return null;
  const progress = await getProgressFor(viewer.id);

  const quests: Array<{
    id: string;
    title: string;
    body: string;
    current: number;
    goal: number;
    reward: number;
    glyph: GlyphName;
  }> = [
    {
      id: "first-lesson",
      title: "First steps",
      body: "Complete one lesson today.",
      current: Math.min(1, progress.lessonsCompleted),
      goal: 1,
      reward: 25,
      glyph: "target",
    },
    {
      id: "xp-hundred",
      title: "XP collector",
      body: "Earn 100 experience points.",
      current: Math.min(100, progress.xp),
      goal: 100,
      reward: 50,
      glyph: "bolt",
    },
    {
      id: "streak-three",
      title: "On a roll",
      body: "Reach a 3-day streak.",
      current: Math.min(3, progress.streak),
      goal: 3,
      reward: 75,
      glyph: "flame",
    },
    {
      id: "three-lessons",
      title: "Momentum",
      body: "Finish three lessons in total.",
      current: Math.min(3, progress.lessonsCompleted),
      goal: 3,
      reward: 100,
      glyph: "gem",
    },
  ];

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">Daily quests</p>
      <h1 className="mt-2 font-display text-4xl font-extrabold">Small goals, big rewards.</h1>
      <p className="mt-3 text-sm text-slate-400">
        Quests read your live progression state, so they update the moment you finish a lesson.
      </p>

      <div className="mt-9 grid gap-4 sm:grid-cols-2">
        {quests.map((quest) => {
          const done = quest.current >= quest.goal;
          const percent = Math.min(100, (quest.current / quest.goal) * 100);
          return (
            <div
              key={quest.id}
              className={`rounded-2xl border p-6 ${done ? "border-accent/35 bg-accent/5" : "border-line bg-surface/60"}`}
            >
              <div className="flex items-start justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-teal/15 text-teal">
                  <Glyph name={quest.glyph} className="size-5" />
                </span>
                {done ? (
                  <Badge variant="accent">
                    <Glyph name="check" className="size-3" /> Complete
                  </Badge>
                ) : (
                  <Badge variant="gold">
                    <Glyph name="gem" className="size-3" /> {quest.reward}
                  </Badge>
                )}
              </div>
              <h2 className="mt-5 font-display text-lg font-extrabold">{quest.title}</h2>
              <p className="mt-1 text-sm text-slate-400">{quest.body}</p>
              <Progress value={percent} className="mt-5 h-2" />
              <p className="mt-2 text-right text-[11px] font-bold text-slate-500">
                {quest.current} / {quest.goal}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-line bg-surface/50 p-6">
        <p className="text-sm text-slate-300">Ready to tick one off?</p>
        <Button asChild>
          <Link href="/learn">Go to your path</Link>
        </Button>
      </div>
    </div>
  );
}
