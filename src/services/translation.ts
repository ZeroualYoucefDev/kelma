import { decodeEntities, fetchJson, fromCache, toCache } from "./http";

type MyMemoryResponse = {
  responseData?: { translatedText?: string };
  responseStatus?: number;
  responseDetails?: string;
};

const ENDPOINT = "https://api.mymemory.translated.net/get";

function clean(text: string): string {
  return decodeEntities(text)
    .replace(/<[^>]*>/g, "")
    .trim();
}

/**
 * Translate a single word through MyMemory's public REST endpoint.
 * Results are cached for the configured TTL (default: one day).
 */
export async function translate(text: string, from: string, to: string): Promise<string> {
  const key = `translate:${from}:${to}:${text.toLowerCase()}`;
  const cached = fromCache<string>(key);
  if (cached) return cached;

  const url = new URL(ENDPOINT);
  url.searchParams.set("q", text);
  url.searchParams.set("langpair", `${from}|${to}`);

  const data = await fetchJson<MyMemoryResponse>(url.toString());
  const translated = clean(data.responseData?.translatedText ?? "");

  if (!translated) {
    throw new Error(`No translation returned for “${text}” (${from}→${to}).`);
  }
  if (data.responseStatus && data.responseStatus >= 400) {
    throw new Error(data.responseDetails ?? `Translation failed (${data.responseStatus}).`);
  }
  // MyMemory echoes the source when it has no entry; treat that as unusable.
  if (from === to && translated === text) return translated;
  if (translated.toLowerCase() === text.toLowerCase() && from !== to) {
    throw new Error(`Translation for “${text}” was unchanged.`);
  }

  return toCache(key, translated);
}

/** Non-throwing variant used while assembling exercises from live data. */
export async function translateSafe(
  text: string,
  from: string,
  to: string,
): Promise<string | null> {
  try {
    return await translate(text, from, to);
  } catch {
    return null;
  }
}

/**
 * Translate a batch with bounded concurrency so a lesson does not open
 * dozens of simultaneous connections to a public service.
 */
export async function translateBatch(
  words: readonly string[],
  from: string,
  to: string,
  concurrency = 4,
): Promise<Array<{ source: string; translated: string | null }>> {
  const results: Array<{ source: string; translated: string | null }> = [];
  let cursor = 0;

  async function worker() {
    while (cursor < words.length) {
      const index = cursor++;
      const source = words[index];
      results[index] = { source, translated: await translateSafe(source, from, to) };
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, words.length) }, () => worker()),
  );
  return results;
}
