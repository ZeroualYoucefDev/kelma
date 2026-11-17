import Link from "next/link";
import { Crown, Flame, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { topLearners } from "@/lib/data";
import { formatNumber, initials } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const learners = await topLearners(10);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gold">
            <Trophy className="size-3.5" /> Leaderboard
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold">The top of the class.</h1>
          <p className="mt-3 text-sm text-slate-400">Ranked by lifetime XP from saved lesson attempts.</p>
        </div>
        <Badge variant="lime">Updated live</Badge>
      </div>

      {learners.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-surface/40 p-10 text-center">
          <Trophy className="mx-auto size-10 text-slate-600" />
          <h2 className="mt-4 font-display text-xl font-bold">No rankings yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">
            Once a PostgreSQL database is connected and learners finish lessons, the leaderboard fills itself.
            In local preview there is no shared database.
          </p>
          <Button asChild className="mt-6">
            <Link href="/learn">Be the first to earn XP</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-8 space-y-2">
          {learners.map((learner, index) => (
            <div
              key={learner.id}
              className="flex items-center gap-4 rounded-xl border border-line bg-surface/60 px-4 py-3"
            >
              <span
                className={`grid size-8 place-items-center rounded-lg font-display text-sm font-extrabold ${
                  index === 0 ? "bg-gold/20 text-gold" : "bg-white/5 text-slate-400"
                }`}
              >
                {index === 0 ? <Crown className="size-4" /> : index + 1}
              </span>
              <span className="grid size-9 place-items-center rounded-full bg-violet/15 text-xs font-extrabold text-violet">
                {initials(learner.name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">
                  {learner.name} {learner.plan === "pro" && <span className="text-gold">👑</span>}
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs font-bold text-gold">
                <Flame className="size-3.5" /> {learner.streak}
              </span>
              <span className="flex items-center gap-1 text-sm font-extrabold text-lime">
                <Zap className="size-3.5" /> {formatNumber(learner.xp)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
