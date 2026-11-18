/** Shared, product-level daily goal choices used by the flow and validation. */
export const DAILY_GOALS = [
  { minutes: 5, label: "Casual", description: "A small habit, five minutes a day." },
  { minutes: 10, label: "Regular", description: "Steady progress that adds up." },
  { minutes: 15, label: "Serious", description: "Build real momentum each day." },
  { minutes: 20, label: "Intense", description: "Go deep and move fast." },
] as const;

export function isDailyGoal(value: number): boolean {
  return DAILY_GOALS.some((goal) => goal.minutes === value);
}
