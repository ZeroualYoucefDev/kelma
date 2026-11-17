"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-bold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime/70 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "bg-lime text-ink shadow-[0_6px_0_#5fae1f] hover:bg-[#c7ff85] hover:-translate-y-0.5",
        secondary:
          "bg-surface-2 text-white border border-line hover:border-lime/60 hover:bg-[#1b2740]",
        ghost: "text-slate-300 hover:bg-white/5 hover:text-white",
        outline:
          "border-2 border-line bg-transparent text-white hover:border-lime hover:text-lime",
        pro: "bg-gradient-to-r from-gold to-[#ff9d4d] text-ink shadow-[0_6px_0_#b06b16]",
        destructive: "bg-rose text-white hover:bg-[#ff8296]",
      },
      size: {
        default: "h-11 px-5",
        sm: "h-9 px-3.5 text-xs",
        lg: "h-14 px-7 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { buttonVariants };
