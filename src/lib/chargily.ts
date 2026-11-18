import { createHmac, timingSafeEqual } from "node:crypto";
import { appUrl } from "./config";

/**
 * Chargily Pay API v2 client (direct REST, no vendor lock-in).
 * Supports DZD checkouts via CIB, Edahabia and the Chargily app.
 */

export type PaymentMethod = "cib" | "edahabia" | "chargily_app";
export type ChargilyMode = "test" | "live";

export type ChargilyCheckout = {
  id: string;
  checkout_url: string;
  status: string;
  amount: number;
  currency: string;
};

export type ChargilyEvent = {
  id: string;
  type: string;
  livemode: string | boolean;
  data: {
    id: string;
    status: string;
    metadata?: Record<string, string> | null;
    [key: string]: unknown;
  };
};

export function chargilyMode(): ChargilyMode {
  return process.env.CHARGILY_MODE === "live" ? "live" : "test";
}

function baseUrl(): string {
  const configured = process.env.CHARGILY_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  return chargilyMode() === "live"
    ? "https://pay.chargily.net/api/v2"
    : "https://pay.chargily.net/test/api/v2";
}

function apiKey(): string {
  const key = process.env.CHARGILY_API_KEY?.trim();
  if (!key) throw new Error("Chargily Pay is not configured on this deployment.");
  return key;
}

function webhookSecret(): string {
  const secret =
    process.env.CHARGILY_SECRET_KEY?.trim() || process.env.CHARGILY_API_KEY?.trim();
  if (!secret) throw new Error("Chargily webhook secret is not configured.");
  return secret;
}

export function isChargilyConfigured(): boolean {
  return Boolean(process.env.CHARGILY_API_KEY?.trim());
}

function proAmount(): number {
  const raw = process.env.CHARGILY_PRO_AMOUNT_DZD?.trim() ?? "9900";
  const amount = Number(raw);
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error("CHARGILY_PRO_AMOUNT_DZD must be a positive integer.");
  }
  return amount;
}

function responseError(payload: { error?: unknown; message?: unknown }, status: number): string {
  const detail =
    (typeof payload.message === "string" && payload.message) ||
    (typeof payload.error === "string" && payload.error) ||
    (payload.error && typeof payload.error === "object" && "message" in payload.error
      ? String((payload.error as { message?: unknown }).message ?? "")
      : "");
  return `Chargily checkout failed (${status})${detail ? `: ${detail}` : ""}.`;
}

export async function createProCheckout(input: {
  userId: string;
  email: string;
  name: string;
  method?: PaymentMethod;
}): Promise<ChargilyCheckout> {
  const priceId = process.env.CHARGILY_PRO_PRICE_ID?.trim();
  const body: Record<string, unknown> = {
    success_url: `${appUrl}/settings?checkout=success`,
    failure_url: `${appUrl}/settings?checkout=failed`,
    webhook_endpoint: `${appUrl}/api/webhooks/chargily`,
    payment_method: input.method ?? "cib",
    description: "kelma Pro — unlimited hearts and advanced drills",
    locale: "en",
    chargily_pay_fees_allocation: "merchant",
    metadata: {
      userId: input.userId,
      plan: "pro",
      email: input.email,
      name: input.name,
    },
  };

  if (priceId) {
    body.items = [{ price: priceId, quantity: 1 }];
  } else {
    body.amount = proAmount();
    body.currency = "dzd";
  }

  const response = await fetch(`${baseUrl()}/checkouts`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey()}`,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const payload = (await response.json().catch(() => ({}))) as Partial<ChargilyCheckout> & {
    error?: unknown;
    message?: unknown;
  };

  if (!response.ok || !payload.checkout_url) {
    throw new Error(responseError(payload, response.status));
  }

  return payload as ChargilyCheckout;
}

/**
 * Constant-time HMAC-SHA256 verification of the raw webhook body using the
 * Chargily secret key. Chargily sends the hex digest in the `signature` header.
 */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature) return false;

  let secret: string;
  try {
    secret = webhookSecret();
  } catch {
    return false;
  }

  const expected = createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
  const received = signature.trim().toLowerCase();

  if (expected.length !== received.length) return false;
  return timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(received, "utf8"));
}

export function parseWebhook(rawBody: string): ChargilyEvent {
  const event = JSON.parse(rawBody) as ChargilyEvent;
  if (!event?.type || !event?.data?.id) throw new Error("Malformed Chargily event.");
  return event;
}

/** Reject cross-mode webhooks (a test event can never activate live Pro). */
export function webhookMatchesMode(event: ChargilyEvent): boolean {
  const eventLive = String(event.livemode) === "true" || event.livemode === true;
  return eventLive === (chargilyMode() === "live");
}
