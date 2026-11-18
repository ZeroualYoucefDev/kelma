import Link from "next/link";
import { BookOpenCheck, Clock3, Flame, Gem, Settings2, Trophy, Zap } from "lucide-react";
import { Avatar } from "@/components/profile/avatar";
import { AvatarPicker } from "@/components/profile/avatar-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getViewer } from "@/lib/auth";
import { getPlayer, getProgressFor, recentAttempts } from "@/lib/data";
import { levelFromXp } from "@/lib/gamification";
import { getLanguage } from "@/services/languages";
import { LEARNING_REASONS, DAILY_GOALS } from "@/lib/onboarding";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const player = await getPlayer(viewer);
  const [progress, attempts, target] = await Promise.all([
    getProgressFor(viewer.id),
    recentAttempts(viewer.id, 5),
    getLanguage(player.targetLanguage ?? "es"),
  ]);
  const level = levelFromXp(progress.xp);
  const reason = LEARNING_REASONS.find((item) => item.id === player.learningReason);
  const goal = DAILY_GOALS.find((item) => item.minutes === player.dailyGoalMinutes);

  const stats = [
    { icon: Zap, label: "Total XP", value: progress.xp.toLocaleString(), tone: "text-accent" },
    { icon: Flame, label: "Day streak", value: `${progress.streak} days`, tone: "text-gold" },
    { icon: Gem, label: "Gems", value: progress.gems.toLocaleString(), tone: "text-teal" },
    { icon: BookOpenCheck, label: "Lessons", value: progress.lessonsCompleted.toLocaleString(), tone: "text-sky-400" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-5">
          <Avatar avatarId={player.avatar} name={player.name} size="lg" />
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-3xl font-extrabold">{player.name}</h1>
              {player.plan === "pro" && <Badge variant="gold">👑 Pro</Badge>}
              {viewer.isPreview && <Badge variant="outline">Preview</Badge>}
            </div>
            <p className="mt-1 text-sm text-slate-400">{player.email}</p>
            <p className="mt-1 text-xs text-slate-500">Learning {target.emoji} {target.name}</p>
          </div>
        </div>
        <Button asChild variant="secondary">
          <Link href="/settings">
            <Settings2 className="size-4" /> Edit profile
          </Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-line bg-surface/60 p-5">
            <stat.icon className={`size-5 ${stat.tone}`} />
            <p className="mt-4 font-display text-2xl font-extrabold">{stat.value}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface/60 p-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
            Learning
          </p>
          <p className="mt-3 font-display text-lg font-bold">
            {target.emoji} {target.name}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {reason ? `For ${reason.label.toLowerCase()}` : "Your path is personal to you."}
          </p>
          <Link href="/settings" className="mt-4 inline-block text-xs font-bold text-accent hover:underline">
            Change language →
          </Link>
        </div>

        <div className="rounded-2xl border border-line bg-surface/60 p-6">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">
            Daily goal
          </p>
          <p className="mt-3 flex items-center gap-2 font-display text-lg font-bold">
            <Clock3 className="size-5 text-teal" />
            {goal?.minutes ?? 10} minutes a day
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {goal?.description ?? "Steady progress that adds up."}
          </p>
          <Link href="/settings" className="mt-4 inline-block text-xs font-bold text-accent hover:underline">
            Adjust goal →
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface/60 p-6">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold">Your avatar</h2>
            <p className="mt-1 text-xs text-slate-400">Pick a character that feels like you.</p>
          </div>
        </div>
        <div className="mt-5">
          <AvatarPicker current={player.avatar} name={player.name} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface/60 p-6">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-display font-bold">
            <Trophy className="size-4 text-gold" /> Level {level.level}
          </span>
          <span className="text-xs text-slate-500">
            {level.intoLevel} / {level.needed} XP
          </span>
        </div>
        <Progress value={(level.intoLevel / level.needed) * 100} className="mt-4" />
        <p className="mt-2 text-xs text-slate-500">Longest streak: {progress.longestStreak} days</p>
      </div>

      <div className="mt-6 rounded-2xl border border-line bg-surface/60 p-6">
        <h2 className="font-display text-lg font-bold">Recent activity</h2>
        {attempts.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">
            No lessons yet. <Link href="/learn" className="font-bold text-accent hover:underline">Start your path →</Link>
          </p>
        ) : (
          <div className="mt-4 space-y-2">
            {attempts.map((attempt) => (
              <div
                key={attempt.id}
                className="flex items-center justify-between rounded-xl border border-line bg-ink/40 px-4 py-3 text-sm"
              >
                <span className="truncate font-semibold text-slate-300">{attempt.lessonKey}</span>
                <span className="shrink-0 text-xs font-bold text-accent">
                  {attempt.correct}/{attempt.total} · +{attempt.xpEarned} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
