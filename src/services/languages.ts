import { fetchJson, fromCache, toCache } from "./http";

export type Language = {
  /** ISO 639-1 code used by the translation provider. */
  code: string;
  /** Human readable name, resolved from a live ISO-639 dataset. */
  name: string;
  /** BCP-47 tag used by the Web Speech synthesis API. */
  locale: string;
  emoji: string;
};

/**
 * Product configuration: which ISO languages Kelma currently supports.
 * Names are NOT stored here — they are resolved at runtime from the
 * ISO-639-1 dataset maintained by the `haliaeetus` public repository.
 */
const SUPPORTED: Array<{ code: string; locale: string; emoji: string }> = [
  { code: "en", locale: "en-US", emoji: "🇬🇧" },
  { code: "es", locale: "es-ES", emoji: "🇪🇸" },
  { code: "fr", locale: "fr-FR", emoji: "🇫🇷" },
  { code: "de", locale: "de-DE", emoji: "🇩🇪" },
  { code: "it", locale: "it-IT", emoji: "🇮🇹" },
  { code: "pt", locale: "pt-PT", emoji: "🇵🇹" },
  { code: "ja", locale: "ja-JP", emoji: "🇯🇵" },
  { code: "ko", locale: "ko-KR", emoji: "🇰🇷" },
  { code: "zh", locale: "zh-CN", emoji: "🇨🇳" },
  { code: "ar", locale: "ar-SA", emoji: "🇸🇦" },
  { code: "ru", locale: "ru-RU", emoji: "🇷🇺" },
  { code: "hi", locale: "hi-IN", emoji: "🇮🇳" },
  { code: "tr", locale: "tr-TR", emoji: "🇹🇷" },
  { code: "nl", locale: "nl-NL", emoji: "🇳🇱" },
  { code: "sv", locale: "sv-SE", emoji: "🇸🇪" },
];

type IsoRecord = { name?: string; nativeName?: string };
type IsoDataset = Record<string, IsoRecord>;

const ISO_DATASET_URL =
  "https://raw.githubusercontent.com/haliaeetus/iso-639/master/data/iso_639-1.json";

/** Resolve a language name using the platform's ICU data (no bundled list). */
function fallbackName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

/** Fetch the live ISO-639-1 dataset, memoised for a day. */
async function isoNames(): Promise<Record<string, string>> {
  const cached = fromCache<Record<string, string>>("iso-639-1");
  if (cached) return cached;

  let names: Record<string, string> = {};
  try {
    const dataset = await fetchJson<IsoDataset>(ISO_DATASET_URL);
    for (const [code, record] of Object.entries(dataset)) {
      if (record?.name) names[code] = record.name;
    }
  } catch {
    // ICU fallback keeps the catalogue usable when GitHub is unreachable.
    names = {};
  }

  return toCache("iso-639-1", names);
}

/** The full language catalogue with live-resolved display names. */
export async function getLanguages(): Promise<Language[]> {
  const names = await isoNames();
  return SUPPORTED.map((language) => ({
    ...language,
    name: names[language.code] ?? fallbackName(language.code),
  }));
}

/** Find one language by code, falling back to ICU data for unknown codes. */
export async function getLanguage(code: string): Promise<Language> {
  const all = await getLanguages();
  const found = all.find((language) => language.code === code);
  if (found) return found;

  const config = SUPPORTED.find((entry) => entry.code === code) ?? {
    code,
    locale: code,
    emoji: "🌐",
  };
  return { ...config, name: fallbackName(code) };
}

/** Only languages that are safe to use as a source (English today). */
export async function getSourceLanguages(): Promise<Language[]> {
  const all = await getLanguages();
  return all.filter((language) => language.code === "en");
}

/** Target languages exclude the source language. */
export async function getTargetLanguages(source: string): Promise<Language[]> {
  const all = await getLanguages();
  return all.filter((language) => language.code !== source);
}
