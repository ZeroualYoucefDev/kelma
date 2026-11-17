import * as React from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-line bg-surface-2 px-4 text-sm text-white placeholder:text-slate-500 transition-colors focus:border-lime focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      className={cn("mb-2 block text-xs font-bold uppercase tracking-wider text-slate-400", className)}
      {...props}
    />
  );
}
