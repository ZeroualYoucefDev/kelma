/** Shared, product-level onboarding choices used by the flow and its validation. */
export const LEARNING_REASONS = [
  {
    id: "travel",
    label: "Travel",
    description: "Feel at home in a new place.",
  },
  {
    id: "work",
    label: "Work",
    description: "Grow in your career.",
  },
  {
    id: "school",
    label: "School",
    description: "Keep up with your studies.",
  },
  {
    id: "family",
    label: "Family & friends",
    description: "Talk to the people you love.",
  },
  {
    id: "fun",
    label: "Just for fun",
    description: "Learn something new, your way.",
  },
] as const;

export type LearningReasonId = (typeof LEARNING_REASONS)[number]["id"];

export const DAILY_GOALS = [
  { minutes: 5, label: "Casual", description: "A small habit, five minutes a day." },
  { minutes: 10, label: "Regular", description: "Steady progress that adds up." },
  { minutes: 15, label: "Serious", description: "Build real momentum each day." },
  { minutes: 20, label: "Intense", description: "Go deep and move fast." },
] as const;

export function isLearningReason(value: string): value is LearningReasonId {
  return LEARNING_REASONS.some((reason) => reason.id === value);
}

export function isDailyGoal(value: number): boolean {
  return DAILY_GOALS.some((goal) => goal.minutes === value);
}
