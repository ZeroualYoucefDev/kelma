"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame,
  Gem,
  GraduationCap,
  Heart,
  Map,
  Settings,
  ShoppingBag,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  Zap,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { appConfig } from "@/lib/config";

export type ShellStats = {
  name: string;
  plan: "free" | "pro";
  xp: number;
  gems: number;
  hearts: number;
  streak: number;
  targetLanguage: string;
  isPreview: boolean;
};

const mainNav = [
  { href: "/learn", label: "Learn", icon: GraduationCap },
  { href: "/units", label: "Units", icon: Map },
  { href: "/quests", label: "Quests", icon: Target },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { href: "/shop", label: "Shop", icon: ShoppingBag },
];

const accountNav = [
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

function Stat({
  icon: Icon,
  value,
  tone,
  label,
}: {
  icon: typeof Heart;
  value: string | number;
  tone: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5" title={label}>
      <Icon className={cn("size-4", tone)} />
      <span className="text-sm font-extrabold tabular-nums">{value}</span>
    </div>
  );
}

export function AppShell({ stats, children }: { stats: ShellStats; children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-line bg-surface/50 px-4 py-6 lg:flex">
        <Link href="/learn" className="mb-8 flex items-center gap-2 px-2 font-display text-xl font-extrabold">
          <span className="grid size-8 place-items-center rounded-xl bg-lime text-ink">
            <Sparkles className="size-4" />
          </span>
          {appConfig.name}
          <span className="text-lime">.</span>
        </Link>

        <nav className="space-y-1">
          {mainNav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                  active
                    ? "bg-lime/12 text-lime"
                    : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1 border-t border-line pt-5">
          {accountNav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                  active ? "bg-lime/12 text-lime" : "text-slate-400 hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
          <div className="mt-4 flex items-center gap-3 rounded-xl border border-line bg-ink/50 p-3">
            <span className="grid size-9 place-items-center rounded-full bg-violet/20 text-xs font-extrabold text-violet">
              {initials(stats.name)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold">{stats.name}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                {stats.plan === "pro" ? "Pro learner" : "Free learner"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b border-line/70 bg-ink/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link href="/learn" className="flex items-center gap-2 font-display text-lg font-extrabold lg:hidden">
              <span className="grid size-7 place-items-center rounded-lg bg-lime text-ink">
                <Sparkles className="size-3.5" />
              </span>
              {appConfig.name}
            </Link>

            <div className="hidden items-center gap-5 sm:flex">
              <Stat icon={Heart} value={stats.plan === "pro" ? "∞" : stats.hearts} tone="text-rose" label="Hearts" />
              <Stat icon={Gem} value={stats.gems} tone="text-violet" label="Gems" />
              <Stat icon={Flame} value={`${stats.streak}🔥`} tone="text-gold" label="Day streak" />
              <Stat icon={Zap} value={stats.xp} tone="text-lime" label="Total XP" />
            </div>

            <div className="flex items-center gap-2 sm:hidden">
              <Stat icon={Heart} value={stats.plan === "pro" ? "∞" : stats.hearts} tone="text-rose" label="Hearts" />
              <Stat icon={Gem} value={stats.gems} tone="text-violet" label="Gems" />
              <Stat icon={Flame} value={stats.streak} tone="text-gold" label="Streak" />
            </div>

            {stats.plan === "free" ? (
              <Link
                href="/shop"
                className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-extrabold text-gold transition-colors hover:bg-gold/20"
              >
                Go Pro
              </Link>
            ) : (
              <span className="rounded-lg border border-gold/40 bg-gold/10 px-3 py-1.5 text-xs font-extrabold text-gold">
                PRO
              </span>
            )}
          </div>
        </header>

        {stats.isPreview && (
          <div className="border-b border-gold/20 bg-gold/8 px-4 py-2 text-center text-[11px] font-semibold text-gold">
            Preview mode — connect Clerk and PostgreSQL to enable real accounts and saved progress.
          </div>
        )}

        <main className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:px-6 lg:pb-16">{children}</main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 backdrop-blur-xl lg:hidden">
        {mainNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold",
                active ? "text-lime" : "text-slate-500",
              )}
            >
              <item.icon className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
