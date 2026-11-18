"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useMemo, useState } from "react";
import { Glyph, type GlyphName } from "@/components/brand/glyphs";
import { KelmaWordmark } from "@/components/brand/kelma-mark";
import { LanguageSigil } from "@/components/brand/language-sigil";
import { Avatar } from "@/components/profile/avatar";
import { cn } from "@/lib/utils";

export type ShellStats = {
  name: string;
  avatar: string;
  plan: "free" | "pro";
  xp: number;
  gems: number;
  hearts: number;
  streak: number;
  targetLanguage: { code: string; name: string };
  isPreview: boolean;
};

type HeartsContextValue = {
  hearts: number;
  isPro: boolean;
  setHearts: (value: number) => void;
};

const HeartsContext = createContext<HeartsContextValue | null>(null);

export function useHearts(): HeartsContextValue {
  const value = useContext(HeartsContext);
  if (!value) throw new Error("useHearts must be used inside the app shell.");
  return value;
}

type NavItem = { href: string; label: string; glyph: GlyphName };

const mainNav: NavItem[] = [
  { href: "/learn", label: "Learn", glyph: "book" },
  { href: "/units", label: "Units", glyph: "map" },
  { href: "/quests", label: "Quests", glyph: "target" },
  { href: "/leaderboard", label: "Leaderboard", glyph: "trophy" },
  { href: "/shop", label: "Shop", glyph: "bag" },
];

const accountNav: NavItem[] = [
  { href: "/profile", label: "Profile", glyph: "user" },
  { href: "/settings", label: "Settings", glyph: "settings" },
];

function StatPill({
  glyph,
  value,
  tone,
  label,
}: {
  glyph: GlyphName;
  value: string | number;
  tone: string;
  label: string;
}) {
  return (
    <div className="pill gap-1.5" title={label}>
      <Glyph name={glyph} className={cn("size-3.5", tone)} />
      <span className="tabular-nums text-white">{value}</span>
      <span className="hidden text-[10px] font-bold uppercase tracking-wider text-muted xl:inline">
        {label}
      </span>
    </div>
  );
}

export function AppShell({ stats, children }: { stats: ShellStats; children: React.ReactNode }) {
  const pathname = usePathname();
  const [hearts, setHearts] = useState(stats.hearts);
  const isPro = stats.plan === "pro";

  const heartsValue = useMemo(
    () => ({ hearts, isPro, setHearts }),
    [hearts, isPro],
  );

  return (
    <HeartsContext.Provider value={heartsValue}>
      <div className="aurora min-h-screen lg:grid lg:grid-cols-[248px_1fr]">
        <aside className="sticky top-0 hidden h-screen flex-col border-r border-line/70 bg-ink/50 px-4 py-6 backdrop-blur-xl lg:flex">
          <Link href="/learn" className="mb-9 px-1">
            <KelmaWordmark />
          </Link>

          <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-muted">
            Your studio
          </p>
          <nav className="space-y-1.5">
            {mainNav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all",
                    active
                      ? "bg-accent/12 text-accent shadow-[inset_0_0_0_1px_rgba(199,255,92,0.16)]"
                      : "text-muted hover:-translate-y-0.5 hover:bg-white/5 hover:text-white",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-7 place-items-center rounded-lg transition-colors",
                      active ? "bg-accent/15" : "bg-white/5 group-hover:bg-white/10",
                    )}
                  >
                    <Glyph name={item.glyph} className="size-4" />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto space-y-1 border-t border-line/70 pt-5">
            <p className="px-3 pb-2 text-[10px] font-extrabold uppercase tracking-[0.22em] text-muted">
              Account
            </p>
            {accountNav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition-all",
                    active ? "bg-violet/15 text-white" : "text-muted hover:bg-white/5 hover:text-white",
                  )}
                >
                  <Glyph name={item.glyph} className="size-4" />
                  {item.label}
                </Link>
              );
            })}

            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-surface/60 p-3">
              <Avatar avatarId={stats.avatar} name={stats.name} size="md" />
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold">{stats.name}</p>
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted">
                  {isPro ? "Pro learner" : "Free learner"}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[10px] text-slate-400">
                  <LanguageSigil code={stats.targetLanguage.code} className="size-4 rounded-[5px]" />
                  {stats.targetLanguage.name}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="sticky top-0 z-30 border-b border-line/50 bg-ink/70 backdrop-blur-2xl">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
              <Link href="/learn" className="lg:hidden">
                <KelmaWordmark className="[&>span:last-child]:text-lg" />
              </Link>

              <div className="hidden items-center gap-2 sm:flex">
                <StatPill
                  glyph="heart"
                  value={isPro ? "∞" : hearts}
                  tone="text-coral"
                  label="Hearts"
                />
                <StatPill glyph="gem" value={stats.gems} tone="text-teal" label="Gems" />
                <StatPill
                  glyph="flame"
                  value={stats.streak}
                  tone="text-gold"
                  label="Streak"
                />
                <StatPill glyph="bolt" value={stats.xp} tone="text-accent" label="XP" />
              </div>

              <div className="flex items-center gap-2 sm:hidden">
                <StatPill
                  glyph="heart"
                  value={isPro ? "∞" : hearts}
                  tone="text-coral"
                  label="Hearts"
                />
                <StatPill glyph="gem" value={stats.gems} tone="text-teal" label="Gems" />
              </div>

              <div className="ml-auto flex items-center gap-2">
                <Link
                  href="/profile"
                  aria-label="Your profile"
                  className="rounded-full transition-transform hover:scale-110"
                >
                  <Avatar avatarId={stats.avatar} name={stats.name} size="sm" />
                </Link>

                {isPro ? (
                  <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-[11px] font-extrabold text-gold">
                    PRO
                  </span>
                ) : (
                  <Link
                    href="/shop"
                    className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1.5 text-[11px] font-extrabold text-gold transition-colors hover:bg-gold/20"
                  >
                    Go Pro
                  </Link>
                )}
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:pb-16">{children}</main>
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-surface/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {mainNav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px] font-extrabold transition-colors",
                active ? "text-accent" : "text-muted",
              )}
            >
              <Glyph name={item.glyph} className="size-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </HeartsContext.Provider>
  );
}
