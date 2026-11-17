import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"span"> & {
  variant?: "default" | "accent" | "teal" | "gold" | "outline";
}) {
  const variants = {
    default: "bg-white/8 text-slate-200",
    accent: "bg-accent/15 text-accent border border-accent/25",
    teal: "bg-teal/15 text-teal border border-teal/25",
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
