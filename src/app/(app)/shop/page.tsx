import { Check, Gem, Heart, Snowflake } from "lucide-react";
import { CheckoutButtons, PurchaseButton } from "@/components/shop/shop-actions";
import { Badge } from "@/components/ui/badge";
import { getViewer } from "@/lib/auth";
import { shopItems } from "@/lib/config";
import { getPlayer, getProgressFor } from "@/lib/data";
import { MAX_HEARTS } from "@/lib/gamification";

export const dynamic = "force-dynamic";

export default async function ShopPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const [player, progress] = await Promise.all([
    getPlayer(viewer),
    getProgressFor(viewer.id),
  ]);
  const consumables = shopItems.filter((item) => item.kind !== "pro");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-teal">
            <Gem className="size-3.5" /> Shop
          </p>
          <h1 className="mt-2 font-display text-4xl font-extrabold">Spend your hard-earned gems.</h1>
          <p className="mt-3 text-sm text-slate-400">Consumables are bought with gems. Pro is billed in DZD.</p>
        </div>
        <div className="rounded-xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm font-extrabold text-teal">
          💎 {progress.gems} gems
        </div>
      </div>

      <div className="mt-9 grid gap-4 sm:grid-cols-2">
        {consumables.map((item) => {
          const Icon = item.kind === "hearts" ? Heart : Snowflake;
          const disabled =
            progress.gems < item.price || (item.kind === "hearts" && progress.hearts >= MAX_HEARTS);
          return (
            <div key={item.id} className="rounded-2xl border border-line bg-surface/60 p-6">
              <div className="flex items-start justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-accent/10 text-2xl">
                  {item.icon}
                </span>
                <Badge variant="teal">
                  <Gem className="size-3" /> {item.price}
                </Badge>
              </div>
              <h2 className="mt-5 flex items-center gap-2 font-display text-lg font-extrabold">
                {item.name} <Icon className="size-4 text-accent" />
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
              <div className="mt-6">
                <PurchaseButton itemId={item.id} disabled={disabled} />
              </div>
            </div>
          );
        })}
      </div>

      <section className="relative mt-10 overflow-hidden rounded-3xl border border-gold/30 bg-gradient-to-br from-gold/15 via-surface to-coral/10 p-7 sm:p-10">
        <div className="pointer-events-none absolute inset-0 grid-glow opacity-50" />
        <div className="relative grid gap-8 md:grid-cols-2 md:items-center">
          <div>
            <Badge variant="gold" className="mb-4">👑 Kelma Pro</Badge>
            <h2 className="font-display text-3xl font-extrabold">Never lose a heart again.</h2>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate-300">
              Unlimited hearts, 1.5× XP on every lesson and every advanced drill. Pay securely in DZD
              with CIB or Edahabia through Chargily Pay.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              {["Unlimited hearts", "1.5× XP and gems", "Every advanced exercise type", "Priority support"].map(
                (benefit) => (
                  <li key={benefit} className="flex items-center gap-2">
                    <Check className="size-4 text-gold" /> {benefit}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div>
            {player.plan === "pro" ? (
              <div className="rounded-2xl border border-gold/40 bg-gold/10 p-6 text-center">
                <p className="font-display text-xl font-extrabold text-gold">You are Pro 👑</p>
                <p className="mt-2 text-xs text-slate-400">Unlimited hearts are active on every lesson.</p>
              </div>
            ) : (
              <CheckoutButtons />
            )}
            <p className="mt-3 text-center text-[11px] text-slate-500">
              Payments are processed by Chargily Pay API v2 · DZD · test/live modes supported.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
