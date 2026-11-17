import { NextResponse } from "next/server";
import { buildCurriculum } from "@/services/curriculum";

export const runtime = "nodejs";

/** Live unit map for clients that want to refresh the path without a reload. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const source = url.searchParams.get("source") ?? "en";
  const target = url.searchParams.get("target") ?? "es";

  try {
    const curriculum = await buildCurriculum(source, target);
    return NextResponse.json(curriculum, {
      headers: { "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Curriculum unavailable" },
      { status: 502 },
    );
  }
}
