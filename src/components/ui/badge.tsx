import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & {
  variant?: "default" | "lime" | "violet" | "gold" | "outline";
}) {
  const variants = {
    default: "bg-white/8 text-slate-200",
    lime: "bg-lime/15 text-lime border border-lime/25",
    violet: "bg-violet/15 text-violet border border-violet/25",
    gold: "bg-gold/15 text-gold border border-gold/25",
    outline: "border border-line text-slate-300",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
