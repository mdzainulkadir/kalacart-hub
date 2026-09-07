import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, MessageCircle, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";

import heroImage from "@/assets/hero-artisan.jpg";
import { ContactSection } from "@/components/ContactSection";
import { PageShell } from "@/components/PageShell";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BECOME_SELLER_URL, CATEGORIES, type Product } from "@/lib/kalacart";
import { cn } from "@/lib/utils";

type Search = { q?: string | undefined };

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search["q"] === "string" && search["q"] ? (search["q"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "KalaCart — Handmade Indian Crafts Direct From Rural Artisans" },
      {
        name: "description",
        content:
          "Shop pottery, handloom, bamboo craft, tribal jewelry, home decor and wooden toys made by rural Indian artisans. Every rupee goes straight to the maker.",
      },
      { property: "og:title", content: "KalaCart — Handmade Indian Crafts" },
      {
        property: "og:description",
        content:
          "A marketplace connecting rural Indian artisans directly with buyers. No middlemen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function useProducts() {
  return useQuery({
    queryKey: ["products", "published"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return (data ?? []) as Product[];
    },
  });
}

function SectionHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-serif text-2xl font-bold sm:text-3xl">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

function Home() {
  const { q } = Route.useSearch();
  const { data, isLoading, isError, refetch, isFetching } = useProducts();
  const [category, setCategory] = useState<string>("All");

  const products = data ?? [];

  const filtered = useMemo(() => {
    const term = (q ?? "").trim().toLowerCase();
    return products.filter((p) => {
      const matchesCategory = category === "All" || p.category === category;
      const matchesTerm =
        !term ||
        p.title.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.seller_location.toLowerCase().includes(term);
      return matchesCategory && matchesTerm;
    });
  }, [products, category, q]);

  const trending = useMemo(() => {
    return [...products]
      .sort((a, b) => (a.id > b.id ? 1 : -1))
      .filter((_, i) => i % 2 === 0)
      .slice(0, 8);
  }, [products]);

  const newArrivals = products.slice(0, 8);

  function scrollToShop() {
    document.getElementById("shop")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <PageShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <img
          src={heroImage}
          alt="An artisan shaping a clay pot on a potter's wheel"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="max-w-xl">
            <p className="mb-4 inline-block rounded-full bg-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-foreground">
              Direct from the village
            </p>
            <h1 className="font-serif text-4xl font-bold leading-tight sm:text-6xl">
              Handmade by artisans. <span className="text-primary">Bought straight</span> from them.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              KalaCart removes the middlemen who take most of a craftsperson's earnings. You meet
              the maker, you know the town, and your money reaches the hands that shaped your piece.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={scrollToShop} className="rounded-full px-8">
                Shop Now
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-full border-primary bg-card px-8 text-primary"
              >
                <a href={BECOME_SELLER_URL} target="_blank" rel="noreferrer">
                  Become a Seller
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Impact stats */}
      <div className="border-y border-border bg-secondary">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-center gap-3 px-4 py-6 text-center text-sm font-medium sm:flex-row sm:gap-8 sm:px-6 lg:px-8">
          <span>500+ Artisans Empowered</span>
          <span className="hidden text-primary sm:inline">·</span>
          <span>6 Craft Categories</span>
          <span className="hidden text-primary sm:inline">·</span>
          <span>100% Direct-to-Artisan</span>
        </div>
      </div>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-16 sm:px-6 lg:px-8">
        <SectionHeading title="Browse by craft" subtitle="Six living traditions, one marketplace." />
        <div className="flex flex-wrap gap-2.5">
          {["All", ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-colors",
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:border-primary hover:text-primary",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <SectionHeading title="Trending Now" subtitle="What buyers are reaching for this week." />
        {isLoading ? (
          <div className="scroll-row">
            {Array.from({ length: 5 }).map((_, i) => (
              <ProductCardSkeleton key={i} className="w-64" />
            ))}
          </div>
        ) : (
          <div className="scroll-row">
            {trending.map((p) => (
              <ProductCard key={p.id} product={p} className="w-64" />
            ))}
          </div>
        )}
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
        <SectionHeading title="New Arrivals" subtitle="Freshly listed by artisans across India." />
        {isLoading ? (
          <div className="scroll-row">
            {Array.from({ length: 5 }).map((_, i) => (
              <ProductCardSkeleton key={i} className="w-64" />
            ))}
          </div>
        ) : (
          <div className="scroll-row">
            {newArrivals.map((p) => (
              <ProductCard key={p.id} product={p} className="w-64" />
            ))}
          </div>
        )}
      </section>

      {/* Grid */}
      <section id="shop" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-16 sm:px-6 lg:px-8">
        <SectionHeading
          title={category === "All" ? "All crafts" : category}
          subtitle={q ? `Showing results for “${q}”` : "Every piece made by hand, one at a time."}
        />

        {isError ? (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <p className="font-serif text-lg font-semibold">We couldn't load the crafts</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Something went wrong reaching our shelves.
            </p>
            <Button onClick={() => void refetch()} className="mt-5 rounded-full px-8">
              {isFetching ? "Retrying…" : "Try again"}
            </Button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card p-14 text-center">
            <p className="font-serif text-xl font-semibold">Nothing here just yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              We couldn't find a craft matching that. Try another word, or browse all categories.
            </p>
            <Button
              variant="outline"
              className="mt-6 rounded-full px-8"
              onClick={() => setCategory("All")}
            >
              Show everything
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Become a seller banner */}
      <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-xl bg-primary px-6 py-12 text-center text-primary-foreground shadow-[var(--shadow-lift)] sm:px-12">
          <h2 className="font-serif text-3xl font-bold sm:text-4xl">Do you make things by hand?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed opacity-95 sm:text-base">
            List your craft with one WhatsApp message. No forms, no computer, no commission agents —
            just a photo and a chat.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="mt-7 rounded-full px-9 text-base"
          >
            <a href={BECOME_SELLER_URL} target="_blank" rel="noreferrer">
              Become a Seller
            </a>
          </Button>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {[
            { icon: MessageCircle, step: "1", text: "Message us on WhatsApp" },
            { icon: Camera, step: "2", text: "Send a photo of your product" },
            {
              icon: Sparkles,
              step: "3",
              text: "Our AI creates your listing instantly — you just confirm!",
            },
          ].map(({ icon: Icon, step, text }) => (
            <div
              key={step}
              className="rounded-xl border border-border bg-card p-7 text-center shadow-[var(--shadow-soft)]"
            >
              <Icon className="mx-auto h-8 w-8 text-primary" aria-hidden="true" />
              <p className="mt-4 font-serif text-lg font-semibold">Step {step}</p>
              <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <ContactSection />
    </PageShell>
  );
}
