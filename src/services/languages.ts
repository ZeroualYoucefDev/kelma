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
 * The catalogue is intentionally broad. Names are fetched from a live
 * ISO-639-1 dataset at runtime; this file only maps each code to an accurate
 * speech locale and a friendly flag. No language is locked by default and no
 * language is privileged as "the source".
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
  { code: "pl", locale: "pl-PL", emoji: "🇵🇱" },
  { code: "uk", locale: "uk-UA", emoji: "🇺🇦" },
  { code: "cs", locale: "cs-CZ", emoji: "🇨🇿" },
  { code: "da", locale: "da-DK", emoji: "🇩🇰" },
  { code: "fi", locale: "fi-FI", emoji: "🇫🇮" },
  { code: "no", locale: "nb-NO", emoji: "🇳🇴" },
  { code: "el", locale: "el-GR", emoji: "🇬🇷" },
  { code: "he", locale: "he-IL", emoji: "🇮🇱" },
  { code: "th", locale: "th-TH", emoji: "🇹🇭" },
  { code: "vi", locale: "vi-VN", emoji: "🇻🇳" },
  { code: "id", locale: "id-ID", emoji: "🇮🇩" },
  { code: "ms", locale: "ms-MY", emoji: "🇲🇾" },
  { code: "ro", locale: "ro-RO", emoji: "🇷🇴" },
  { code: "hu", locale: "hu-HU", emoji: "🇭🇺" },
  { code: "fa", locale: "fa-IR", emoji: "🇮🇷" },
  { code: "ur", locale: "ur-PK", emoji: "🇵🇰" },
  { code: "bn", locale: "bn-BD", emoji: "🇧🇩" },
  { code: "ta", locale: "ta-IN", emoji: "🇮🇳" },
  { code: "sw", locale: "sw-KE", emoji: "🇰🇪" },
  { code: "af", locale: "af-ZA", emoji: "🇿🇦" },
  { code: "sq", locale: "sq-AL", emoji: "🇦🇱" },
  { code: "hr", locale: "hr-HR", emoji: "🇭🇷" },
  { code: "sr", locale: "sr-RS", emoji: "🇷🇸" },
  { code: "sk", locale: "sk-SK", emoji: "🇸🇰" },
  { code: "sl", locale: "sl-SI", emoji: "🇸🇮" },
  { code: "lt", locale: "lt-LT", emoji: "🇱🇹" },
  { code: "lv", locale: "lv-LV", emoji: "🇱🇻" },
  { code: "et", locale: "et-EE", emoji: "🇪🇪" },
  { code: "is", locale: "is-IS", emoji: "🇮🇸" },
  { code: "ga", locale: "ga-IE", emoji: "🇮🇪" },
  { code: "cy", locale: "cy-GB", emoji: "🏴" },
  { code: "ca", locale: "ca-ES", emoji: "🇪🇸" },
  { code: "eu", locale: "eu-ES", emoji: "🇪🇸" },
  { code: "gl", locale: "gl-ES", emoji: "🇪🇸" },
  { code: "am", locale: "am-ET", emoji: "🇪🇹" },
  { code: "yo", locale: "yo-NG", emoji: "🇳🇬" },
  { code: "zu", locale: "zu-ZA", emoji: "🇿🇦" },
];

/** BCP-47 tags that the pronunciation pipeline is allowed to synthesize. */
export const SPEECH_LOCALES: readonly string[] = SUPPORTED.map((language) => language.locale);

/** Guard for the public TTS route and client-side voice selection. */
export function isSpeechLocale(locale: string): boolean {
  return SPEECH_LOCALES.includes(locale);
}

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

/** The full catalogue with live-resolved display names. */
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

/** Every language can be learned and every language can be a native language. */
export async function getTargetLanguages(source: string): Promise<Language[]> {
  const all = await getLanguages();
  return all.filter((language) => language.code !== source);
}
