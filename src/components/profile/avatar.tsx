import { cn } from "@/lib/utils";
import { getAvatar } from "@/lib/avatars";

const sizes = {
  sm: "size-8 text-base",
  md: "size-10 text-xl",
  lg: "size-24 text-5xl sm:size-28 sm:text-6xl",
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
      aria-label={`${name}'s ${avatar.label.toLowerCase()} avatar`}
      title={avatar.label}
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-gradient-to-br shadow-[inset_0_1px_1px_rgba(255,255,255,0.35)] ring-2 ring-white/10",
        avatar.gradient,
        sizes[size],
        className,
      )}
    >
      <span aria-hidden="true" className="drop-shadow-sm">
        {avatar.emoji}
      </span>
    </span>
  );
}
