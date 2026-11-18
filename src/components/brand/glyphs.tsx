import type { ReactNode, SVGProps } from "react";
import { cn } from "@/lib/utils";

export type GlyphName =
  | "heart"
  | "heart-break"
  | "gem"
  | "flame"
  | "bolt"
  | "spark"
  | "sprout"
  | "rocket"
  | "trophy"
  | "target"
  | "map"
  | "book"
  | "bag"
  | "user"
  | "settings"
  | "lock"
  | "check"
  | "crown"
  | "clock"
  | "shield"
  | "card"
  | "mail"
  | "search"
  | "sound"
  | "arrow"
  | "arrow-left"
  | "chevron"
  | "close"
  | "menu"
  | "freeze"
  | "play"
  | "loader";

function shape(name: GlyphName): ReactNode {
  switch (name) {
    case "heart":
      return (
        <>
          <path d="M16 26.5C10.4 22.6 6 18.6 6 13.8 6 10.5 8.5 8 11.7 8c2 0 3.5 1 4.3 2.5C16.8 9 18.3 8 20.3 8 23.5 8 26 10.5 26 13.8c0 4.8-4.4 8.8-10 12.7Z" />
          <path d="M10 13.6c0-1.6 1.1-2.8 2.6-2.8M22 13.8c0 1.7-.9 3-2.3 3.8" opacity=".55" />
          <circle cx="16" cy="15.5" r="1.7" fill="currentColor" stroke="none" opacity=".35" />
        </>
      );
    case "heart-break":
      return (
        <>
          <path d="M16 26.5C10.4 22.6 6 18.6 6 13.8 6 10.5 8.5 8 11.7 8c2 0 3.5 1 4.3 2.5C16.8 9 18.3 8 20.3 8 23.5 8 26 10.5 26 13.8c0 4.8-4.4 8.8-10 12.7Z" />
          <path d="m17 10-3 6h4l-3 7 5-6h-4l2-7" strokeWidth="2" />
        </>
      );
    case "gem":
      return (
        <>
          <path d="M9 12h14l5 6-12 11L4 18l5-6Z" />
          <path d="M4 18h24M9 12l3 6 4 11 4-11 3-6M12 18h8" opacity=".65" />
          <circle cx="16" cy="18" r="1.6" fill="currentColor" stroke="none" opacity=".5" />
        </>
      );
    case "flame":
      return (
        <>
          <path d="M17 27c5 0 8-3.4 8-7.8 0-4.7-4.2-6.7-4.2-11.2-3 1.3-4.8 3.7-4.8 6.4-2.2-1.2-3.2-3-3.2-5.4C9.8 11.4 9 14.3 9 18.4 9 23 12.2 27 17 27Z" />
          <path d="M17 24c2.3 0 3.8-1.6 3.8-3.7 0-2.2-1.8-3.2-1.8-5.3-1.6 1-2.5 2.3-2.5 4-1-.6-1.6-1.5-1.6-2.7-1.1 1.2-1.7 2.7-1.7 4 0 2.1 1.5 3.7 3.8 3.7Z" opacity=".55" />
        </>
      );
    case "bolt":
      return (
        <>
          <path d="M18 4 8 18h7l-1 10 10-14h-7l1-10Z" />
          <path d="M19 7 12 16" opacity=".5" />
        </>
      );
    case "spark":
      return (
        <>
          <path d="M16 4c1.4 6.3 3 7.9 9.3 9.3C19 14.7 17.4 16.3 16 22.6 14.6 16.3 13 14.7 6.7 13.3 13 11.9 14.6 10.3 16 4Z" />
          <path d="M25 22c.6 2.6 1.2 3.2 3.8 3.8-2.6.6-3.2 1.2-3.8 3.8-.6-2.6-1.2-3.2-3.8-3.8 2.6-.6 3.2-1.2 3.8-3.8Z" opacity=".65" />
        </>
      );
    case "sprout":
      return (
        <>
          <path d="M16 27V13" />
          <path d="M16 17C10 17 7 14 7 9c5 0 9 2 9 8ZM16 20c6 0 9-3 9-8-5 0-9 2-9 8Z" />
          <circle cx="16" cy="27" r="1.8" fill="currentColor" stroke="none" opacity=".5" />
        </>
      );
    case "rocket":
      return (
        <>
          <path d="M13 13c3-5 7-7 11-7 2 4 0 8-5 11l-6-4Z" />
          <path d="m13 17-5 4 5 1 2 5 4-5 1-5" />
          <path d="M16 27 13 31M19 27l3 4" opacity=".6" />
          <circle cx="20" cy="10" r="2" fill="currentColor" stroke="none" opacity=".6" />
        </>
      );
    case "trophy":
      return (
        <>
          <path d="M10 7h12v9c0 4-2.7 6.5-6 6.5S10 20 10 16V7Z" />
          <path d="M10 9H6v3c0 3 1.7 4.5 4 4.5M22 9h4v3c0 3-1.7 4.5-4 4.5M16 22.5V27M11 27h10" />
          <path d="m16 11 1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4L16 11Z" opacity=".7" />
        </>
      );
    case "target":
      return (
        <>
          <circle cx="16" cy="16" r="11" />
          <circle cx="16" cy="16" r="6" opacity=".65" />
          <circle cx="16" cy="16" r="2" fill="currentColor" stroke="none" />
          <path d="M16 2v4M16 26v4M2 16h4M26 16h4" opacity=".5" />
        </>
      );
    case "map":
      return (
        <>
          <path d="m4 8 8-3 8 3 8-3v20l-8 3-8-3-8 3V8Z" />
          <path d="M12 5v20M20 8v20" opacity=".6" />
          <path d="M8 22c3-6 6 1 9-5s6 1 8-3" strokeWidth="2" />
          <circle cx="8" cy="22" r="1.6" fill="currentColor" stroke="none" />
          <circle cx="25" cy="14" r="1.6" fill="currentColor" stroke="none" />
        </>
      );
    case "book":
      return (
        <>
          <path d="M16 9C12 6 8 6 4 7v18c4-1 8-1 12 2 4-3 8-3 12-2V7c-4-1-8-1-12 2Z" />
          <path d="M16 9v18M7 12h5M7 16h5M20 12h5M20 16h5" opacity=".6" />
        </>
      );
    case "bag":
      return (
        <>
          <path d="M6 11h20l-2 17H8L6 11Z" />
          <path d="M11 12V9c0-3 2-5 5-5s5 2 5 5v3" />
          <path d="M10 17h12" opacity=".55" />
        </>
      );
    case "user":
      return (
        <>
          <circle cx="16" cy="11" r="5.5" />
          <path d="M5 27c1.5-5.5 5.7-8 11-8s9.5 2.5 11 8" />
          <circle cx="16" cy="11" r="1.8" fill="currentColor" stroke="none" opacity=".6" />
        </>
      );
    case "settings":
      return (
        <>
          <path d="M12.5 5h7l1.3 3.2 3 .9 3-1.6 3.5 6-2.5 2v3.2l2.5 2-3.5 6-3-1.6-3 .9L19.5 29h-7l-1.3-3.2-3-.9-3 1.6-3.5-6 2.5-2v-3.2l-2.5-2 3.5-6 3 1.6 3-.9L12.5 5Z" />
          <circle cx="16" cy="17" r="4" />
          <circle cx="16" cy="17" r="1.3" fill="currentColor" stroke="none" opacity=".7" />
        </>
      );
    case "lock":
      return (
        <>
          <path d="M9 14h14v13H9V14Z" />
          <path d="M12 14v-3c0-3 1.8-5 4-5s4 2 4 5v3" />
          <path d="M16 19v4" strokeWidth="2.2" />
          <circle cx="16" cy="18" r="1.4" fill="currentColor" stroke="none" />
        </>
      );
    case "check":
      return (
        <>
          <path d="m6 17 6 6L26 8" strokeWidth="2.4" />
          <path d="m14 21 3 3 9-10" opacity=".45" />
        </>
      );
    case "crown":
      return (
        <>
          <path d="m4 10 6 5 6-9 6 9 6-5-2.5 16h-19L4 10Z" />
          <path d="M7 22h18" />
          <circle cx="16" cy="10" r="1.7" fill="currentColor" stroke="none" opacity=".7" />
        </>
      );
    case "clock":
      return (
        <>
          <circle cx="16" cy="16" r="11" />
          <path d="M16 9v7l5 3" strokeWidth="2" />
          <circle cx="16" cy="16" r="1.6" fill="currentColor" stroke="none" />
        </>
      );
    case "shield":
      return (
        <>
          <path d="M16 3 27 7v8c0 7-4.5 11.5-11 14C9.5 26.5 5 22 5 15V7l11-4Z" />
          <path d="m11 16 3.5 3.5L21 12" opacity=".75" />
        </>
      );
    case "card":
      return (
        <>
          <rect x="3" y="7" width="26" height="18" rx="4" />
          <path d="M3 13h26M8 19h5M8 22h9" opacity=".7" />
          <circle cx="23" cy="20" r="2" fill="currentColor" stroke="none" opacity=".6" />
        </>
      );
    case "mail":
      return (
        <>
          <rect x="4" y="7" width="24" height="18" rx="4" />
          <path d="m5 9 11 8 11-8" />
          <path d="m5 23 8-6M27 23l-8-6" opacity=".5" />
        </>
      );
    case "search":
      return (
        <>
          <circle cx="14" cy="14" r="8" />
          <path d="m20 20 7 7" strokeWidth="2.2" />
          <circle cx="14" cy="14" r="2" fill="currentColor" stroke="none" opacity=".5" />
        </>
      );
    case "sound":
      return (
        <>
          <path d="M7 13h5l6-5v16l-6-5H7v-6Z" />
          <path d="M22 12c2 2 2 6 0 8M25 9c4 4 4 10 0 14" opacity=".75" />
          <circle cx="7" cy="16" r="1.4" fill="currentColor" stroke="none" />
        </>
      );
    case "arrow":
      return (
        <>
          <path d="M6 16h19" strokeWidth="2.2" />
          <path d="m18 9 7 7-7 7" strokeWidth="2.2" />
          <circle cx="6" cy="16" r="1.8" fill="currentColor" stroke="none" opacity=".6" />
        </>
      );
    case "arrow-left":
      return (
        <>
          <path d="M26 16H7" strokeWidth="2.2" />
          <path d="m14 9-7 7 7 7" strokeWidth="2.2" />
          <circle cx="26" cy="16" r="1.8" fill="currentColor" stroke="none" opacity=".6" />
        </>
      );
    case "chevron":
      return <path d="m12 7 9 9-9 9" strokeWidth="2.2" />;
    case "close":
      return (
        <>
          <path d="m8 8 16 16M24 8 8 24" strokeWidth="2.2" />
          <circle cx="16" cy="16" r="11" opacity=".35" />
        </>
      );
    case "menu":
      return <path d="M6 9h20M8 16h16M10 23h12" strokeWidth="2.2" />;
    case "freeze":
      return (
        <>
          <path d="M16 3v26M5 9.5l22 13M27 9.5 5 22.5" strokeWidth="2" />
          <path d="m12 6 4 4 4-4M12 26l4-4 4 4M5.5 14l5.5 1-1.5-5M26.5 18 21 17l1.5 5M8.5 25l4-4-5-1M23.5 7l-4 4 5 1" opacity=".65" />
        </>
      );
    case "play":
      return (
        <>
          <circle cx="16" cy="16" r="12" />
          <path d="m13 10 9 6-9 6V10Z" fill="currentColor" stroke="none" />
        </>
      );
    case "loader":
      return (
        <>
          <path d="M16 4a12 12 0 1 0 12 12" strokeWidth="2.4" />
          <circle cx="28" cy="16" r="1.8" fill="currentColor" stroke="none" />
        </>
      );
    default:
      return <circle cx="16" cy="16" r="8" />;
  }
}

export function Glyph({
  name,
  className,
  ...props
}: { name: GlyphName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-4", className)}
      {...props}
    >
      {shape(name)}
    </svg>
  );
}
