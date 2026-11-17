import { CreditCard, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CheckoutButtons } from "@/components/shop/shop-actions";
import { SettingsForm } from "@/components/settings/settings-form";
import { clerkConfigured, getViewer } from "@/lib/auth";
import { getPlayer } from "@/lib/data";
import { getLanguages } from "@/services/languages";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const viewer = await getViewer();
  if (!viewer) return null;

  const [player, languages] = await Promise.all([
    getPlayer(viewer),
    getLanguages().catch(() => []),
  ]);

  return (
    <div>
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-accent">
        <SlidersHorizontal className="size-3.5" /> Settings
      </p>
      <h1 className="mt-2 font-display text-4xl font-extrabold">Make Kelma yours.</h1>

      <div className="mt-9 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface/60 p-6">
          <h2 className="font-display text-lg font-bold">Profile & languages</h2>
          <p className="mb-6 mt-1 text-sm text-slate-400">
            Target-language names are resolved live from an ISO dataset.
          </p>
          <SettingsForm
            languages={languages}
            clerkEnabled={clerkConfigured}
            initial={{
              name: player.name,
              sourceLanguage: player.sourceLanguage,
              targetLanguage: player.targetLanguage,
            }}
          />
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-surface/60 p-6">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <CreditCard className="size-4 text-gold" /> Billing
              </h2>
              {player.plan === "pro" ? (
                <Badge variant="gold">👑 Pro active</Badge>
              ) : (
                <Badge variant="outline">Free plan</Badge>
              )}
            </div>
            {player.plan === "pro" ? (
              <p className="mt-4 text-sm text-slate-300">
                Unlimited hearts and 1.5× XP are active. Thank you for supporting Kelma.
              </p>
            ) : (
              <>
                <p className="mt-4 text-sm text-slate-400">
                  Upgrade in DZD with CIB or Edahabia. Activation happens automatically when a verified
                  Chargily webhook arrives.
                </p>
                <div className="mt-5">
                  <CheckoutButtons compact />
                </div>
              </>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-surface/60 p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold">
              <ShieldCheck className="size-4 text-accent" /> Verification
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Only verified Google, email magic-link or phone-OTP sessions can reach the dashboard.
              Password registration is not offered anywhere in the product.
            </p>
            <Badge variant="accent" className="mt-4">Verified account</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
