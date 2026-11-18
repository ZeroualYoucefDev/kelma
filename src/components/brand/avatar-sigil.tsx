import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Abstract portrait marks. IDs are stable; the artwork is deliberately not animal emoji. */
function portrait(id: string): ReactNode {
  switch (id) {
    case "fox": // Ember
      return (
        <>
          <path d="M17 40 32 15l15 25-15 9-15-9Z" stroke="white" strokeWidth="2.6" />
          <path d="m24 36 8-11 8 11-8 5-8-5Z" fill="white" fillOpacity="0.16" stroke="white" strokeWidth="1.6" />
          <circle cx="32" cy="34" r="2.2" fill="white" />
        </>
      );
    case "owl": // Halo
      return (
        <>
          <circle cx="32" cy="32" r="12" stroke="white" strokeWidth="2.6" />
          <path d="M19 25c3-5 7.5-7 13-7s10 2 13 7M19 39c3 5 7.5 7 13 7s10-2 13-7" stroke="white" strokeWidth="2" opacity="0.9" />
          <circle cx="32" cy="32" r="3.2" fill="white" />
        </>
      );
    case "panda": // Echo
      return (
        <>
          <path d="M27 17c-8.5 4-12.5 10-12.5 15S18.5 43 27 47M37 17c8.5 4 12.5 10 12.5 15S45.5 43 37 47" stroke="white" strokeWidth="2.8" />
          <circle cx="32" cy="32" r="5.5" stroke="white" strokeWidth="2.2" />
          <circle cx="32" cy="32" r="1.8" fill="white" />
        </>
      );
    case "tiger": // Solstice
      return (
        <>
          <path d="M32 11v8M32 45v8M11 32h8M45 32h8M17 17l6 6M47 17l-6 6M17 47l6-6M47 47l-6-6" stroke="white" strokeWidth="2" />
          <path d="m32 21 11 11-11 11-11-11 11-11Z" stroke="white" strokeWidth="2.6" />
          <circle cx="32" cy="32" r="2.8" fill="white" />
        </>
      );
    case "frog": // Verdant
      return (
        <>
          <path d="M32 47c-11-6-15-15-11.5-23.5C27.5 23 33 27 34 34M32 47c11-6 15-15 11.5-23.5C36.5 23 31 27 30 34" stroke="white" strokeWidth="2.6" />
          <path d="M32 47V23" stroke="white" strokeWidth="1.8" opacity="0.85" />
          <circle cx="32" cy="19" r="2.4" fill="white" />
        </>
      );
    case "koala": // Tide
      return (
        <>
          <path d="M13 25c6-6 11 5 18-1s11-3 20 1M13 35c6-6 11 5 18-1s11-3 20 1" stroke="white" strokeWidth="2.8" />
          <circle cx="32" cy="17" r="3.2" fill="white" />
          <circle cx="32" cy="45" r="2" fill="white" opacity="0.7" />
        </>
      );
    case "raccoon": // Dusk
      return (
        <>
          <path d="M17 19h30M15 32h34M19 45h26" stroke="white" strokeWidth="2.8" />
          <path d="m25 15-5 34M39 15l5 34" stroke="white" strokeOpacity="0.6" strokeWidth="1.7" />
          <circle cx="32" cy="32" r="3" fill="white" />
        </>
      );
    case "penguin": // Nacre
      return (
        <>
          <path d="M32 13 47 25l-5 21H22l-5-21 15-12Z" stroke="white" strokeWidth="2.6" />
          <path d="M32 13v33M18 25h28M22 46l10-21 10 21" stroke="white" strokeOpacity="0.7" strokeWidth="1.6" />
          <circle cx="32" cy="25" r="2.2" fill="white" />
        </>
      );
    default:
      return (
        <>
          <circle cx="32" cy="32" r="15" stroke="white" strokeWidth="2.4" />
          <path d="m25 32 5 5 10-11" stroke="white" strokeWidth="2.4" />
        </>
      );
  }
}

export function AvatarSigil({
  id,
  className,
}: {
  id: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-3/5 w-3/5", className)}
    >
      {portrait(id)}
    </svg>
  );
}
