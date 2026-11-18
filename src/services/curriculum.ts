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

/** Structural configuration only. Every vocabulary item is fetched live. */
const UNITS = 6;
const LESSONS_PER_UNIT = 4;
const WORDS_PER_UNIT = LESSONS_PER_UNIT * 4;

const UNIT_TITLES = [
  "First sparks",
  "Word playground",
  "Say it out loud",
  "Story threads",
  "Quick fire",
  "Mastery lap",
] as const;

const LESSON_TITLES = ["Warm up", "Mix & match", "Sound check", "Mini quest"] as const;

/**
 * Assemble the curriculum map. Unit and lesson metadata are structural; all
 * words are pulled from the live frequency dataset, never from this file.
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
        title: LESSON_TITLES[lessonIndex] ?? `Lesson ${lessonIndex + 1}`,
        words: words.slice(lessonIndex * 4, lessonIndex * 4 + 4),
      });
    }

    units.push({
      id: unitId,
      index: unitIndex + 1,
      title: UNIT_TITLES[unitIndex] ?? `Unit ${unitIndex + 1}`,
      description: `${words.length} live words from the open vocabulary dataset, turned into ${LESSONS_PER_UNIT} playful rounds.`,
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
  if (unique.length < 3) {
    throw new Error("The live translation pool did not provide enough distinct answers.");
  }
  const options = seededShuffle([correct, ...unique], seed);
  return { options, answerIndex: options.indexOf(correct) };
}

/**
 * Generate a playable lesson from live translations and dictionary metadata.
 *
 * The English frequency list is the canonical word source. Every displayed
 * word is translated from that list into the learner's native language and
 * into the active target language, so changing either language changes what
 * the learner sees — and no language is structurally locked.
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

  const baseWords = await getWordsForLesson(lessonId, 12);
  const [nativeRows, targetRows] = await Promise.all([
    sourceCode === "en"
      ? Promise.resolve(baseWords.map((word) => ({ source: word, translated: word })))
      : translateBatch(baseWords, "en", sourceCode),
    translateBatch(baseWords, "en", targetCode),
  ]);

  const pairs: Array<{ base: string; native: string; target: string }> = [];
  const seenTargets = new Set<string>();
  const seenNatives = new Set<string>();

  for (let index = 0; index < baseWords.length; index += 1) {
    const base = baseWords[index];
    const native = nativeRows[index]?.translated?.trim();
    const target = targetRows[index]?.translated?.trim();
    if (!native || !target) continue;
    if (native.toLowerCase() === target.toLowerCase()) continue;

    const nativeKey = native.toLowerCase();
    const targetKey = target.toLowerCase();
    if (seenNatives.has(nativeKey) || seenTargets.has(targetKey)) continue;

    seenNatives.add(nativeKey);
    seenTargets.add(targetKey);
    pairs.push({ base, native, target });
    if (pairs.length === 5) break;
  }

  if (pairs.length < 4) {
    throw new Error("The translation provider did not return enough distinct live words.");
  }

  const chosen = pairs.slice(0, 4);
  const nativeWords = chosen.map((pair) => pair.native);
  const targetWords = chosen.map((pair) => pair.target);
  const dictionary = await lookupWords(chosen.map((pair) => pair.base));

  const exercises: Exercise[] = [];

  chosen.forEach((pair, index) => {
    const seed = `${lessonId}:${index}`;

    exercises.push({
      id: `${seed}:translate`,
      kind: "translate",
      prompt: pair.native,
      question: `What does “${pair.native}” mean in ${curriculum.target.name}?`,
      ...makeOptions(pair.target, targetWords, `${seed}:translate`),
      speak: { text: pair.native, locale: curriculum.source.locale },
      note: `${curriculum.source.emoji} ${curriculum.source.name} → ${curriculum.target.emoji} ${curriculum.target.name}`,
    });

    exercises.push({
      id: `${seed}:reverse`,
      kind: "reverse",
      prompt: pair.target,
      question: `What does “${pair.target}” mean in ${curriculum.source.name}?`,
      ...makeOptions(pair.native, nativeWords, `${seed}:reverse`),
      speak: { text: pair.target, locale: curriculum.target.locale },
      note: `${curriculum.target.emoji} ${curriculum.target.name} → ${curriculum.source.emoji} ${curriculum.source.name}`,
    });

    exercises.push({
      id: `${seed}:listen`,
      kind: "listen",
      prompt: "🔊",
      question: `Listen and choose the ${curriculum.source.name} meaning`,
      ...makeOptions(pair.native, nativeWords, `${seed}:listen`),
      speak: { text: pair.target, locale: curriculum.target.locale },
      note: `Spoken in ${curriculum.target.name} · ${curriculum.target.locale}`,
    });
  });

  // Dictionary definitions are English-only upstream, so this round is shown
  // only when English is the learner's native language.
  if (sourceCode === "en") {
    const definitionEntry = dictionary.find((entry) => entry.definition && nativeWords.includes(entry.word));
    if (definitionEntry) {
      exercises.push({
        id: `${lessonId}:meaning`,
        kind: "meaning",
        prompt: definitionEntry.definition ?? "",
        question: "Which word matches this definition?",
        ...makeOptions(definitionEntry.word, nativeWords, `${lessonId}:meaning`),
        speak: { text: definitionEntry.word, locale: curriculum.source.locale },
        note: definitionEntry.partOfSpeech ? `A ${definitionEntry.partOfSpeech}` : undefined,
      });
    }
  }

  return {
    plan,
    unit,
    source: curriculum.source,
    target: curriculum.target,
    exercises: seededShuffle(exercises, `${lessonId}:order`).slice(0, 9),
  };
}
