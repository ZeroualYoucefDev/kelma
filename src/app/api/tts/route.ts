import { isSpeechLocale } from "@/services/languages";

export const runtime = "nodejs";

const UPSTREAM = "https://translate.google.com/translate_tts";

/** A few BCP-47 tags need a provider-specific language code. */
const PROVIDER_LANGUAGE: Record<string, string> = {
  "zh-CN": "zh-CN",
  "pt-PT": "pt",
  "nb-NO": "no",
  "he-IL": "he",
  "fa-IR": "fa",
  "cy-GB": "cy",
};

function providerLanguage(locale: string): string {
  return PROVIDER_LANGUAGE[locale] ?? locale.split("-")[0].toLowerCase();
}

/**
 * Locale-locked pronunciation audio. The browser only has a handful of local
 * voices installed, which makes Chromium read Spanish or Italian with the
 * default French voice. Streaming a clean provider voice here keeps every
 * lesson in the exact target locale; the client still sets
 * `SpeechSynthesisUtterance.lang` for the Web Speech fallback.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const text = (url.searchParams.get("text") ?? url.searchParams.get("q") ?? "").trim();
  const locale = (url.searchParams.get("locale") ?? url.searchParams.get("tl") ?? "").trim();

  if (!text || text.length > 200) {
    return Response.json({ error: "Provide a short `text` parameter." }, { status: 400 });
  }
  if (!isSpeechLocale(locale)) {
    return Response.json({ error: "Unsupported speech locale." }, { status: 400 });
  }

  const upstream = new URL(UPSTREAM);
  upstream.searchParams.set("ie", "UTF-8");
  upstream.searchParams.set("client", "tw-ob");
  upstream.searchParams.set("tl", providerLanguage(locale));
  upstream.searchParams.set("q", text);

  try {
    const response = await fetch(upstream, {
      headers: {
        accept: "audio/mpeg,audio/*;q=0.9,*/*;q=0.1",
        "user-agent": "Mozilla/5.0 (compatible; Kelma/1.0)",
      },
      signal: AbortSignal.timeout(10_000),
      cache: "force-cache",
    });

    if (!response.ok) {
      return Response.json({ error: "Pronunciation provider unavailable." }, { status: 502 });
    }

    const audio = await response.arrayBuffer();
    if (audio.byteLength === 0) {
      return Response.json({ error: "Pronunciation provider returned no audio." }, { status: 502 });
    }

    return new Response(audio, {
      headers: {
        "content-type": "audio/mpeg",
        "content-length": String(audio.byteLength),
        "cache-control": "public, max-age=31536000, immutable",
        "x-pronunciation-locale": locale,
      },
    });
  } catch {
    return Response.json({ error: "Pronunciation provider unavailable." }, { status: 502 });
  }
}
