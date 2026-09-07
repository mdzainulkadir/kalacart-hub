import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Minus, Plus, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageShell } from "@/components/PageShell";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { fallbackImage, formatINR, ratingFor, type Product } from "@/lib/kalacart";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Handmade craft detail | KalaCart" },
      {
        name: "description",
        content:
          "See the full story, materials and maker behind this handmade Indian craft, and buy it directly from the artisan.",
      },
      { property: "og:title", content: "Handmade craft detail | KalaCart" },
      {
        property: "og:description",
        content: "The story, materials and artisan behind this handmade Indian craft.",
      },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [size, setSize] = useState("");
  const [qty, setQty] = useState(1);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["product", id],
    queryFn: async (): Promise<Product | null> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return (data as Product | null) ?? null;
    },
  });

  const related = useQuery({
    queryKey: ["related", data?.category, id],
    enabled: Boolean(data?.category),
    queryFn: async (): Promise<Product[]> => {
      const { data: rows, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "published")
        .eq("category", data!.category)
        .neq("id", id)
        .limit(4);
      if (error) throw new Error(error.message);
      return (rows ?? []) as Product[];
    },
  });

  useEffect(() => {
    if (data?.size_options?.length && !size) setSize(data.size_options[0] ?? "");
  }, [data, size]);

  function add() {
    if (!data) return;
    addItem({
      productId: data.id,
      title: data.title,
      price: Number(data.price),
      imageUrl: data.image_url,
      size: size || data.size_options[0] || "Standard",
      quantity: qty,
      sellerName: data.seller_name,
    });
    toast.success(`${data.title} added to your cart`);
  }

  if (isLoading) {
    return (
      <PageShell>
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <div className="space-y-5">
            <Skeleton className="h-9 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-11 w-40" />
          </div>
        </div>
      </PageShell>
    );
  }

  if (isError || !data) {
    return (
      <PageShell>
        <div className="mx-auto max-w-lg px-4 py-24 text-center">
          <h1 className="font-serif text-2xl font-bold">We couldn't find that craft</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            It may have been sold or removed by the artisan.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Button onClick={() => void refetch()} variant="outline" className="rounded-full px-6">
              Try again
            </Button>
            <Button onClick={() => void navigate({ to: "/" })} className="rounded-full px-6">
              Continue shopping
            </Button>
          </div>
        </div>
      </PageShell>
    );
  }

  const { rating, reviews } = ratingFor(data.id);

  return (
    <PageShell>
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <img
            src={data.image_url || fallbackImage(data)}
            alt={data.title}
            className="aspect-square w-full object-cover"
          />
        </div>

        <div>
          <h1 className="font-serif text-3xl font-bold leading-tight sm:text-4xl">{data.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {data.seller_name} · {data.seller_location}
            </span>
            <span className="flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-xs font-semibold text-gold-foreground">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" /> Verified Artisan
            </span>
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-sm">
            <Star className="h-4 w-4 fill-gold text-gold" aria-hidden="true" />
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-muted-foreground">({reviews} reviews)</span>
          </div>

          <p className="mt-6 font-serif text-3xl font-bold text-primary">
            {formatINR(Number(data.price))}
          </p>

          <p className="mt-6 text-base leading-relaxed text-muted-foreground">{data.description}</p>

          <div className="mt-6">
            <h2 className="text-sm font-semibold">Materials</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.materials.map((m) => (
                <span
                  key={m}
                  className="rounded-full border border-border bg-secondary px-3 py-1 text-xs"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold">Size</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {data.size_options.map((s) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-colors",
                    size === s
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:border-primary hover:text-primary",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-sm font-semibold">Quantity</h2>
            <div className="mt-2 inline-flex items-center rounded-full border border-border bg-card">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-10 text-center text-sm font-medium">{qty}</span>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setQty((q) => Math.min(99, q + 1))}
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={add} size="lg" variant="outline" className="rounded-full px-8">
              Add to Cart
            </Button>
            <Button
              size="lg"
              className="rounded-full px-8"
              onClick={() => {
                add();
                void navigate({ to: "/checkout" });
              }}
            >
              Buy Now
            </Button>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6 lg:px-8">
        <h2 className="mb-6 font-serif text-2xl font-bold">You may also like</h2>
        {related.isLoading ? (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (related.data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            This is the only piece in {data.category} right now — more are on the way.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
            {(related.data ?? []).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}
