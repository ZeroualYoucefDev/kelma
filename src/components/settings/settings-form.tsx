"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SignOutButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updateSettings } from "@/actions/settings";
import type { Language } from "@/services/languages";

export function SettingsForm({
  languages,
  initial,
  clerkEnabled,
}: {
  languages: Language[];
  initial: { name: string; sourceLanguage: string; targetLanguage: string };
  clerkEnabled: boolean;
}) {
  const [name, setName] = useState(initial.name);
  const [source, setSource] = useState(initial.sourceLanguage);
  const [target, setTarget] = useState(initial.targetLanguage);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await updateSettings({
        name,
        sourceLanguage: source,
        targetLanguage: target,
      });
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setLoading(false);
    }
  }

  const selectClass =
    "h-11 w-full rounded-xl border border-line bg-surface-2 px-3 text-sm text-white focus:border-lime focus:outline-none";

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <Label htmlFor="name">Display name</Label>
        <Input id="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={60} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="source">I speak</Label>
          <select id="source" className={selectClass} value={source} onChange={(event) => setSource(event.target.value)}>
            {languages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.emoji} {language.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="target">I want to learn</Label>
          <select id="target" className={selectClass} value={target} onChange={(event) => setTarget(event.target.value)}>
            {languages.map((language) => (
              <option key={language.code} value={language.code}>
                {language.emoji} {language.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Saving…" : "Save changes"}
      </Button>

      {clerkEnabled && (
        <div className="border-t border-line pt-6">
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Account</p>
          <SignOutButton>
            <Button type="button" variant="secondary">Sign out</Button>
          </SignOutButton>
        </div>
      )}
    </form>
  );
}
