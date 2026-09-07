import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import type { CartItem } from "@/lib/cart";
import { formatINR } from "@/lib/kalacart";
import { LAST_ORDER_KEY } from "./checkout";

export const Route = createFileRoute("/confirmation")({
  head: () => ({
    meta: [
      { title: "Order Confirmed | KalaCart" },
      {
        name: "description",
        content:
          "Your order is confirmed and the artisan has been notified. Thank you for buying direct.",
      },
      { property: "og:title", content: "Order Confirmed | KalaCart" },
      { property: "og:description", content: "Your handmade craft order is on its way." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Confirmation,
});

type LastOrder = { items: CartItem[]; total: number; buyerName: string };

function Confirmation() {
  const [order, setOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(LAST_ORDER_KEY);
      if (raw) setOrder(JSON.parse(raw) as LastOrder);
    } catch {
      /* ignore */
    }
  }, []);

  return (
    <PageShell>
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" aria-hidden="true" />
        <h1 className="mt-5 font-serif text-3xl font-bold sm:text-4xl">
          Thank you{order?.buyerName ? `, ${order.buyerName.split(" ")[0]}` : ""}!
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Your order is confirmed and the artisan has already been messaged on WhatsApp.
        </p>

        {order && order.items.length > 0 && (
          <div className="mt-10 rounded-xl border border-border bg-card p-6 text-left shadow-[var(--shadow-soft)]">
            <h2 className="font-serif text-xl font-bold">Order summary</h2>
            <ul className="mt-5 space-y-4">
              {order.items.map((i) => (
                <li key={`${i.productId}-${i.size}`} className="flex gap-3 text-sm">
                  <img
                    src={i.imageUrl ?? ""}
                    alt={i.title}
                    className="h-14 w-14 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-medium leading-snug">{i.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {i.size} · Qty {i.quantity} · by {i.sellerName}
                    </p>
                  </div>
                  <span className="font-medium">{formatINR(i.price * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="font-serif text-xl font-bold text-primary">
                {formatINR(order.total)}
              </span>
            </div>
          </div>
        )}

        <p className="mx-auto mt-8 max-w-md rounded-xl bg-secondary p-5 text-sm leading-relaxed">
          Every rupee of this order supports the artisan directly — no agents, no commissions, no
          middlemen taking a cut of their craft.
        </p>

        <Button asChild size="lg" className="mt-8 rounded-full px-9">
          <Link to="/">Continue Shopping</Link>
        </Button>
      </div>
    </PageShell>
  );
}
