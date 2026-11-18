import { NextResponse } from "next/server";
import { requireOnboardedViewer } from "@/lib/auth";
import { createProCheckout, isChargilyConfigured, type PaymentMethod } from "@/lib/chargily";
import { getPlayer } from "@/lib/data";

export const runtime = "nodejs";

const METHODS: PaymentMethod[] = ["cib", "edahabia", "chargily_app"];

export async function POST(request: Request) {
  try {
    const viewer = await requireOnboardedViewer();

    if (!isChargilyConfigured()) {
      return NextResponse.json(
        { error: "Chargily Pay is not configured on this deployment." },
        { status: 503 },
      );
    }

    const body = (await request.json().catch(() => ({}))) as { method?: unknown };
    const method: PaymentMethod = METHODS.includes(body.method as PaymentMethod)
      ? (body.method as PaymentMethod)
      : "cib";

    const player = await getPlayer(viewer);
    const checkout = await createProCheckout({
      userId: viewer.id,
      email: player.email,
      name: player.name,
      method,
    });

    return NextResponse.json({ url: checkout.checkout_url, id: checkout.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create checkout.";
    const unauthorized =
      message.includes("signed in") || message.includes("Verify") || message.includes("onboarding");
    const misconfigured =
      message.includes("not configured") || message.includes("placeholder");
    const status = unauthorized ? 401 : misconfigured ? 503 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
