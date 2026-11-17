"use client";

/**
 * Native pronunciation via the browser's Web Speech Synthesis API.
 * No audio files are bundled: every listening prompt is generated at runtime
 * from the live translated word using an installed system voice.
 */

function pickVoice(locale: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;

  const exact = voices.find((voice) => voice.lang.toLowerCase() === locale.toLowerCase());
  if (exact) return exact;

  const language = locale.split("-")[0].toLowerCase();
  return voices.find((voice) => voice.lang.toLowerCase().startsWith(language));
}

export function speak(text: string, locale: string, rate = 0.85): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      resolve();
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = rate;
    utterance.pitch = 1;

    const voice = pickVoice(locale);
    if (voice) utterance.voice = voice;

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    utterance.onend = finish;
    utterance.onerror = finish;
    // Some browsers never fire onend for very short strings.
    window.setTimeout(finish, Math.max(1200, text.length * 160));
    window.speechSynthesis.speak(utterance);
  });
}

/** Warm up voice lists — Chrome loads them lazily. */
export function warmUpVoices(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.getVoices();
  }
}

/** Play a dictionary-provided recording when available, else synthesize. */
export async function playPronunciation(
  text: string,
  locale: string,
  audioUrl?: string | null,
): Promise<void> {
  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      await audio.play();
      return;
    } catch {
      // Fall through to Web Speech when the remote recording is blocked.
    }
  }
  await speak(text, locale);
}
