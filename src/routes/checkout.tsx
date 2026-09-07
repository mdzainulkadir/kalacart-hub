import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";

import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/kalacart";
import { placeOrder } from "@/lib/kalacart.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout | KalaCart" },
      {
        name: "description",
        content:
          "Enter your delivery details and place your order — payment goes straight to the artisan who made your craft.",
      },
      { property: "og:title", content: "Checkout | KalaCart" },
      { property: "og:description", content: "Place your order directly with the artisan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Checkout,
});

export const LAST_ORDER_KEY = "kalacart.lastOrder.v1";

function Checkout() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const submitOrder = useServerFn(placeOrder);

  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-serif text-2xl font-bold">There's nothing to check out yet</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Add a craft to your cart and come back.
          </p>
          <Button asChild className="mt-6 rounded-full px-8">
            <Link to="/">Continue Shopping</Link>
          </Button>
        </div>
      </PageShell>
    );
  }

  function validate() {
    const next: Record<string, string> = {};
    if (form.name.trim().length < 2) next.name = "Please enter your full name";
    if (form.address.trim().length < 10) next.address = "Please enter a complete delivery address";
    const digits = form.phone.replace(/\D/g, "");
    if (digits.length < 10) next.phone = "Enter a valid phone number (at least 10 digits)";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setFailure(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await submitOrder({
        data: {
          buyerName: form.name.trim(),
          buyerAddress: form.address.trim(),
          buyerPhone: form.phone.trim(),
          items: items.map((i) => ({
            productId: i.productId,
            size: i.size,
            quantity: i.quantity,
          })),
        },
      });

      try {
        window.sessionStorage.setItem(
          LAST_ORDER_KEY,
          JSON.stringify({ items, total, buyerName: form.name.trim() }),
        );
      } catch {
        /* storage blocked */
      }

      clear();
      void navigate({ to: "/confirmation" });
    } catch (error) {
      console.error(error);
      setFailure("We couldn't place your order. Your cart is safe — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell>
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.3fr_1fr] lg:px-8">
        <div>
          <h1 className="font-serif text-3xl font-bold sm:text-4xl">Delivery details</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The artisan gets your order on WhatsApp the moment you place it.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ananya Sharma"
              />
              {errors["name"] && <p className="text-xs text-destructive">{errors["name"]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Delivery address</Label>
              <Textarea
                id="address"
                rows={4}
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="House no, street, city, state, PIN code"
              />
              {errors["address"] && <p className="text-xs text-destructive">{errors["address"]}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                inputMode="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
              {errors["phone"] && <p className="text-xs text-destructive">{errors["phone"]}</p>}
            </div>

            {failure && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
                {failure}
              </div>
            )}

            <Button type="submit" size="lg" disabled={submitting} className="rounded-full px-9">
              {submitting ? "Placing order…" : failure ? "Retry order" : "Place Order"}
            </Button>
          </form>
        </div>

        <aside className="h-fit rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
          <h2 className="font-serif text-xl font-bold">Order summary</h2>
          <ul className="mt-5 space-y-4">
            {items.map((i) => (
              <li key={`${i.productId}-${i.size}`} className="flex gap-3 text-sm">
                <img
                  src={i.imageUrl ?? ""}
                  alt={i.title}
                  className="h-14 w-14 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-medium leading-snug">{i.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {i.size} · Qty {i.quantity}
                  </p>
                </div>
                <span className="font-medium">{formatINR(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="font-serif text-xl font-bold text-primary">{formatINR(total)}</span>
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
