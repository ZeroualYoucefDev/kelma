"use client";

/**
 * Native pronunciation with a clean, locale-locked voice.
 *
 * Browsers only ship a handful of local voices, so setting `utterance.lang` to
 * `es-ES` is not enough: Chromium happily reads it with the default French
 * voice. Kelma therefore streams a provider voice from `/api/tts` first and
 * uses the Web Speech API only when a genuine same-language system voice is
 * available. `SpeechSynthesisUtterance.lang` is still always set to the exact
 * active target locale.
 */

let voiceListPromise: Promise<SpeechSynthesisVoice[]> | null = null;
let activeAudio: HTMLAudioElement | null = null;
let playbackToken = 0;

function baseLanguage(locale: string): string {
  return locale.toLowerCase().split("-")[0];
}

function normalizeLocale(locale: string): string {
  return locale.toLowerCase().replace("_", "-");
}

function voiceMatchesLocale(voice: SpeechSynthesisVoice, locale: string): boolean {
  const voiceLang = normalizeLocale(voice.lang);
  const target = normalizeLocale(locale);
  return (
    voiceLang === target ||
    voiceLang.startsWith(`${target}-`) ||
    voiceLang.startsWith(`${baseLanguage(locale)}-`)
  );
}

function scoreVoice(voice: SpeechSynthesisVoice, locale: string): number {
  if (!voiceMatchesLocale(voice, locale)) return -1;

  const voiceLang = normalizeLocale(voice.lang);
  const target = normalizeLocale(locale);
  let score = voiceLang === target ? 120 : voiceLang.startsWith(`${target}-`) ? 100 : 70;

  // Online/natural voices are noticeably cleaner than the old local ones.
  if (!voice.localService) score += 30;
  if (/natural|neural|premium|enhanced|online|google|siri|aria|jenny|guy|sonia|elvira|helena/i.test(voice.name)) {
    score += 25;
  }
  if (/desktop|legacy/i.test(voice.name)) score -= 10;
  if (voice.default) score -= 5;

  return score;
}

/** Chrome loads voices lazily; wait for them, but never hang the lesson. */
function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    return Promise.resolve([]);
  }
  if (voiceListPromise) return voiceListPromise;

  voiceListPromise = new Promise((resolve) => {
    const current = window.speechSynthesis.getVoices();
    if (current.length) {
      resolve(current);
      return;
    }

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      window.speechSynthesis.removeEventListener?.("voiceschanged", onChange);
      resolve(window.speechSynthesis.getVoices());
    };
    const onChange = () => finish();

    window.speechSynthesis.addEventListener?.("voiceschanged", onChange);
    window.setTimeout(finish, 1500);
  });

  return voiceListPromise;
}

async function pickVoice(locale: string): Promise<SpeechSynthesisVoice | undefined> {
  const voices = await loadVoices();
  return voices
    .map((voice) => ({ voice, score: scoreVoice(voice, locale) }))
    .filter((candidate) => candidate.score >= 0)
    .sort((a, b) => b.score - a.score)[0]?.voice;
}

function stopCurrentPlayback(): number {
  playbackToken += 1;
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  return playbackToken;
}

function playAudioUrl(src: string, timeoutMs: number): Promise<boolean> {
  const token = stopCurrentPlayback();

  return new Promise((resolve) => {
    const audio = new Audio(src);
    audio.preload = "auto";
    activeAudio = audio;

    let settled = false;
    let timer = 0;
    const finish = (ok: boolean) => {
      if (settled || token !== playbackToken) return;
      settled = true;
      window.clearTimeout(timer);
      if (activeAudio === audio) {
        activeAudio = null;
        if (!ok) audio.pause();
      }
      resolve(ok);
    };

    timer = window.setTimeout(() => finish(false), timeoutMs);
    audio.onended = () => finish(true);
    audio.onerror = () => finish(false);
    audio.play().catch(() => finish(false));
  });
}

function pronunciationUrl(text: string, locale: string): string {
  return `/api/tts?${new URLSearchParams({ text, locale }).toString()}`;
}

/** Web Speech fallback, restricted to a voice that really speaks the locale. */
export async function speak(text: string, locale: string, rate = 0.85): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const token = stopCurrentPlayback();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = locale;
  utterance.rate = rate;
  utterance.pitch = 1;

  const voices = await loadVoices();
  if (token !== playbackToken) return;

  const voice = await pickVoice(locale);
  if (token !== playbackToken) return;

  // If the OS only has other languages installed, do NOT speak with its
  // default voice — that is what made Spanish sound French.
  if (voices.length > 0 && !voice) return;
  if (voice) utterance.voice = voice;

  return new Promise((resolve) => {
    let settled = false;
    let timer = 0;
    const finish = () => {
      if (settled || token !== playbackToken) return;
      settled = true;
      window.clearTimeout(timer);
      resolve();
    };

    timer = window.setTimeout(finish, Math.max(1200, text.length * 160));
    utterance.onend = finish;
    utterance.onerror = finish;
    window.speechSynthesis.speak(utterance);
  });
}

/** Warm up voice lists — Chrome loads them lazily. */
export function warmUpVoices(): void {
  void loadVoices();
}

/** Play a dictionary recording when available, else a clean locale-matched voice. */
export async function playPronunciation(
  text: string,
  locale: string,
  audioUrl?: string | null,
): Promise<void> {
  const timeout = Math.max(6000, text.length * 260);

  if (audioUrl && (await playAudioUrl(audioUrl, timeout))) return;
  if (await playAudioUrl(pronunciationUrl(text, locale), timeout)) return;

  await speak(text, locale);
}
