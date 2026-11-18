import { cn } from "@/lib/utils";

const PALETTES = [
  { from: "#C7FF5C", to: "#55E6D9", ink: "#171438" },
  { from: "#A89BFF", to: "#FF6B8B", ink: "#171438" },
  { from: "#FFD166", to: "#FF8A5B", ink: "#3A1B12" },
  { from: "#8ED8E8", to: "#7A9BFF", ink: "#171438" },
  { from: "#F98FB4", to: "#8B7BFF", ink: "#241246" },
  { from: "#9BE7A4", to: "#55E6D9", ink: "#123A2E" },
] as const;

function hash(value: string) {
  let result = 0;
  for (let index = 0; index < value.length; index += 1) {
    result = (result * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(result);
}

/** A deterministic woven word-mark for a language — no flags, no emoji. */
export function LanguageSigil({
  code,
  className,
}: {
  code: string;
  className?: string;
}) {
  const seed = hash(code);
  const palette = PALETTES[seed % PALETTES.length];
  const variant = hash(`${code}:weave`) % 4;
  const gradientId = `language-sigil-${code.replace(/[^a-zA-Z0-9]/g, "") || "word"}`;

  return (
    <svg
      viewBox="0 0 44 44"
      fill="none"
      aria-hidden="true"
      className={cn("size-8 shrink-0", className)}
    >
      <defs>
        <linearGradient id={gradientId} x1="5" y1="3" x2="39" y2="41" gradientUnits="userSpaceOnUse">
          <stop stopColor={palette.from} />
          <stop offset="1" stopColor={palette.to} />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="42" height="42" rx="13" fill={`url(#${gradientId})`} />
      <rect x="1.75" y="1.75" width="40.5" height="40.5" rx="12.25" stroke="white" strokeOpacity="0.35" strokeWidth="1.5" />

      {variant === 0 && (
        <>
          <path d="M12.5 22c0-5.2 3.8-9.3 9.5-9.3S31.5 16.8 31.5 22s-3.8 9.3-9.5 9.3S12.5 27.2 12.5 22Z" stroke={palette.ink} strokeWidth="2.2" opacity="0.85" />
          <path d="M18 14c5 0 8.5 3.6 8.5 8.5S23 31 18 31" stroke="white" strokeWidth="1.8" opacity="0.9" />
          <circle cx="22" cy="22" r="2.3" fill={palette.ink} />
        </>
      )}

      {variant === 1 && (
        <>
          <path d="M10 31 22 10l12 21" stroke={palette.ink} strokeWidth="2.6" />
          <path d="M14 13h16l-8 18-8-18Z" stroke="white" strokeWidth="1.7" opacity="0.9" />
          <circle cx="22" cy="18" r="2.2" fill={palette.ink} />
          <circle cx="22" cy="29" r="1.5" fill="white" opacity="0.9" />
        </>
      )}

      {variant === 2 && (
        <>
          <path d="M11 28c2-9 8.5-15 16-13.5 5.2 1 7 5.2 4.8 8.8-2.2 3.7-7 4.4-10 1.8-2-1.8-1.2-4.6 1.2-5.5" stroke={palette.ink} strokeWidth="2.4" />
          <circle cx="23.5" cy="19.5" r="2.1" fill={palette.ink} />
          <circle cx="13.5" cy="29" r="1.7" fill="white" />
        </>
      )}

      {variant === 3 && (
        <>
          <path d="M8 17c5.5-5.5 10 5 15.5-.5S35 15 37 17M8 26c5.5-5.5 10 5 15.5-.5S35 24 37 26" stroke={palette.ink} strokeWidth="2.4" />
          <circle cx="22" cy="12" r="2.1" fill={palette.ink} />
          <circle cx="22" cy="32" r="1.5" fill="white" opacity="0.9" />
        </>
      )}
    </svg>
  );
}
