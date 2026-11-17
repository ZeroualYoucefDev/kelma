import { NextResponse } from "next/server";
import { parseWebhook, verifyWebhookSignature, type ChargilyEvent } from "@/lib/chargily";
import { activatePro, recordPurchase } from "@/lib/data";

export const runtime = "nodejs";

/**
 * Chargily Pay v2 webhook.
 *
 * 1. Verify the `signature` header = HMAC-SHA256(raw body, CHARGILY_SECRET_KEY)
 * 2. Ignore everything except `checkout.paid`
 * 3. Activate Pro exactly once (unique checkout id constraint)
 * 4. Always answer 2xx so Chargily stops retrying
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

  if (event.type === "checkout.paid") {
    const checkout = event.data;
    const userId = checkout.metadata?.userId;

    if (userId && checkout.status === "paid") {
      const firstTime = await recordPurchase({
        userId,
        checkoutId: checkout.id,
        kind: "pro",
        amountDzd: Number(checkout.amount ?? 0),
        livemode: String(event.livemode) === "true",
      });
      if (firstTime) await activatePro(userId);
    }
  }

  return NextResponse.json({ received: true });
}
