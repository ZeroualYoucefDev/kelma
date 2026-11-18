import type { Language } from "@/services/languages";

export type ExerciseKind = "translate" | "reverse" | "listen" | "meaning";

export type Exercise = {
  id: string;
  kind: ExerciseKind;
  prompt: string;
  question: string;
  options: string[];
  answerIndex: number;
  speak?: { text: string; locale: string };
  /** Same word/meaning pronounced in the learner's native language. */
  nativeSpeak?: { text: string; locale: string };
  note?: string;
};

export type LessonPlan = {
  id: string;
  unitId: string;
  index: number;
  title: string;
  words: string[];
};

export type UnitPlan = {
  id: string;
  index: number;
  title: string;
  description: string;
  lessons: LessonPlan[];
};

export type CurriculumPlan = {
  source: Language;
  target: Language;
  units: UnitPlan[];
  totalWords: number;
};

export type Lesson = {
  plan: LessonPlan;
  unit: UnitPlan;
  source: Language;
  target: Language;
  exercises: Exercise[];
};

export type Viewer = {
  id: string;
  name: string;
  email: string;
  imageUrl: string | null;
  verified: boolean;
  isPreview: boolean;
};
