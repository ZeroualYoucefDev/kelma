import { fetchText, fromCache, toCache } from "./http";

/**
 * Vocabulary is streamed from the Google 10k/20k English frequency dataset
 * hosted on GitHub. Nothing in this repository contains a word list.
 */
const WORD_LIST_URLS = [
  "https://raw.githubusercontent.com/first20hours/google-10000-english/master/20k.txt",
  "https://raw.githubusercontent.com/first20hours/google-10000-english/master/10000.txt",
];

/** Download, clean and cache the live frequency-ordered word pool. */
export async function getWordPool(): Promise<string[]> {
  const cached = fromCache<string[]>("word-pool");
  if (cached) return cached;

  let raw = "";
  let lastError: unknown;
  for (const url of WORD_LIST_URLS) {
    try {
      raw = await fetchText(url);
      if (raw.length > 0) break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!raw) {
    throw new Error(
      `Unable to load the live vocabulary dataset: ${lastError instanceof Error ? lastError.message : "unknown error"}`,
    );
  }

  const seen = new Set<string>();
  const words: string[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const word = line.trim().toLowerCase();
    if (!/^[a-z]{3,9}$/.test(word) || seen.has(word)) continue;
    seen.add(word);
    words.push(word);
  }

  if (words.length < 100) {
    throw new Error("The live vocabulary dataset returned too few usable words.");
  }

  return toCache("word-pool", words);
}

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Deterministically select `count` source-language words for a lesson.
 * The seed is derived from the lesson id, so a lesson always maps to the
 * same slice of the live dataset without storing any words locally.
 */
export async function getWordsForLesson(seed: string, count: number): Promise<string[]> {
  const pool = await getWordPool();
  const start = hashSeed(seed) % Math.max(1, pool.length - count);
  const picked: string[] = [];
  for (let i = 0; i < count; i += 1) {
    picked.push(pool[(start + i * 7) % pool.length]);
  }
  return picked;
}

/** Total number of words currently available from the upstream dataset. */
export async function getWordPoolSize(): Promise<number> {
  return (await getWordPool()).length;
}
