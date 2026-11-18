import { cn } from "@/lib/utils";
import { getAvatar } from "@/lib/avatars";
import { AvatarSigil } from "@/components/brand/avatar-sigil";

const sizes = {
  sm: "size-8",
  md: "size-10",
  lg: "size-24 sm:size-28",
};

export function Avatar({
  avatarId,
  name,
  size = "md",
  className,
}: {
  avatarId: string | null | undefined;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const avatar = getAvatar(avatarId);

  return (
    <span
      role="img"
      aria-label={`${name}'s ${avatar.label.toLowerCase()} sigil`}
      title={avatar.label}
      className={cn(
        "relative grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)] ring-2 ring-white/10",
        avatar.gradient,
        sizes[size],
        className,
      )}
    >
      <span className="pointer-events-none absolute inset-0 rounded-full border border-white/25" />
      <AvatarSigil id={avatar.id} />
    </span>
  );
}
