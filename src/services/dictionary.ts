import { fetchJson, fromCache, toCache } from "./http";

export type DictionaryWord = {
  word: string;
  phonetic: string | null;
  definition: string | null;
  partOfSpeech: string | null;
  example: string | null;
  audioUrl: string | null;
};

type Phonetic = { text?: string; audio?: string };
type Entry = {
  word?: string;
  phonetic?: string;
  phonetics?: Phonetic[];
  meanings?: Array<{
    partOfSpeech?: string;
    definitions?: Array<{ definition?: string; example?: string }>;
  }>;
};

const ENDPOINT = "https://api.dictionaryapi.dev/api/v2/entries/en";

/** Fetch rich word metadata from the free Dictionary API. */
export async function lookupWord(word: string): Promise<DictionaryWord | null> {
  const key = `dictionary:${word.toLowerCase()}`;
  const cached = fromCache<DictionaryWord | null>(key);
  if (cached !== undefined) return cached;

  let result: DictionaryWord | null = null;
  try {
    const entries = await fetchJson<Entry[]>(`${ENDPOINT}/${encodeURIComponent(word)}`);
    const entry = entries[0];
    if (entry) {
      const meaning = entry.meanings?.find((item) => item.definitions?.length);
      const definition = meaning?.definitions?.[0];
      const audio = entry.phonetics?.find((item) => item.audio?.startsWith("https://"));
      result = {
        word: entry.word ?? word,
        phonetic: entry.phonetic ?? entry.phonetics?.find((item) => item.text)?.text ?? null,
        definition: definition?.definition ?? null,
        partOfSpeech: meaning?.partOfSpeech ?? null,
        example: definition?.example ?? null,
        audioUrl: audio?.audio ?? null,
      };
    }
  } catch {
    result = null;
  }

  return toCache(key, result, 7 * 24 * 60 * 60 * 1000);
}

/** Resolve definitions for many words at once. */
export async function lookupWords(words: readonly string[]): Promise<DictionaryWord[]> {
  const entries = await Promise.all(words.map((word) => lookupWord(word)));
  return entries.filter((entry): entry is DictionaryWord => entry !== null);
}
