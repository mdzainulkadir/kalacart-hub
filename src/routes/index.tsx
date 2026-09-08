import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Camera, Handshake, MapPin, MessageCircle, Quote, Sparkles, Truck } from "lucide-react";
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

  function pickCategory(c: string) {
    setCategory(c);
    scrollToShop();
  }

  return (
    <PageShell>
      {/* Hero */}
      <section className="grain relative overflow-hidden">
        <img
          src={heroImage}
          alt="An artisan shaping a clay pot on a potter's wheel"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background to-transparent"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-28 sm:px-6 sm:py-36 lg:px-8">
          <div className="max-w-2xl">
            <p className="mb-4 inline-block rounded-full bg-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gold-foreground">
              Direct from the village
            </p>
            <h1 className="font-serif text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
              Handmade by artisans. <span className="text-primary">Bought straight</span> from them.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-xl">
              KalaCart removes the middlemen who take most of a craftsperson's earnings. You meet
              the maker, you know the town, and your money reaches the hands that shaped your piece.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
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
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-medium text-muted-foreground sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-primary" aria-hidden="true" />
                Cash on Delivery
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Handshake className="h-4 w-4 text-primary" aria-hidden="true" />
                Direct to Artisan
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                Made in India
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Impact stats */}
      <div className="border-y border-border bg-teal text-teal-foreground">
        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-teal-foreground/15 px-4 sm:px-6 lg:px-8">
          {[
            ["500+", "Artisans empowered"],
            ["6", "Craft categories"],
            ["100%", "Direct to artisan"],
          ].map(([n, label]) => (
            <div key={label} className="px-3 py-5 sm:px-8 sm:py-6">
              <p className="font-serif text-2xl font-bold leading-none sm:text-3xl">{n}</p>
              <p className="mt-1.5 text-[11px] uppercase tracking-wider opacity-80 sm:text-xs">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <section id="categories" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr] lg:items-end">
          <SectionHeading title="Browse by craft" subtitle="Six living traditions, one marketplace." />
          <div className="mb-6 flex flex-wrap gap-2.5 lg:justify-end">
            {["All", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => pickCategory(c)}
                aria-pressed={category === c}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                  category === c
                    ? "border-primary bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                    : "border-border bg-transparent text-foreground hover:border-primary hover:text-primary",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Trending — asymmetric editorial grid */}
      <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <SectionHeading title="Trending Now" subtitle="What buyers are reaching for this week." />
        {isLoading ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            <ProductCardSkeleton className="col-span-2 row-span-2" />
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {trending.slice(0, 7).map((p, i) => (
              <ProductCard
                key={p.id}
                product={p}
                className={cn(
                  i === 0 && "col-span-2 row-span-2",
                  i === 5 && "md:col-span-2",
                )}
              />
            ))}
          </div>
        )}
      </section>

      {/* New arrivals */}
      <section className="mx-auto max-w-7xl px-4 pt-24 sm:px-6 lg:px-8">
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
      <section id="shop" className="mx-auto max-w-7xl scroll-mt-24 px-4 pt-24 sm:px-6 lg:px-8">
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

      {/* Become a seller — text left, steps right */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grain overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-lift)]">
          <div className="relative z-10 grid gap-10 px-6 py-12 sm:px-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16 lg:py-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-80">
                For artisans
              </p>
              <h2 className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-5xl">
                Do you make things by hand?
              </h2>
              <p className="mt-4 max-w-md text-sm leading-relaxed opacity-95 sm:text-base">
                List your craft with one WhatsApp message. No forms, no computer, no commission
                agents — just a photo and a chat.
              </p>
              <Button asChild size="lg" variant="secondary" className="mt-8 rounded-full px-9 text-base">
                <a href={BECOME_SELLER_URL} target="_blank" rel="noreferrer">
                  Become a Seller
                </a>
              </Button>
            </div>

            <ol className="space-y-3 self-center">
              {[
                { icon: MessageCircle, text: "Message us on WhatsApp" },
                { icon: Camera, text: "Send a photo of your product" },
                { icon: Sparkles, text: "Our AI creates your listing instantly — you just confirm!" },
              ].map(({ icon: Icon, text }, i) => (
                <li
                  key={text}
                  className={cn(
                    "flex items-start gap-4 rounded-xl bg-card/95 p-5 text-card-foreground",
                    i === 1 && "lg:translate-x-6",
                  )}
                >
                  <span className="font-serif text-3xl font-black leading-none text-primary">
                    {i + 1}
                  </span>
                  <div className="pt-0.5">
                    <Icon className="mb-1.5 h-5 w-5 text-teal" aria-hidden="true" />
                    <p className="text-sm font-medium leading-snug">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* Trust — craft fair quotes */}
      <section className="mx-auto mt-28 max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">
              Seen at craft fairs
            </p>
            <h2 className="mt-3 font-serif text-3xl font-bold leading-tight sm:text-4xl">
              Surajkund, Dastkar Bazaar, Shilparamam — and now your doorstep.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Many of our makers first met buyers at India's craft melas. KalaCart keeps that
              conversation going all year round.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {[
              {
                quote:
                  "The Bankura horse arrived wrapped in newspaper from Panchmura with a note from the potter. I have never felt closer to where a thing came from.",
                who: "Meera Iyer, Bengaluru",
              },
              {
                quote:
                  "I sent one photo on WhatsApp and my ikat stoles were listed by evening. Three orders came before the weekend — no agent, no cut.",
                who: "Padma Reddy, weaver, Pochampally",
              },
              {
                quote:
                  "Bought the Dhokra jhumkas for my sister's wedding. The wire texture is exactly what I saw at Surajkund last year.",
                who: "Ritika Sharma, Delhi",
              },
            ].map(({ quote, who }, i) => (
              <figure
                key={who}
                className={cn(
                  "rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]",
                  i === 1 && "sm:mt-10",
                  i === 2 && "sm:col-span-2 sm:mr-16",
                )}
              >
                <Quote className="h-5 w-5 text-gold" aria-hidden="true" />
                <blockquote className="mt-3 font-serif text-base leading-relaxed sm:text-lg">
                  {quote}
                </blockquote>
                <figcaption className="mt-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  — {who}
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <ContactSection />
    </PageShell>
  );
}
