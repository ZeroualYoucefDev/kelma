"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateAvatar } from "@/actions/settings";
import { Glyph } from "@/components/brand/glyphs";
import { Avatar } from "@/components/profile/avatar";
import { Button } from "@/components/ui/button";
import { AVATARS } from "@/lib/avatars";
import { cn } from "@/lib/utils";

export function AvatarPicker({
  current,
  name,
}: {
  current: string;
  name: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(current);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const result = await updateAvatar(selected);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update sigil.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
        {AVATARS.map((avatar) => {
          const active = selected === avatar.id;
          return (
            <button
              key={avatar.id}
              type="button"
              aria-pressed={active}
              title={avatar.label}
              onClick={() => setSelected(avatar.id)}
              className={cn(
                "relative flex flex-col items-center gap-1.5 rounded-xl border p-2 transition-all",
                active
                  ? "border-accent/70 bg-accent/10"
                  : "border-line bg-surface-2/40 hover:border-accent/30 hover:bg-surface-2",
              )}
            >
              <Avatar avatarId={avatar.id} name={name} size="md" />
              <span className={cn("text-[10px] font-bold", active ? "text-accent" : "text-slate-400")}>
                {avatar.label}
              </span>
              {active && (
                <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-accent text-ink">
                  <Glyph name="check" className="size-3" strokeWidth={3} />
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-end gap-3">
        {selected !== current && (
          <button
            type="button"
            onClick={() => setSelected(current)}
            className="text-xs font-bold text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        )}
        <Button type="button" onClick={save} disabled={saving || selected === current} size="sm">
          {saving && <Glyph name="loader" className="size-4 animate-spin" />}
          Save sigil
        </Button>
      </div>
    </div>
  );
}
