import { Link, createFileRoute } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart";
import { formatINR } from "@/lib/kalacart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Cart | KalaCart" },
      {
        name: "description",
        content: "Review the handmade Indian crafts in your cart before checking out on KalaCart.",
      },
      { property: "og:title", content: "Your Cart | KalaCart" },
      { property: "og:description", content: "Review your handmade crafts before checkout." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, total, setQuantity, removeItem } = useCart();

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl font-bold sm:text-4xl">Your cart</h1>

        {items.length === 0 ? (
          <div className="mt-10 rounded-xl border border-dashed border-border bg-card p-16 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
            <p className="mt-4 font-serif text-xl font-semibold">Your cart is empty</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Somewhere in India, a potter's wheel is turning. Go find something you love.
            </p>
            <Button asChild className="mt-6 rounded-full px-8">
              <Link to="/">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}`}
                  className="flex gap-4 rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-soft)]"
                >
                  <img
                    src={item.imageUrl ?? ""}
                    alt={item.title}
                    className="h-24 w-24 shrink-0 rounded-lg object-cover"
                  />
                  <div className="flex flex-1 flex-col gap-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <Link
                          to="/product/$id"
                          params={{ id: item.productId }}
                          className="font-serif text-base font-semibold hover:text-primary"
                        >
                          {item.title}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          Size: {item.size} · by {item.sellerName}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-full"
                        aria-label={`Remove ${item.title}`}
                        onClick={() => removeItem(item.productId, item.size)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          aria-label="Decrease quantity"
                          onClick={() =>
                            setQuantity(item.productId, item.size, item.quantity - 1)
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-9 text-center text-sm font-medium">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full"
                          aria-label="Increase quantity"
                          onClick={() =>
                            setQuantity(item.productId, item.size, item.quantity + 1)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <span className="font-serif text-lg font-bold text-primary">
                        {formatINR(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-serif text-2xl font-bold text-primary">
                  {formatINR(total)}
                </span>
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link to="/checkout">Proceed to Checkout</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                  <Link to="/">Continue Shopping</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </PageShell>
  );
}
