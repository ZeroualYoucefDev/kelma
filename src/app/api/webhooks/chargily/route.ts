import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import {
  parseWebhook,
  verifyWebhookSignature,
  webhookMatchesMode,
  type ChargilyEvent,
} from "@/lib/chargily";
import { provisionProPurchase } from "@/lib/data";

export const runtime = "nodejs";

/**
 * Chargily Pay v2 webhook.
 *
 * 1. Verify the `signature` header = HMAC-SHA256(raw body, CHARGILY_SECRET_KEY)
 * 2. Reject events from the wrong mode (test ≠ live)
 * 3. Ignore everything except a paid checkout with our userId metadata
 * 4. Activate Pro exactly once (unique checkout id constraint)
 * 5. Always answer 2xx so Chargily stops retrying
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  let event: ChargilyEvent;
  try {
    event = parseWebhook(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed payload" }, { status: 400 });
  }

  if (!webhookMatchesMode(event)) {
    return NextResponse.json({ received: true, ignored: "mode mismatch" });
  }

  if (event.type === "checkout.paid") {
    const checkout = event.data;
    const userId = checkout.metadata?.userId;

    if (!userId || checkout.status !== "paid") {
      return NextResponse.json({ received: true, ignored: "not a paid kelma checkout" });
    }

    try {
      const firstTime = await provisionProPurchase({
        userId,
        checkoutId: checkout.id,
        kind: "pro",
        amountDzd: Number(checkout.amount ?? 0),
        livemode: String(event.livemode) === "true" || event.livemode === true,
      });

      if (firstTime) {
        revalidatePath("/settings");
        revalidatePath("/profile");
        revalidatePath("/learn");
      }
    } catch {
      // A 500 makes Chargily retry; the unique checkout constraint keeps this
      // activation idempotent when it does.
      return NextResponse.json({ error: "Could not record purchase" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
