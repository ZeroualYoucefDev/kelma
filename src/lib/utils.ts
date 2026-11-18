import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** Turn an email-derived Clerk name into a human greeting without altering real names. */
export function displayName(name: string, email?: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Learner";
  const local = email?.split("@")[0] ?? "";
  if (trimmed !== local && !trimmed.includes("@") && !trimmed.includes("+")) return trimmed;

  const words = trimmed
    .split("@")[0]
    .split("+")[0]
    .split(/[._-]+/)
    .filter(Boolean);
  return words.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ") || "Learner";
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
