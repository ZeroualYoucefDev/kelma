"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { purchaseItem } from "@/actions/shop";
import type { PaymentMethod } from "@/lib/chargily";

export function PurchaseButton({
  itemId,
  disabled,
}: {
  itemId: string;
  disabled?: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function handle() {
    setLoading(true);
    try {
      const result = await purchaseItem(itemId);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Purchase failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" onClick={handle} disabled={loading || disabled}>
      {loading ? "Adding…" : "Redeem"}
    </Button>
  );
}

export function CheckoutButtons({ compact = false }: { compact?: boolean }) {
  const [loading, setLoading] = useState<PaymentMethod | null>(null);

  async function checkout(method: PaymentMethod) {
    setLoading(method);
    try {
      const response = await fetch("/api/checkout/chargily", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ method }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error ?? "Could not start checkout.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout unavailable.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className={compact ? "grid gap-2" : "grid gap-3 sm:grid-cols-2"}>
      <Button variant="pro" onClick={() => checkout("cib")} disabled={loading !== null}>
        {loading === "cib" ? "Opening…" : "Pay with CIB"}
      </Button>
      <Button variant="pro" onClick={() => checkout("edahabia")} disabled={loading !== null}>
        {loading === "edahabia" ? "Opening…" : "Pay with Edahabia"}
      </Button>
      <Button
        variant="secondary"
        className={compact ? "" : "sm:col-span-2"}
        onClick={() => checkout("chargily_app")}
        disabled={loading !== null}
      >
        {loading === "chargily_app" ? "Opening…" : "Pay with Chargily App"}
      </Button>
    </div>
  );
}
