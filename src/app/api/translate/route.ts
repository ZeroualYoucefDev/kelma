import { NextResponse } from "next/server";
import { translate } from "@/services/translation";

export const runtime = "nodejs";

/** Thin proxy over the live translation provider for client-side checks. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const from = url.searchParams.get("from") ?? "en";
  const to = url.searchParams.get("to") ?? "es";

  if (!q || q.length > 120) {
    return NextResponse.json({ error: "Provide a short `q` parameter." }, { status: 400 });
  }

  try {
    const text = await translate(q, from, to);
    return NextResponse.json({ text }, {
      headers: { "cache-control": "public, s-maxage=86400" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Translation unavailable" },
      { status: 502 },
    );
  }
}
