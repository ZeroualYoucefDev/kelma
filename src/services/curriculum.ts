import type {
  CurriculumPlan,
  Exercise,
  Lesson,
  LessonPlan,
  UnitPlan,
} from "@/lib/types";
import { lookupWords } from "./dictionary";
import { getLanguage } from "./languages";
import { seededShuffle } from "./http";
import { translateBatch } from "./translation";
import { getWordsForLesson, getWordPoolSize } from "./words";

/** Curriculum shape is configuration; every word inside it is fetched live. */
const UNITS = 6;
const LESSONS_PER_UNIT = 4;
const WORDS_PER_UNIT = LESSONS_PER_UNIT * 4;

/**
 * Assemble a sequential unit path. Unit and lesson metadata are structural;
 * all vocabulary is pulled from the live frequency dataset, so no words are
 * committed to this repository.
 */
export async function buildCurriculum(
  sourceCode = "en",
  targetCode = "es",
): Promise<CurriculumPlan> {
  const [source, target, totalWords] = await Promise.all([
    getLanguage(sourceCode),
    getLanguage(targetCode),
    getWordPoolSize(),
  ]);

  const units: UnitPlan[] = [];
  for (let unitIndex = 0; unitIndex < UNITS; unitIndex += 1) {
    const unitId = `unit-${unitIndex + 1}`;
    const words = await getWordsForLesson(unitId, WORDS_PER_UNIT);

    const lessons: LessonPlan[] = [];
    for (let lessonIndex = 0; lessonIndex < LESSONS_PER_UNIT; lessonIndex += 1) {
      lessons.push({
        id: `${unitId}-lesson-${lessonIndex + 1}`,
        unitId,
        index: lessonIndex + 1,
        title: `Lesson ${lessonIndex + 1} · ${target.name}`,
        words: words.slice(lessonIndex * 4, lessonIndex * 4 + 4),
      });
    }

    units.push({
      id: unitId,
      index: unitIndex + 1,
      title: `Unit ${unitIndex + 1} · ${target.name}`,
      description: `${words.length} live words from the open vocabulary dataset, broken into bite-sized lessons.`,
      lessons,
    });
  }

  return { source, target, units, totalWords };
}

function makeOptions(
  correct: string,
  distractors: string[],
  seed: string,
): { options: string[]; answerIndex: number } {
  const unique = [...new Set(distractors.filter((item) => item !== correct))].slice(0, 3);
  // Upstream providers sometimes return fewer than four distinct words. The
  // placeholder is an option label, never a vocabulary answer.
  while (unique.length < 3) unique.push(`Option ${unique.length + 1}`);
  const options = seededShuffle([correct, ...unique], seed);
  return { options, answerIndex: options.indexOf(correct) };
}

/**
 * Generate a playable lesson from live translations and dictionary metadata.
 * Every option (correct or distractor) originates from an upstream API.
 */
export async function buildLesson(
  sourceCode: string,
  targetCode: string,
  unitId: string,
  lessonId: string,
): Promise<Lesson> {
  const curriculum = await buildCurriculum(sourceCode, targetCode);
  const unit = curriculum.units.find((item) => item.id === unitId);
  const plan = unit?.lessons.find((item) => item.id === lessonId);

  if (!unit || !plan) throw new Error("Lesson not found in the live curriculum.");

  // Ask for a wider live slice so a failed upstream translation never blocks a lesson.
  const widerPool = await getWordsForLesson(lessonId, 10);
  const translations = await translateBatch(widerPool, sourceCode, targetCode);
  const usable = translations.filter(
    (item): item is { source: string; translated: string } => Boolean(item.translated),
  );

  if (usable.length < 4) {
    throw new Error("The translation provider did not return enough words for this lesson.");
  }

  const pairs = usable.slice(0, 4);
  const sourceWords = pairs.map((pair) => pair.source);
  const targetWords = pairs.map((pair) => pair.translated);
  const dictionary = await lookupWords(sourceWords);

  const exercises: Exercise[] = [];

  pairs.forEach((pair, index) => {
    const seed = `${lessonId}:${index}`;

    exercises.push({
      id: `${seed}:translate`,
      kind: "translate",
      prompt: pair.source,
      question: `Translate “${pair.source}” into ${curriculum.target.name}`,
      ...makeOptions(pair.translated, targetWords, `${seed}:translate`),
      note: "Pick the translation that sounds right.",
    });

    exercises.push({
      id: `${seed}:reverse`,
      kind: "reverse",
      prompt: pair.translated,
      question: `What does “${pair.translated}” mean?`,
      ...makeOptions(pair.source, sourceWords, `${seed}:reverse`),
      note: `From ${curriculum.target.name} to ${curriculum.source.name}`,
    });

    exercises.push({
      id: `${seed}:listen`,
      kind: "listen",
      prompt: "🔊",
      question: "Listen and choose the correct meaning",
      ...makeOptions(pair.source, sourceWords, `${seed}:listen`),
      speak: { text: pair.translated, locale: curriculum.target.locale },
      note: "Tap the speaker to hear it again.",
    });
  });

  const definitionEntry = dictionary.find((entry) => entry.definition && entry.audioUrl);
  if (definitionEntry && sourceWords.includes(definitionEntry.word)) {
    exercises.push({
      id: `${lessonId}:meaning`,
      kind: "meaning",
      prompt: definitionEntry.definition ?? "",
      question: "Which word matches this definition?",
      ...makeOptions(definitionEntry.word, sourceWords, `${lessonId}:meaning`),
      note: definitionEntry.partOfSpeech ? `A ${definitionEntry.partOfSpeech}` : undefined,
    });
  }

  return {
    plan,
    unit,
    source: curriculum.source,
    target: curriculum.target,
    exercises: seededShuffle(exercises, `${lessonId}:order`).slice(0, 9),
  };
}
