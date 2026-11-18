"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { KelmaWordmark } from "@/components/brand/kelma-mark";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#languages", label: "Languages" },
  { href: "#why-kelma", label: "Why kelma" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-2xl border border-line/70 bg-ink/70 px-4 py-3 shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)] backdrop-blur-2xl sm:px-6">
        <Link href="/" aria-label="kelma home">
          <KelmaWordmark />
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-bold text-muted transition-colors hover:text-accent"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">
              Get started <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <button
          className="rounded-xl p-2 text-white transition-colors hover:bg-white/5 md:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Toggle navigation"
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      <div
        className={cn(
          "mx-auto mt-2 max-w-6xl overflow-hidden rounded-2xl border border-line bg-surface/95 backdrop-blur-2xl transition-all md:hidden",
          open ? "max-h-96 opacity-100" : "max-h-0 border-transparent opacity-0",
        )}
      >
        <div className="flex flex-col gap-1 p-4">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-bold text-slate-200 hover:bg-white/5"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button asChild variant="secondary" size="sm">
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/sign-up">Get started</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
